import { describe, expect, it } from 'vitest';
import { resolveResumeSetNumber } from './workoutReliability';

describe('posição de retomada da série', () => {
  it('reproduz o travamento relatado: 3 de 4 séries concluídas com posição em 1', () => {
    // Estado da tela: cabeçalho "SÉRIE 1/4" com as séries 1, 2 e 3 já marcadas.
    // Concluir a série 1 de novo era recusado e não havia como avançar.
    expect(resolveResumeSetNumber({
      completedSetIndices: [0, 1, 2],
      setCount: 4,
      storedSetNumber: 1,
    })).toBe(4);
  });

  it('aponta para a primeira série ainda não concluída', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [0], setCount: 4, storedSetNumber: 1 })).toBe(2);
    expect(resolveResumeSetNumber({ completedSetIndices: [0, 1], setCount: 4, storedSetNumber: 1 })).toBe(3);
  });

  it('não pula um buraco: série 1 pendente mantém a posição na 1', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [1, 2], setCount: 4, storedSetNumber: 1 })).toBe(1);
  });

  it('nunca anda para trás em relação à posição gravada', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [0], setCount: 4, storedSetNumber: 4 })).toBe(4);
    expect(resolveResumeSetNumber({ completedSetIndices: [], setCount: 4, storedSetNumber: 3 })).toBe(3);
  });

  it('mantém a última série quando todas já foram concluídas', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [0, 1, 2, 3], setCount: 4, storedSetNumber: 1 })).toBe(4);
  });

  it('começa na primeira série quando nada foi concluído', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [], setCount: 3, storedSetNumber: 1 })).toBe(1);
    expect(resolveResumeSetNumber({ completedSetIndices: null, setCount: 3 })).toBe(1);
  });

  it('nunca ultrapassa o total de séries', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [0, 1, 2], setCount: 3, storedSetNumber: 9 })).toBe(3);
    expect(resolveResumeSetNumber({ completedSetIndices: [0, 1, 2, 3, 4], setCount: 2, storedSetNumber: 1 })).toBe(2);
  });

  it('tolera entrada inválida sem devolver posição impossível', () => {
    expect(resolveResumeSetNumber({ completedSetIndices: [], setCount: 0, storedSetNumber: 1 })).toBe(1);
    expect(resolveResumeSetNumber({ completedSetIndices: [], setCount: 3, storedSetNumber: 'x' })).toBe(1);
    expect(resolveResumeSetNumber({ completedSetIndices: [], setCount: 3, storedSetNumber: -5 })).toBe(1);
  });
});
