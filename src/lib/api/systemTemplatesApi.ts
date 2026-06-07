import { supabase } from './supabase';
import { workoutApi } from './workoutApi';
import { SetConfig, WorkoutCategory, WorkoutExercise, WorkoutFolder } from '../../types';

export interface SystemTemplateExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight: number;
  rest_time: number;
  sets_json: SetConfig[];
  notes?: string;
  sort_order: number;
}

export interface SystemTemplateWorkout {
  id: string;
  name: string;
  description?: string;
  exercises: SystemTemplateExercise[];
}

export interface SystemTemplate {
  id: string; // e.g. "iniciante", "hipertrofia_base", etc.
  name: string;
  description: string;
  version: number;
  is_default: boolean;
  updated_at: string;
  updated_by: string;
  created_at: string;
  created_by: 'system' | 'admin' | 'rubi_ai';
  folders: { id: string; name: string }[];
  workouts: SystemTemplateWorkout[];
  version_history?: {
    version: number;
    updated_at: string;
    updated_by: string;
    changes: string[];
  }[];
}

// Global Static Seed Templates (Initialized to ensure complete system functionality)
export const DEFAULT_SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'iniciante',
    name: 'Iniciante',
    description: 'Protocolo padrão para novos atletas focando em adaptação neuromuscular básica e progressão inicial rápida.',
    version: 3,
    is_default: true,
    created_at: '2026-06-01T12:00:00Z',
    updated_at: '2026-06-02T18:00:00Z',
    updated_by: 'Rubi Admin',
    created_by: 'system',
    folders: [{ id: 'f_iniciante', name: 'Iniciante' }],
    workouts: [
      {
        id: 'w_fb_a',
        name: 'Full Body A',
        description: 'Foco inicial em membros superiores e ativação de core.',
        exercises: [
          {
            exercise_id: '5ce43864-44ac-4822-ba91-30efc477431e', // Static exercise placeholder index if uuid is not synced
            exercise_name: 'Leg Press 45',
            sets: 3,
            reps: '10',
            weight: 40,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 40, rest_time: 60 },
              { reps: '10', weight: 40, rest_time: 60 },
              { reps: '10', weight: 40, rest_time: 60 }
            ]
          },
          {
            exercise_id: '58f114c0-ebfd-4370-b9bb-c67d1dbb8997',
            exercise_name: 'Puxada Frente',
            sets: 3,
            reps: '10',
            weight: 25,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 25, rest_time: 60 },
              { reps: '10', weight: 25, rest_time: 60 },
              { reps: '10', weight: 25, rest_time: 60 }
            ]
          },
          {
            exercise_id: '81fd8997-ebfd-4370-b9bb-c67d1dbb8123',
            exercise_name: 'Cadeira Extensora',
            sets: 3,
            reps: '12',
            weight: 15,
            rest_time: 60,
            sort_order: 3,
            sets_json: [
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 }
            ]
          }
        ]
      },
      {
        id: 'w_fb_b',
        name: 'Treino 02',
        description: 'Foco em antagonistas, flexores de perna e elevação controlada de intensidade.',
        exercises: [
          {
            exercise_id: 'a9d287ef-9ef9-4089-80be-84576395b050',
            exercise_name: 'Cadeira Flexora',
            sets: 3,
            reps: '12',
            weight: 20,
            rest_time: 60,
            sort_order: 1,
            sets_json: [
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 }
            ]
          },
          {
            exercise_id: '439ea861-cfbc-4889-8fa4-52dfb31a890a',
            exercise_name: 'Tríceps Pulley',
            sets: 3,
            reps: '10',
            weight: 15,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '10', weight: 15, rest_time: 60 },
              { reps: '10', weight: 15, rest_time: 60 },
              { reps: '10', weight: 15, rest_time: 60 }
            ]
          },
          {
            exercise_id: '48f114c0-ebfd-4370-b9bb-c67d1dbb89aa',
            exercise_name: 'Elevação lateral',
            sets: 3,
            reps: '10',
            weight: 5,
            rest_time: 60,
            sort_order: 3,
            sets_json: [
              { reps: '10', weight: 5, rest_time: 60 },
              { reps: '10', weight: 5, rest_time: 60 },
              { reps: '10', weight: 5, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-05-15T10:00:00Z',
        updated_by: 'Rubi Admin',
        changes: ['Criação do protocolo inicial Iniciante para novos atletas.']
      },
      {
        version: 2,
        updated_at: '2026-05-28T14:30:00Z',
        updated_by: 'Rubi Admin',
        changes: ['Ajuste de volume de séries nos exercícios multiarticulares.', 'Adicionado descanso padrão de 60s.']
      },
      {
        version: 3,
        updated_at: '2026-06-02T18:00:00Z',
        updated_by: 'Rubi Admin',
        changes: ['Substituído Peck Deck por Crucifixo Máquina.', 'Otimizada a ordem dos antagonistas no Treino A e B.', 'Melhor distribuição de volume para iniciantes.']
      }
    ]
  },
  {
    id: 'hipertrofia_base',
    name: 'Hipertrofia Base',
    description: 'Protocolo focado em hipertrofia geral, dividindo volume semanal de forma balanceada.',
    version: 1,
    is_default: false,
    created_at: '2026-06-01T12:00:00Z',
    updated_at: '2026-06-01T12:00:00Z',
    updated_by: 'Rubi Admin',
    created_by: 'admin',
    folders: [{ id: 'f_hipertrofia', name: 'Hipertrofia Base' }],
    workouts: [
      {
        id: 'w_push',
        name: 'Push (Peito e Tríceps)',
        description: 'Enfâse em empurrar.',
        exercises: [
          {
            exercise_id: '6ca43812-44ac-4822-ba91-30efc477431e',
            exercise_name: 'Supino Inclinado com Halteres',
            sets: 4,
            reps: '10',
            weight: 18,
            rest_time: 90,
            sort_order: 1,
            sets_json: [
              { reps: '10', weight: 18, rest_time: 90 },
              { reps: '10', weight: 18, rest_time: 90 },
              { reps: '10', weight: 18, rest_time: 90 },
              { reps: '10', weight: 18, rest_time: 90 }
            ]
          },
          {
            exercise_id: '439ea861-cfbc-4889-8fa4-52dfb31a890a',
            exercise_name: 'Tríceps Pulley',
            sets: 3,
            reps: '12',
            weight: 20,
            rest_time: 60,
            sort_order: 2,
            sets_json: [
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 },
              { reps: '12', weight: 20, rest_time: 60 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-01T12:00:00Z',
        updated_by: 'Rubi Admin',
        changes: ['Lançamento da versão base do protocolo de Hipertrofia.']
      }
    ]
  },
  {
    id: 'emagrecimento_inteligente',
    name: 'Emagrecimento Inteligente',
    description: 'Protocolo de alta densidade energética combinando força com intervalos metabólicos estruturados.',
    version: 1,
    is_default: false,
    created_at: '2026-06-01T12:00:00Z',
    updated_at: '2026-06-01T12:00:00Z',
    updated_by: 'Rubi Intelligence',
    created_by: 'rubi_ai',
    folders: [{ id: 'f_fit_slim', name: 'Emagrecimento Inteligente' }],
    workouts: [
      {
        id: 'w_metabolic',
        name: 'Full Body HIIT',
        description: 'Alta freqüência cardíaca e trabalho global de músculos.',
        exercises: [
          {
            exercise_id: '5ce43864-44ac-4822-ba91-30efc477431e',
            exercise_name: 'Leg Press 45',
            sets: 4,
            reps: '15',
            weight: 30,
            rest_time: 45,
            sort_order: 1,
            sets_json: [
              { reps: '15', weight: 30, rest_time: 45 },
              { reps: '15', weight: 30, rest_time: 45 },
              { reps: '15', weight: 30, rest_time: 45 },
              { reps: '15', weight: 30, rest_time: 45 }
            ]
          }
        ]
      }
    ],
    version_history: [
      {
        version: 1,
        updated_at: '2026-06-01T12:00:00Z',
        updated_by: 'Rubi Intelligence',
        changes: ['Modelo gerado pela IA da Rubi focado em otimização do gasto calórico total.']
      }
    ]
  }
];

// Local state for system templates persistence, syncing natively with database if tables exist
class SystemTemplatesApi {
  private getLocalTemplates(): SystemTemplate[] {
    const raw = localStorage.getItem('rubi_system_templates');
    if (!raw) {
      localStorage.setItem('rubi_system_templates', JSON.stringify(DEFAULT_SYSTEM_TEMPLATES));
      return DEFAULT_SYSTEM_TEMPLATES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SYSTEM_TEMPLATES;
    }
  }

  private saveLocalTemplates(templates: SystemTemplate[]) {
    localStorage.setItem('rubi_system_templates', JSON.stringify(templates));
  }

  async getTemplates(): Promise<SystemTemplate[]> {
    try {
      const { data, error } = await supabase.from('system_templates').select('*');
      if (error) {
        if (error.message?.includes('Could not find the table') || error.code === 'PGRST204') {
          console.warn('[SystemTemplatesApi] Table system_templates doesnt exist. Falling back to local state.');
          return this.getLocalTemplates();
        }
        throw error;
      }
      if (data && data.length > 0) {
        return data as SystemTemplate[];
      }
    } catch (e) {
      console.warn('[SystemTemplatesApi] Database query failed or table does not exist. Using high-fidelity local state cache.', e);
    }
    return this.getLocalTemplates();
  }

  async getTemplateById(id: string): Promise<SystemTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createOrUpdateTemplate(template: SystemTemplate): Promise<SystemTemplate> {
    try {
      const { data, error } = await supabase.from('system_templates').upsert(template).select().single();
      if (error) {
        if (error.message?.includes('Could not find the table') || error.code === 'PGRST204') {
          console.warn('[SystemTemplatesApi] Table system_templates doesnt exist. Persisting in local state.');
        } else {
          throw error;
        }
      } else if (data) {
        const local = this.getLocalTemplates();
        const index = local.findIndex(t => t.id === template.id);
        if (index > -1) local[index] = data as SystemTemplate;
        else local.push(data as SystemTemplate);
        this.saveLocalTemplates(local);
        return data as SystemTemplate;
      }
    } catch (e) {
      console.error('[SystemTemplatesApi] Could not upsert template to database:', e);
      throw e;
    }

    const local = this.getLocalTemplates();
    const index = local.findIndex(t => t.id === template.id);
    if (index > -1) {
      local[index] = template;
    } else {
      local.push(template);
    }
    this.saveLocalTemplates(local);
    return template;
  }

  async archiveTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('system_templates').delete().eq('id', id);
      if (error) {
        if (error.message?.includes('Could not find the table') || error.code === 'PGRST204') {
          console.warn('[SystemTemplatesApi] Table system_templates doesn\'t exist. Falling back to local state deletion.');
          const local = this.getLocalTemplates();
          const filtered = local.filter(t => t.id !== id);
          this.saveLocalTemplates(filtered);
          return true;
        }
        throw error;
      }
      
      const local = this.getLocalTemplates();
      const filtered = local.filter(t => t.id !== id);
      this.saveLocalTemplates(filtered);
      return true;
    } catch (e: any) {
      console.error('[SystemTemplatesApi] Database delete failed:', e);
      throw e;
    }
  }

  // Gets user template tracking registry: { [folderId]: { templateId, version } }
  getUserTemplateTracking(userId: string): Record<string, { templateId: string; version: number }> {
    const stored = localStorage.getItem(`rubi_user_template_tracking_${userId}`);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  updateUserTemplateTracking(userId: string, folderId: string, templateId: string, version: number) {
    const tracking = this.getUserTemplateTracking(userId);
    tracking[folderId] = { templateId, version };
    localStorage.setItem(`rubi_user_template_tracking_${userId}`, JSON.stringify(tracking));
  }

  removeUserTemplateTracking(userId: string, folderId: string) {
    const tracking = this.getUserTemplateTracking(userId);
    delete tracking[folderId];
    localStorage.setItem(`rubi_user_template_tracking_${userId}`, JSON.stringify(tracking));
  }

  // Detect which user folders need template updates, returning detailed info
  async detectUpdates(userId: string, userFolders: WorkoutFolder[]): Promise<any[]> {
    const tracking = this.getUserTemplateTracking(userId);
    const globalTemplates = await this.getTemplates();
    const updatesNeeded: any[] = [];

    for (const folder of userFolders) {
      const tracked = tracking[folder.id];
      if (tracked) {
        const globalTemplate = globalTemplates.find(t => t.id === tracked.templateId);
        if (globalTemplate && globalTemplate.version > tracked.version) {
          updatesNeeded.push({
            folderId: folder.id,
            folderName: folder.name,
            templateId: globalTemplate.id,
            templateName: globalTemplate.name,
            currentVersion: tracked.version,
            latestVersion: globalTemplate.version,
            changes: globalTemplate.version_history
              ?.filter(h => h.version > tracked.version)
              ?.flatMap(h => h.changes) || [],
            globalTemplate
          });
        }
      }
    }

    return updatesNeeded;
  }

  // Copies a system template to create a secure personal protocol copy for the athlete
  async copyTemplateToUser(userId: string, templateId: string): Promise<WorkoutFolder> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Modelo de sistema não encontrado.');

    // 1. Fetch available exercises database from Supabase to correctly map UUIDs by name, fall back to seed values
    let exerciseMap = new Map<string, string>();
    try {
      const { data: exercises } = await supabase.from('exercises').select('id, name');
      if (exercises) {
        exercises.forEach(ex => exerciseMap.set(ex.name.toLowerCase().trim(), ex.id));
      }
    } catch (e) {
      console.warn('[SystemTemplatesApi] Failed to load global exercise UUID reference map. Falling back to static identifiers.', e);
    }

    // 2. Create personal folder for the user
    const folderName = template.is_default && template.id === 'iniciante' ? 'Iniciantes' : template.name;
    const newFolder = await workoutApi.createFolder(userId, folderName);

    // 3. For each workout template, create a workout category and populate exercises
    for (const tw of template.workouts) {
      const categoryPayload = {
        user_id: userId,
        folder_id: newFolder.id,
        name: tw.name,
        description: tw.description || ''
      };

      const newCategory = await workoutApi.createCategory(categoryPayload);

      // Construct category exercises
      const workoutExercisesPayload = tw.exercises.map((te, idx) => {
        // Resolve closest exercise UUID using mapping or default to its static reference
        const matchedUuid = exerciseMap.get(te.exercise_name.toLowerCase().trim()) || te.exercise_id;
        
        return {
          category_id: newCategory.id,
          exercise_id: matchedUuid,
          exercise_name_snapshot: te.exercise_name,
          sets: te.sets,
          reps: te.reps,
          weight: te.weight,
          rest_time: te.rest_time,
          sort_order: te.sort_order || (idx + 1),
          sets_json: te.sets_json || []
        };
      });

      if (workoutExercisesPayload.length > 0) {
        await workoutApi.insertWorkoutExercises(workoutExercisesPayload);
      }
    }

    // 4. Update the local tracking registry with cloned version information
    this.updateUserTemplateTracking(userId, newFolder.id, template.id, template.version);

    return newFolder;
  }

  // Safe merge engine implementation: updates local copy without silencing user custom edits
  async mergeTemplate(
    userId: string,
    folderId: string,
    templateId: string,
    targetVersion: number,
    mode: 'safe' | 'overwrite' | 'keep'
  ): Promise<boolean> {
    const template = await this.getTemplateById(templateId);
    if (!template) throw new Error('Modelo global não encontrado.');

    if (mode === 'keep') {
      // Just mark the version as tracked without changing contents
      this.updateUserTemplateTracking(userId, folderId, templateId, targetVersion);
      return true;
    }

    // 1. Fetch current categories inside user folder
    const { data: userCategories, error: catError } = await supabase
      .from('workout_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('folder_id', folderId);

    if (catError) throw catError;

    // Resolve exercises map
    let exerciseMap = new Map<string, string>();
    try {
      const { data: exercises } = await supabase.from('exercises').select('id, name');
      if (exercises) {
        exercises.forEach(ex => exerciseMap.set(ex.name.toLowerCase().trim(), ex.id));
      }
    } catch {}

    if (mode === 'overwrite') {
      // Clean delete all categories inside folder to rebuild
      if (userCategories && userCategories.length > 0) {
        for (const cat of userCategories) {
          await workoutApi.deleteWorkout(cat.id);
        }
      }

      // Re-create completely
      for (const tw of template.workouts) {
        const categoryPayload = {
          user_id: userId,
          folder_id: folderId,
          name: tw.name,
          description: tw.description || ''
        };
        const newCategory = await workoutApi.createCategory(categoryPayload);

        const workoutExercisesPayload = tw.exercises.map((te, idx) => {
          const matchedUuid = exerciseMap.get(te.exercise_name.toLowerCase().trim()) || te.exercise_id;
          return {
            category_id: newCategory.id,
            exercise_id: matchedUuid,
            exercise_name_snapshot: te.exercise_name,
            sets: te.sets,
            reps: te.reps,
            weight: te.weight,
            rest_time: te.rest_time,
            sort_order: te.sort_order || (idx + 1),
            sets_json: te.sets_json || []
          };
        });

        if (workoutExercisesPayload.length > 0) {
          await workoutApi.insertWorkoutExercises(workoutExercisesPayload);
        }
      }

      this.updateUserTemplateTracking(userId, folderId, templateId, targetVersion);
      return true;
    }

    // === SAFE MERGE OPTION (Intelligent diff system and personalization safeguard) ===
    if (mode === 'safe') {
      for (const tw of template.workouts) {
        // Look for existing category in user's side matching template workout name (case insensitive match)
        const matchedUserCategory = userCategories?.find(
          c => c.name.toLowerCase().trim() === tw.name.toLowerCase().trim()
        );

        if (!matchedUserCategory) {
          // Create category and fill since athlete does not have it
          const categoryPayload = {
            user_id: userId,
            folder_id: folderId,
            name: tw.name,
            description: tw.description || ''
          };
          const newCategory = await workoutApi.createCategory(categoryPayload);

          const workoutExercisesPayload = tw.exercises.map((te, idx) => {
            const matchedUuid = exerciseMap.get(te.exercise_name.toLowerCase().trim()) || te.exercise_id;
            return {
              category_id: newCategory.id,
              exercise_id: matchedUuid,
              exercise_name_snapshot: te.exercise_name,
              sets: te.sets,
              reps: te.reps,
              weight: te.weight,
              rest_time: te.rest_time,
              sort_order: te.sort_order || (idx + 1),
              sets_json: te.sets_json || []
            };
          });

          if (workoutExercisesPayload.length > 0) {
            await workoutApi.insertWorkoutExercises(workoutExercisesPayload);
          }
        } else {
          // Merge exercises inside existing category
          const { data: userExercises, error: exError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('category_id', matchedUserCategory.id);

          if (exError) throw exError;

          const finalExercisesToInsert: any[] = [];
          const userExsList = userExercises || [];

          // Compare template exercises against user's actual workouts list
          for (const te of tw.exercises) {
            const matchedUuid = exerciseMap.get(te.exercise_name.toLowerCase().trim()) || te.exercise_id;
            
            // Check if user already has an exercise tracking this exercise id (or snapshot name matching)
            const matchedUserEx = userExsList.find(
              ue => ue.exercise_id === matchedUuid || ue.exercise_name_snapshot?.toLowerCase().trim() === te.exercise_name.toLowerCase().trim()
            );

            if (matchedUserEx) {
              // Athlete has the exercise. We preserve custom loads, notes, and sets.
              // We only update if the item is UNTOUCHED.
              // To detect if untouched: we check if weight is 0 or matches original baseline, or we just keep their settings to be safe!
              // Preservation Safeguard: Never overwrite custom modifications silently.
              const isUntouched = matchedUserEx.weight === 0 || matchedUserEx.weight === te.weight;
              
              if (isUntouched) {
                // Safely apply template optimizations to base parameters while preserving notes / custom structures
                await supabase
                  .from('workout_exercises')
                  .update({
                    sets: te.sets,
                    reps: te.reps,
                    weight: matchedUserEx.weight || te.weight,
                    rest_time: te.rest_time,
                    sets_json: te.sets_json
                  })
                  .eq('id', matchedUserEx.id);
              }
            } else {
              // Exercise does not exist in user's folder. Add as a new exercise.
              finalExercisesToInsert.push({
                category_id: matchedUserCategory.id,
                exercise_id: matchedUuid,
                exercise_name_snapshot: te.exercise_name,
                sets: te.sets,
                reps: te.reps,
                weight: te.weight,
                rest_time: te.rest_time,
                sort_order: te.sort_order || (userExsList.length + 1),
                sets_json: te.sets_json || []
              });
            }
          }

          if (finalExercisesToInsert.length > 0) {
            await workoutApi.insertWorkoutExercises(finalExercisesToInsert);
          }
        }
      }

      this.updateUserTemplateTracking(userId, folderId, templateId, targetVersion);
      return true;
    }

    return false;
  }
}

export const systemTemplatesApi = new SystemTemplatesApi();
