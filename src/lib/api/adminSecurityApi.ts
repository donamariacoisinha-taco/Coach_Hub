import { supabase } from './supabase';
import { UserProfile } from '../../types';

export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type SubscriptionStatus = 'free' | 'premium' | 'trial' | 'cancelled' | 'past_due';

export const adminSecurityApi = {
  async setAccountStatus(userId: string, status: AccountStatus, reason?: string): Promise<UserProfile> {
    const { data, error } = await supabase.rpc('admin_set_account_status', {
      target_user_id: userId,
      new_status: status,
      reason: reason || null,
    });

    if (error) throw error;
    return data as UserProfile;
  },

  async setSubscriptionStatus(userId: string, status: SubscriptionStatus, reason?: string): Promise<UserProfile> {
    const { data, error } = await supabase.rpc('admin_set_subscription_status', {
      target_user_id: userId,
      new_status: status,
      reason: reason || null,
    });

    if (error) throw error;
    return data as UserProfile;
  },

  async getAuditLogs(targetUserId?: string) {
    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (targetUserId) query = query.eq('target_user_id', targetUserId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};
