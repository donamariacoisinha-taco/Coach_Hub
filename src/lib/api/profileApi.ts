
import { supabase } from './supabase';
import { UserProfile, BodyMeasurement } from '../../types';
import { fetchWithRetry } from '../utils';

type AccessRecord = {
  user_id: string;
  role: 'admin' | 'user';
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
  suspension_reason?: string | null;
  suspended_at?: string | null;
  suspended_by?: string | null;
  updated_at?: string;
};

type ProfileWithAccess = UserProfile & {
  user_access?: AccessRecord | AccessRecord[] | null;
};

export const mergeAccess = (raw: ProfileWithAccess | null): UserProfile | null => {
  if (!raw) return null;

  const relation = Array.isArray(raw.user_access)
    ? raw.user_access[0]
    : raw.user_access;
  const { user_access: _userAccess, ...profile } = raw;

  if (!relation) {
    throw new Error(`Access record missing for profile ${raw.id}`);
  }

  return {
    ...profile,
    role: relation.role,
    plan: relation.plan,
    account_status: relation.status,
    suspension_reason: relation.suspension_reason ?? null,
    suspended_at: relation.suspended_at ?? null,
    suspended_by: relation.suspended_by ?? null,
    is_admin: relation.role === 'admin',
    is_premium: relation.plan === 'premium'
  };
};

