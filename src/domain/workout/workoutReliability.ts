import type { WorkoutExercise } from '../../types';
import { SetType } from '../../types';

export type WorkoutAdvanceAction =
  | 'NEXT_SET'
  | 'NEXT_EXERCISE'
  | 'FINISH_WORKOUT'
  | 'STAY';

export interface WorkoutPosition {
  currentIndex: number;
  currentSet: number;
}

export interface WorkoutAdvanceDecision extends WorkoutPosition {
  action: WorkoutAdvanceAction;
}

export interface RuntimeSetData {
  id?: string;
  weight: number;
  reps: number;
  rpe: number;
  type?: SetType;
  rest_time?: number;
}

export interface RemoteWorkoutLog {
  exercise_id: string;
  set_number: number;
  weight_achieved: number;
  reps_achieved: number;
  rpe?: number | null;
  set_type?: SetType | null;
  created_at?: string | null;
}

export interface LocalContinuityState {
  currentIndex?: number;
  currentSet?: number;
  activeSetsData?: RuntimeSetData[];
  workoutPerformance?: Record<string | number, RuntimeSetData[]>;
  completedSetsByExercise?: Record<string | number, number[] | Set<number>>;
}

export interface ReconciliationDiagnostics {
  remoteOverrides: number;
  localOnlySets: number;
  ignoredRemoteLogs: number;
  correctedPosition: boolean;
}

export interface ReconciledWorkoutProgress extends WorkoutPosition {
  workoutPerformance: Record<number, RuntimeSetData[]>;
  completedSetsByExercise: Record<number, Set<number>>;
  diagnostics: ReconciliationDiagnostics;
}

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNonNegativeInteger = (value: unknown, fallback: number): number => {
  const parsed = Math.trunc(toFiniteNumber(value, fallback));
  return parsed >= 0 ? parsed : fallback;
};

export const getWorkoutSetCount = (
  exercise: Pick<WorkoutExercise, 'sets_json' | 'sets'> | null | undefined,
  runtimeSetCount?: number,
): number => {
  if (Number.isFinite(runtimeSetCount) && Number(runtimeSetCount) > 0) {
    return Math.max(1, Math.trunc(Number(runtimeSetCount)));
  }

  const configured = exercise?.sets_json?.length || exercise?.sets || 1;
  return Math.max(1, Math.trunc(Number(configured) || 1));
};

export const normalizeWorkoutPosition = (
  exercises: Array<Pick<WorkoutExercise, 'sets_json' | 'sets'>>,
  currentIndex: unknown,
  currentSet: unknown,
  runtimeSetCounts: Record<number, number> = {},
): WorkoutPosition => {
  if (exercises.length === 0) return { currentIndex: 0, currentSet: 1 };

  const normalizedIndex = Math.min(
    Math.max(toNonNegativeInteger(currentIndex, 0), 0),
    exercises.length - 1,
  );
  const maxSets = getWorkoutSetCount(exercises[normalizedIndex], runtimeSetCounts[normalizedIndex]);
  const normalizedSet = Math.min(
    Math.max(toNonNegativeInteger(currentSet, 1), 1),
    maxSets,
  );

  return { currentIndex: normalizedIndex, currentSet: normalizedSet };
};

export const decideWorkoutAdvance = ({
  currentIndex,
  currentSet,
  exerciseCount,
  runtimeSetCount,
}: {
  currentIndex: number;
  currentSet: number;
  exerciseCount: number;
  runtimeSetCount: number;
}): WorkoutAdvanceDecision => {
  if (exerciseCount <= 0 || runtimeSetCount <= 0) {
    return { action: 'STAY', currentIndex: 0, currentSet: 1 };
  }

  const safeIndex = Math.min(Math.max(Math.trunc(currentIndex), 0), exerciseCount - 1);
  const safeSet = Math.min(Math.max(Math.trunc(currentSet), 1), Math.max(1, Math.trunc(runtimeSetCount)));

  if (safeSet < runtimeSetCount) {
    return { action: 'NEXT_SET', currentIndex: safeIndex, currentSet: safeSet + 1 };
  }

  if (safeIndex < exerciseCount - 1) {
    return { action: 'NEXT_EXERCISE', currentIndex: safeIndex + 1, currentSet: 1 };
  }

  return { action: 'FINISH_WORKOUT', currentIndex: safeIndex, currentSet: safeSet };
};

export const decideWorkoutPrevious = ({
  exercises,
  currentIndex,
  currentSet,
  runtimeSetCounts = {},
}: {
  exercises: Array<Pick<WorkoutExercise, 'sets_json' | 'sets'>>;
  currentIndex: number;
  currentSet: number;
  runtimeSetCounts?: Record<number, number>;
}): WorkoutPosition => {
  const normalized = normalizeWorkoutPosition(exercises, currentIndex, currentSet, runtimeSetCounts);
  if (normalized.currentSet > 1) {
    return { currentIndex: normalized.currentIndex, currentSet: normalized.currentSet - 1 };
  }
  if (normalized.currentIndex > 0) {
    const previousIndex = normalized.currentIndex - 1;
    return {
      currentIndex: previousIndex,
      currentSet: getWorkoutSetCount(exercises[previousIndex], runtimeSetCounts[previousIndex]),
    };
  }
  return normalized;
};

const normalizeRuntimeSet = (value: Partial<RuntimeSetData> | undefined): RuntimeSetData => ({
  ...(value?.id ? { id: value.id } : {}),
  weight: Math.max(0, toFiniteNumber(value?.weight, 0)),
  reps: Math.max(0, Math.trunc(toFiniteNumber(value?.reps, 0))),
  rpe: Math.min(10, Math.max(1, toFiniteNumber(value?.rpe, 8))),
  type: value?.type || SetType.NORMAL,
  ...(Number.isFinite(value?.rest_time) ? { rest_time: Math.max(0, Math.trunc(Number(value?.rest_time))) } : {}),
});

