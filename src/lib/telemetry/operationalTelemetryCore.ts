export const OPERATIONAL_EVENT_NAMES = [
  'startup_error',
  'render_error',
  'slow_initialization',
  'profile_load_error',
  'app_initialization_error',
  'offline_storage_unavailable',
  'manual_sync_failure',
  'dead_letter_created',
  'dead_letter_retry_failure',
  'dead_letter_recovered',
] as const;

export type OperationalEventName = typeof OPERATIONAL_EVENT_NAMES[number];

export const OPERATIONAL_ROUTE_GROUPS = [
  'landing',
  'auth',
  'onboarding',
  'dashboard',
  'workout',
  'preparation',
  'editor',
  'history',
  'admin',
  'profile',
  'library',
  'dieta',
  'unknown',
] as const;

export type OperationalRouteGroup = typeof OPERATIONAL_ROUTE_GROUPS[number];

export interface OperationalTelemetryCounter {
  event_name: OperationalEventName;
  route_group: OperationalRouteGroup;
  build: string;
  count: number;
}

const ROUTE_GROUP_SET = new Set<string>(OPERATIONAL_ROUTE_GROUPS);
const EVENT_NAME_SET = new Set<string>(OPERATIONAL_EVENT_NAMES);

export const resolveOperationalRouteGroup = (pathname: string): OperationalRouteGroup => {
  const segment = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean)[0] || 'landing';
  return ROUTE_GROUP_SET.has(segment) ? segment as OperationalRouteGroup : 'unknown';
};

export const normalizeOperationalBuild = (value: string | null | undefined): string => {
  const normalized = String(value || 'unknown').trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  return (normalized || 'unknown').slice(0, 40);
};

export const isOperationalEventName = (value: string): value is OperationalEventName => (
  EVENT_NAME_SET.has(value)
);

export const createOperationalCounterKey = (
  eventName: OperationalEventName,
  routeGroup: OperationalRouteGroup,
  build: string,
): string => `${eventName}|${routeGroup}|${normalizeOperationalBuild(build)}`;

export const mergeOperationalCounter = (
  counters: Record<string, OperationalTelemetryCounter>,
  next: OperationalTelemetryCounter,
): Record<string, OperationalTelemetryCounter> => {
  const sanitized: OperationalTelemetryCounter = {
    event_name: next.event_name,
    route_group: ROUTE_GROUP_SET.has(next.route_group) ? next.route_group : 'unknown',
    build: normalizeOperationalBuild(next.build),
    count: Math.max(1, Math.min(Math.trunc(next.count || 1), 1000)),
  };
  const key = createOperationalCounterKey(
    sanitized.event_name,
    sanitized.route_group,
    sanitized.build,
  );
  const previous = counters[key];
  return {
    ...counters,
    [key]: {
      ...sanitized,
      count: Math.min((previous?.count || 0) + sanitized.count, 1000),
    },
  };
};

export const toOperationalRpcPayload = (
  counters: Record<string, OperationalTelemetryCounter>,
  limit = 25,
): OperationalTelemetryCounter[] => (
  Object.values(counters)
    .filter(counter => isOperationalEventName(counter.event_name))
    .slice(0, Math.max(1, Math.min(limit, 25)))
    .map(counter => ({
      event_name: counter.event_name,
      route_group: ROUTE_GROUP_SET.has(counter.route_group) ? counter.route_group : 'unknown',
      build: normalizeOperationalBuild(counter.build),
      count: Math.max(1, Math.min(Math.trunc(counter.count || 1), 100)),
    }))
);
