import { describe, expect, it } from 'vitest';
import { profileDaysPerWeek, targetWeightWrite, weeklyFrequencyWrite } from './weeklyFrequency';

describe('frequência semanal', () => {
  it('days_per_week vence frequency e a lista de dias preferidos', () => {
    expect(profileDaysPerWeek({ days_per_week: 2, frequency: '5' })).toBe(2);
    expect(profileDaysPerWeek({ days_per_week: 4, frequency: null })).toBe(4);
  });

  it('lê frequency só quando days_per_week é nulo', () => {
    expect(profileDaysPerWeek({ days_per_week: null, frequency: '4' })).toBe(4);
    expect(profileDaysPerWeek({ frequency: '2' })).toBe(2);
    expect(profileDaysPerWeek({ days_per_week: null, frequency: null })).toBeNull();
    expect(profileDaysPerWeek(null)).toBeNull();
  });

  it('grava o inteiro e o texto legado com o mesmo valor', () => {
    expect(weeklyFrequencyWrite({ days_per_week: 2 })).toEqual({ days_per_week: 2, frequency: '2' });
    expect(weeklyFrequencyWrite({ frequency: '4' })).toEqual({ days_per_week: 4, frequency: '4' });
    expect(weeklyFrequencyWrite({ weekly_availability: 1 })).toEqual({ days_per_week: 1, frequency: '1' });
    expect(weeklyFrequencyWrite({ days_per_week: 2, frequency: '9' })).toEqual({ days_per_week: 2, frequency: '2' });
    expect(weeklyFrequencyWrite({ name: 'Ana' })).toBeNull();
  });

  it('não descarta a meta de peso', () => {
    expect(targetWeightWrite(88)).toBe(88);
    expect(targetWeightWrite('72.5')).toBe(72.5);
    expect(targetWeightWrite('')).toBeNull();
    expect(targetWeightWrite(null)).toBeNull();
  });
});
