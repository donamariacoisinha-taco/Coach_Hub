import { supabase } from './supabase';

export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type SubscriptionStatus = 'free' | 'premium' | 'trial' | 'past_due' | 'cancelled';

export interface AdminProfile {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  is_admin?: boolean | null;
  onboarding_completed?: boolean | null;
  workout_streak?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  account_status?: AccountStatus | string | null;
  subscription_status?: SubscriptionStatus | string | null;
  suspended_at?: string | null;
  deleted_at?: string | null;
  is_premium?: boolean | null;
  _p0_migration_missing?: boolean;
}

const P0_MISSING_CODES = new Set(['PGRST202', 'PGRST204', '42703', '42883', '42P01']);

export class P0MigrationRequiredError extends Error {
  code = 'P0_MIGRATION_REQUIRED';

  constructor(message = 'A migração P0 ainda não foi aplicada no Supabase.') {
    super(message);
    this.name = 'P0MigrationRequiredError';
  }
}

const isP0MissingError = (error: any): boolean => {
  const code = error?.code?.toString?.();
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();

  return Boolean(
    (code && P0_MISSING_CODES.has(code)) ||
    message.includes('admin_set_account_status') ||
    message.includes('admin_set_subscription_status') ||
    message.includes('admin_soft_delete_user') ||
    message.includes('account_status') ||
    message.includes('subscription_status') ||
    message.includes('function') && message.includes('does not exist')
  );
};

const normalizeProfile = (profile: any): AdminProfile => {
  const subscription = profile.subscription_status || (profile.is_premium ? 'premium' : 'free');
  return {
    ...profile,
    account_status: profile.account_status || 'active',
    subscription_status: subscription,
    is_premium: subscription === 'premium' || subscription === 'trial' || profile.is_premium === true,
  };
};

const throwMigrationRequiredIfNeeded = (error: any): never => {
  if (isP0MissingError(error)) {
    throw new P0MigrationRequiredError();
  }
  throw error;
};

export const adminSecurityApi = {
  isP0MigrationRequiredError(error: unknown): error is P0MigrationRequiredError {
    return error instanceof P0MigrationRequiredError || (error as any)?.code === 'P0_MIGRATION_REQUIRED';
  },

  async listProfiles(): Promise<AdminProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throwMigrationRequiredIfNeeded(error);

    return (data || [])
      .map(normalizeProfile)
      .filter(profile => profile.account_status !== 'deleted');
  },

  async setAccountStatus(targetUserId: string, nextStatus: AccountStatus, reason?: string): Promise<AdminProfile> {
    const { data, error } = await supabase.rpc('admin_set_account_status', {
      target_user_id: targetUserId,
      next_status: nextStatus,
      reason: reason || null,
    });

    if (error) throwMigrationRequiredIfNeeded(error);
    return normalizeProfile(data);
  },

  async setSubscriptionStatus(targetUserId: string, nextStatus: SubscriptionStatus, reason?: string): Promise<AdminProfile> {
    const { data, error } = await supabase.rpc('admin_set_subscription_status', {
      target_user_id: targetUserId,
      next_status: nextStatus,
      reason: reason || null,
    });

    if (error) throwMigrationRequiredIfNeeded(error);
    return normalizeProfile(data);
  },

  async softDeleteUser(targetUserId: string, reason?: string): Promise<AdminProfile> {
    const { data, error } = await supabase.rpc('admin_soft_delete_user', {
      target_user_id: targetUserId,
      reason: reason || null,
    });

    if (error) throwMigrationRequiredIfNeeded(error);
    return normalizeProfile(data);
  },
};
