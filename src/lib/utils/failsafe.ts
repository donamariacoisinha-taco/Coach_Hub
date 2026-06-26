import { supabase } from '../api/supabase';
import { workoutApi } from '../api/workoutApi';
import { exerciseApi } from '../api/exerciseApi';
import { fallbackExercises } from '../api/fallbackExercises';
import { normalizeMuscleGroup, sortExercisesAnatomically } from '../../types';

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('[Failsafe] Error reading from localStorage:', e);
    }
    return null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('[Failsafe] Error writing to localStorage:', e);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[Failsafe] Error removing from localStorage:', e);
    }
  }
};

export interface AuditReport {
  protocol: {
    id: string;
    name: string;
    status: string;
  } | null;
  workouts: {
    id: string;
    name: string;
    protocolName: string;
    exerciseCount: number;
    exercises: { id: string; name: string }[];
  }[];
  filters: {
    totalAvailable: number;
    muscleGroupsFound: string[];
    filteredCount: number;
    rulesEvaluation: string[];
  };
  autocorrected: boolean;
  actionsTaken: string[];
}

export async function runProtocolFailsafeAndAudit(userId: string, email: string, passedFolderId?: string | null): Promise<AuditReport> {
  const report: AuditReport = {
    protocol: null,
    workouts: [],
    filters: {
      totalAvailable: 0,
      muscleGroupsFound: [],
      filteredCount: 0,
      rulesEvaluation: []
    },
    autocorrected: false,
    actionsTaken: []
  };

  try {
    console.log(`%c[KYRON_OS_DIAGNOSTIC] Starting Critical Audit & Failsafe for ${email} (ID: ${userId})`, 'color: #3b82f6; font-weight: bold;');

    // 1. Fetch user onboarding parameters from localStorage or DB
    const storedOnboarding = safeLocalStorage.getItem(`kyron_onboarding_v21_${userId}`);
    let onboardingData: any = {};
    if (storedOnboarding) {
      try {
        onboardingData = JSON.parse(storedOnboarding);
      } catch (e) {
        console.error('[KYRON_OS_DIAGNOSTIC] Error parsing local onboarding config', e);
      }
    }

    const goal = onboardingData.primary_goal || 'Performance';
    const environment = onboardingData.training_environment || 'gym_full';
    const level = onboardingData.training_experience || 'beginner';
    
    // Ensure restrictions and dislikes are safely parsed as arrays
    const rawRestrictions = onboardingData.restrictions;
    const restrictions: string[] = Array.isArray(rawRestrictions)
      ? rawRestrictions
      : (typeof rawRestrictions === 'string' && rawRestrictions ? [rawRestrictions] : ['Nenhuma']);

    const rawDislikes = onboardingData.exercise_dislikes;
    const dislikes: string[] = Array.isArray(rawDislikes)
      ? rawDislikes
      : (typeof rawDislikes === 'string' && rawDislikes ? [rawDislikes] : []);

    const activeProtocolId = onboardingData.active_protocol_id || 'failsafe-id';

    report.filters.rulesEvaluation.push(`Goal: ${goal}`);
    report.filters.rulesEvaluation.push(`Environment: ${environment}`);
    report.filters.rulesEvaluation.push(`Level: ${level}`);
    report.filters.rulesEvaluation.push(`Restrictions: ${restrictions.join(', ')}`);
    report.filters.rulesEvaluation.push(`Dislikes: ${dislikes.join(', ')}`);

    // 2. Resolve Active Protocol
    let protocolName = 'Kyron OS Adaptativo';
    let protocolStatus = 'Active';

    const isUUID = (val: any): boolean => {
      if (typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    };

    // Query active plan folder to verify matches
    let favoriteFolderId = passedFolderId || safeLocalStorage.getItem('favorite_workout_folder_id') || onboardingData.active_plan_id;

    // Strict validation: Ignore any non-UUID inputs (e.g. "public_admin", "uncategorized", "null", "undefined")
    if (favoriteFolderId && !isUUID(favoriteFolderId)) {
      console.warn('[KYRON_OS_DIAGNOSTIC] favoriteFolderId is not a valid UUID, ignoring and resetting:', favoriteFolderId);
      favoriteFolderId = null;
    }

    // DB lookup fallback if favoriteFolderId is null/undefined
    if (!favoriteFolderId) {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('active_plan_id')
        .eq('id', userId)
        .maybeSingle();
      if (dbProfile?.active_plan_id && isUUID(dbProfile.active_plan_id)) {
        favoriteFolderId = dbProfile.active_plan_id;
        safeLocalStorage.setItem('favorite_workout_folder_id', favoriteFolderId);
        console.log('[KYRON_OS_DIAGNOSTIC] Resolved active_plan_id from profiles DB:', favoriteFolderId);
      }
    }

    // If still null, try finding any folder for this user
    if (!favoriteFolderId) {
      const { data: userFolders } = await supabase
        .from('workout_folders')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (userFolders && userFolders.length > 0) {
        const firstValidFolder = userFolders.find(uf => isUUID(uf.id));
        if (firstValidFolder) {
          favoriteFolderId = firstValidFolder.id;
          safeLocalStorage.setItem('favorite_workout_folder_id', favoriteFolderId);
          console.log('[KYRON_OS_DIAGNOSTIC] Resolved first existing user folder from DB:', favoriteFolderId);
        }
      }
    }

    // If STILL null, dynamically create a brand-new folder!
    if (!favoriteFolderId || !isUUID(favoriteFolderId)) {
      console.warn('[KYRON_OS_DIAGNOSTIC] No folder found in DB or storage. Dynamically creating brand-new folder...');
      const newFolder = await workoutApi.createFolder(userId, 'Kyron OS: Plano Personalizado');
      favoriteFolderId = newFolder.id;
      safeLocalStorage.setItem('favorite_workout_folder_id', favoriteFolderId);
      
      // Update profile DB
      await supabase.from('profiles').update({ active_plan_id: favoriteFolderId }).eq('id', userId);
      report.actionsTaken.push(`Created a brand new folder: "${newFolder.name}"`);
      report.autocorrected = true;
    }

    if (favoriteFolderId) {
      const { data: folderData } = await supabase
        .from('workout_folders')
        .select('name')
        .eq('id', favoriteFolderId)
        .maybeSingle();

      if (folderData) {
        protocolName = folderData.name;
      }
    }

    report.protocol = {
      id: activeProtocolId,
      name: protocolName,
      status: protocolStatus
    };

    console.log('[KYRON_OS_DIAGNOSTIC] AUDIT STEP 1 - PROTOCOL INFO', report.protocol);

    // 3. Resolve Workouts and linked exercises
    const { data: categories } = await supabase
      .from('workout_categories')
      .select('*')
      .eq('folder_id', favoriteFolderId);

    const activeCategories = categories || [];
    console.log(`[KYRON_OS_DIAGNOSTIC] AUDIT STEP 2 - WORKOUTS CREATED: Found ${activeCategories.length} workouts.`);

    // Load ALL exercises available in DB or fallback
    let allExercises: any[] = [];
    try {
      const res = await exerciseApi.getExercises();
      allExercises = Array.isArray(res) ? res : fallbackExercises;
    } catch {
      allExercises = fallbackExercises;
    }

    report.filters.totalAvailable = allExercises.length;
    const muscleGroups = Array.from(new Set(allExercises.map(e => e?.muscle_group || 'Outros')));
    report.filters.muscleGroupsFound = muscleGroups;

    // Apply onboarding rules evaluation
    const filteredAvailableExs = allExercises.filter(ex => {
      if (!ex) return false;
      if (ex.is_active === false) return false;
      const nameLower = (ex.name || '').toLowerCase();

      // 1. Dislikes
      if (dislikes.some(d => nameLower.includes(d.toLowerCase()))) {
        return false;
      }

      // 2. Environment
      if (environment === 'home') {
        if (
          nameLower.includes('leg press') ||
          nameLower.includes('pulley') ||
          nameLower.includes('polia') ||
          nameLower.includes('cadeira extensor') ||
          nameLower.includes('cadeira flexor') ||
          nameLower.includes('mesa flexora') ||
          nameLower.includes('crossover') ||
          nameLower.includes('hack') ||
          nameLower.includes('smith') ||
          nameLower.includes('graviton') ||
          nameLower.includes('supino inclinado articulado')
        ) {
          return false;
        }
      }

      // 3. Restrictions
      if (restrictions.some(r => r.toLowerCase().includes('ombro'))) {
        if (nameLower.includes('desenvolvimento com barra') || nameLower.includes('overhead press')) {
          return false;
        }
      }
      if (restrictions.some(r => r.toLowerCase().includes('joelho'))) {
        if (nameLower.includes('agachamento livre profundo') || nameLower.includes('leg press 45')) {
          return false;
        }
      }
      if (restrictions.some(r => r.toLowerCase().includes('lombar'))) {
        if (nameLower.includes('levantamento terra') || nameLower.includes('remada curvada')) {
          return false;
        }
      }

      return true;
    });

    report.filters.filteredCount = filteredAvailableExs.length;
    console.log(`[KYRON_OS_DIAGNOSTIC] AUDIT STEP 5 & 6 - FILTER EVALUATION:
      - Total Available: ${report.filters.totalAvailable}
      - Muscle Groups: ${report.filters.muscleGroupsFound.join(', ')}
      - Filtered Matching Rules: ${report.filters.filteredCount}`);

    // Fetch and examine relation mappings for each category
    for (const cat of activeCategories) {
      const { data: relations } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('category_id', cat.id)
        .order('sort_order', { ascending: true });

      const linkedExs = relations || [];
      report.workouts.push({
        id: cat.id,
        name: cat.name || 'Treino Sem Nome',
        protocolName: protocolName,
        exerciseCount: linkedExs.length,
        exercises: linkedExs.map(r => ({ id: r.exercise_id || '', name: r.exercise_name_snapshot || 'Exercício' }))
      });

      console.log(`- Workout ID: ${cat.id} | Name: ${cat.name || 'Treino Sem Nome'} | Linked Exercises: ${linkedExs.length}`);
      linkedExs.forEach(r => {
        console.log(`  * Relationship mapped -> Workout: ${cat.id} | Exercise: ${r.exercise_id} | Name: ${r.exercise_name_snapshot}`);
      });

      // 4. AUTOCORRECTION & FAILSAFE RULE COMPLIANCE:
      // Minimum: 5 exercises. Maximum: 10 exercises. No workout empty!
      try {
        if (linkedExs.length < 5 || linkedExs.length > 10) {
          console.warn(`[KYRON_OS_DIAGNOSTIC] Workout "${cat.name || 'Treino Sem Nome'}" has ${linkedExs.length} exercises. Out of boundaries [5 - 10]. Triggering Failsafe Autocorrect...`);
          report.autocorrected = true;
          report.actionsTaken.push(`Corrected workout "${cat.name || 'Treino Sem Nome'}" exercise count from ${linkedExs.length} to meet [5-10] rule.`);

          // Determine compatible exercises based on category name or split muscle hints
          const catNameLower = (cat.name || '').toLowerCase();
          let targetMuscles: string[] = [];
          if (catNameLower.includes('superior') || catNameLower.includes('peito') || catNameLower.includes('costas') || catNameLower.includes('ombro') || catNameLower.includes('braço')) {
            targetMuscles = ['Peito', 'Costas', 'Ombros', 'Braços'];
          } else if (catNameLower.includes('inferior') || catNameLower.includes('perna') || catNameLower.includes('glúteo') || catNameLower.includes('quad')) {
            targetMuscles = ['Pernas'];
          } else {
            targetMuscles = ['Peito', 'Costas', 'Ombros', 'Pernas', 'Braços', 'Abdômen'];
          }

          // Filter compatible exercises
          let candidates = filteredAvailableExs.filter(ex => {
            if (!ex) return false;
            const normMuscle = normalizeMuscleGroup(ex.muscle_group || '');
            return targetMuscles.some(tm => normalizeMuscleGroup(tm).toLowerCase() === normMuscle.toLowerCase());
          });

          // FALLBACK DE EMERGÊNCIA: If no compatible exercises found under filters, use emergency database list
          if (candidates.length < 5) {
            console.warn('[KYRON_OS_DIAGNOSTIC] Too few matching exercises under strict filters. Activating emergency fallback database...');
            
            // Emergency exercise list names
            const emergencyNames = [
              'Leg Press',
              'Supino Máquina',
              'Puxada Frontal',
              'Desenvolvimento Máquina',
              'Mesa Flexora',
              'Prancha'
            ];

            candidates = allExercises.filter(ex => 
              ex && ex.name && emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase()))
            );

            // If still less than 5, grab any active exercises to guarantee a sheet
            if (candidates.length < 5) {
              candidates = allExercises.slice(0, 6).filter(Boolean);
            }
          }

          // Shuffle and take between 5 and 8 exercises (target average of 6) to stay strictly between 5 and 10
          const shuffled = [...candidates].filter(Boolean).sort(() => 0.5 - Math.random());
          const finalSelection = sortExercisesAnatomically(shuffled.slice(0, Math.min(8, Math.max(5, shuffled.length)))).filter(ex => ex && ex.id);

          if (finalSelection.length > 0) {
            // Remove existing exercises
            await supabase.from('workout_exercises').delete().eq('category_id', cat.id);

            // Map payload
            const finalPayload = finalSelection.map((ex, index) => {
              const setsCount = level === 'advanced' ? 4 : 3;
              const repsValue = level === 'beginner' ? '12' : '10';
              const rest = 60;

              return {
                category_id: cat.id,
                exercise_id: ex.id,
                exercise_name_snapshot: ex.name,
                sets: setsCount,
                reps: repsValue,
                weight: level === 'beginner' ? 10 : 20,
                rest_time: rest,
                sort_order: index + 1,
                sets_json: Array.from({ length: setsCount }, () => ({
                  reps: repsValue,
                  weight: level === 'beginner' ? 10 : 20,
                  rest_time: rest
                }))
              };
            });

            if (finalPayload.length > 0) {
              await workoutApi.insertWorkoutExercises(finalPayload);
              console.log(`[KYRON_OS_DIAGNOSTIC] Workout "${cat.name}" autocorrected successfully with ${finalPayload.length} exercises.`);
            }
          }
        }
      } catch (workoutErr: any) {
        console.warn(`[KYRON_OS_DIAGNOSTIC] Failsafe correction failed for category ${cat.name || cat.id}:`, workoutErr?.message || workoutErr);
      }
    }

    // Double check: if no workouts/categories exist at all, create emergency plan Treino A
    try {
      if (activeCategories.length === 0 && favoriteFolderId) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Severe Failsafe triggered - Zero workouts found. Generating emergency "Treino A - Ativação Geral"...');
        report.autocorrected = true;
        report.actionsTaken.push('Created emergency "Treino A" as folder had zero categories.');

        const cat = await workoutApi.createCategory({
          user_id: userId,
          folder_id: favoriteFolderId,
          name: 'Treino A — Ativação Geral',
          description: 'Treino adaptativo de ativação emergencial.'
        });

        // Emergency exercises
        const emergencyNames = [
          'Leg Press',
          'Supino Máquina',
          'Puxada Frontal',
          'Desenvolvimento Máquina',
          'Mesa Flexora',
          'Prancha'
        ];

        let emergencyExs = allExercises.filter(ex => 
          ex && ex.name && emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase()))
        );

        if (emergencyExs.length === 0) {
          emergencyExs = allExercises.slice(0, 6).filter(Boolean);
        }

        const sortedEmergencyExs = sortExercisesAnatomically(emergencyExs).filter(ex => ex && ex.id);

        const finalPayload = sortedEmergencyExs.map((ex, index) => ({
          category_id: cat.id,
          exercise_id: ex.id,
          exercise_name_snapshot: ex.name,
          sets: 3,
          reps: '12',
          weight: 15,
          rest_time: 60,
          sort_order: index + 1,
          sets_json: [
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 }
          ]
        }));

        if (finalPayload.length > 0) {
          await workoutApi.insertWorkoutExercises(finalPayload);
          console.log('[KYRON_OS_DIAGNOSTIC] Emergency "Treino A" created and populated with standard exercises.');
        }
      }
    } catch (emergencyErr: any) {
      console.warn('[KYRON_OS_DIAGNOSTIC] Emergency category generation failed:', emergencyErr?.message || emergencyErr);
    }

    console.log(`%c[KYRON_OS_DIAGNOSTIC] Audit Complete. Status autocorrected: ${report.autocorrected}`, 'color: #10b981; font-weight: bold;');
  } catch (err: any) {
    console.error('[KYRON_OS_DIAGNOSTIC] Critical failure in audit runner:', err);
  }

  return report;
}
