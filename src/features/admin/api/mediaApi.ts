
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
    // Sanitize payload: remove id and other non-updatable fields
    const { id, created_at, ...updateData } = payload as any;
    
    let currentPayload = { 
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Mapeamento de compatibilidade agressivo
    if (currentPayload.static_frame_url) {
      currentPayload.image_url = currentPayload.static_frame_url;
    }
    
    while (true) {
      try {
        const { error } = await supabase.from('exercises').update(currentPayload).eq('id', exerciseId);
        if (error) throw error;
        return;
      } catch (err: any) {
        const msg = err.message || '';
        const isColumnError = msg.includes('column') || msg.includes('named') || msg.includes('does not exist');

        if (isColumnError) {
          // Robust regex to find column name in quotes or single quotes
          const match = msg.match(/column "([^"]+)"/) || 
                        msg.match(/named "([^"]+)"/) || 
                        msg.match(/column '([^']+)'/) ||
                        msg.match(/named '([^']+)'/);
          
          const badColumn = match ? match[1] : null;

          if (badColumn) {
            console.warn(`[MEDIA] Removing missing column from update: ${badColumn}`);
            const { [badColumn as keyof typeof currentPayload]: _, ...remaining } = currentPayload;
            currentPayload = remaining as any;
            if (Object.keys(currentPayload).length === 0) return; // Nothing left to update
            continue; // Retry
          }
        }
        throw err;
      }
    }
  }
};
