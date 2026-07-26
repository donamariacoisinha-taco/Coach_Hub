import { supabase } from './supabase';
import { UserProfile, BodyMeasurement } from '../../types';
import { fetchWithRetry } from '../utils';

type AccessRole = 'admin' | 'coach' | 'user';
type AccessPlan = 'free' | 'premium';
type AccountStatus = 'active' | 'suspended';

type AccessRecord = {
  user_id: string;
  role: AccessRole;
  plan: AccessPlan;
  status: AccountStatus;
  created_at?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
};

type ProfileWithAccess = UserProfile & {
  user_access?: AccessRecord | AccessRecord[] | null;
};

export type EnrichedUserProfile = UserProfile & {
  role: AccessRole;
  plan: AccessPlan;
  account_status: AccountStatus;
  is_admin: boolean;
  is_premium: boolean;
  user_access: AccessRecord;
};

const getAccessRelation = (raw: ProfileWithAccess): AccessRecord | null => {
  if (Array.isArray(raw.user_access)) return raw.user_access[0] || null;
  return raw.user_access || null;
};

export const mergeAccess = (raw: ProfileWithAccess | null): EnrichedUserProfile | null => {
  if (!raw) return null;

  const access = getAccessRelation(raw);
  if (!access) {
    throw new Error(`Integridade P0: user_access ausente para o perfil ${raw.id}.`);
  }

  const { user_access: _relation, ...profile } = raw;
  return {
    ...profile,
    role: access.role,
    plan: access.plan,
    account_status: access.status,
    is_admin: access.role === 'admin',
    is_premium: access.plan === 'premium',
    user_access: access,
  } as EnrichedUserProfile;
};

const hydrateLocalPreferences = (profile: EnrichedUserProfile, userId: string) => {
  const storedDays = localStorage.getItem(`rubi_preferred_training_days_${userId}`);
  if (storedDays) {
    try {
      profile.preferred_training_days = JSON.parse(storedDays);
    } catch (error) {
      console.error('[profileApi] Invalid preferred training days cache:', error);
    }
  }

  const storedOnboarding = localStorage.getItem(`kyron_onboarding_v21_${userId}`);
  if (storedOnboarding) {
    try {
      const onboarding = JSON.parse(storedOnboarding);
      profile.sex = onboarding.sex;
      profile.primary_goal = onboarding.primary_goal;
      profile.training_experience = onboarding.training_experience;
      profile.weekly_availability = onboarding.weekly_availability;
      profile.training_environment = onboarding.training_environment;
      profile.restrictions = onboarding.restrictions;
      profile.exercise_dislikes = onboarding.exercise_dislikes;
      profile.onboarding_version = onboarding.onboarding_version;
      profile.updated_at = onboarding.updated_at;
      profile.active_protocol_id = onboarding.active_protocol_id;
      profile.active_plan_id = onboarding.active_plan_id;
      profile.last_onboarding_update = onboarding.last_onboarding_update;
    } catch (error) {
      console.error('[profileApi] Invalid onboarding cache:', error);
    }
  }

  if (!profile.sex && profile.gender) profile.sex = profile.gender;
  if (!profile.primary_goal && profile.goal) profile.primary_goal = String(profile.goal);
  if (!profile.training_experience && profile.experience_level) {
    profile.training_experience = String(profile.experience_level);
  }
  if (!profile.weekly_availability && profile.frequency) {
    profile.weekly_availability = Number.parseInt(profile.frequency, 10) || 3;
  }

  return profile;
};

