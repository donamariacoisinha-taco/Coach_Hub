export type OperationalEventName =
  | 'app_runtime_error'
  | 'app_recovery_retry'
  | 'app_recovery_reload'
  | 'connectivity_online'
  | 'connectivity_offline'
  | 'sync_storage_unavailable'
  | 'sync_storage_restored'
  | 'sync_manual_started'
  | 'sync_manual_succeeded'
  | 'sync_manual_failed'
  | 'sync_retry_one_started'
  | 'sync_retry_one_succeeded'
  | 'sync_retry_one_failed'
  | 'sync_retry_all_started'
  | 'sync_retry_all_succeeded'
  | 'sync_retry_all_failed'
  | 'diagnostic_copied';

export type OperationalDimensionKey =
  | 'source'
  | 'result'
  | 'routeGroup'
  | 'errorKind'
  | 'countBucket'
  | 'healthLevel';

export type OperationalDimensions = Partial<Record<OperationalDimensionKey, string | number | boolean>>;

export type OperationalTelemetryEntry = {
  event: OperationalEventName;
  occurredAt: string;
  dimensions: Partial<Record<OperationalDimensionKey, string>>;
};

export type OperationalTelemetrySnapshot = {
  version: 1;
  startedAt: string;
  updatedAt: string;
  expiresAt: string;
  build: string;
  counters: Partial<Record<OperationalEventName, number>>;
  recent: OperationalTelemetryEntry[];
};

export type SafeOperationalReport = {
  generatedAt: string;
  build: string;
  online: boolean;
  pendingCount: number;
  deadLetterCount: number;
  incidentId?: string;
  telemetry: OperationalTelemetrySnapshot;
  privacy: {
    includesPersonalData: false;
    includesWorkoutContent: false;
    includesCredentials: false;
  };
};

const STORAGE_KEY = 'kyron_operational_telemetry_v1';
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_RECENT_EVENTS = 20;
const MAX_DIMENSION_LENGTH = 64;

const ALLOWED_EVENTS = new Set<OperationalEventName>([
  'app_runtime_error',
  'app_recovery_retry',
  'app_recovery_reload',
  'connectivity_online',
  'connectivity_offline',
  'sync_storage_unavailable',
  'sync_storage_restored',
  'sync_manual_started',
  'sync_manual_succeeded',
  'sync_manual_failed',
  'sync_retry_one_started',
  'sync_retry_one_succeeded',
  'sync_retry_one_failed',
  'sync_retry_all_started',
  'sync_retry_all_succeeded',
  'sync_retry_all_failed',
  'diagnostic_copied',
]);

const ALLOWED_DIMENSIONS = new Set<OperationalDimensionKey>([
  'source',
  'result',
  'routeGroup',
  'errorKind',
  'countBucket',
  'healthLevel',
]);

const SENSITIVE_VALUE_PATTERN = /@|bearer\s|password|passwd|secret|token|eyJ[a-zA-Z0-9_-]{10,}/i;

const getDefaultStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const getOperationalBuildLabel = (): string => {
  try {
    const configuredBuild = import.meta.env.VITE_GIT_COMMIT_SHA;
    if (configuredBuild) return configuredBuild.slice(0, 12);
    return import.meta.env.MODE || 'unknown';
  } catch {
    return 'unknown';
  }
};

export const getRouteGroup = (pathname: string): string => {
  const firstSegment = pathname
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean)[0];

  if (!firstSegment) return '/';

  const sanitized = firstSegment
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\d+/g, ':id')
    .replace(/[^a-zA-Z0-9:_-]/g, '')
    .slice(0, 40);

  return sanitized ? `/${sanitized}` : '/other';
};

export const bucketOperationalCount = (count: number): string => {
  if (count <= 0) return '0';
  if (count === 1) return '1';
  if (count <= 5) return '2-5';
  if (count <= 20) return '6-20';
  return '21+';
};

