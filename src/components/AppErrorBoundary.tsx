import * as React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  getOperationalBuildLabel,
  getRouteGroup,
  recordOperationalEvent,
} from '../lib/telemetry/operationalTelemetry';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
  incidentId: string | null;
};

type RuntimeDiagnostic = {
  incidentId: string;
  occurredAt: string;
  errorKind: string;
  routeGroup: string;
  build: string;
};

const DIAGNOSTICS_STORAGE_KEY = 'kyron_runtime_diagnostics';
const MAX_DIAGNOSTICS = 5;

const createIncidentId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KY-${timestamp}-${random}`;
};

const sanitizeErrorKind = (value: string | null | undefined): string => {
  const normalized = String(value || 'Error')
    .replace(/[^a-zA-Z0-9:_-]/g, '')
    .slice(0, 64);
  return normalized || 'Error';
};

const persistDiagnostic = (diagnostic: RuntimeDiagnostic) => {
  try {
    const existingRaw = sessionStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const diagnostics = Array.isArray(existing) ? existing : [];
    sessionStorage.setItem(
      DIAGNOSTICS_STORAGE_KEY,
      JSON.stringify([diagnostic, ...diagnostics].slice(0, MAX_DIAGNOSTICS)),
    );
  } catch {
    // Diagnostics must never create a second application failure.
  }
};

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  declare readonly props: Readonly<AppErrorBoundaryProps>;
  declare setState: (state: Partial<AppErrorBoundaryState>) => void;

  state: AppErrorBoundaryState = {
    error: null,
    incidentId: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
      incidentId: createIncidentId(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const incidentId = this.state.incidentId || createIncidentId();
    const routeGroup = getRouteGroup(window.location.pathname);
    const errorKind = sanitizeErrorKind(error.name);
    const diagnostic: RuntimeDiagnostic = {
      incidentId,
      occurredAt: new Date().toISOString(),
      errorKind,
      routeGroup,
      build: getOperationalBuildLabel(),
    };

    // The full error remains only in the current browser console and is not persisted.
    console.error('[KYRON OS Runtime Error]', { ...diagnostic, componentStackPresent: Boolean(info.componentStack) }, error);
    persistDiagnostic(diagnostic);
    recordOperationalEvent('app_runtime_error', {
      source: 'runtime',
      routeGroup,
      errorKind,
    });

    if (this.state.incidentId !== incidentId) {
      this.setState({ incidentId });
    }
  }

  private retryRender = () => {
    recordOperationalEvent('app_recovery_retry', {
      source: 'runtime',
      routeGroup: getRouteGroup(window.location.pathname),
    });
    this.setState({ error: null, incidentId: null });
  };

  private reloadApplication = () => {
    recordOperationalEvent('app_recovery_reload', {
      source: 'runtime',
      routeGroup: getRouteGroup(window.location.pathname),
    });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-[#F7F8FA] px-5 py-8 flex items-center justify-center text-gray-900">
        <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-xl shadow-gray-200/50">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <h1 className="text-2xl font-black tracking-tight">O KYRON OS encontrou um problema</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Seus dados não foram apagados. Tente carregar a tela novamente. Caso o erro continue, recarregue o aplicativo.
          </p>

          <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Código do incidente</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-800">
              {this.state.incidentId || 'KY-UNKNOWN'}
            </p>
            <p className="mt-2 text-xs text-gray-500">Build: {getOperationalBuildLabel()}</p>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={this.retryRender}
              className="min-h-12 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-[0.99]"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={this.reloadApplication}
              className="min-h-12 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50 active:scale-[0.99]"
            >
              Recarregar aplicativo
            </button>
          </div>
        </section>
      </main>
    );
  }
}
