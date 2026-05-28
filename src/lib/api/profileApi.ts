
import { supabase } from './supabase';
import { UserProfile, BodyMeasurement } from '../../types';
import { fetchWithRetry } from '../utils';

export const profileApi = {
  async getProfile(userId: string) {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      
      const profileData = data as UserProfile | null;
      if (profileData) {
        // Hydrate preferred_training_days from local storage since it is not a DB column
        const stored = localStorage.getItem(`rubi_preferred_training_days_${userId}`);
        if (stored) {
          try {
            profileData.preferred_training_days = JSON.parse(stored);
          } catch (e) {
            console.error('[PROFILE_API] Error hydrating preferred_training_days', e);
          }
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
      // Save preferred training days safely to localStorage to protect column constraints and maintain offline sync
      if (payload.preferred_training_days) {
        localStorage.setItem(`rubi_preferred_training_days_${userId}`, JSON.stringify(payload.preferred_training_days));
      }

      // Strip preferred_training_days before pushing to the profiles table
      const { preferred_training_days, ...cleanPayload } = payload as any;

      // We use upsert to ensure it works even if the profile was not yet created
      const { error } = await supabase
        .from('profiles')
        .upsert({ ...cleanPayload, id: userId });
      if (error) throw error;
    });
  },

  async ensureProfile(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      console.log(`[PROFILE_API] Creating initial profile for ${userId}`);
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        onboarding_completed: false,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      return this.getProfile(userId);
    }
    return profile;
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
  }
};