export const profileApi = {
  async getProfile(userId: string): Promise<EnrichedUserProfile | null> {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_access(*)')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      const profile = mergeAccess(data as ProfileWithAccess | null);
      if (!profile) return null;

      if (!profile.email) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user?.id === userId && authData.user.email) {
          profile.email = authData.user.email;
        }
      }

      return hydrateLocalPreferences(profile, userId);
    });
  },

  async updateStreak(userId: string, streak: number) {
    return fetchWithRetry(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ workout_streak: streak })
        .eq('id', userId);
      if (error) throw error;
    });
  },

  async updateWeight(userId: string, weight: number) {
    return fetchWithRetry(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ weight })
        .eq('id', userId);
      if (error) throw error;
    });
  },

  async updateProfile(userId: string, payload: Partial<UserProfile> | Record<string, unknown>) {
    return fetchWithRetry(async () => {
      const unsafePayload = payload as Record<string, unknown>;
      const authorizationKeys = ['role', 'is_admin', 'is_premium', 'plan', 'account_status', 'user_access'];
      if (authorizationKeys.some(key => unsafePayload[key] !== undefined)) {
        throw new Error('Campos de autorização devem ser alterados somente pela RPC admin_update_user_access.');
      }

      if (unsafePayload.preferred_training_days) {
        localStorage.setItem(
          `rubi_preferred_training_days_${userId}`,
          JSON.stringify(unsafePayload.preferred_training_days)
        );
      }

      const storedOnboarding = localStorage.getItem(`kyron_onboarding_v21_${userId}`);
      let onboarding: Record<string, unknown> = {};
      if (storedOnboarding) {
        try {
          onboarding = JSON.parse(storedOnboarding);
        } catch (error) {
          console.error('[profileApi] Invalid onboarding cache:', error);
        }
      }

      const onboardingKeys = [
        'sex', 'primary_goal', 'training_experience', 'weekly_availability',
        'training_environment', 'restrictions', 'exercise_dislikes',
        'onboarding_version', 'updated_at', 'active_protocol_id',
        'active_plan_id', 'last_onboarding_update',
      ];
      for (const key of onboardingKeys) {
        if (unsafePayload[key] !== undefined) onboarding[key] = unsafePayload[key];
      }
      localStorage.setItem(`kyron_onboarding_v21_${userId}`, JSON.stringify(onboarding));

      const dbPayload: Record<string, unknown> = { id: userId };
      const profileColumns = [
        'email', 'name', 'full_name', 'avatar_url', 'weight', 'height',
        'age', 'birth_date', 'onboarding_completed', 'workout_streak', 'created_at',
      ];
      for (const column of profileColumns) {
        if (unsafePayload[column] !== undefined) dbPayload[column] = unsafePayload[column];
      }

      if (unsafePayload.sex !== undefined) dbPayload.gender = unsafePayload.sex;
      else if (unsafePayload.gender !== undefined) dbPayload.gender = unsafePayload.gender;

      if (unsafePayload.primary_goal !== undefined) dbPayload.goal = unsafePayload.primary_goal;
      else if (unsafePayload.goal !== undefined) dbPayload.goal = unsafePayload.goal;

      if (unsafePayload.training_experience !== undefined) {
        dbPayload.experience_level = unsafePayload.training_experience;
      } else if (unsafePayload.experience_level !== undefined) {
        dbPayload.experience_level = unsafePayload.experience_level;
      }

      if (unsafePayload.weekly_availability !== undefined) {
        dbPayload.frequency = String(unsafePayload.weekly_availability);
      } else if (unsafePayload.frequency !== undefined) {
        dbPayload.frequency = unsafePayload.frequency;
      }

      const { error } = await supabase.from('profiles').upsert(dbPayload);
      if (error) throw error;
    });
  },

  async ensureProfile(userId: string): Promise<EnrichedUserProfile | null> {
    let profile = await this.getProfile(userId);
    if (profile) return profile;

    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email: authData.user?.email || '',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    // Production has ensure_user_access_after_profile_insert, which creates
    // the authoritative free/user/active access row.
    profile = await this.getProfile(userId);
    if (!profile) throw new Error('Perfil criado sem registro user_access correspondente.');
    return profile;
  },

  async updateUserAccess(
    userId: string,
    changes: {
      role?: AccessRole;
      plan?: AccessPlan;
      status?: AccountStatus;
      reason?: string | null;
    }
  ): Promise<AccessRecord> {
    if (!changes.role && !changes.plan && !changes.status) {
      throw new Error('Nenhuma alteração de acesso foi informada.');
    }

    const { data, error } = await supabase.rpc('admin_update_user_access', {
      p_user_id: userId,
      p_role: changes.role ?? null,
      p_plan: changes.plan ?? null,
      p_status: changes.status ?? null,
      p_reason: changes.reason ?? null,
    });

    if (error) throw error;
    if (!data) throw new Error('Supabase não retornou o registro user_access atualizado.');
    return data as AccessRecord;
  },

  async getBodyMeasurements() {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .order('measured_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BodyMeasurement[];
  },

  async deleteBodyMeasurement(id: string) {
    const { error } = await supabase.from('body_measurements').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertBodyMeasurement(payload: unknown) {
    const { error } = await supabase.from('body_measurements').upsert(payload as any);
    if (error) throw error;
  },

  async getAllProfiles(): Promise<EnrichedUserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_access(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(raw => mergeAccess(raw as ProfileWithAccess)!);
  },
};
