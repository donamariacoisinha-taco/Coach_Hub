
import { supabase } from './supabase';

export const systemApi = {
  async notifyAdmin(payload: {
    user_id: string;
    user_name: string;
    user_email: string;
    admin_recipient: string;
    dossier_content: {
      summary: string;
      strategy: string;
    };
    email_body: string;
    status: 'pending_email';
  }) {
    const { error } = await supabase.from('admin_notifications').insert([payload]);
    if (error) throw error;
  }
};