export const profileApi = {
  async getProfile(userId: string) {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_access(*)')
        .eq('id', userId)
        .maybeSingle();
        if (error) throw error;

        let currentUserEmail = '';
        try {
          const { data: authData } = await supabase.auth.getUser();
          currentUserEmail = authData?.user?.email || '';
        } catch (e) {
          console.warn('[profileApi] Could not fetch auth user email:', e);
        }

        const profileData = mergeAccess(data as ProfileWithAccess | null);
        if (profileData) {
          if (!profileData.email && currentUserEmail && profileData.id === userId) {
            profileData.email = currentUserEmail;
          }
          // Hydrate preferred_training_days from local storage since it is not a DB column
          const stored = localStorage.getItem(`rubi_preferred_training_days_${userId}`);
          if (stored) {
            try {
              profileData.preferred_training_days = JSON.parse(stored);
            } catch (e) {
              console.error('[PROFILE_API] Error hydrating preferred_training_days', e);
            }
          }

          // Hydrate Onboarding 2.1 fields from local storage
          const storedOnboarding = localStorage.getItem(`kyron_onboarding_v21_${userId}`);
          if (storedOnboarding) {
            try {
              const onboardingObj = JSON.parse(storedOnboarding);
              profileData.sex = onboardingObj.sex;
              profileData.primary_goal = onboardingObj.primary_goal;
              profileData.training_experience = onboardingObj.training_experience;
              profileData.weekly_availability = onboardingObj.weekly_availability;
              profileData.training_environment = onboardingObj.training_environment;
              profileData.restrictions = onboardingObj.restrictions;
              profileData.exercise_dislikes = onboardingObj.exercise_dislikes;
              profileData.onboarding_version = onboardingObj.onboarding_version;
              profileData.updated_at = onboardingObj.updated_at;
              profileData.active_protocol_id = onboardingObj.active_protocol_id;
              profileData.active_plan_id = onboardingObj.active_plan_id;
              profileData.last_onboarding_update = onboardingObj.last_onboarding_update;
            } catch (e) {
              console.error('[PROFILE_API] Error hydrating onboarding v21 data', e);
            }
          }

          // Backwards compatibility fallback mappings for missing local hydration
          if (!profileData.sex && profileData.gender) profileData.sex = profileData.gender;
          if (!profileData.primary_goal && profileData.goal) profileData.primary_goal = profileData.goal as string;
          if (!profileData.training_experience && profileData.experience_level) profileData.training_experience = profileData.experience_level;
          if (!profileData.weekly_availability && profileData.frequency) {
            profileData.weekly_availability = parseInt(profileData.frequency, 10) || 3;
          }
        }
        return profileData;
    });
  },

  async updateStreak(userId: string, streak: number) {
    return fetchWithRetry(async () => {
      const { error } = await supabase.from('profiles').update({ workout_streak: streak }).eq('id', userId);
      if (error) throw error;
    });
  },

  async updateWeight(userId: string, weight: number) {
    return fetchWithRetry(async () => {
      const { error } = await supabase.from('profiles').update({ weight }).eq('id', userId);
      if (error) throw error;
    });
  },

  async updateProfile(userId: string, payload: Partial<UserProfile>) {
    return fetchWithRetry(async () => {
      if (
        payload.role !== undefined
        || payload.is_admin !== undefined
        || payload.is_premium !== undefined
        || payload.plan !== undefined
        || payload.account_status !== undefined
      ) {
        throw new Error('Authorization fields must be changed through updateUserAccess');
      }

      // Save preferred training days safely to localStorage to protect column constraints and maintain offline sync
      if (payload.preferred_training_days) {
        localStorage.setItem(`rubi_preferred_training_days_${userId}`, JSON.stringify(payload.preferred_training_days));
      }

      // 1. Persist Onboarding 2.1 values to local storage
      const storedOnboarding = localStorage.getItem(`kyron_onboarding_v21_${userId}`);
      let onboardingObj: any = {};
      if (storedOnboarding) {
        try {
          onboardingObj = JSON.parse(storedOnboarding);
        } catch (e) {
          console.error('[PROFILE_API] Error parsing onboarding storage', e);
        }
      }

      const onboardingKeys: Array<keyof UserProfile> = [
        'sex', 'primary_goal', 'training_experience', 'weekly_availability',
        'training_environment', 'restrictions', 'exercise_dislikes',
        'onboarding_version', 'updated_at', 'active_protocol_id',
        'active_plan_id', 'last_onboarding_update'
      ];

      onboardingKeys.forEach(key => {
        if (payload[key] !== undefined) {
          onboardingObj[key] = payload[key];
        }
      });

      localStorage.setItem(`kyron_onboarding_v21_${userId}`, JSON.stringify(onboardingObj));

      // 2. Draft safe DB schema values mapping only columns present in profiles table
      const dbPayload: any = {
        id: userId
      };

      const columnsInTable = [
        'email', 'name', 'full_name', 'avatar_url',
        'weight', 'height', 'age', 'birth_date', 'onboarding_completed',
        'workout_streak', 'created_at'
      ];

      columnsInTable.forEach(col => {
        if ((payload as any)[col] !== undefined) {
          dbPayload[col] = (payload as any)[col];
        }
      });

      // Map Onboarding 2.1 conceptual properties to real SQL columns
      if (payload.sex !== undefined) {
        dbPayload.gender = payload.sex;
      } else if (payload.gender !== undefined) {
        dbPayload.gender = payload.gender;
      }

      if (payload.primary_goal !== undefined) {
        dbPayload.goal = payload.primary_goal;
      } else if (payload.goal !== undefined) {
        dbPayload.goal = payload.goal;
      }

      if (payload.training_experience !== undefined) {
        dbPayload.experience_level = payload.training_experience;
      } else if (payload.experience_level !== undefined) {
        dbPayload.experience_level = payload.experience_level;
      }

      if (payload.weekly_availability !== undefined) {
        dbPayload.frequency = payload.weekly_availability.toString();
      } else if (payload.frequency !== undefined) {
        dbPayload.frequency = payload.frequency;
      }

      // We use upsert to ensure it works even if the profile was not yet created
      const { error } = await supabase
        .from('profiles')
        .upsert(dbPayload);
      if (error) throw error;
    });
  },

  async ensureProfile(userId: string) {
      let profile = await this.getProfile(userId);
      if (!profile) {
        console.log(`[PROFILE_API] Creating initial profile for ${userId} (user was likely deleted or is registering for the first time)`);
        
        // Clear old local storage caches before creating new profile to ensure they are treated as completely new
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes(userId) || key.startsWith('rubi_workout_init_') || key.startsWith('rubi_partial_session_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          localStorage.removeItem('favorite_workout_folder_id');
          localStorage.removeItem('deployed_folder_id');
          console.log(`[PROFILE_API] All local storage data for user ${userId} completely cleared.`);
        } catch (storageErr) {
          console.error('[PROFILE_API] Error clearing local storage:', storageErr);
        }

        let currentUserEmail = '';
        try {
          const { data: authData } = await supabase.auth.getUser();
          currentUserEmail = authData?.user?.email || '';
        } catch (e) {
          console.warn('[profileApi] Could not fetch auth user email:', e);
        }

        const { error } = await supabase.from('profiles').insert({
          id: userId,
          email: currentUserEmail,
          onboarding_completed: false,
          is_admin: false,
          created_at: new Date().toISOString()
        });
        if (error) {
          throw error;
        }
        profile = await this.getProfile(userId);
      }
      return profile;
  },

  async updateUserAccess(
    userId: string,
    changes: {
      role?: 'admin' | 'user';
      plan?: 'free' | 'premium';
      status?: 'active' | 'suspended';
      reason?: string | null;
    }
  ): Promise<AccessRecord> {
    const { data, error } = await supabase.rpc('admin_update_user_access', {
      p_user_id: userId,
      p_role: changes.role ?? null,
      p_plan: changes.plan ?? null,
      p_status: changes.status ?? null,
      p_reason: changes.reason ?? null
    });

    if (error) throw error;
    if (!data) throw new Error('Supabase did not return the updated access record');
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

  async upsertBodyMeasurement(payload: any) {
    const { error } = await supabase.from('body_measurements').upsert(payload);
    if (error) throw error;
  },

  async getAllProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_access(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(raw => mergeAccess(raw as ProfileWithAccess)!);
  }
};
