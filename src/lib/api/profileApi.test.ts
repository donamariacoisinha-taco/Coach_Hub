import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    rpc: vi.fn(),
  },
}));

import { mergeAccess } from './profileApi';

describe('mergeAccess', () => {
  it('uses user_access as the authoritative source for role, plan and status', () => {
    const profile = mergeAccess({
      id: 'user-1',
      onboarding_completed: true,
      role: 'user',
      is_admin: false,
      is_premium: false,
      user_access: {
        user_id: 'user-1',
        role: 'admin',
        plan: 'premium',
        status: 'active',
      },
    });

    expect(profile).toMatchObject({
      id: 'user-1',
      role: 'admin',
      plan: 'premium',
      account_status: 'active',
      is_admin: true,
      is_premium: true,
    });
  });

  it('supports the array relation returned by embedded Supabase selects', () => {
    const profile = mergeAccess({
      id: 'user-2',
      onboarding_completed: false,
      user_access: [{
        user_id: 'user-2',
        role: 'user',
        plan: 'free',
        status: 'suspended',
      }],
    });

    expect(profile?.account_status).toBe('suspended');
    expect(profile?.is_admin).toBe(false);
    expect(profile?.is_premium).toBe(false);
  });

  it('fails closed when the access record is missing', () => {
    expect(() => mergeAccess({
      id: 'user-without-access',
      onboarding_completed: true,
      user_access: null,
    })).toThrow(/user_access ausente/i);
  });

  it('returns null only when the profile itself does not exist', () => {
    expect(mergeAccess(null)).toBeNull();
  });
});