const toCompletedSet = (value: number[] | Set<number> | undefined): Set<number> => {
  const values = value instanceof Set ? Array.from(value) : Array.isArray(value) ? value : [];
  return new Set(
    values
      .map(item => Math.trunc(Number(item)))
      .filter(item => Number.isFinite(item) && item >= 0),
  );
};

const remoteTimestamp = (log: RemoteWorkoutLog): number => {
  const timestamp = Date.parse(log.created_at || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const reconcileWorkoutProgress = ({
  exercises,
  localState,
  remoteLogs,
}: {
  exercises: Array<Pick<WorkoutExercise, 'exercise_id' | 'sets_json' | 'sets'>>;
  localState?: LocalContinuityState | null;
  remoteLogs?: RemoteWorkoutLog[] | null;
}): ReconciledWorkoutProgress => {
  const workoutPerformance: Record<number, RuntimeSetData[]> = {};
  const completedSetsByExercise: Record<number, Set<number>> = {};
  let ignoredRemoteLogs = 0;
  let remoteOverrides = 0;

  Object.entries(localState?.workoutPerformance || {}).forEach(([indexText, sets]) => {
    const index = Math.trunc(Number(indexText));
    if (!Number.isFinite(index) || index < 0 || index >= exercises.length || !Array.isArray(sets)) return;
    workoutPerformance[index] = sets.map(set => normalizeRuntimeSet(set));
  });

  Object.entries(localState?.completedSetsByExercise || {}).forEach(([indexText, completed]) => {
    const index = Math.trunc(Number(indexText));
    if (!Number.isFinite(index) || index < 0 || index >= exercises.length) return;
    completedSetsByExercise[index] = toCompletedSet(completed);
  });

  const latestRemoteLogs = new Map<string, RemoteWorkoutLog>();
  for (const log of remoteLogs || []) {
    const exerciseIndex = exercises.findIndex(exercise => exercise.exercise_id === log?.exercise_id);
    const setIndex = Math.trunc(Number(log?.set_number)) - 1;
    if (exerciseIndex < 0 || !Number.isFinite(setIndex) || setIndex < 0) {
      ignoredRemoteLogs += 1;
      continue;
    }
    const key = `${exerciseIndex}:${setIndex}`;
    const previous = latestRemoteLogs.get(key);
    if (!previous || remoteTimestamp(log) >= remoteTimestamp(previous)) latestRemoteLogs.set(key, log);
  }

  for (const [key, log] of latestRemoteLogs.entries()) {
    const [exerciseIndexText, setIndexText] = key.split(':');
    const exerciseIndex = Number(exerciseIndexText);
    const setIndex = Number(setIndexText);
    const existing = workoutPerformance[exerciseIndex]?.[setIndex];
    if (existing) remoteOverrides += 1;
    if (!workoutPerformance[exerciseIndex]) workoutPerformance[exerciseIndex] = [];
    workoutPerformance[exerciseIndex][setIndex] = normalizeRuntimeSet({
      ...existing,
      weight: log.weight_achieved,
      reps: log.reps_achieved,
      rpe: log.rpe ?? existing?.rpe ?? 8,
      type: log.set_type || existing?.type || SetType.NORMAL,
    });
    if (!completedSetsByExercise[exerciseIndex]) completedSetsByExercise[exerciseIndex] = new Set();
    completedSetsByExercise[exerciseIndex].add(setIndex);
  }

  Object.keys(workoutPerformance).forEach(indexText => {
    const index = Number(indexText);
    workoutPerformance[index] = workoutPerformance[index].map(set => normalizeRuntimeSet(set));
  });

  const runtimeSetCounts = Object.fromEntries(
    Object.entries(workoutPerformance).map(([index, sets]) => [Number(index), sets.length]),
  );
  const requestedIndex = localState?.currentIndex ?? 0;
  const requestedSet = localState?.currentSet ?? 1;
  const position = normalizeWorkoutPosition(exercises, requestedIndex, requestedSet, runtimeSetCounts);
  const localOnlySets = Object.values(workoutPerformance).reduce((total, sets) => total + sets.length, 0) - latestRemoteLogs.size;

  return {
    ...position,
    workoutPerformance,
    completedSetsByExercise,
    diagnostics: {
      remoteOverrides,
      localOnlySets: Math.max(0, localOnlySets),
      ignoredRemoteLogs,
      correctedPosition:
        position.currentIndex !== requestedIndex || position.currentSet !== requestedSet,
    },
  };
};

export const createContinuitySnapshot = ({
  position,
  activeSetsData,
  workoutPerformance,
  completedSetsByExercise,
}: {
  position: WorkoutPosition;
  activeSetsData: RuntimeSetData[];
  workoutPerformance: Record<number, RuntimeSetData[]>;
  completedSetsByExercise: Record<number, Set<number>>;
}) => ({
  currentIndex: position.currentIndex,
  currentSet: position.currentSet,
  activeSetsData: activeSetsData.map(set => normalizeRuntimeSet(set)),
  workoutPerformance: Object.fromEntries(
    Object.entries(workoutPerformance).map(([index, sets]) => [index, sets.map(set => normalizeRuntimeSet(set))]),
  ),
  completedSetsByExercise: Object.fromEntries(
    Object.entries(completedSetsByExercise).map(([index, sets]) => [index, Array.from(sets).sort((a, b) => a - b)]),
  ),
});
