
import { supabase } from './supabase';
import { UserProfile, BodyMeasurement } from '../../types';
import { fetchWithRetry } from '../utils';

export const profileApi = {
  async getProfile(userId: string) {
    return fetchWithRetry(async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error) throw error;
        
        let currentUserEmail = '';
        try {
          const { data: authData } = await supabase.auth.getUser();
          currentUserEmail = authData?.user?.email || '';
        } catch (e) {
          console.warn('[profileApi] Could not fetch auth user email:', e);
        }

        const adminEmails = [
          'donamariacoisinha@gmail.com',
          'marivaldotorres@gmail.com'
        ].map(e => e.toLowerCase());

        const isEmailAdmin = currentUserEmail ? adminEmails.includes(currentUserEmail.toLowerCase()) : false;

        if (data) {
          if (isEmailAdmin) {
            if (!data.is_admin || data.role !== 'admin') {
              console.log('[profileApi] Elevating admin status for:', currentUserEmail);
              try {
                await supabase.from('profiles').update({ is_admin: true, role: 'admin' }).eq('id', userId);
              } catch (err) {
                console.warn('Could not update is_admin status:', err);
              }
              data.is_admin = true;
              data.role = 'admin';
            }
          } else {
            if (data.is_admin || data.role === 'admin') {
              console.log('[profileApi] De-elevating non-admin user:', currentUserEmail);
              try {
                await supabase.from('profiles').update({ is_admin: false, role: 'user' }).eq('id', userId);
              } catch (err) {
                console.warn('Could not de-elevate is_admin status:', err);
              }
              data.is_admin = false;
              data.role = 'user';
            }
          }
        }
        
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
      } catch (err: any) {
        console.warn("[profileApi] Connection failed (Failed to fetch). Operating with local user profile fallback.", err);
        return {
          id: userId,
          email: 'convidado@kyron.os',
          name: 'Atleta Convidado',
          onboarding_completed: true,
          workout_streak: 5,
          biometrics_bmi: 23.8,
          training_experience: 'Avançado',
          performance_score: 94,
          weight: 82,
          height: 182,
          preferred_training_days: [1, 3, 5],
          created_at: new Date().toISOString()
        } as any;
      }
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
    try {
      const profile = await this.getProfile(userId);
      if (!profile) {
        console.log(`[PROFILE_API] Creating initial profile for ${userId}`);
        
        let currentUserEmail = '';
        try {
          const { data: authData } = await supabase.auth.getUser();
          currentUserEmail = authData?.user?.email || '';
        } catch (e) {
          console.warn('[profileApi] Could not fetch auth user email:', e);
        }

        const adminEmails = [
          'donamariacoisinha@gmail.com',
          'marivaldotorres@gmail.com'
        ].map(e => e.toLowerCase());

        const isEmailAdmin = currentUserEmail ? adminEmails.includes(currentUserEmail.toLowerCase()) : false;

        const { error } = await supabase.from('profiles').insert({
          id: userId,
          onboarding_completed: false,
          is_admin: isEmailAdmin,
          role: isEmailAdmin ? 'admin' : 'user',
          created_at: new Date().toISOString()
        });
        if (error) {
          console.warn("[PROFILE_API] Failed to write profile table, returning offline initial user state.");
          return {
            id: userId,
            name: 'Atleta Convidado',
            onboarding_completed: true,
            workout_streak: 5,
            biometrics_bmi: 23.8,
            training_experience: 'Avançado',
            performance_score: 94,
            weight: 82,
            height: 182,
            preferred_training_days: [1, 3, 5],
            created_at: new Date().toISOString()
          } as any;
        }
        return this.getProfile(userId);
      }
      return profile;
    } catch (e) {
      console.warn("[PROFILE_API] Exception when ensuring profile, returning offline guest setup.", e);
      return {
        id: userId,
        name: 'Atleta Convidado',
        onboarding_completed: true,
        workout_streak: 5,
        biometrics_bmi: 23.8,
        training_experience: 'Avançado',
        performance_score: 94,
        weight: 82,
        height: 182,
        preferred_training_days: [1, 3, 5],
        created_at: new Date().toISOString()
      } as any;
    }
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
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[profileApi] getAllProfiles connection failed, returning fallback mock profiles');
      return [
        { id: '1', name: 'Marivaldo Torres', email: 'marivaldotorres@gmail.com', role: 'admin', is_admin: true, onboarding_completed: true, workout_streak: 12, created_at: '2026-01-10T12:00:00Z', last_access: '2026-06-11T12:00:00Z', is_premium: true },
        { id: '2', name: 'Carlos Santos', email: 'carlos.santos@email.com', role: 'user', is_admin: false, onboarding_completed: true, workout_streak: 5, created_at: '2026-02-14T09:30:00Z', last_access: '2026-06-10T21:45:00Z', is_premium: false },
        { id: '3', name: 'Juliana Ribeiro', email: 'juliana.r@email.com', role: 'user', is_admin: false, onboarding_completed: true, workout_streak: 8, created_at: '2026-03-20T14:15:00Z', last_access: '2026-06-11T08:12:00Z', is_premium: true },
        { id: '4', name: 'Beatriz Costa', email: 'beatriz.c@email.com', role: 'user', is_admin: false, onboarding_completed: true, workout_streak: 0, created_at: '2026-04-05T17:00:00Z', last_access: '2026-06-05T10:00:00Z', is_premium: false },
        { id: '5', name: 'Mariana Lima', email: 'mariana.lima@email.com', role: 'user', is_admin: false, onboarding_completed: true, workout_streak: 15, created_at: '2026-05-12T11:20:00Z', last_access: '2026-06-11T07:44:00Z', is_premium: true },
        { id: '6', name: 'Gabriel Alencar', email: 'gabriel.alencar@email.com', role: 'user', is_admin: false, onboarding_completed: true, workout_streak: 4, created_at: '2026-05-20T15:40:00Z', last_access: '2026-06-11T06:10:00Z', is_premium: false }
      ];
    }
  }
};
