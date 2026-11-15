import { describe, expect, it } from 'vitest';
import { confirmedSetIndexes, saveChoiceWritesPlan, volumeKg } from './sessionRecord';

describe('o que a sessão pode gravar', () => {
  it('não persiste a série em que a pessoa ainda está, mesmo sendo a última', () => {
    const saved = confirmedSetIndexes([0, 1], 3);
    expect(saved).toEqual([0, 1]);
    expect(saved).not.toContain(2);
  });

  it('soma o volume das séries confirmadas, inclusive quando o número vem como texto', () => {
    expect(volumeKg([
      { weight: '50', reps: '5' },
      { weight_achieved: 50, reps_achieved: 5 },
    ])).toBe(500);
    expect(volumeKg([{ weight: 0, reps: 5 }])).toBe(0);
  });

  it('salvar apenas os dados não reescreve a ficha', () => {
    expect(saveChoiceWritesPlan('data')).toBe(false);
    expect(saveChoiceWritesPlan('new')).toBe(true);
    expect(saveChoiceWritesPlan('update')).toBe(true);
  });
});
