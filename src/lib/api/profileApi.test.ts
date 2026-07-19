import { describe, expect, it } from 'vitest';
import { mergeAccess } from './profileApi';

describe('mergeAccess', () => {
  it('derives admin and premium flags from the server access record', () => {
    const profile = mergeAccess({
      id: 'user-1',
      onboarding_completed: true,
      is_admin: false,
      is_premium: false,
      user_access: {
        user_id: 'user-1',
        role: 'admin',
        plan: 'premium',
        status: 'active'
      }
    });

    expect(profile).toMatchObject({
      role: 'admin',
      plan: 'premium',
      account_status: 'active',
      is_admin: true,
      is_premium: true
    });
  });

  it('maps a suspended free athlete without trusting legacy profile flags', () => {
    const profile = mergeAccess({
      id: 'user-2',
      onboarding_completed: true,
      is_admin: true,
      is_premium: true,
      user_access: [{
        user_id: 'user-2',
        role: 'user',
        plan: 'free',
        status: 'suspended',
        suspension_reason: 'policy violation'
      }]
    });

    expect(profile).toMatchObject({
      role: 'user',
      plan: 'free',
      account_status: 'suspended',
      suspension_reason: 'policy violation',
      is_admin: false,
      is_premium: false
    });
  });

  it('fails closed when the authorization record is missing', () => {
    expect(() => mergeAccess({
      id: 'user-3',
      onboarding_completed: true,
      user_access: null
    })).toThrow('Access record missing');
  });
});
