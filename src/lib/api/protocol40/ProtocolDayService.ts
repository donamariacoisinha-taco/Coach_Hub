import { supabase } from '../supabase';
import { PremiumProtocolDay } from '../../../types/protocol_4_0';

export const ProtocolDayService = {
  async getByProtocolId(protocolId: string) {
    return await supabase.from('premium_protocol_days').select('*').eq('protocol_id', protocolId).order('day_number');
  },

  async create(data: Omit<PremiumProtocolDay, 'id' | 'created_at' | 'updated_at'>) {
    return await supabase.from('premium_protocol_days').insert(data).select().single();
  },

  async update(id: string, data: Partial<PremiumProtocolDay>) {
    return await supabase.from('premium_protocol_days').update(data).eq('id', id).select().single();
  },

  async delete(id: string) {
    return await supabase.from('premium_protocol_days').delete().eq('id', id);
  }
};
