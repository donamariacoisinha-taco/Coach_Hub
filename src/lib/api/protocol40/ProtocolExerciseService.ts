import { supabase } from '../supabase';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';

export const ProtocolExerciseService = {
  async getByDayId(dayId: string) {
    return await supabase.from('premium_protocol_exercises').select('*').eq('day_id', dayId).order('exercise_order');
  },

  async create(data: Omit<PremiumProtocolExercise, 'id' | 'created_at' | 'updated_at'>) {
    return await supabase.from('premium_protocol_exercises').insert(data).select().single();
  },

  async update(id: string, data: Partial<PremiumProtocolExercise>) {
    return await supabase.from('premium_protocol_exercises').update(data).eq('id', id).select().single();
  },

  async delete(id: string) {
    return await supabase.from('premium_protocol_exercises').delete().eq('id', id);
  }
};
