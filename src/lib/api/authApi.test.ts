import { describe, expect, it } from 'vitest';
import { GUEST_USER_ID, isGuestSession } from './authApi';

describe('guest session classification', () => {
  it('recognizes the local guest without treating anonymous visitors as guests', () => {
    expect(isGuestSession({ user: { id: GUEST_USER_ID }, access_token: 'guest-token' })).toBe(true);
    expect(isGuestSession(null)).toBe(false);
    expect(isGuestSession({ user: { id: 'real-user' }, access_token: 'jwt' })).toBe(false);
  });
});
