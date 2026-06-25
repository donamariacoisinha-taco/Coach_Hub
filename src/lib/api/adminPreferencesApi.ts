import { supabase } from './supabase';

export interface AdminPreferences {
  id: string;
  user_id: string;
  favorite_exercises: string[];
  recent_exercises: string[];
  created_at: string;
  updated_at: string;
}

export const adminPreferencesApi = {
  /**
   * Retrieves administrative preferences (favorites and recents) from Supabase.
   * Gracefully returns null on database connection errors or missing relation.
   */
  async getPreferences(userId: string): Promise<AdminPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('admin_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AdminPreferencesApi] Error querying admin_preferences table:', error.message);
        return null;
      }
      return data as AdminPreferences | null;
    } catch (err: any) {
      console.warn('[AdminPreferencesApi] Failed to fetch admin preferences from database:', err?.message || err);
      return null;
    }
  },

  /**
   * Saves or updates administrative preferences (favorites and recents) in Supabase.
   * Gracefully falls back if table is missing or write fails.
   */
  async savePreferences(
    userId: string,
    favoriteExercises: string[],
    recentExercises: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_preferences')
        .upsert({
          user_id: userId,
          favorite_exercises: favoriteExercises,
          recent_exercises: recentExercises,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.warn('[AdminPreferencesApi] Error writing to admin_preferences:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn('[AdminPreferencesApi] Exception writing to admin preferences database:', err?.message || err);
      return false;
    }
  }
};
