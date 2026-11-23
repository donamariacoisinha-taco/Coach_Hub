import { describe, expect, it } from 'vitest';
import {
  applyPreventiveReduction,
  lastSessionSetsForExercise,
  latestLogByExerciseId,
  ownPrescriptionSets,
  prefillExercise,
  prefillPlan,
  previewExerciseLine,
  type ExercisePerformanceLog,
  type PrefillExercise,
} from './exercisePrefill';

const extensora: PrefillExercise = {
  exercise_id: 'extensora',
  sets_json: [
    { weight: 50, reps: 12, rest_time: 60, rpe: 8 },
    { weight: 100, reps: 10, rest_time: 60, rpe: 8 },
  ],
};
const scott: PrefillExercise = {
  exercise_id: 'scott',
  sets_json: [{ weight: 25, reps: 8, rest_time: 60, rpe: 8 }],
};
const anterior: PrefillExercise = {
  exercise_id: 'anterior',
  sets_json: [{ weight: 55, reps: 3, rest_time: 60, rpe: 8 }],
};

const logs: ExercisePerformanceLog[] = [
  { exercise_id: 'extensora', weight: 48, reps: 12, rpe: 8, created_at: '2026-10-01T10:00:00Z', category_id: 'plano-a' },
  { exercise_id: 'extensora', weight: 52, reps: 11, rpe: 8, created_at: '2026-11-20T10:00:00Z', category_id: 'plano-a' },
  { exercise_id: 'scott', weight: 26, reps: 8, rpe: 7, created_at: '2026-11-18T10:00:00Z', category_id: 'plano-b' },
];

