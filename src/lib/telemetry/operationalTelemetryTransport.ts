import { supabase } from '../api/supabase';
import {
  OPERATIONAL_TELEMETRY_EVENT,
  OperationalTelemetryOutboxItem,
  acknowledgeOperationalTelemetryBatch,
  readOperationalTelemetryOutbox,
} from './operationalTelemetry';

const DISABLED_SESSION_KEY = 'kyron_operational_telemetry_transport_disabled';
const FLUSH_DELAY_MS = 5000;
const MAX_BATCH_SIZE = 25;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushPromise: Promise<void> | null = null;

const isDisabledForSession = (): boolean => {
  try {
    return sessionStorage.getItem(DISABLED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

const disableForSession = () => {
  try {
    sessionStorage.setItem(DISABLED_SESSION_KEY, '1');
  } catch {
    // Ignore storage errors.
  }
};

const getBatch = (): OperationalTelemetryOutboxItem[] => (
  Object.values(readOperationalTelemetryOutbox())
    .slice(0, MAX_BATCH_SIZE)
    .map(item => ({
      ...item,
      count: Math.max(1, Math.min(Math.trunc(item.count || 1), 100)),
    }))
);

export const flushOperationalTelemetry = async (): Promise<void> => {
  if (flushPromise) return flushPromise;
  if (isDisabledForSession()) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  flushPromise = (async () => {
    const batch = getBatch();
    if (batch.length === 0) return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const { error } = await supabase.rpc('record_operational_telemetry', {
      events: batch,
    });

    if (error) {
      const missingMigration = error.code === '42883'
        || error.code === 'PGRST202'
        || error.message?.includes('record_operational_telemetry');
      if (missingMigration) disableForSession();
      return;
    }

    acknowledgeOperationalTelemetryBatch(batch);
  })().catch(() => {
    // Telemetry transport must never surface an application error.
  }).finally(() => {
    flushPromise = null;
  });

  return flushPromise;
};

export const scheduleOperationalTelemetryFlush = (): void => {
  if (flushTimer || isDisabledForSession()) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOperationalTelemetry();
  }, FLUSH_DELAY_MS);
};

export const initializeOperationalTelemetryTransport = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const handleTelemetry = () => scheduleOperationalTelemetryFlush();
  const handleOnline = () => void flushOperationalTelemetry();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') void flushOperationalTelemetry();
  };

  window.addEventListener(OPERATIONAL_TELEMETRY_EVENT, handleTelemetry);
  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibility);
  scheduleOperationalTelemetryFlush();

  return () => {
    window.removeEventListener(OPERATIONAL_TELEMETRY_EVENT, handleTelemetry);
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibility);
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };
};
