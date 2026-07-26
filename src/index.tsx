import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  getRouteGroup,
  recordOperationalEvent,
} from './lib/telemetry/operationalTelemetry';

// Intercept and gracefully suppress benign/transient Supabase refresh token errors
try {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.message + '\n' + a.stack;
      try {
        return JSON.stringify(a);
      } catch (e) {
        return String(a);
      }
    }).join(' ');

    const isBenignAuthError =
      msg.includes('Invalid Refresh Token') ||
      msg.includes('Refresh Token Not Found') ||
      msg.includes('refresh_token') ||
      msg.includes('grant_type') ||
      msg.includes('refresh token');

    if (isBenignAuthError) {
      console.warn('[Benign Auth Suppressed]', msg);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (err) {}
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    if (
      msg.includes('Invalid Refresh Token') ||
      msg.includes('Refresh Token Not Found') ||
      msg.includes('refresh_token') ||
      msg.includes('refresh token')
    ) {
      console.warn('[Unhandled Rejection Suppressed]', msg);
      event.preventDefault();
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (err) {}
    }
  });
} catch (e) {
  console.error('[Error Setup Interceptors]', e);
}

window.addEventListener('online', () => {
  recordOperationalEvent('connectivity_online', { source: 'browser' });
});
window.addEventListener('offline', () => {
  recordOperationalEvent('connectivity_offline', { source: 'browser' });
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const getErrorKind = (error: unknown): string => {
  if (error instanceof Error) {
    return error.name.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 64) || 'Error';
  }
  return 'StartupError';
};

const renderStartupError = (error: unknown) => {
  recordOperationalEvent('app_runtime_error', {
    source: 'startup',
    routeGroup: getRouteGroup(window.location.pathname),
    errorKind: getErrorKind(error),
  });
  console.error('[KYRON OS Startup Error]', error);
  rootElement.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f8fa;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
      <section style="width:100%;max-width:420px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;box-shadow:0 12px 36px rgba(15,23,42,.08);text-align:center;">
        <h1 style="margin:0 0 12px;font-size:22px;">Não foi possível iniciar o KYRON OS</h1>
        <p style="margin:0 0 20px;color:#4b5563;line-height:1.5;">Atualize a página. Caso o problema continue, feche esta janela e abra o aplicativo novamente.</p>
        <button type="button" onclick="window.location.reload()" style="border:0;border-radius:12px;padding:12px 18px;background:#111827;color:#fff;font-weight:700;font-size:15px;">Atualizar página</button>
      </section>
    </main>
  `;
};

const bootstrap = async () => {
  try {
    const [
      { default: App },
      { default: AppErrorBoundary },
      { default: OfflineSyncHealthPanel },
    ] = await Promise.all([
      import('./App'),
      import('./components/AppErrorBoundary'),
      import('./components/OfflineSyncHealthPanel'),
    ]);
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <>
            <App />
            <OfflineSyncHealthPanel />
          </>
        </AppErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    renderStartupError(error);
  }
};

void bootstrap();