const createEmptySnapshot = (now: number): OperationalTelemetrySnapshot => {
  const occurredAt = new Date(now).toISOString();
  return {
    version: 1,
    startedAt: occurredAt,
    updatedAt: occurredAt,
    expiresAt: new Date(now + RETENTION_MS).toISOString(),
    build: getOperationalBuildLabel(),
    counters: {},
    recent: [],
  };
};

const sanitizeDimensionValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }

  const normalized = String(value).trim().slice(0, MAX_DIMENSION_LENGTH);
  if (!normalized || SENSITIVE_VALUE_PATTERN.test(normalized)) return undefined;
  return normalized;
};

export const sanitizeOperationalDimensions = (
  dimensions: Record<string, unknown> = {},
): Partial<Record<OperationalDimensionKey, string>> => {
  const safe: Partial<Record<OperationalDimensionKey, string>> = {};

  for (const [key, value] of Object.entries(dimensions)) {
    if (!ALLOWED_DIMENSIONS.has(key as OperationalDimensionKey)) continue;
    const sanitized = sanitizeDimensionValue(value);
    if (sanitized !== undefined) safe[key as OperationalDimensionKey] = sanitized;
  }

  return safe;
};

const isValidSnapshot = (value: unknown): value is OperationalTelemetrySnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<OperationalTelemetrySnapshot>;
  return candidate.version === 1
    && typeof candidate.startedAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && typeof candidate.expiresAt === 'string'
    && typeof candidate.build === 'string'
    && Boolean(candidate.counters)
    && Array.isArray(candidate.recent);
};

export const readOperationalTelemetry = (
  storage: Storage | null = getDefaultStorage(),
  now = Date.now(),
): OperationalTelemetrySnapshot => {
  if (!storage) return createEmptySnapshot(now);

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createEmptySnapshot(now);

    const parsed = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) return createEmptySnapshot(now);

    const expiresAt = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      storage.removeItem(STORAGE_KEY);
      return createEmptySnapshot(now);
    }

    return parsed;
  } catch {
    return createEmptySnapshot(now);
  }
};

export const recordOperationalEvent = (
  event: OperationalEventName,
  dimensions: Record<string, unknown> = {},
  options: { storage?: Storage | null; now?: number } = {},
): OperationalTelemetrySnapshot => {
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
  const now = options.now ?? Date.now();
  const snapshot = readOperationalTelemetry(storage, now);

  if (!ALLOWED_EVENTS.has(event)) return snapshot;

  const updated: OperationalTelemetrySnapshot = {
    ...snapshot,
    updatedAt: new Date(now).toISOString(),
    build: getOperationalBuildLabel(),
    counters: {
      ...snapshot.counters,
      [event]: (snapshot.counters[event] || 0) + 1,
    },
    recent: [
      {
        event,
        occurredAt: new Date(now).toISOString(),
        dimensions: sanitizeOperationalDimensions(dimensions),
      },
      ...snapshot.recent,
    ].slice(0, MAX_RECENT_EVENTS),
  };

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Telemetry must never interrupt the application.
    }
  }

  return updated;
};

export const createSafeOperationalReport = ({
  online,
  pendingCount,
  deadLetterCount,
  incidentId,
  storage,
  now = Date.now(),
}: {
  online: boolean;
  pendingCount: number;
  deadLetterCount: number;
  incidentId?: string;
  storage?: Storage | null;
  now?: number;
}): SafeOperationalReport => ({
  generatedAt: new Date(now).toISOString(),
  build: getOperationalBuildLabel(),
  online,
  pendingCount: Math.max(0, Math.floor(pendingCount)),
  deadLetterCount: Math.max(0, Math.floor(deadLetterCount)),
  ...(incidentId ? { incidentId: incidentId.slice(0, 80) } : {}),
  telemetry: readOperationalTelemetry(storage === undefined ? getDefaultStorage() : storage, now),
  privacy: {
    includesPersonalData: false,
    includesWorkoutContent: false,
    includesCredentials: false,
  },
});
