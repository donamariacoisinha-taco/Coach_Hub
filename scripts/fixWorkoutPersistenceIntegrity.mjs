import fs from 'node:fs';
import path from 'node:path';

const playerFile = path.resolve('src/features/workout/WorkoutPlayer.tsx');
const apiFile = path.resolve('src/lib/api/workoutApi.ts');

let player = fs.readFileSync(playerFile, 'utf8');
let api = fs.readFileSync(apiFile, 'utf8');

const replaceRegexOrAssert = (source, regex, replacement, marker, label) => {
  if (source.includes(marker)) return source;
  if (!regex.test(source)) {
    throw new Error(`[WorkoutPersistence] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(regex, replacement);
};

// 1) Never create non-UUID mock workout histories. A workout may only start
// after a real database history row exists. Explicit completed_at:null keeps
// active sessions compatible with the completion integrity trigger.
api = replaceRegexOrAssert(
  api,
  /  async startWorkoutHistory\(userId: string, workoutId: string, categoryName: string\) \{[\s\S]*?\n  \},\n\n  async upsertPartialSession/,
  `  async startWorkoutHistory(userId: string, workoutId: string, categoryName: string) {\n    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;\n\n    if (!uuidPattern.test(workoutId)) {\n      throw new Error('Não foi possível iniciar o treino: a ficha não possui um identificador válido no banco.');\n    }\n\n    let lastError: any = null;\n    for (let attempt = 1; attempt <= 3; attempt++) {\n      try {\n        const { data, error } = await supabase.from('workout_history').insert([{\n          user_id: userId,\n          category_id: workoutId,\n          category_name: categoryName,\n          completed_at: null\n        }]).select().single();\n\n        if (error) throw error;\n        if (!data?.id || !uuidPattern.test(data.id)) {\n          throw new Error('O banco não retornou um identificador válido para a sessão de treino.');\n        }\n        return data as WorkoutHistory;\n      } catch (err: any) {\n        lastError = err;\n        if (attempt < 3) {\n          await new Promise(resolve => setTimeout(resolve, 350 * attempt));\n        }\n      }\n    }\n\n    console.error('[workoutApi] Failed to create a real workout history after retries.', lastError);\n    throw lastError || new Error('Não foi possível criar a sessão de treino no banco. Tente novamente.');\n  },\n\n  async upsertPartialSession`,
  'Failed to create a real workout history after retries.',
  'real workout history'
);

// 2) Temporary session exercise ids must be treated as NEW rows when the user
// chooses to evolve the workout template.
player = replaceRegexOrAssert(
  player,
  /const addedCount = exercises\.filter\(ex => !ex\.id\)\.length;/,
  `const addedCount = exercises.filter(ex => !ex.id || ex.id.startsWith('ex-live-')).length;`,
  "ex.id.startsWith('ex-live-')).length",
  'new exercise detection'
);

// 3) Do not write template defaults while the workout is still in progress.
// Stage them in memory; the final evolution modal is the single commit point.
player = replaceRegexOrAssert(
  player,
  /  \/\/ HELPER TO SAVE EXERCISE DATA FOR THE NEXT WORKOUT SESSION[\s\S]*?\n  \/\/ CENTRALIZED PROGRESSION LOGIC/,
  `  // STAGE EXERCISE DATA FOR THE NEXT WORKOUT SESSION\n  // Database persistence happens only in handleApplyTemplateEvolution so that\n  // "manter apenas para hoje" truly leaves the template unchanged.\n  const promptAndSaveExerciseData = async (exObj: any, setsData: any[]) => {\n    if (!exObj || !setsData || setsData.length === 0) return;\n\n    const firstSet = setsData[0] || {\n      weight: exObj.weight || 0,\n      reps: parseInt(exObj.reps) || 10,\n      rpe: exObj.default_rpe || 8\n    };\n    const setsJsonList = setsData.map((s) => ({\n      reps: String(s.reps),\n      weight: Number(s.weight),\n      rest_time: Number(s.rest_time || exObj.rest_time || 60),\n      type: s.type || SetType.NORMAL,\n      rpe: Number(s.rpe || 8)\n    }));\n\n    const currentExercises = exercisesRef.current;\n    const updatedExercises = currentExercises.map(ex => {\n      const sameRow = exObj.id && ex.id === exObj.id;\n      const sameTransientExercise = !exObj.id && ex.exercise_id === exObj.exercise_id;\n      if (!sameRow && !sameTransientExercise) return ex;\n      return {\n        ...ex,\n        sets: setsData.length,\n        weight: Number(firstSet.weight),\n        reps: String(firstSet.reps),\n        rest_time: Number(exObj.rest_time || 60),\n        default_rpe: Number(firstSet.rpe || 8),\n        sets_json: setsJsonList\n      };\n    });\n\n    useWorkoutStore.setState({ exercises: updatedExercises } as any);\n  };\n\n  // CENTRALIZED PROGRESSION LOGIC`,
  'Database persistence happens only in handleApplyTemplateEvolution',
  'stage exercise defaults'
);

// 4) Completion state must be recorded per exercise whenever a set advances.
player = replaceRegexOrAssert(
  player,
  /    setCompletedSetIndices\(prev => \{\n      const next = new Set\(prev\);\n      next\.add\(completedIdx\);\n      return next;\n    \}\);/,
  `    setCompletedSetIndices(prev => {\n      const next = new Set(prev);\n      next.add(completedIdx);\n      return next;\n    });\n    setCompletedSetsByExercise(prev => {\n      const exerciseIndex = currentIndexRef.current;\n      const nextCompleted = new Set(prev[exerciseIndex] || []);\n      nextCompleted.add(completedIdx);\n      return { ...prev, [exerciseIndex]: nextCompleted };\n    });`,
  'const nextCompleted = new Set(prev[exerciseIndex] || [])',
  'per-exercise completion state'
);

// 5) sessionDiff must detect granular set/RPE changes, not only top-level fields.
player = replaceRegexOrAssert(
  player,
  /    \/\/ 5\. Sets\/reps count target adjustments[\s\S]*?    if \(targetChanges\.length > 0\) \{\n      diffsList\.push\(`Target de Séries\/Reps de \$\{targetChanges\.join\(', '\)\}`\);\n      changed = true;\n    \}/,
  `    // 5. Granular set/reps/load/RPE target adjustments\n    const targetChanges: string[] = [];\n    exercises.forEach((ex) => {\n      if (ex.id) {\n        const orig = originalExercises.find(o => o.id === ex.id);\n        const originalSets = orig ? (orig.sets_json?.length || orig.sets || 3) : 3;\n        const activeSets = ex.sets_json?.length || ex.sets || 3;\n        const originalRpe = Number(orig?.default_rpe ?? orig?.sets_json?.[0]?.rpe ?? 8);\n        const activeRpe = Number(ex.default_rpe ?? ex.sets_json?.[0]?.rpe ?? 8);\n        const granularSetsChanged = !!orig && JSON.stringify(orig.sets_json || []) !== JSON.stringify(ex.sets_json || []);\n        if (orig && (orig.reps !== ex.reps || originalSets !== activeSets || originalRpe !== activeRpe || granularSetsChanged)) {\n          targetChanges.push(ex.exercise_name);\n        }\n      }\n    });\n    if (targetChanges.length > 0) {\n      diffsList.push(\`Séries, reps, carga ou esforço de \${targetChanges.join(', ')}\`);\n      changed = true;\n    }`,
  'Granular set/reps/load/RPE target adjustments',
  'granular session diff'
);

// 6) Final workout history must include only explicitly completed sets.
player = replaceRegexOrAssert(
  player,
  /      const sets = setsUntyped as \{weight: number, reps: number, rpe: number\}\[\];\n\n      sets\.forEach\(\(set, setIdx\) => \{[\s\S]*?      \}\);\n\n      if \(sets\.length > 0\) \{\n        const lastSetVal = sets\[sets\.length - 1\];\n        if \(lastSetVal\.reps > 0\) \{[\s\S]*?        \}\n      \}/,
  `      const sets = setsUntyped as {weight: number, reps: number, rpe: number}[];\n      const completedForExercise = new Set<number>([\n        ...Array.from(completedSetsByExercise[exIdx] || []),\n        ...(exIdx === currentIndex ? Array.from(completedSetIndices) : [])\n      ]);\n\n      // At the terminal exercise the last React state update can still be in\n      // flight. Reaching the terminal state itself proves all runtime sets in\n      // the current exercise were completed.\n      if (exIdx === currentIndex && currentSet >= sets.length && currentIndex >= exercises.length - 1) {\n        sets.forEach((_, idx) => completedForExercise.add(idx));\n      }\n\n      const completedPerformance: { set: {weight: number, reps: number, rpe: number}, setIdx: number }[] = [];\n      sets.forEach((set, setIdx) => {\n        if (!completedForExercise.has(setIdx)) return;\n        if (set.reps > 0 || set.weight > 0) {\n          logs.push({\n            history_id: histId,\n            user_id: userId,\n            exercise_id: ex.exercise_id,\n            set_number: setIdx + 1,\n            weight_achieved: typeof set.weight === 'string' ? parseFloat(set.weight) : set.weight,\n            reps_achieved: typeof set.reps === 'string' ? parseInt(set.reps) : set.reps,\n            rpe: set.rpe,\n            set_type: SetType.NORMAL,\n            created_at: new Date().toISOString()\n          });\n          completedPerformance.push({ set, setIdx });\n        }\n      });\n\n      if (completedPerformance.length > 0) {\n        const lastSetVal = completedPerformance[completedPerformance.length - 1].set;\n        if (lastSetVal.reps > 0) {\n          progressions.push({\n            exerciseId: ex.exercise_id,\n            weight: typeof lastSetVal.weight === 'string' ? parseFloat(lastSetVal.weight) : lastSetVal.weight,\n            reps: typeof lastSetVal.reps === 'string' ? parseInt(lastSetVal.reps) : lastSetVal.reps,\n            rpe: lastSetVal.rpe\n          });\n        }\n      }`,
  'const completedForExercise = new Set<number>',
  'completed-only workout history'
);

// 7) Build the template from executed set data for completed sets while
// preserving untouched targets for sets that were not executed.
player = replaceRegexOrAssert(
  player,
  /        \/\/ Resolve individual, non-uniform sets_json[\s\S]*?\n        const firstSetReps = finalSetsJson\[0\]\?\.reps \|\| targetReps;\n        const firstSetWeight = finalSetsJson\[0\]\?\.weight !== undefined \? Number\(finalSetsJson\[0\]\.weight\) : targetWeight;/,
  `        // Resolve individual, non-uniform sets_json. Executed data wins only\n        // for sets that were actually completed; untouched sets keep their target.\n        const perfSets = workoutPerformance[index] || [];\n        const completedForExercise = new Set<number>([\n          ...Array.from(completedSetsByExercise[index] || []),\n          ...(index === currentIndex ? Array.from(completedSetIndices) : [])\n        ]);\n        const finalSetsJson = Array.from({ length: numSets }).map((_, sIdx) => {\n          const existingSet = ex.sets_json?.[sIdx];\n          const performedSet = perfSets?.[sIdx];\n          const usePerformed = completedForExercise.has(sIdx) && !!performedSet;\n          const sourceSet: any = usePerformed ? performedSet : (existingSet || performedSet || {});\n          return {\n            reps: sourceSet.reps !== undefined ? String(sourceSet.reps) : targetReps,\n            weight: sourceSet.weight !== undefined ? Number(sourceSet.weight) : targetWeight,\n            rest_time: Number(sourceSet.rest_time || existingSet?.rest_time || targetRest),\n            rpe: Number(sourceSet.rpe || existingSet?.rpe || ex.default_rpe || 8),\n            type: sourceSet.type || existingSet?.type || SetType.NORMAL\n          };\n        });\n\n        const firstSetReps = finalSetsJson[0]?.reps || targetReps;\n        const firstSetWeight = finalSetsJson[0]?.weight !== undefined ? Number(finalSetsJson[0].weight) : targetWeight;\n        const firstSetRpe = Number(finalSetsJson[0]?.rpe || ex.default_rpe || 8);`,
  'Executed data wins only',
  'template from executed data'
);

// 8) ex-live ids are temporary; update existing rows only for real DB ids.
player = replaceRegexOrAssert(
  player,
  /        if \(ex\.id\) \{\n          \/\/ Existed in original template -> Update granularly/,
  `        const isNewExercise = !ex.id || ex.id.startsWith('ex-live-');\n        if (!isNewExercise) {\n          // Existed in original template -> Update granularly`,
  'const isNewExercise = !ex.id || ex.id.startsWith',
  'new row branch'
);

// 9) Persist default RPE together with weight/reps for existing rows.
player = replaceRegexOrAssert(
  player,
  /            if \(orig\.rest_time !== targetRest\) \{\n              patch\.rest_time = targetRest;\n            \}\n\n            if \(JSON\.stringify\(orig\.sets_json\) !== JSON\.stringify\(finalSetsJson\)\) \{/,
  `            if (orig.rest_time !== targetRest) {\n              patch.rest_time = targetRest;\n            }\n            if (Number(orig.default_rpe ?? 8) !== firstSetRpe) {\n              patch.default_rpe = firstSetRpe;\n            }\n\n            if (JSON.stringify(orig.sets_json) !== JSON.stringify(finalSetsJson)) {`,
  'patch.default_rpe = firstSetRpe',
  'existing default RPE'
);

// 10) Persist default RPE for newly inserted workout exercises.
player = replaceRegexOrAssert(
  player,
  /            rest_time: targetRest,\n            sets_json: finalSetsJson,/,
  `            rest_time: targetRest,\n            default_rpe: firstSetRpe,\n            sets_json: finalSetsJson,`,
  'default_rpe: firstSetRpe',
  'new exercise default RPE'
);

// 11) Temporary session ids must not prevent detection of removed original rows.
player = replaceRegexOrAssert(
  player,
  /const activeIdsSet = new Set\(exercises\.map\(ex => ex\.id\)\.filter\(Boolean\)\);/,
  `const activeIdsSet = new Set(exercises.map(ex => ex.id).filter(id => !!id && !id.startsWith('ex-live-')));`,
  "!id.startsWith('ex-live-')",
  'active template ids'
);

fs.writeFileSync(playerFile, player);
fs.writeFileSync(apiFile, api);
console.log('[WorkoutPersistence] Integrity fixes applied or already present.');
