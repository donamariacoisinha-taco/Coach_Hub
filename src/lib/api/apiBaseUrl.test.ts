import { describe, expect, it } from 'vitest';
import { KYRON_API_ORIGIN, normalizeApiBase, resolveApiUrl } from './apiBaseUrl';

describe('resolveApiUrl', () => {
  it('keeps the website on the same origin', () => {
    expect(resolveApiUrl('/api/intelligence/proxy')).toBe('/api/intelligence/proxy');
    expect(resolveApiUrl('/api/admin/exercise-media/status', { native: false, baseUrl: '' })).toBe(
      '/api/admin/exercise-media/status',
    );
  });

  it('uses kyron.uno inside the native app when no base is configured', () => {
    expect(resolveApiUrl('/api/intelligence/proxy', { native: true })).toBe(
      `${KYRON_API_ORIGIN}/api/intelligence/proxy`,
    );
    expect(resolveApiUrl('api/intelligence/optimize', { native: true, baseUrl: '   ' })).toBe(
      `${KYRON_API_ORIGIN}/api/intelligence/optimize`,
    );
  });

  it('lets an explicit base override the native default and drops a trailing slash', () => {
    expect(resolveApiUrl('/api/intelligence/find-media', {
      native: true,
      baseUrl: 'https://preview.example/',
    })).toBe('https://preview.example/api/intelligence/find-media');
  });

  it('normalizes an empty setting to no base', () => {
    expect(normalizeApiBase(undefined)).toBe('');
    expect(normalizeApiBase('  https://kyron.uno///  ')).toBe('https://kyron.uno');
  });
});
