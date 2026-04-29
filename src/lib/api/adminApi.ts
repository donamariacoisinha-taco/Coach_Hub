
import { supabase } from './supabase';
import { Exercise, MuscleGroup } from '../../types';
import { cloudinaryService } from '../../services/cloudinaryService';

export const adminApi = {
  // Helper para sanitizar nomes
  sanitizeName(name: string) {
    if (!name) return '';
    return name
      .trim()
      .replace(/\s+/g, ' ') // Colapsar múltiplos espaços
      .normalize('NFD') // De-compor caracteres acentuados
      .replace(/[\u0300-\u036f]/g, ""); // Opcional: Aqui o requisito diz normalize, as vezes é só trim. 
      // Mas para a comparação de duplicatas, vamos usar uma versão limpa.
  },

  async updateExercise(id: string, payload: Partial<Exercise>) {
    // Sanitize payload
    const { id: _, created_at, ...updateData } = payload as any;
    let currentPayload = { ...updateData };
    
    // Sanitização básica
    if (currentPayload.name) {
      currentPayload.name = currentPayload.name.trim().replace(/\s+/g, ' ');
    }

    // Mapeamento de compatibilidade agressivo: static_frame_url sempre espelha image_url
    // Isso garante que se a coluna no DB faltar, a imagem principal continue salva.
    if (currentPayload.static_frame_url) {
      currentPayload.image_url = currentPayload.static_frame_url;
    }
    
    while (true) {
      try {
        const { error } = await supabase.from('exercises').update(currentPayload).eq('id', id);
        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um exercício com este nome.');
          }
          throw error;
        }
        return; // Success
      } catch (err: any) {
        const msg = err.message || '';
        const isColumnError = msg.includes('column') || msg.includes('named') || msg.includes('does not exist');

        if (isColumnError) {
          const match = msg.match(/column "([^"]+)"/) || 
                        msg.match(/named "([^"]+)"/) || 
                        msg.match(/column '([^']+)'/) ||
                        msg.match(/named '([^']+)'/);
          
          const badColumn = match ? match[1] : null;

          if (badColumn) {
            console.warn(`[ADMIN] Removing missing column from update: ${badColumn}`);
            const { [badColumn as keyof typeof currentPayload]: _, ...remaining } = currentPayload;
            currentPayload = remaining;
            
            if (Object.keys(currentPayload).length === 0) return;
            continue; // Retry
          }
        }
        throw err;
      }
    }
  },

  async createExercise(payload: Partial<Exercise>) {
    let currentPayload = { ...payload };
    
    // Sanitização básica
    if (currentPayload.name) {
      currentPayload.name = currentPayload.name.trim().replace(/\s+/g, ' ');
    }
    
    while (true) {
      try {
        const { error } = await supabase.from('exercises').insert([currentPayload]);
        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um exercício com este nome.');
          }
          throw error;
        }
        return; // Success
      } catch (err: any) {
        const msg = err.message || '';
        const isColumnError = msg.includes('column') || msg.includes('named') || msg.includes('does not exist');

        if (isColumnError) {
          const match = msg.match(/column "([^"]+)"/) || 
                        msg.match(/named "([^"]+)"/) || 
                        msg.match(/column '([^']+)'/) ||
                        msg.match(/named '([^']+)'/);
          
          const badColumn = match ? match[1] : null;

          if (badColumn) {
            console.warn(`[ADMIN] Removing missing column from insert: ${badColumn}`);
            const { [badColumn as keyof typeof currentPayload]: _, ...remaining } = currentPayload;
            currentPayload = remaining;
            
            if (Object.keys(currentPayload).length === 0) throw err;
            continue; // Retry
          }
        }
        throw err;
      }
    }
  },

  async uploadExerciseImage(file: File, _exerciseId: string) {
    const url = await cloudinaryService.uploadImage(file);
    return url;
  },

  async updateMuscleGroup(id: string, payload: Partial<MuscleGroup>) {
    const { error } = await supabase.from('muscle_groups').update(payload).eq('id', id);
    if (error) throw error;
  },

  async createMuscleGroup(payload: any) {
    const { error } = await supabase.from('muscle_groups').insert([payload]);
    if (error) throw error;
  },

  async deleteMuscleGroup(id: string) {
    const { error } = await supabase.from('muscle_groups').delete().eq('id', id);
    if (error) throw error;
  },

  async bulkUpdateStatus(ids: string[], is_active: boolean) {
    const { error } = await supabase.from('exercises').update({ is_active }).in('id', ids);
    if (error) throw error;
  },

  async updateExerciseStatus(id: string, is_active: boolean) {
    return this.bulkUpdateStatus([id], is_active);
  },

  async deleteExercise(id: string) {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) throw error;
  },

  async bulkCreateExercises(exercises: Partial<Exercise>[]) {
    try {
      const { data, error } = await supabase.from('exercises').insert(exercises).select();
      if (error) throw error;
      return data;
    } catch (err: any) {
      if (err.message?.includes('column') && err.message?.includes('schema cache')) {
        console.warn('[ADMIN] Fallback ativado em bulkCreateExercises');
        // Tenta inserir sem o select() para evitar erro de leitura de colunas inexistentes
        const { error } = await supabase.from('exercises').insert(exercises);
        if (error) throw error;
        return [];
      }
      throw err;
    }
  },

  async checkExistingExercise(name: string) {
    if (!name) return null;
    const sanitized = name.trim().replace(/\s+/g, ' ');

    const { data, error } = await supabase.from('exercises')
      .select('id, name')
      .ilike('name', sanitized)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async getAdminData() {
    try {
      const [exRes, mgRes] = await Promise.all([
        supabase.from('exercises').select('*').order('name'),
        supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true })
      ]);
      
      if (exRes.error) throw exRes.error;
      if (mgRes.error) throw mgRes.error;
      
      return {
        exercises: (exRes.data || []) as Exercise[],
        muscleGroups: (mgRes.data || []) as MuscleGroup[]
      };
    } catch (err: any) {
      if (err.message?.includes('column') && err.message?.includes('schema cache')) {
        console.warn('[ADMIN] Fallback ativado em getAdminData:', err.message);
        const [exRes, mgRes] = await Promise.all([
          supabase.from('exercises').select('id, name, muscle_group, is_active').order('name'),
          supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true })
        ]);
        if (exRes.error) throw exRes.error;
        if (mgRes.error) throw mgRes.error;
        return {
          exercises: (exRes.data || []) as Exercise[],
          muscleGroups: (mgRes.data || []) as MuscleGroup[]
        };
      }
      throw err;
    }
  },

  async getQualityStats() {
    try {
      const { data: exercises, error } = await supabase.from('exercises').select('*');
      if (error) throw error;
      
      const stats = {
        total: (exercises || []).length,
        premium: (exercises || []).filter(e => e.quality_status === 'premium').length,
        good: (exercises || []).filter(e => e.quality_status === 'good').length,
        improvable: (exercises || []).filter(e => e.quality_status === 'improvable').length,
        avgScore: (exercises || []).reduce((acc: number, curr: any) => acc + (curr.quality_score || 0), 0) / (exercises || []).length || 0
      };
      
      return stats;
    } catch (err: any) {
      if (err.message?.includes('column') && err.message?.includes('schema cache')) {
         console.warn('[ADMIN] Fallback ativado em getQualityStats');
         const { data: exercises, error } = await supabase.from('exercises').select('id, name');
         if (error) throw error;
         return {
            total: (exercises || []).length,
            premium: 0,
            good: 0,
            improvable: 0,
            avgScore: 0
          };
      }
      throw err;
    }
  },

  async getLowQualityExercises() {
    try {
      const { data, error } = await supabase.from('exercises')
        .select('*')
        .or('quality_status.eq.improvable,quality_score.lt.70')
        .limit(20);
      if (error) throw error;
      return (data || []) as Exercise[];
    } catch (err: any) {
      if (err.message?.includes('column') && err.message?.includes('schema cache')) {
        console.warn('[ADMIN] Fallback ativado em getLowQualityExercises');
        const { data, error } = await supabase.from('exercises')
          .select('id, name, muscle_group')
          .limit(20);
        if (error) throw error;
        return (data || []) as Exercise[];
      }
      throw err;
    }
  },

  async reorderMuscleGroups(items: { id: string, sort_order: number }[]) {
    // Supabase doesn't support bulk update with different values easily in a single call without RPC
    // For simplicity in this audit, we'll do them sequentially or assume an RPC exists.
    // Since I can't create RPCs, I'll do Promise.all
    const updates = items.map(item => 
      supabase.from('muscle_groups').update({ sort_order: item.sort_order }).eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;
  }
};
