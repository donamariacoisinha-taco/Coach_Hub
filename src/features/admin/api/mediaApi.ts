
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
    // We also remove objects/arrays that might be relations and not columns
    const { 
      id, 
      created_at, 
      muscle_groups, 
      ai_issues, 
      ai_suggestions, 
      version_history,
      ...updateData 
    } = payload as any;
    
    let currentPayload = { 
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Mapeamento de compatibilidade agressivo
    if (currentPayload.static_frame_url) {
      currentPayload.image_url = currentPayload.static_frame_url;
    }
    
    console.log('[MEDIA_DB_SYNC_START]', { exerciseId, fields: Object.keys(currentPayload) });

    while (true) {
      try {
        const { error } = await supabase.from('exercises').update(currentPayload).eq('id', exerciseId);
        if (error) {
          console.error('[MEDIA_DB_SYNC_ERROR_RAW]', error);
          throw error;
        }
        console.log('[MEDIA_DB_SYNC_SUCCESS]');
        return;
      } catch (err: any) {
        const msg = err.message || '';
        const isColumnError = msg.includes('column') || msg.includes('named') || msg.includes('does not exist') || msg.includes('PGRST204');

        if (isColumnError) {
          // Robust regex to find column name in quotes or single quotes
          const match = msg.match(/column "([^"]+)"/) || 
                        msg.match(/named "([^"]+)"/) || 
                        msg.match(/column '([^']+)'/) ||
                        msg.match(/named '([^']+)'/) ||
                        msg.match(/field "([^"]+)"/);
          
          const badColumn = match ? match[1] : null;

          if (badColumn) {
            console.warn(`[MEDIA] Auto-removing missing column from update: ${badColumn}`);
            const { [badColumn]: _, ...remaining } = currentPayload;
            currentPayload = remaining;
            if (Object.keys(currentPayload).length === 0) {
              console.warn('[MEDIA] All columns removed, nothing to update');
              return;
            }
            continue; // Retry with sanitized payload
          }
        }
        
        console.error('[MEDIA_DB_SYNC_FINAL_FAILURE]', err);
        throw err;
      }
    }
  }
};
