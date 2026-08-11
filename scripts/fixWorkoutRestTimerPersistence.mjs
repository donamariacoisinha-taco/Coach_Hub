import fs from 'node:fs';
import path from 'node:path';

const playerFile = path.resolve('src/features/workout/WorkoutPlayer.tsx');
let player = fs.readFileSync(playerFile, 'utf8');

const replaceRegexOrAssert = (source, regex, replacement, marker, label) => {
  if (source.includes(marker)) return source;
  if (!regex.test(source)) {
    throw new Error(`[WorkoutRest] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(regex, replacement);
};

// 1) Track when the current rest actually started so we can persist the real
// rest duration in workout_sets_log.rest_time_actual.
player = replaceRegexOrAssert(
  player,
  /  const restEndTimestampRef = useRef<number \| null>\(null\);/,
  `  const restEndTimestampRef = useRef<number | null>(null);\n  const restStartedAtRef = useRef<number | null>(null);`,
  'const restStartedAtRef = useRef<number | null>(null)',
  'rest start timestamp ref'
);

// 2) Timer adjustments must update the timestamp source of truth, not only the
// rendered counter. The same delta also becomes the new base rest for upcoming
// sets of the active exercise.
player = replaceRegexOrAssert(
  player,
  /  const handleAdjustTimer = \(delta: number\) => \{[\s\S]*?\n  \};\n\n  \/\/ Smart Footer Logic/,
  `  const handleAdjustTimer = (delta: number) => {\n    const now = Date.now();\n    const currentRemaining = restEndTimestampRef.current !== null\n      ? Math.max(0, Math.round((restEndTimestampRef.current - now) / 1000))\n      : timeLeft;\n    const adjustedRemaining = Math.max(0, currentRemaining + delta);\n\n    // Keep the countdown source of truth aligned with the visible timer so the\n    // 200ms interval cannot overwrite a manual +10s/-10s adjustment.\n    restEndTimestampRef.current = now + adjustedRemaining * 1000;\n    setTimeLeft(adjustedRemaining);\n\n    const exerciseIndex = currentIndexRef.current;\n    const storeExercises = useWorkoutStore.getState().exercises;\n    const liveExercise = storeExercises[exerciseIndex] || currentEx;\n\n    if (delta !== 0 && liveExercise) {\n      const currentBaseRest = Number(liveExercise.rest_time || 60);\n      const nextBaseRest = Math.max(10, Math.min(600, currentBaseRest + delta));\n      const appliedDelta = nextBaseRest - currentBaseRest;\n\n      if (appliedDelta !== 0) {\n        // While resting after set N, currentSet is still N (1-based). Therefore\n        // zero-based indexes >= currentSet are upcoming sets.\n        const firstUpcomingSetIndex = Math.max(0, currentSetRef.current);\n\n        setActiveSetsData(prev => prev.map((set, idx) =>\n          idx >= firstUpcomingSetIndex ? { ...set, rest_time: nextBaseRest } : set\n        ));\n\n        setWorkoutPerformance(prev => {\n          const existing = prev[exerciseIndex];\n          if (!existing) return prev;\n          return {\n            ...prev,\n            [exerciseIndex]: existing.map((set: any, idx: number) =>\n              idx >= firstUpcomingSetIndex ? { ...set, rest_time: nextBaseRest } : set\n            )\n          };\n        });\n\n        const updatedExercises = storeExercises.map((exercise, idx) => {\n          if (idx !== exerciseIndex) return exercise;\n          return {\n            ...exercise,\n            rest_time: nextBaseRest,\n            sets_json: (exercise.sets_json || []).map((set: any, setIdx: number) =>\n              setIdx >= firstUpcomingSetIndex ? { ...set, rest_time: nextBaseRest } : set\n            )\n          };\n        });\n        useWorkoutStore.setState({ exercises: updatedExercises } as any);\n\n        log('[REST_DEFAULT_ADJUSTED]', {\n          exerciseId: liveExercise.exercise_id,\n          previousRest: currentBaseRest,\n          nextRest: nextBaseRest,\n          firstUpcomingSetIndex\n        });\n      }\n    }\n\n    if (adjustedRemaining === 0 && currentRemaining > 0) {\n      log('[REST_SKIPPED] Timer adjusted to 0');\n    }\n  };\n\n  // Smart Footer Logic`,
  'REST_DEFAULT_ADJUSTED',
  'manual timer adjustment'
);

// 3) Initialize both rest timestamps immediately when rest begins. This avoids
// a race where the user taps +10s before the rest effect has run.
player = replaceRegexOrAssert(
  player,
  /    \/\/ INITIATE REST\n    setTimeLeft\(adaptiveRest\);\n    setRestOvertime\(0\);\n    setIsResting\(true\);/,
  `    // INITIATE REST\n    const restStartedAt = Date.now();\n    restStartedAtRef.current = restStartedAt;\n    restEndTimestampRef.current = restStartedAt + adaptiveRest * 1000;\n    setTimeLeft(adaptiveRest);\n    setRestOvertime(0);\n    setIsResting(true);`,
  'restStartedAtRef.current = restStartedAt',
  'rest timer initialization'
);

// 4) Clear both timer refs when rest is over.
player = replaceRegexOrAssert(
  player,
  /      restEndTimestampRef\.current = null;\n      return;/,
  `      restEndTimestampRef.current = null;\n      restStartedAtRef.current = null;\n      return;`,
  'restStartedAtRef.current = null',
  'rest ref cleanup'
);

// 5) Before resetting rest state, attach the actual elapsed rest to the just
// completed set and persist it to the incremental workout log. Final batch save
// also keeps this value (patch below).
player = replaceRegexOrAssert(
  player,
  /    \/\/ 3\. Reset states for progression\n    setIsResting\(false\);/,
  `    // 3. Persist actual rest duration before resetting rest state\n    const actualRestSeconds = restStartedAtRef.current !== null\n      ? Math.max(0, Math.round((Date.now() - restStartedAtRef.current) / 1000))\n      : null;\n\n    if (actualRestSeconds !== null) {\n      const exerciseIndex = currentIndexRef.current;\n      setWorkoutPerformance(prev => {\n        const sourceSets = prev[exerciseIndex] || activeSetsDataRef.current || [];\n        if (!sourceSets[completedIdx]) return prev;\n        const nextSets = [...sourceSets];\n        nextSets[completedIdx] = { ...nextSets[completedIdx], rest_time_actual: actualRestSeconds } as any;\n        return { ...prev, [exerciseIndex]: nextSets };\n      });\n\n      supabase.from('workout_sets_log')\n        .update({ rest_time_actual: actualRestSeconds })\n        .eq('history_id', historyId)\n        .eq('exercise_id', currentEx.exercise_id)\n        .eq('set_number', completedIdx + 1)\n        .then(({ error }) => {\n          if (error) console.warn('[REST_ACTUAL_SAVE_WARN]', error);\n        });\n    }\n\n    setIsResting(false);`,
  'REST_ACTUAL_SAVE_WARN',
  'actual rest persistence'
);

// 6) The final batch rewrite must preserve rest_time_actual, otherwise the
// incremental value above would be deleted at workout completion.
player = replaceRegexOrAssert(
  player,
  /            rpe: set\.rpe,\n            set_type: SetType\.NORMAL,/,
  `            rpe: set.rpe,\n            rest_time_actual: Number((set as any).rest_time_actual ?? 0) || null,\n            set_type: SetType.NORMAL,`,
  'rest_time_actual: Number((set as any).rest_time_actual',
  'final batch actual rest'
);

// 7) At exercise completion persist the manually adjusted base rest immediately
// for existing template rows. New ex-live rows are inserted later by the normal
// template-evolution flow, already carrying the adjusted rest_time.
player = replaceRegexOrAssert(
  player,
  /    if \(isLastSet\) \{\n      \/\/ Ask user if they wish to keep current exercise settings for next sessions\n      await promptAndSaveExerciseData\(currentEx, latestActiveSetsData\);/,
  `    if (isLastSet) {\n      const latestExercise = exercisesRef.current[latestCurrentIndex] || currentEx;\n      const hasPersistentRow = !!latestExercise?.id && !latestExercise.id.startsWith('ex-live-');\n      if (hasPersistentRow) {\n        const originalExercise = originalExercises.find(o => o.id === latestExercise.id);\n        const currentRest = Number(latestExercise.rest_time || 60);\n        const originalRest = Number(originalExercise?.rest_time || 60);\n        if (currentRest !== originalRest) {\n          const { error: restSaveError } = await supabase.from('workout_exercises')\n            .update({ rest_time: currentRest })\n            .eq('id', latestExercise.id);\n          if (restSaveError) {\n            console.warn('[REST_DEFAULT_SAVE_WARN]', restSaveError);\n          } else {\n            log('[REST_DEFAULT_SAVED]', { exerciseId: latestExercise.exercise_id, restTime: currentRest });\n          }\n        }\n      }\n\n      // Stage all other exercise settings for the normal template-evolution flow.\n      // Newly added exercises are inserted there with the adjusted rest_time.\n      await promptAndSaveExerciseData(latestExercise, latestActiveSetsData);`,
  'REST_DEFAULT_SAVED',
  'rest default persistence at exercise completion'
);

fs.writeFileSync(playerFile, player);
console.log('[WorkoutRest] Timer and rest persistence fixes applied or already present.');
