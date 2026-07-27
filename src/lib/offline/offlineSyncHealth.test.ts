import { describe, expect, it } from 'vitest';
import {
  deriveOfflineSyncHealth,
  formatOfflineOperationType,
  formatRelativeTimestamp,
} from './offlineSyncHealth';

describe('deriveOfflineSyncHealth', () => {
  it('reports healthy when online and queues are empty', () => {
    expect(deriveOfflineSyncHealth({
      online: true,
      pendingCount: 0,
      deadLetterCount: 0,
      storageAvailable: true,
    }).level).toBe('healthy');
  });

  it('prioritizes dead-letter attention over pending items', () => {
    const health = deriveOfflineSyncHealth({
      online: true,
      pendingCount: 4,
      deadLetterCount: 2,
      storageAvailable: true,
    });
    expect(health.level).toBe('attention');
    expect(health.summary).toContain('2 operações');
  });

  it('reports offline while preserving queued work', () => {
    const health = deriveOfflineSyncHealth({
      online: false,
      pendingCount: 1,
      deadLetterCount: 0,
      storageAvailable: true,
    });
    expect(health.level).toBe('offline');
    expect(health.summary).toContain('preservados');
  });

  it('reports unavailable when IndexedDB cannot be accessed', () => {
    expect(deriveOfflineSyncHealth({
      online: true,
      pendingCount: 0,
      deadLetterCount: 0,
      storageAvailable: false,
    }).level).toBe('unavailable');
  });
});

describe('offline sync formatting', () => {
  it('uses a human label for saved sets', () => {
    expect(formatOfflineOperationType('SAVE_SET')).toBe('Série de treino');
  });

  it('formats relative timestamps deterministically', () => {
    const now = 1_000_000;
    expect(formatRelativeTimestamp(now - 30_000, now)).toBe('agora');
    expect(formatRelativeTimestamp(now - 5 * 60_000, now)).toBe('há 5 min');
    expect(formatRelativeTimestamp(now - 2 * 60 * 60_000, now)).toBe('há 2 h');
  });
});
