import { supabase } from '../supabase';
import { PremiumProtocol, PremiumProtocolDay, PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { conflictResolutionService } from '../ConflictResolutionService';

export const ProtocolService = {
  async list(): Promise<PremiumProtocol[]> {
    const { data, error } = await supabase
      .from('premium_protocols')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ProtocolService] Error fetching protocols list:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<PremiumProtocol> {
    const { data, error } = await supabase
      .from('premium_protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[ProtocolService] Error fetching protocol by ID:', error);
      throw error;
    }
    return data;
  },

  async create(protocolData: Omit<PremiumProtocol, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<PremiumProtocol> {
    const finalData = {
      ...protocolData,
      version: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('premium_protocols')
      .insert(finalData)
      .select()
      .single();

    if (error) {
      console.error('[ProtocolService] Error inserting new protocol:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, protocolData: Partial<PremiumProtocol> & { version: number }): Promise<PremiumProtocol> {
    const localVersion = protocolData.version || 0;

    const { data: existingRecord, error: fetchError } = await supabase
      .from('premium_protocols')
      .select('id, name, version')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.warn('[ProtocolService] Failed to check existing record version:', fetchError);
    }

    if (existingRecord) {
      const serverVersion = existingRecord.version || 0;

      if (serverVersion !== localVersion) {
        conflictResolutionService.registerConflict(
          { id, name: existingRecord.name || protocolData.name || '', version: localVersion } as any,
          serverVersion
        );
        throw new Error("Este protocolo foi alterado em outro dispositivo. Recarregue os dados antes de salvar.");
      }

      const nextVersion = serverVersion + 1;
      const { id: _, created_at: __, updated_at: ___, ...updatePayload } = protocolData;

      const { data, error } = await supabase
        .from('premium_protocols')
        .update({
          ...updatePayload,
          version: nextVersion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('version', serverVersion)
        .select()
        .single();

      if (error || !data) {
        conflictResolutionService.registerConflict(
          { id, name: existingRecord.name || protocolData.name || '', version: localVersion } as any,
          serverVersion
        );
        throw new Error("Este protocolo foi alterado em outro dispositivo. Recarregue os dados antes de salvar.");
      }

      return data;
    } else {
      throw new Error("Protocolo não encontrado para atualização.");
    }
  },

  async softDelete(id: string, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('premium_protocols')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId || null
      })
      .eq('id', id);

    if (error) {
      console.error('[ProtocolService] Error performing soft delete:', error);
      throw error;
    }
  },

  /**
   * Safe transaction logic for saving the whole protocol.
   * Chained logical execution with client-side rollback capabilities.
   */
  async saveCompleteProtocol(
    protocol: Partial<PremiumProtocol>,
    days: PremiumProtocolDay[],
    exercises: Record<string, PremiumProtocolExercise[]>,
    deletedDayIds: string[],
    deletedExerciseIds: string[]
  ): Promise<{ protocol: PremiumProtocol; days: PremiumProtocolDay[]; exercises: Record<string, PremiumProtocolExercise[]> }> {
    const insertedDays: string[] = [];
    const insertedExercises: string[] = [];
    const modifiedDays: { id: string; original: any }[] = [];
    const modifiedExercises: { id: string; original: any }[] = [];
    
    let savedProtocol: PremiumProtocol;

    try {
      // 1. Save general protocol data
      if (protocol.id) {
        // Update
        savedProtocol = await this.update(protocol.id, protocol as any);
      } else {
        // Create
        const { id: _, version: __, created_at: ___, updated_at: ____, ...createPayload } = protocol;
        savedProtocol = await this.create(createPayload as any);
      }

      const protocolId = savedProtocol.id;
      const finalDays: PremiumProtocolDay[] = [];
      const finalExercises: Record<string, PremiumProtocolExercise[]> = {};

      // 2. Perform Day deletions first
      if (deletedDayIds.length > 0) {
        const { error: delDaysErr } = await supabase
          .from('premium_protocol_days')
          .delete()
          .in('id', deletedDayIds);
        if (delDaysErr) throw delDaysErr;
      }

      // 3. Perform Exercise deletions first
      if (deletedExerciseIds.length > 0) {
        const { error: delExsErr } = await supabase
          .from('premium_protocol_exercises')
          .delete()
          .in('id', deletedExerciseIds);
        if (delExsErr) throw delExsErr;
      }

      // Mapping old/client-side day IDs to new/database day IDs (in case of creation)
      const dayIdMapping: Record<string, string> = {};

      // 4. Save Days
      for (const day of days) {
        // Is it a brand new day? (we can detect by checking if it starts with "temp_" or if we want to insert)
        const isNewDay = !day.id || day.id.startsWith('temp_');
        const dayPayload = {
          protocol_id: protocolId,
          day_number: day.day_number,
          title: day.title || '',
          description: day.description || '',
          sort_order: day.sort_order
        };

        if (isNewDay) {
          const { data, error } = await supabase
            .from('premium_protocol_days')
            .insert(dayPayload)
            .select()
            .single();

          if (error) throw error;
          insertedDays.push(data.id);
          dayIdMapping[day.id] = data.id;
          finalDays.push(data);
        } else {
          // Track original for rollback
          const { data: original } = await supabase.from('premium_protocol_days').select('*').eq('id', day.id).single();
          modifiedDays.push({ id: day.id, original });

          const { data, error } = await supabase
            .from('premium_protocol_days')
            .update(dayPayload)
            .eq('id', day.id)
            .select()
            .single();

          if (error) throw error;
          dayIdMapping[day.id] = data.id;
          finalDays.push(data);
        }
      }

      // 5. Save Exercises
      for (const [dayId, exerciseList] of Object.entries(exercises)) {
        const realDayId = dayIdMapping[dayId] || dayId;
        finalExercises[realDayId] = [];

        for (const ex of exerciseList) {
          const isNewEx = !ex.id || ex.id.startsWith('temp_');
          const exPayload = {
            day_id: realDayId,
            exercise_id: ex.exercise_id,
            exercise_order: ex.exercise_order,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds || 60,
            load_type: ex.load_type || '',
            rpe: ex.rpe || '',
            tempo: ex.tempo || '',
            cadence: ex.cadence || '',
            notes: ex.notes || '',
            drop_set: !!ex.drop_set,
            rest_pause: !!ex.rest_pause,
            superset: !!ex.superset
          };

          if (isNewEx) {
            const { data, error } = await supabase
              .from('premium_protocol_exercises')
              .insert(exPayload)
              .select()
              .single();

            if (error) throw error;
            insertedExercises.push(data.id);
            finalExercises[realDayId].push(data);
          } else {
            // Track original for rollback
            const { data: original } = await supabase.from('premium_protocol_exercises').select('*').eq('id', ex.id).single();
            modifiedExercises.push({ id: ex.id, original });

            const { data, error } = await supabase
              .from('premium_protocol_exercises')
              .update(exPayload)
              .eq('id', ex.id)
              .select()
              .single();

            if (error) throw error;
            finalExercises[realDayId].push(data);
          }
        }
      }

      return {
        protocol: savedProtocol,
        days: finalDays,
        exercises: finalExercises
      };

    } catch (err: any) {
      console.error('[ProtocolService] Transaction failed. Initiating automated client-side rollback...', err);
      
      // Rollback newly inserted days
      if (insertedDays.length > 0) {
        await supabase.from('premium_protocol_days').delete().in('id', insertedDays);
      }
      // Rollback newly inserted exercises
      if (insertedExercises.length > 0) {
        await supabase.from('premium_protocol_exercises').delete().in('id', insertedExercises);
      }
      // Rollback modified days
      for (const item of modifiedDays) {
        if (item.original) {
          await supabase.from('premium_protocol_days').update(item.original).eq('id', item.id);
        }
      }
      // Rollback modified exercises
      for (const item of modifiedExercises) {
        if (item.original) {
          await supabase.from('premium_protocol_exercises').update(item.original).eq('id', item.id);
        }
      }

      throw err;
    }
  },

  subscribeToChanges(onUpdate: (payload: any) => void) {
    const channel = supabase
      .channel('premium_protocols_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_protocols'
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
