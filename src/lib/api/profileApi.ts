
import { supabase } from './supabase';
import { UserProfile, BodyMeasurement } from '../../types';

export const profileApi = {
  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data as UserProfile | null;
  },

  async updateStreak(userId: string, streak: number) {
    const { error } = await supabase.from('profiles').update({ workout_streak: streak }).eq('id', userId);
    if (error) throw error;
  },

  async updateWeight(userId: string, weight: number) {
    const { error } = await supabase.from('profiles').update({ weight }).eq('id', userId);
    if (error) throw error;
  },

  async updateProfile(userId: string, payload: Partial<UserProfile>) {
    // We use upsert to ensure it works even if the profile was not yet created
    const { error } = await supabase
      .from('profiles')
      .upsert({ ...payload, id: userId })
      .eq('id', userId);
    if (error) throw error;
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
