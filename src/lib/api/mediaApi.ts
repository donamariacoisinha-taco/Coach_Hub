
import { supabase } from './supabase';
import { ProgressPhoto } from '../../types';
import { GUEST_USER_ID } from './authApi';

export const mediaApi = {
  async getPhotos(userId: string) {
    // Convidado não tem fotos de progresso persistidas no Supabase — o id
    // sentinela nem passaria na coluna uuid. Sem esse corte, quem chama isto
    // (ex.: ProgressIntelligence ao montar a telemetria) recebe uma exceção
    // antes de alcançar o próprio fallback local de convidado.
    if (userId === GUEST_USER_ID) return [] as ProgressPhoto[];

    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProgressPhoto[];
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
