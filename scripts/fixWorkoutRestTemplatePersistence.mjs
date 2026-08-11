import fs from 'node:fs';
import path from 'node:path';

const playerFile = path.resolve('src/features/workout/WorkoutPlayer.tsx');
let player = fs.readFileSync(playerFile, 'utf8');

const replaceOrAssert = (source, oldValue, newValue, marker, label) => {
  if (source.includes(marker)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[WorkoutRestTemplate] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(oldValue, newValue);
};

// The top-level workout_exercises.rest_time is not enough because WorkoutPlayer
// prefers sets_json[n].rest_time when loading a workout. Persist the adjusted
// default into every configured set so the next workout cannot fall back to an
// older per-set rest value.
player = replaceOrAssert(
  player,
  `          const { error: restSaveError } = await supabase.from('workout_exercises')\n            .update({ rest_time: currentRest })\n            .eq('id', latestExercise.id);`,
  `          // REST_TEMPLATE_SETS_PERSISTED: keep top-level and per-set defaults aligned.\n          const persistedRestSets = (latestExercise.sets_json || []).map((set: any) => ({\n            ...set,\n            rest_time: currentRest\n          }));\n          const { error: restSaveError } = await supabase.from('workout_exercises')\n            .update({ rest_time: currentRest, sets_json: persistedRestSets })\n            .eq('id', latestExercise.id);`,
  'REST_TEMPLATE_SETS_PERSISTED',
  'persist per-set rest defaults'
);

// Normalize the staged in-memory exercise as well. Otherwise the final template
// evolution step could overwrite the database again with old per-set rest values.
player = replaceOrAssert(
  player,
  `      await promptAndSaveExerciseData(latestExercise, latestActiveSetsData);`,
  `      const normalizedRestSetsData = latestActiveSetsData.map((set: any) => ({\n        ...set,\n        rest_time: Number(latestExercise.rest_time || 60)\n      }));\n      await promptAndSaveExerciseData(latestExercise, normalizedRestSetsData);`,
  'const normalizedRestSetsData = latestActiveSetsData.map',
  'normalize staged rest defaults'
);

fs.writeFileSync(playerFile, player);
console.log('[WorkoutRestTemplate] Adjusted rest persists in top-level and sets_json defaults.');
