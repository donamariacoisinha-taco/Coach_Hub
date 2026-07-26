import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));

import { adminSecurityApi, UserAccessFoundationError } from './adminSecurityApi';

describe('adminSecurityApi', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.from.mockReset();
  });

  it('calls the production RPC with the exact user_access contract', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        user_id: 'target-1',
        role: 'user',
        plan: 'premium',
        status: 'active',
      },
      error: null,
    });

    const result = await adminSecurityApi.updateAccess('target-1', {
      plan: 'premium',
      reason: 'Homologação P0.1',
    });

    expect(mocks.rpc).toHaveBeenCalledWith('admin_update_user_access', {
      p_user_id: 'target-1',
      p_role: null,
      p_plan: 'premium',
      p_status: null,
      p_reason: 'Homologação P0.1',
    });
    expect(result).toMatchObject({
      user_id: 'target-1',
      plan: 'premium',
      status: 'active',
    });
  });

  it('does not call the RPC when no access change was requested', async () => {
    await expect(adminSecurityApi.updateAccess('target-2', {}))
      .rejects.toThrow(/nenhuma alteração de acesso/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('normalizes a missing foundation response into a dedicated blocking error', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function admin_update_user_access',
      },
    });

    await expect(adminSecurityApi.setAccountStatus('target-3', 'suspended'))
      .rejects.toBeInstanceOf(UserAccessFoundationError);
  });

  it('joins profiles and user_access without trusting legacy authorization fields', async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [{
                id: 'user-1',
                name: 'Atleta',
                role: 'admin',
                is_admin: true,
                is_premium: true,
              }],
              error: null,
            }),
          })),
        };
      }

      if (table === 'user_access') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{
              user_id: 'user-1',
              role: 'user',
              plan: 'free',
              status: 'active',
            }],
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const profiles = await adminSecurityApi.listProfiles();

    expect(profiles[0]).toMatchObject({
      id: 'user-1',
      role: 'user',
      plan: 'free',
      account_status: 'active',
      is_admin: false,
      is_premium: false,
    });
  });

  it('fails closed when a profile has no corresponding user_access row', async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [{ id: 'orphan-profile' }],
              error: null,
            }),
          })),
        };
      }

      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    await expect(adminSecurityApi.listProfiles()).rejects.toThrow(/user_access ausente/i);
  });
});
