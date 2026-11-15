import { describe, expect, it } from 'vitest';
import { alignFlatColumns, readPlanSummary, summaryFromSets } from './planColumns';

describe('colunas da ficha a partir de sets_json', () => {
  it('espelha a primeira série mesmo quando as colunas estão no padrão 12 e 60', () => {
    const summary = summaryFromSets(
      [
        { reps: '8', weight: 20, rest_time: 90 },
        { reps: '8', weight: 20, rest_time: 90 },
      ],
      { reps: '12', weight: 0, rest_time: 60, sets: 3 },
    );
    expect(summary).toEqual({ sets: 2, reps: '8', weight: 20, rest_time: 90 });
  });

  it('a leitura da tela prefere sets_json e ignora a coluna antiga', () => {
    expect(readPlanSummary({
      reps: '12',
      rest_time: 60,
      weight: 0,
      sets: 3,
      sets_json: [{ reps: '10', weight: 15, rest_time: 75 }],
    })).toEqual({ sets: 1, reps: '10', weight: 15, rest_time: 75 });
  });

  it('sem sets_json, mantém o que já está na linha', () => {
    expect(alignFlatColumns({ reps: '6', weight: 12, rest_time: 45, sets: 4 })).toMatchObject({
      reps: '6',
      weight: 12,
      rest_time: 45,
      sets: 4,
    });
  });
});
