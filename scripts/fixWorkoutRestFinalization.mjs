import fs from 'node:fs';
import path from 'node:path';

const playerFile = path.resolve('src/features/workout/WorkoutPlayer.tsx');
let player = fs.readFileSync(playerFile, 'utf8');

const replaceOrAssert = (source, oldValue, newValue, marker, label) => {
  if (source.includes(marker)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[WorkoutRestFinalize] ${label}: source block changed unexpectedly.`);
  }
  return source.replace(oldValue, newValue);
};

// Keep a synchronous per-set copy of actual rest. React state updates can be
// deferred, especially on the terminal set where finishWorkout starts at once.
player = replaceOrAssert(
  player,
  `  const restEndTimestampRef = useRef<number | null>(null);\n  const restStartedAtRef = useRef<number | null>(null);`,
  `  const restEndTimestampRef = useRef<number | null>(null);\n  const restStartedAtRef = useRef<number | null>(null);\n  const restActualBySetRef = useRef<Record<string, number>>({});`,
  'const restActualBySetRef = useRef<Record<string, number>>({})',
  'actual-rest synchronous ref'
);

player = replaceOrAssert(
  player,
  `    if (actualRestSeconds !== null) {\n      const exerciseIndex = currentIndexRef.current;\n      setWorkoutPerformance(prev => {`,
  `    if (actualRestSeconds !== null) {\n      const exerciseIndex = currentIndexRef.current;\n      restActualBySetRef.current[\`${'${exerciseIndex}'}:${'${completedIdx}'}\`] = actualRestSeconds;\n      setWorkoutPerformance(prev => {`,
  'restActualBySetRef.current[`${exerciseIndex}:${completedIdx}`]',
  'capture actual rest before React update'
);

// The final batch is the last writer of workout_sets_log. Always consult the
// synchronous ref so the terminal set cannot lose its just-recorded rest.
player = replaceOrAssert(
  player,
  `            rest_time_actual: Number((set as any).rest_time_actual ?? 0) || null,`,
  `            rest_time_actual: Number((set as any).rest_time_actual ?? restActualBySetRef.current[\`${'${exIdx}'}:${'${setIdx}'}\`] ?? 0) || null,`,
  'restActualBySetRef.current[`${exIdx}:${setIdx}`]',
  'terminal batch rest fallback'
);

// Preserve actual rest across recovery/hydration so a resumed workout does not
// delete historical rest values when the final batch rewrites the session.
player = replaceOrAssert(
  player,
  `      const reconciledPerf: Record<number, {weight: number, reps: number, rpe: number, type?: SetType, rest_time?: number}[]> = {};`,
  `      const reconciledPerf: Record<number, {weight: number, reps: number, rpe: number, type?: SetType, rest_time?: number, rest_time_actual?: number}[]> = {};`,
  'rest_time_actual?: number}[]> = {}',
  'hydration performance type'
);

player = replaceOrAssert(
  player,
  `            type: s.type || SetType.NORMAL,\n            rest_time: s.rest_time\n          }));`,
  `            type: s.type || SetType.NORMAL,\n            rest_time: s.rest_time,\n            rest_time_actual: s.rest_time_actual\n          }));`,
  'rest_time_actual: s.rest_time_actual',
  'local hydration actual rest'
);

player = replaceOrAssert(
  player,
  `              rpe: l.rpe || 8,\n              type: l.set_type || SetType.NORMAL\n            };`,
  `              rpe: l.rpe || 8,\n              type: l.set_type || SetType.NORMAL,\n              rest_time_actual: l.rest_time_actual ?? undefined\n            };`,
  'type: l.set_type || SetType.NORMAL,\n              rest_time_actual:',
  'remote hydration new set actual rest'
);

player = replaceOrAssert(
  player,
  `              rpe: l.rpe || 8,\n              type: l.set_type || reconciledPerf[exIdx][sIdx].type || SetType.NORMAL\n            };`,
  `              rpe: l.rpe || 8,\n              type: l.set_type || reconciledPerf[exIdx][sIdx].type || SetType.NORMAL,\n              rest_time_actual: l.rest_time_actual ?? reconciledPerf[exIdx][sIdx].rest_time_actual\n            };`,
  'rest_time_actual: l.rest_time_actual ?? reconciledPerf',
  'remote hydration merge actual rest'
);

player = replaceOrAssert(
  player,
  `          rest_time: (s as any).rest_time || origSet?.rest_time || currentEx.rest_time || 60\n        };`,
  `          rest_time: (s as any).rest_time || origSet?.rest_time || currentEx.rest_time || 60,\n          rest_time_actual: (s as any).rest_time_actual\n        };`,
  'rest_time_actual: (s as any).rest_time_actual',
  'active set hydration actual rest'
);

fs.writeFileSync(playerFile, player);
console.log('[WorkoutRestFinalize] Actual rest survives terminal save and recovery.');
