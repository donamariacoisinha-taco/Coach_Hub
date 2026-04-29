
import { supabase } from '../../../lib/api/supabase';
import { Exercise } from '../../../types';
import { cloudinaryService } from '../../../services/cloudinaryService';

export const mediaApi = {
  async uploadAsset(file: File, path: string, _bucket: string = 'exercise-images', onProgress?: (p: number) => void) {
    // Determine subfolder based on path hint
    const isStaticFrame = path.includes('static-frames');
    const folder = isStaticFrame ? 'static-frames' : 'images';
    
    // Use Cloudinary service
    const url = await cloudinaryService.uploadImage(file, folder, onProgress);
    return url;
  },

  async deleteAsset(url: string, _bucket: string = 'exercise-images') {
    try {
      await cloudinaryService.deleteAsset(url);
    } catch (err) {
      console.warn('[MEDIA] Failed to delete Cloudinary asset, but proceeding:', err);
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