describe('prefill por exercise_id', () => {
  it('não desloca a carga para o exercício de baixo', () => {
    const plan = [anterior, extensora, scott];
    const filled = prefillPlan(plan, logs);
    expect(filled[0][0]).toMatchObject({ weight: 55, reps: 3 });
    expect(filled[1][0]).toMatchObject({ weight: 52, reps: 11 });
    expect(filled[1][1]).toMatchObject({ weight: 100, reps: 10 });
    expect(filled[2][0]).toMatchObject({ weight: 26, reps: 8 });
    expect(filled[2][0]).not.toMatchObject({ weight: 100, reps: 10 });
  });

  it('mantém o mesmo prefill depois de reordenar', () => {
    const forward = prefillPlan([anterior, extensora, scott], logs);
    const reversed = prefillPlan([scott, extensora, anterior], logs);
    expect(reversed[0]).toEqual(forward[2]);
    expect(reversed[1]).toEqual(forward[1]);
    expect(reversed[2]).toEqual(forward[0]);
  });

  it('a substituição usa o exercício novo, não o vizinho', () => {
    const rosca: PrefillExercise = {
      exercise_id: 'rosca',
      sets_json: [{ weight: 12, reps: 10, rest_time: 45, rpe: 8 }],
    };
    const neighborLog: ExercisePerformanceLog = {
      exercise_id: 'scott',
      weight: 100,
      reps: 10,
      created_at: '2026-11-22T10:00:00Z',
    };
    expect(prefillExercise(rosca, neighborLog)[0]).toMatchObject({ weight: 12, reps: 10 });
    const ownLog: ExercisePerformanceLog = {
      exercise_id: 'rosca',
      weight: 14,
      reps: 12,
      created_at: '2026-11-21T10:00:00Z',
      category_id: 'outro-plano',
    };
    expect(prefillExercise(rosca, ownLog)[0]).toMatchObject({ weight: 14, reps: 12 });
    const withoutLog = prefillPlan([rosca, scott], [neighborLog]);
    expect(withoutLog[0][0]).toMatchObject({ weight: 12, reps: 10 });
    expect(withoutLog[1][0]).toMatchObject({ weight: 100, reps: 10 });
  });

  it('entre planos, vale o log mais recente daquele exercise_id', () => {
    const mixed: ExercisePerformanceLog[] = [
      { exercise_id: 'extensora', weight: 40, reps: 10, created_at: '2026-11-01T10:00:00Z', category_id: 'plano-b' },
      { exercise_id: 'extensora', weight: 52, reps: 11, created_at: '2026-11-20T10:00:00Z', category_id: 'plano-a' },
    ];
    const latest = latestLogByExerciseId(mixed);
    expect(latest.get('extensora')).toMatchObject({ weight: 52, category_id: 'plano-a' });
    expect(prefillPlan([extensora], latest)[0][0]).toMatchObject({ weight: 52, reps: 11 });
  });

  it('sem log, fica a prescrição da própria linha', () => {
    expect(prefillExercise(extensora, null)[0]).toMatchObject({ weight: 50, reps: 12 });
    expect(prefillExercise(extensora, null)[1]).toMatchObject({ weight: 100, reps: 10 });
    expect(ownPrescriptionSets({ exercise_id: 'novo', sets: 2, reps: '10', weight: 0, rest_time: 60 })).toEqual([
      { reps: '10', weight: 0, rest_time: 60, rpe: 8 },
      { reps: '10', weight: 0, rest_time: 60, rpe: 8 },
    ]);
  });

  it('cada série nasce da série de mesmo número da última sessão', () => {
    const pyramid: PrefillExercise = { exercise_id: 'supino', sets: 4, sets_json: [
      { weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 },
    ] };
    const session: ExercisePerformanceLog[] = [
      { exercise_id: 'supino', history_id: 'antiga', set_number: 1, weight: 70, reps: 5, created_at: '2026-10-01T10:00:00Z' },
      { exercise_id: 'supino', history_id: 'ultima', set_number: 1, weight: 85, reps: 5, created_at: '2026-11-20T10:00:00Z' },
      { exercise_id: 'supino', history_id: 'ultima', set_number: 2, weight: 90, reps: 5, created_at: '2026-11-20T10:01:00Z' },
      { exercise_id: 'supino', history_id: 'ultima', set_number: 3, weight: 95, reps: 4, created_at: '2026-11-20T10:02:00Z' },
      { exercise_id: 'supino', history_id: 'ultima', set_number: 4, weight: 100, reps: 3, rpe: 10, created_at: '2026-11-20T10:03:00Z' },
    ];
    expect(lastSessionSetsForExercise(session, 'supino').map((set) => set.weight)).toEqual([85, 90, 95, 100]);
    const filled = prefillExercise(pyramid, session);
    expect(filled.map((set) => set.weight)).toEqual([85, 90, 95, 100]);
    expect(filled[3]).toMatchObject({ reps: 3, rpe: 10 });
  });

  it('sem série registrada, usa a prescrição salva no lugar de 0x12', () => {
    const supino: PrefillExercise = { exercise_id: 'ef2e75bf', sets: 3, reps: '12', weight: 0 };
    const filled = prefillExercise(supino, null, [
      { weight: 47.5, reps: 5, rpe: 8, rest_time: 90 },
      { weight: 47.5, reps: 5, rpe: 8, rest_time: 90 },
      { weight: 47.5, reps: 5, rpe: 8, rest_time: 90 },
    ]);
    expect(filled.map((set) => set.weight)).toEqual([47.5, 47.5, 47.5]);
    expect(filled[0].reps).toBe(5);
  });

  it('a ficha limita a contagem mesmo com sessão ou prescrição mais longa', () => {
    const extensora3: PrefillExercise = {
      exercise_id: 'extensora',
      sets: 3,
      sets_json: [
        { weight: 0, reps: 12 },
        { weight: 0, reps: 12 },
        { weight: 0, reps: 12 },
      ],
    };
    const session: ExercisePerformanceLog[] = [85, 90, 95, 100].map((weight, index) => ({
      exercise_id: 'extensora',
      history_id: 'ultima',
      set_number: index + 1,
      weight,
      reps: 10,
      created_at: '2026-11-20T10:00:00Z',
    }));
    const filled = prefillExercise(extensora3, session, [
      { weight: 40, reps: 8 },
      { weight: 40, reps: 8 },
      { weight: 40, reps: 8 },
      { weight: 40, reps: 8 },
    ]);
    expect(filled).toHaveLength(3);
    expect(filled.map((set) => set.weight)).toEqual([85, 90, 95]);
    expect(previewExerciseLine(extensora3, session).sets).toBe(3);
    expect(previewExerciseLine(extensora3, session)).toMatchObject({ weight: 85, reps: '10' });
  });

  it('sem log, a prescrição preenche só até o número da ficha', () => {
    const supino: PrefillExercise = { exercise_id: 'ef2e75bf', sets: 3, reps: '12', weight: 0 };
    const prescription = [47.5, 47.5, 47.5, 50].map((weight) => ({ weight, reps: 5, rpe: 8, rest_time: 90 }));
    const filled = prefillExercise(supino, null, prescription);
    expect(filled).toHaveLength(3);
    expect(filled.map((set) => set.weight)).toEqual([47.5, 47.5, 47.5]);
    expect(previewExerciseLine(supino, null, prescription)).toMatchObject({ sets: 3, weight: 47.5, reps: '5' });
  });

  it('a redução de 10% só existe quando há carga para reduzir', () => {
    const reduced = applyPreventiveReduction([{ weight: 100, reps: 10 }, { weight: 90, reps: 8 }]);
    expect(reduced.applied).toBe(true);
    expect(reduced.sets.map((set) => set.weight)).toEqual([90, 81]);
    expect(applyPreventiveReduction([{ weight: 0, reps: 12 }]).applied).toBe(false);
  });
});
