
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

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
      // Auto-clear invalid local storage items to prevent infinite loops
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

  // Intercept unhandled promise rejections for refresh tokens
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    if (
      msg.includes('Invalid Refresh Token') || 
      msg.includes('Refresh Token Not Found') || 
      msg.includes('refresh_token') ||
      msg.includes('refresh token')
    ) {
      console.warn('[Unhandled Rejection Suppressed]', msg);
      event.preventDefault(); // Prevent standard error propagation
      try {
        // Clear corrupt storage keys
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

