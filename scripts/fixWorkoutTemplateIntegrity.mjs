import fs from 'node:fs';
import path from 'node:path';

const playerFile = path.resolve('src/features/workout/WorkoutPlayer.tsx');
const dashboardFile = path.resolve('src/features/dashboard/Dashboard.tsx');

let player = fs.readFileSync(playerFile, 'utf8');
let dashboard = fs.readFileSync(dashboardFile, 'utf8');

const replaceOrAssert = (source, oldValue, newValue, marker, label) => {
  if (source.includes(marker)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[WorkoutTemplateIntegrity] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(oldValue, newValue);
};

// 1) Dashboard must never fabricate an exercise count when the database says 0.
dashboard = replaceOrAssert(
  dashboard,
  `                    const exercisesCount = workout.exercises_count || (idx % 3 === 0 ? 8 : (idx % 3 === 1 ? 6 : 7));`,
  `                    const exercisesCount = workout.exercises_count ?? 0;`,
  'const exercisesCount = workout.exercises_count ?? 0;',
  'dashboard exercise count'
);

// 2) Track only exercise rows the user explicitly chose to remove. Runtime
// reconciliation/hydration must never be interpreted as a deletion command.
player = replaceOrAssert(
  player,
  `  const exercisesRef = useRef(exercises);\n  exercisesRef.current = exercises;`,
  `  const exercisesRef = useRef(exercises);\n  exercisesRef.current = exercises;\n  const removedExerciseIdsRef = useRef<Set<string>>(new Set());`,
  'const removedExerciseIdsRef = useRef<Set<string>>(new Set())',
  'explicit removal ref'
);

player = replaceOrAssert(
  player,
  `    const exName = exercises[index]?.exercise_name || "Exercício";\n    const updatedExercises = exercises.filter((_, i) => i !== index);`,
  `    const exerciseToRemove = exercises[index];\n    const exName = exerciseToRemove?.exercise_name || "Exercício";\n    if (exerciseToRemove?.id && !exerciseToRemove.id.startsWith('ex-live-')) {\n      removedExerciseIdsRef.current.add(exerciseToRemove.id);\n    }\n    const updatedExercises = exercises.filter((_, i) => i !== index);`,
  'removedExerciseIdsRef.current.add(exerciseToRemove.id)',
  'capture explicit removal'
);

// 3) Template evolution may delete only ids captured by the explicit Remove
// Exercise action. Never infer removals from ids missing in transient state.
const inferredDeleteRegex = /      \/\/ 2\. Remove deleted exercises\n      const activeIdsSet = new Set\([^\n]+\);\n      const removedExercises = originalExercises\.filter\(ex => ex\.id && !activeIdsSet\.has\(ex\.id\)\);\n      for \(const rem of removedExercises\) \{\n        const \{ error \} = await supabase\.from\('workout_exercises'\)\.delete\(\)\.eq\('id', rem\.id\);\n        if \(error\) throw error;\n      \}/;

if (!player.includes('const explicitRemovedIds = Array.from(removedExerciseIdsRef.current)')) {
  if (!inferredDeleteRegex.test(player)) {
    throw new Error('[WorkoutTemplateIntegrity] inferred deletion block changed unexpectedly.');
  }
  player = player.replace(
    inferredDeleteRegex,
    `      // 2. Remove only exercises explicitly deleted by the user.\n      // Missing/transient ids can occur during hydration and must never trigger mass deletion.\n      const explicitRemovedIds = Array.from(removedExerciseIdsRef.current);\n      for (const removedId of explicitRemovedIds) {\n        const { error } = await supabase.from('workout_exercises')\n          .delete()\n          .eq('id', removedId)\n          .eq('category_id', workoutId);\n        if (error) throw error;\n      }\n      removedExerciseIdsRef.current.clear();`
  );
}

fs.writeFileSync(playerFile, player);
fs.writeFileSync(dashboardFile, dashboard);
console.log('[WorkoutTemplateIntegrity] Dashboard count and explicit-deletion safeguards applied.');
