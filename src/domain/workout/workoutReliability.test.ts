import { describe, expect, it } from 'vitest';
import { SetType } from '../../types';
import {
  computeSessionExerciseDiff,
  createContinuitySnapshot,
  decideWorkoutAdvance,
  decideWorkoutPrevious,
  getWorkoutSetCount,
  normalizeWorkoutPosition,
  reconcileWorkoutProgress,
  shouldConfirmPartialBeforeTerminalSet,
  type RuntimeSetData,
} from './workoutReliability';

const exercises = [
  { exercise_id: 'ex-a', sets: 2, sets_json: [{ reps: '10' }, { reps: '8' }] },
  { exercise_id: 'ex-b', sets: 3, sets_json: [{ reps: '12' }, { reps: '10' }, { reps: '8' }] },
] as any[];

const set = (weight: number, reps: number, rpe = 8): RuntimeSetData => ({
  weight,
  reps,
  rpe,
  type: SetType.NORMAL,
});

describe('workout reliability engine', () => {
  it('uses the runtime set count before the configured count', () => {
    expect(getWorkoutSetCount(exercises[0], 4)).toBe(4);
    expect(getWorkoutSetCount(exercises[0])).toBe(2);
    expect(getWorkoutSetCount({ sets: 0 } as any)).toBe(1);
  });

  it('normalizes invalid and out-of-range positions', () => {
    expect(normalizeWorkoutPosition(exercises, -8, 0)).toEqual({ currentIndex: 0, currentSet: 1 });
    expect(normalizeWorkoutPosition(exercises, 99, 99)).toEqual({ currentIndex: 1, currentSet: 3 });
    expect(normalizeWorkoutPosition([], 5, 5)).toEqual({ currentIndex: 0, currentSet: 1 });
  });

  it('advances to the next set without changing exercise', () => {
    expect(decideWorkoutAdvance({
      currentIndex: 0,
      currentSet: 1,
      exerciseCount: 2,
      runtimeSetCount: 2,
    })).toEqual({ action: 'NEXT_SET', currentIndex: 0, currentSet: 2 });
  });

  it('advances to the next exercise after the last runtime set', () => {
    expect(decideWorkoutAdvance({
      currentIndex: 0,
      currentSet: 2,
      exerciseCount: 2,
      runtimeSetCount: 2,
    })).toEqual({ action: 'NEXT_EXERCISE', currentIndex: 1, currentSet: 1 });
  });

  it('finishes only after the last set of the last exercise', () => {
    expect(decideWorkoutAdvance({
      currentIndex: 1,
      currentSet: 3,
      exerciseCount: 2,
      runtimeSetCount: 3,
    })).toEqual({ action: 'FINISH_WORKOUT', currentIndex: 1, currentSet: 3 });
  });

  it('does not advance an empty workout', () => {
    expect(decideWorkoutAdvance({
      currentIndex: 0,
      currentSet: 1,
      exerciseCount: 0,
      runtimeSetCount: 0,
    })).toEqual({ action: 'STAY', currentIndex: 0, currentSet: 1 });
  });

  it('moves backward within the current exercise', () => {
    expect(decideWorkoutPrevious({ exercises, currentIndex: 1, currentSet: 2 }))
      .toEqual({ currentIndex: 1, currentSet: 1 });
  });

  it('moves to the final set of the previous exercise', () => {
    expect(decideWorkoutPrevious({ exercises, currentIndex: 1, currentSet: 1 }))
      .toEqual({ currentIndex: 0, currentSet: 2 });
  });

  it('preserves local progress when the network has no logs', () => {
    const result = reconcileWorkoutProgress({
      exercises,
      localState: {
        currentIndex: 0,
        currentSet: 2,
        workoutPerformance: { 0: [set(30, 10), set(32.5, 8)] },
        completedSetsByExercise: { 0: [0] },
      },
      remoteLogs: [],
    });

    expect(result.currentIndex).toBe(0);
    expect(result.currentSet).toBe(2);
    expect(result.workoutPerformance[0]).toHaveLength(2);
    expect(result.completedSetsByExercise[0]).toEqual(new Set([0]));
    expect(result.diagnostics.localOnlySets).toBe(2);
  });

  it('gives completed remote logs precedence over local values', () => {
    const result = reconcileWorkoutProgress({
      exercises,
      localState: {
        workoutPerformance: { 0: [set(20, 10)] },
      },
      remoteLogs: [{
        exercise_id: 'ex-a',
        set_number: 1,
        weight_achieved: 25,
        reps_achieved: 12,
        rpe: 9,
        set_type: SetType.NORMAL,
        created_at: '2026-07-27T10:00:00.000Z',
      }],
    });

    expect(result.workoutPerformance[0][0]).toMatchObject({ weight: 25, reps: 12, rpe: 9 });
    expect(result.completedSetsByExercise[0].has(0)).toBe(true);
    expect(result.diagnostics.remoteOverrides).toBe(1);
  });

  it('keeps the newest duplicate remote log for the same set', () => {
    const result = reconcileWorkoutProgress({
      exercises,
      remoteLogs: [
        {
          exercise_id: 'ex-a', set_number: 1, weight_achieved: 20, reps_achieved: 10,
          created_at: '2026-07-27T09:00:00.000Z',
        },
        {
          exercise_id: 'ex-a', set_number: 1, weight_achieved: 30, reps_achieved: 8,
          created_at: '2026-07-27T10:00:00.000Z',
        },
      ],
    });

    expect(result.workoutPerformance[0][0]).toMatchObject({ weight: 30, reps: 8 });
    expect(result.completedSetsByExercise[0]).toEqual(new Set([0]));
  });

  it('ignores remote logs for unknown exercises or invalid set numbers', () => {
    const result = reconcileWorkoutProgress({
      exercises,
      remoteLogs: [
        { exercise_id: 'missing', set_number: 1, weight_achieved: 10, reps_achieved: 10 },
        { exercise_id: 'ex-a', set_number: 0, weight_achieved: 10, reps_achieved: 10 },
      ],
    });

    expect(result.workoutPerformance).toEqual({});
    expect(result.diagnostics.ignoredRemoteLogs).toBe(2);
  });

  it('corrects a stale restored position using the reconciled runtime size', () => {
    const result = reconcileWorkoutProgress({
      exercises,
      localState: {
        currentIndex: 8,
        currentSet: 99,
        workoutPerformance: { 1: [set(10, 10), set(10, 10)] },
      },
      remoteLogs: [],
    });

    expect(result.currentIndex).toBe(1);
    expect(result.currentSet).toBe(2);
    expect(result.diagnostics.correctedPosition).toBe(true);
  });

  it('serializes Sets into sorted arrays for continuity storage', () => {
    const snapshot = createContinuitySnapshot({
      position: { currentIndex: 1, currentSet: 2 },
      activeSetsData: [set(40, 8)],
      workoutPerformance: { 1: [set(40, 8)] },
      completedSetsByExercise: { 1: new Set([2, 0, 1]) },
    });

    expect(snapshot.completedSetsByExercise[1]).toEqual([0, 1, 2]);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it('simulates a complete two-exercise workout without skipping a set', () => {
    let position = { currentIndex: 0, currentSet: 1 };
    const counts = [2, 3];
    const actions: string[] = [];

    for (let step = 0; step < 5; step += 1) {
      const decision = decideWorkoutAdvance({
        ...position,
        exerciseCount: counts.length,
        runtimeSetCount: counts[position.currentIndex],
      });
      actions.push(decision.action);
      position = { currentIndex: decision.currentIndex, currentSet: decision.currentSet };
    }

    expect(actions).toEqual([
      'NEXT_SET',
      'NEXT_EXERCISE',
      'NEXT_SET',
      'NEXT_SET',
      'FINISH_WORKOUT',
    ]);
    expect(position).toEqual({ currentIndex: 1, currentSet: 3 });
  });

  it('opens partial confirmation before completing the terminal set when earlier work is missing', () => {
    expect(shouldConfirmPartialBeforeTerminalSet({
      requiredSetCounts: [3, 3],
      completedSetsByExercise: { 0: new Set(), 1: new Set([0, 1]) },
      currentIndex: 1,
      currentSetIndex: 2,
    })).toBe(true);
    expect(shouldConfirmPartialBeforeTerminalSet({
      requiredSetCounts: [3, 3],
      completedSetsByExercise: { 0: new Set([0, 1, 2]), 1: new Set([0, 1]) },
      currentIndex: 1,
      currentSetIndex: 2,
    })).toBe(false);
  });
});

const workoutEx = (overrides: Partial<Record<string, any>>): any => ({
  id: 'row-x', category_id: 'w', exercise_id: 'cat-x', exercise_name: 'Exercício X',
  sets: 3, reps: '10', weight: 40, rest_time: 60, order: 0,
  ...overrides,
});

describe('computeSessionExerciseDiff', () => {
  it('sem mudanças: consistente e sem diffs', () => {
    const original = [workoutEx({ id: 'r1', exercise_id: 'a' }), workoutEx({ id: 'r2', exercise_id: 'b' })];
    const current = [workoutEx({ id: 'r1', exercise_id: 'a' }), workoutEx({ id: 'r2', exercise_id: 'b' })];
    expect(computeSessionExerciseDiff(original, current)).toEqual({ hasChanges: false, isConsistent: true, diffs: [] });
  });

  it('detecta reordenação mantendo o mesmo conjunto de exercícios', () => {
    const original = [workoutEx({ id: 'r1', exercise_id: 'a' }), workoutEx({ id: 'r2', exercise_id: 'b' })];
    const current = [workoutEx({ id: 'r2', exercise_id: 'b' }), workoutEx({ id: 'r1', exercise_id: 'a' })];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.isConsistent).toBe(true);
    expect(diff.diffs).toContain('Ordem dos exercícios alterada');
  });

  it('remover-e-readicionar o mesmo exercício não conta como removido nem quebra a consistência', () => {
    // Regressão: handleAddExerciseToSession sempre gera uma linha nova
    // (ex-live-...) mesmo quando o exercício é o mesmo que acabou de ser
    // removido. A verificação de consistência não pode depender só do id de
    // linha, senão a ficha inteira parece "substituída" sem ter mudado de
    // conteúdo, e o usuário fica travado com um erro que reabrir o treino
    // não resolve.
    const original = [
      workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' }),
      workoutEx({ id: 'r2', exercise_id: 'b', exercise_name: 'Agachamento livre' }),
    ];
    // "Agachamento livre" foi removido e adicionado de volta: mesmo
    // exercise_id ('b'), linha nova ('ex-live-...').
    const current = [
      workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' }),
      workoutEx({ id: 'ex-live-999', exercise_id: 'b', exercise_name: 'Agachamento livre' }),
    ];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.isConsistent).toBe(true);
    expect(diff.diffs.join(' ')).not.toMatch(/removid/i);
  });

  it('exercício de fato ausente (nem linha nem exercise_id sobrevivem) conta como removido', () => {
    const original = [
      workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' }),
      workoutEx({ id: 'r2', exercise_id: 'b', exercise_name: 'Agachamento livre' }),
    ];
    const current = [
      workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' }),
      workoutEx({ id: 'ex-live-999', exercise_id: 'c', exercise_name: 'Puxada frontal' }),
    ];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.isConsistent).toBe(true); // Supino reto (r1) ainda sobrevive
    expect(diff.diffs).toContain('1 exercícios removidos da ficha');
  });

  it('fica inconsistente só quando nenhum exercício original sobrevive (linha nem exercise_id)', () => {
    const original = [workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' })];
    const current = [workoutEx({ id: 'ex-live-1', exercise_id: 'z', exercise_name: 'Outro exercício' })];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.isConsistent).toBe(false);
  });

  it('detecta substituição de exercício (mesma linha, exercise_id diferente)', () => {
    const original = [workoutEx({ id: 'r1', exercise_id: 'a', exercise_name: 'Supino reto' })];
    const current = [workoutEx({ id: 'r1', exercise_id: 'z', exercise_name: 'Supino inclinado' })];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.isConsistent).toBe(true);
    expect(diff.diffs.some((d) => d.includes('Substituição de exercício'))).toBe(true);
  });

  it('detecta ajuste de carga base por exercício', () => {
    const original = [workoutEx({ id: 'r1', exercise_id: 'a', weight: 40 })];
    const current = [workoutEx({ id: 'r1', exercise_id: 'a', weight: 45 })];
    const diff = computeSessionExerciseDiff(original, current);
    expect(diff.diffs.some((d) => d.includes('Carga base ajustada'))).toBe(true);
  });
});
