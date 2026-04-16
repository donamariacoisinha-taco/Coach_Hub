
import { supabase } from './supabase';
import { ProgressPhoto } from '../../types';

export const mediaApi = {
  async getPhotos(userId: string) {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as ProgressPhoto[];
  },

  async uploadPhoto(userId: string, photoUrl: string, tag: 'frente' | 'lado' | 'costas') {
    const { data, error } = await supabase.from('progress_photos').insert([{
      user_id: userId,
      photo_url: photoUrl,
      tag
    }]).select().single();
    
    if (error) throw error;
    return data as ProgressPhoto;
  },

  async deletePhoto(id: string) {
    const { error } = await supabase.from('progress_photos').delete().eq('id', id);
    if (error) throw error;
  }
};
