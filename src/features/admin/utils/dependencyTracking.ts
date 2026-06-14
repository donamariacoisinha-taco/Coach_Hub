import { premiumProtocolsApi } from '../../../lib/api/premiumProtocolsApi';
import { systemTemplatesApi } from '../../../lib/api/systemTemplatesApi';

export interface DependencyResult {
  protocols: { id: string; name: string }[];
  templates: { id: string; name: string }[];
  userWorkouts: { id: string; name: string }[];
}

export async function checkExerciseDependencies(exerciseId: string): Promise<DependencyResult> {
  const result: DependencyResult = {
    protocols: [],
    templates: [],
    userWorkouts: []
  };

  try {
    // 1. Check Protocols
    const protocols = await premiumProtocolsApi.getProtocols();
    if (Array.isArray(protocols)) {
      protocols.forEach(p => {
        const hasEx = p.workouts?.some(w => 
          w.exercises?.some(e => e.exercise_id === exerciseId)
        );
        if (hasEx) {
          result.protocols.push({ id: p.id, name: p.name });
        }
      });
    }
  } catch (err) {
    console.warn('[Dependency Checking] Failed to assess protocols:', err);
  }

  try {
    // 2. Check Templates
    const templates = await systemTemplatesApi.getTemplates();
    if (Array.isArray(templates)) {
      templates.forEach(t => {
        const hasEx = t.workouts?.some(w => 
          w.exercises?.some(e => e.exercise_id === exerciseId)
        );
        if (hasEx) {
          result.templates.push({ id: t.id, name: t.name });
        }
      });
    }
  } catch (err) {
    console.warn('[Dependency Checking] Failed to assess templates:', err);
  }

  try {
    // 3. Scan Local Storage for user workflows / historical logs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('rubi_mock_history_') || 
        key.startsWith('rubi_workout_init_') || 
        key.startsWith('rubi_dashboard_cache_') ||
        key.startsWith('rubi_user_template_tracking_')
      )) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (!parsed) continue;

            const name = parsed.name || 'Treino do Usuário';

            // Check exercises array
            if (parsed.exercises && Array.isArray(parsed.exercises)) {
              if (parsed.exercises.some((e: any) => e.exercise_id === exerciseId || e.id === exerciseId)) {
                result.userWorkouts.push({ id: parsed.id || key, name });
              }
            }

            // Check workouts array
            if (parsed.workouts && Array.isArray(parsed.workouts)) {
              parsed.workouts.forEach((w: any) => {
                if (w.exercises?.some((e: any) => e.exercise_id === exerciseId || e.id === exerciseId)) {
                  result.userWorkouts.push({ id: w.id || key, name: w.name || 'Sessão Registrada' });
                }
              });
            }
          } catch (e) {
            // ignore JSON parse error for unrelated keys
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Dependency Checking] Failed to scan local workouts:', err);
  }

  // De-duplicate workouts
  const uniqueWorkouts: { id: string; name: string }[] = [];
  const seenIds = new Set<string>();
  result.userWorkouts.forEach(w => {
    if (!seenIds.has(w.id)) {
      seenIds.add(w.id);
      uniqueWorkouts.push(w);
    }
  });
  result.userWorkouts = uniqueWorkouts;

  return result;
}
