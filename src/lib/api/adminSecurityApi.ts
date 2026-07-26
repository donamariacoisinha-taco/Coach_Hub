import { supabase } from './supabase';

export type AccessRole = 'admin' | 'coach' | 'user';
export type AccessPlan = 'free' | 'premium';
export type AccountStatus = 'active' | 'suspended';
export type SubscriptionStatus = AccessPlan;

export interface UserAccessRecord {
  user_id: string;
  role: AccessRole;
  plan: AccessPlan;
  status: AccountStatus;
  created_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface AdminProfile {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  onboarding_completed?: boolean | null;
  workout_streak?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_access: UserAccessRecord;

  // Compatibility fields consumed by existing UI components.
  role: AccessRole;
  plan: AccessPlan;
  account_status: AccountStatus;
  is_admin: boolean;
  is_premium: boolean;
}

const FOUNDATION_MISSING_CODES = new Set(['PGRST200', 'PGRST202', 'PGRST204', '42P01', '42883']);

export class UserAccessFoundationError extends Error {
  code = 'USER_ACCESS_FOUNDATION_REQUIRED';

  constructor(message = 'A fundação user_access/admin_update_user_access não está disponível no Supabase.') {
    super(message);
    this.name = 'UserAccessFoundationError';
  }
}

const isFoundationMissingError = (error: any): boolean => {
  const code = error?.code?.toString?.();
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();

  return Boolean(
    (code && FOUNDATION_MISSING_CODES.has(code)) ||
    message.includes('user_access') && message.includes('does not exist') ||
    message.includes('admin_update_user_access') ||
    message.includes('could not find the function')
  );
};

const throwNormalizedError = (error: any): never => {
  if (isFoundationMissingError(error)) {
    throw new UserAccessFoundationError();
  }
  throw error;
};

const normalizeAccess = (raw: any): UserAccessRecord => {
  if (!raw?.user_id) {
    throw new Error('Registro user_access ausente ou inválido.');
  }

  return {
    user_id: raw.user_id,
    role: raw.role as AccessRole,
    plan: raw.plan as AccessPlan,
    status: raw.status as AccountStatus,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    updated_by: raw.updated_by ?? null,
  };
};

const normalizeProfile = (profile: any, access: UserAccessRecord): AdminProfile => ({
  ...profile,
  user_access: access,
  role: access.role,
  plan: access.plan,
  account_status: access.status,
  is_admin: access.role === 'admin',
  is_premium: access.plan === 'premium',
});

export const adminSecurityApi = {
  isP0MigrationRequiredError(error: unknown): error is UserAccessFoundationError {
    return error instanceof UserAccessFoundationError ||
      (error as any)?.code === 'USER_ACCESS_FOUNDATION_REQUIRED';
  },

  async listProfiles(): Promise<AdminProfile[]> {
    const [profilesResult, accessResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_access').select('*'),
    ]);

    if (profilesResult.error) throwNormalizedError(profilesResult.error);
    if (accessResult.error) throwNormalizedError(accessResult.error);

    const accessByUserId = new Map<string, UserAccessRecord>();
    for (const rawAccess of accessResult.data || []) {
      const access = normalizeAccess(rawAccess);
      accessByUserId.set(access.user_id, access);
    }

    return (profilesResult.data || []).map(profile => {
      const access = accessByUserId.get(profile.id);
      if (!access) {
        throw new Error(`Integridade P0: user_access ausente para o perfil ${profile.id}.`);
      }
      return normalizeProfile(profile, access);
    });
  },

  async updateAccess(
    targetUserId: string,
    changes: {
      role?: AccessRole;
      plan?: AccessPlan;
      status?: AccountStatus;
      reason?: string | null;
    }
  ): Promise<UserAccessRecord> {
    if (!changes.role && !changes.plan && !changes.status) {
      throw new Error('Nenhuma alteração de acesso foi informada.');
    }

    const { data, error } = await supabase.rpc('admin_update_user_access', {
      p_user_id: targetUserId,
      p_role: changes.role ?? null,
      p_plan: changes.plan ?? null,
      p_status: changes.status ?? null,
      p_reason: changes.reason ?? null,
    });

    if (error) throwNormalizedError(error);
    return normalizeAccess(data);
  },

  async setAccountStatus(
    targetUserId: string,
    nextStatus: AccountStatus,
    reason?: string
  ): Promise<UserAccessRecord> {
    return this.updateAccess(targetUserId, {
      status: nextStatus,
      reason: reason || null,
    });
  },

  async setSubscriptionStatus(
    targetUserId: string,
    nextPlan: AccessPlan,
    reason?: string
  ): Promise<UserAccessRecord> {
    return this.updateAccess(targetUserId, {
      plan: nextPlan,
      reason: reason || null,
    });
  },
};
