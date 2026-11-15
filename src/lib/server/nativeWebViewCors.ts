export const NATIVE_WEBVIEW_ORIGINS = [
  'https://localhost',
  'capacitor://localhost',
] as const;

export function nativeWebViewCorsHeaders(origin: string | undefined): Record<string, string> | null {
  if (!origin || !NATIVE_WEBVIEW_ORIGINS.includes(origin as (typeof NATIVE_WEBVIEW_ORIGINS)[number])) {
    return null;
  }
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
  };
}
