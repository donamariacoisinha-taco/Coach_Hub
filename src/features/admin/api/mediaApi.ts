
import { supabase } from '../../../lib/api/supabase';
import { Exercise } from '../../../types';
import { cloudinaryService } from '../../../services/cloudinaryService';

export const mediaApi = {
  async uploadAsset(file: File, path: string, bucket: string = 'exercise-images', onProgress?: (p: number) => void) {
    try {
      const fileExt = file.name.split('.').pop();
      // Use the provided path as part of the filename to maintain organization
      const cleanPath = path.replace(/[^\w\s\-\/.]/gi, '_');
      const fileName = `${cleanPath}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log('[SUPABASE_UPLOAD_START]', { bucket, fileName });

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600',
          // Supabase handles progress via a dedicated event or simple callback in some versions
          // If this version of supabase-js uses the options.onUploadProgress:
          // onUploadProgress: (progress) => onProgress?.(Math.round((progress.loaded / progress.total) * 100))
        } as any);

      if (uploadError) {
        console.error('[SUPABASE_UPLOAD_ERROR]', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('[SUPABASE_UPLOAD_SUCCESS]', publicUrl);
      return publicUrl;
    } catch (err: any) {
      console.error('[MEDIA_UPLOAD_FINAL_ERROR]', err);
      throw err;
    }
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

    // Mapeamento de compatibilidade: SEMPRE prioriza image_url
    if (currentPayload.static_frame_url && !currentPayload.image_url) {
      currentPayload.image_url = currentPayload.static_frame_url;
    }
    
    console.log('[MEDIA_API][UPDATE_PAYLOAD]', { exerciseId, payload: currentPayload });

    try {
      while (true) {
        try {
          // Verify supabase client is available
          if (!supabase) {
            throw new Error('Supabase client is not initialized');
          }

          const { error, status } = await supabase.from('exercises').update(currentPayload).eq('id', exerciseId);
          
          console.log('[MEDIA_API][UPDATE_RESPONSE]', { status, error });

          if (error) {
            // Check for specific Supabase error types
            if (error.message?.includes('Failed to fetch')) {
              console.error('[MEDIA_API] Network error detected. Check connection to Supabase.');
            }
            throw error;
          }
          console.log('[MEDIA_DB_SYNC_SUCCESS]', { remainingFields: Object.keys(currentPayload) });
          return;
        } catch (err: any) {
          const msg = err.message || '';
          
          // Enhanced fetch error handling
          if (msg.includes('Failed to fetch')) {
             console.error('[MEDIA_API] Critical Fetch Failure. Supabase might be unreachable.');
             throw new Error('Erro de conexão com o banco de dados (Failed to fetch). Verifique sua internet ou tente novamente em instantes.');
          }

          const isColumnError = msg.includes('column') || msg.includes('named') || msg.includes('does not exist') || msg.includes('PGRST204') || msg.includes('schema cache');

          if (isColumnError) {
            const match = msg.match(/column "([^"]+)"/) || 
                          msg.match(/named "([^"]+)"/) || 
                          msg.match(/column '([^']+)'/) ||
                          msg.match(/'([^']+)' column/) ||
                          msg.match(/named '([^']+)'/) ||
                          msg.match(/field "([^"]+)"/) ||
                          msg.match(/column ([^ ]+) /);
            
            let badColumn = match ? match[1] : null;

            if (!badColumn) {
              if (msg.includes('static_frame_url')) badColumn = 'static_frame_url';
              else if (msg.includes('technical_prompt')) badColumn = 'technical_prompt';
            }

            if (badColumn) {
              console.warn(`[MEDIA] Auto-removing missing column: ${badColumn}`);
              const { [badColumn]: _, ...remaining } = currentPayload;
              currentPayload = remaining;
              if (Object.keys(currentPayload).length === 0) throw new Error('Nenhuma coluna válida restou para atualizar.');
              continue;
            }
          }
          throw err;
        }
      }
    } catch (err: any) {
      console.error('[MEDIA_DB_SYNC_FINAL_FAILURE]', err);
      throw err;
    }
  }
};
