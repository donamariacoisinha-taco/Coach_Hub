import { describe, expect, it } from 'vitest';
import { nativeWebViewCorsHeaders } from './nativeWebViewCors';

describe('native WebView CORS allowlist', () => {
  it('allows the Android WebView and a future iOS scheme', () => {
    expect(nativeWebViewCorsHeaders('https://localhost')?.['Access-Control-Allow-Origin']).toBe('https://localhost');
    expect(nativeWebViewCorsHeaders('capacitor://localhost')?.['Access-Control-Allow-Headers']).toContain('Authorization');
  });

  it('does not reflect the website or an unknown origin', () => {
    expect(nativeWebViewCorsHeaders('https://kyron.uno')).toBeNull();
    expect(nativeWebViewCorsHeaders('https://evil.example')).toBeNull();
    expect(nativeWebViewCorsHeaders(undefined)).toBeNull();
  });
});
