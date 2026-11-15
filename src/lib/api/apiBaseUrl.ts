import { Capacitor } from '@capacitor/core';

export const KYRON_API_ORIGIN = 'https://kyron.uno';

export function normalizeApiBase(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/\/+$/, '');
}

/**
 * Same-origin on the website. Inside Capacitor, or when a build sets
 * VITE_API_BASE_URL, calls go to that origin. An explicit base wins.
 */
export function resolveApiUrl(
  path: string,
  options?: { baseUrl?: string | null; native?: boolean },
): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const configured = normalizeApiBase(options?.baseUrl);
  if (configured) return `${configured}${suffix}`;
  if (options?.native) return `${KYRON_API_ORIGIN}${suffix}`;
  return suffix;
}

export function readConfiguredApiBase(): string {
  try {
    return normalizeApiBase(import.meta.env?.VITE_API_BASE_URL);
  } catch {
    return '';
  }
}

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function apiUrl(path: string): string {
  return resolveApiUrl(path, {
    baseUrl: readConfiguredApiBase(),
    native: isNativeApp(),
  });
}
