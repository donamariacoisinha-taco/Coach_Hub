
import { supabase } from '../../../lib/api/supabase';
import { Exercise } from '../../../types';

export const mediaApi = {
  async uploadAsset(file: File, path: string, bucket: string = 'exercise-images') {
    // Generate SEO friendly name
    const timestamp = Date.now();
    const isStaticFrame = path.includes('static-frames');
    
    let filePath: string;
    if (isStaticFrame) {
      // Requirement: /static-frames/{exerciseId}/{timestamp}.webp
      filePath = `${path}/${timestamp}.webp`;
    } else {
      const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
      filePath = `${path}/${timestamp}-${cleanName}`;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) throw uploadError;

    const result = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return result.data?.publicUrl || '';
  },

  async deleteAsset(url: string, bucket: string = 'exercise-images') {
    try {
      if (!url.includes(bucket)) return;
      const path = url.split(`${bucket}/`)[1];
      if (!path) return;
      await supabase.storage.from(bucket).remove([path]);
    } catch (err) {
      console.warn('[MEDIA] Failed to delete asset file, but proceeding:', err);
    }
  },

  async updateExerciseMedia(exerciseId: string, payload: Partial<Exercise>) {
    let currentPayload = { 
      ...payload,
      updated_at: new Date().toISOString()
    };
    
    while (true) {
      try {
        const { error } = await supabase.from('exercises').update(currentPayload).eq('id', exerciseId);
        if (error) throw error;
        return;
      } catch (err: any) {
        if (err.message?.includes('column') && err.message?.includes('schema cache')) {
          const match = err.message.match(/column '(.*)'/);
          if (match && match[1]) {
            const badColumn = match[1];
            console.warn(`[MEDIA] Removing missing column from update: ${badColumn}`);
            const { [badColumn as keyof typeof currentPayload]: _, ...remaining } = currentPayload;
            currentPayload = remaining as any;
            if (Object.keys(currentPayload).length === 0) throw err;
            continue;
          }
        }
        throw err;
      }
    }
  }
};
