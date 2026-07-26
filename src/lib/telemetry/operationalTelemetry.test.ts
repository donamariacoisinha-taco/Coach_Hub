import { describe, expect, it } from 'vitest';
import {
  bucketOperationalCount,
  createSafeOperationalReport,
  getRouteGroup,
  readOperationalTelemetry,
  recordOperationalEvent,
  sanitizeOperationalDimensions,
} from './operationalTelemetry';

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
};

describe('operational telemetry', () => {
  it('increments counters and keeps a bounded recent-event list', () => {
    const storage = createMemoryStorage();
    const start = Date.UTC(2026, 6, 26, 12, 0, 0);

    recordOperationalEvent('sync_manual_started', { source: 'sync-panel' }, { storage, now: start });
    const snapshot = recordOperationalEvent(
      'sync_manual_succeeded',
      { result: 'success', countBucket: '2-5' },
      { storage, now: start + 1000 },
    );

    expect(snapshot.counters.sync_manual_started).toBe(1);
    expect(snapshot.counters.sync_manual_succeeded).toBe(1);
    expect(snapshot.recent[0].event).toBe('sync_manual_succeeded');
    expect(snapshot.recent[0].dimensions).toEqual({ result: 'success', countBucket: '2-5' });
  });

  it('drops unknown dimensions and values that resemble credentials or personal data', () => {
    const safe = sanitizeOperationalDimensions({
      source: 'runtime',
      email: 'person@example.com',
      errorKind: 'TypeError',
      result: 'Bearer abc.def.ghi',
      password: 'secret',
    });

    expect(safe).toEqual({ source: 'runtime', errorKind: 'TypeError' });
  });

  it('reduces routes to a non-identifying first-level category', () => {
    expect(getRouteGroup('/workout/12345?athlete=user@example.com')).toBe('/workout');
    expect(getRouteGroup('/admin/users/8f5b-1234')).toBe('/admin');
    expect(getRouteGroup('/')).toBe('/');
  });

  it('uses stable count buckets instead of exact high-cardinality values', () => {
    expect(bucketOperationalCount(0)).toBe('0');
    expect(bucketOperationalCount(1)).toBe('1');
    expect(bucketOperationalCount(4)).toBe('2-5');
    expect(bucketOperationalCount(12)).toBe('6-20');
    expect(bucketOperationalCount(100)).toBe('21+');
  });

  it('expires telemetry after the retention window', () => {
    const storage = createMemoryStorage();
    const start = Date.UTC(2026, 6, 1, 0, 0, 0);
    recordOperationalEvent('connectivity_offline', {}, { storage, now: start });

    const expired = readOperationalTelemetry(storage, start + 15 * 24 * 60 * 60 * 1000);
    expect(expired.counters).toEqual({});
    expect(expired.recent).toEqual([]);
  });

  it('creates a safe support report without workout content or credentials', () => {
    const storage = createMemoryStorage();
    const now = Date.UTC(2026, 6, 26, 12, 0, 0);
    recordOperationalEvent(
      'app_runtime_error',
      { source: 'runtime', routeGroup: '/workout', errorKind: 'TypeError' },
      { storage, now },
    );

    const report = createSafeOperationalReport({
      online: false,
      pendingCount: 3.8,
      deadLetterCount: 1,
      incidentId: 'KY-TEST-123',
      storage,
      now: now + 1000,
    });

    expect(report.pendingCount).toBe(3);
    expect(report.deadLetterCount).toBe(1);
    expect(report.incidentId).toBe('KY-TEST-123');
    expect(report.privacy).toEqual({
      includesPersonalData: false,
      includesWorkoutContent: false,
      includesCredentials: false,
    });
    expect(JSON.stringify(report)).not.toContain('password');
    expect(JSON.stringify(report)).not.toContain('token');
  });
});
