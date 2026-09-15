import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import { authApi, GUEST_USER_ID, isGuestSession } from './authApi';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
};

describe('guest session classification', () => {
  it('recognizes the local guest without treating anonymous visitors as guests', () => {
    expect(isGuestSession({ user: { id: GUEST_USER_ID }, access_token: 'guest-token' })).toBe(true);
    expect(isGuestSession(null)).toBe(false);
    expect(isGuestSession({ user: { id: 'real-user' }, access_token: 'jwt' })).toBe(false);
  });
});

describe('signOut', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('clears the shared guest slot so the next anonymous person on this device does not inherit it', async () => {
    localStorage.setItem('kyron_guest_session', 'x');
    localStorage.setItem('coach_rubi_user_id', GUEST_USER_ID);
    localStorage.setItem(`rubi_history_${GUEST_USER_ID}`, '[{"weight":80}]');
    localStorage.setItem(`rubi_cached_profile_${GUEST_USER_ID}`, '{"age":40}');
    localStorage.setItem(`rubi_dashboard_cache_${GUEST_USER_ID}`, '{}');
    localStorage.setItem('rubi_avatar_size', '120');
    localStorage.setItem('rubi_avatar_pos_x', '30');
    localStorage.setItem('rubi_avatar_pos_y', '70');

    await authApi.signOut();

    expect(localStorage.getItem('kyron_guest_session')).toBeNull();
    expect(localStorage.getItem('coach_rubi_user_id')).toBeNull();
    expect(localStorage.getItem(`rubi_history_${GUEST_USER_ID}`)).toBeNull();
    expect(localStorage.getItem(`rubi_cached_profile_${GUEST_USER_ID}`)).toBeNull();
    expect(localStorage.getItem(`rubi_dashboard_cache_${GUEST_USER_ID}`)).toBeNull();
    expect(localStorage.getItem('rubi_avatar_size')).toBeNull();
    expect(localStorage.getItem('rubi_avatar_pos_x')).toBeNull();
    expect(localStorage.getItem('rubi_avatar_pos_y')).toBeNull();
  });

  it('does not touch the versioned guest plan/history store', async () => {
    localStorage.setItem('kyron_guest_dashboard_v1', '{"history":[{"id":1}]}');

    await authApi.signOut();

    expect(localStorage.getItem('kyron_guest_dashboard_v1')).toBe('{"history":[{"id":1}]}');
  });
});
