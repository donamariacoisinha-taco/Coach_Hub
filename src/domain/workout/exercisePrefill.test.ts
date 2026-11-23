import { describe, expect, it } from 'vitest';
import {
  latestLogByExerciseId,
  ownPrescriptionSets,
  prefillExercise,
  prefillPlan,
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
    expect(filled[1][1]).toMatchObject({ weight: 52, reps: 11 });
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
});
