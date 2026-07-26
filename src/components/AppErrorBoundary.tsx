import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
  errorName: string;
  errorMessage: string;
  route: string;
  build: string;
  componentStack?: string;
};

const DIAGNOSTICS_STORAGE_KEY = 'kyron_runtime_diagnostics';
const MAX_DIAGNOSTICS = 5;
const MAX_TEXT_LENGTH = 1200;

const truncate = (value: string | null | undefined, maxLength = MAX_TEXT_LENGTH) => {
  if (!value) return undefined;
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
};

const getBuildLabel = () => {
  const configuredBuild = import.meta.env.VITE_GIT_COMMIT_SHA;
  if (configuredBuild) return configuredBuild.slice(0, 12);
  return import.meta.env.MODE || 'unknown';
};

const createIncidentId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KY-${timestamp}-${random}`;
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
    const diagnostic: RuntimeDiagnostic = {
      incidentId,
      occurredAt: new Date().toISOString(),
      errorName: truncate(error.name, 120) || 'Error',
      errorMessage: truncate(error.message) || 'Unknown runtime error',
      route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      build: getBuildLabel(),
      componentStack: truncate(info.componentStack),
    };

    console.error('[KYRON OS Runtime Error]', diagnostic, error);
    persistDiagnostic(diagnostic);

    if (this.state.incidentId !== incidentId) {
      this.setState({ incidentId });
    }
  }

  private retryRender = () => {
    this.setState({ error: null, incidentId: null });
  };

  private reloadApplication = () => {
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
            <p className="mt-2 text-xs text-gray-500">Build: {getBuildLabel()}</p>
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
