import { describe, expect, it } from 'vitest';
import {
  basalRate,
  dailyExpenditure,
  katchMcArdle,
  medianValidDuration,
  mifflinStJeor,
  weightLossPlan,
} from './metabolism';

describe('taxa basal', () => {
  it('usa Mifflin-St Jeor e não inventa 1600 quando falta dado', () => {
    const kcal = mifflinStJeor({ weightKg: 89.5, heightCm: 181, ageYears: 49, sex: 'male' });
    expect(kcal).toBeCloseTo(10 * 89.5 + 6.25 * 181 - 5 * 49 + 5, 5);
    expect(basalRate({ weightKg: 89.5, heightCm: 181, ageYears: 49, sex: 'masculino' })).toMatchObject({
      method: 'mifflin-st-jeor',
      missing: [],
    });
    const missing = basalRate({ weightKg: 89.5 });
    expect(missing.kcal).toBeNull();
    expect(missing.missing).toEqual(expect.arrayContaining(['altura', 'idade', 'sexo']));
  });

  it('usa Katch-McArdle quando há percentual de gordura', () => {
    const kcal = katchMcArdle(89.5, 20);
    expect(kcal).toBeCloseTo(370 + 21.6 * 89.5 * 0.8, 5);
    expect(basalRate({
      weightKg: 89.5,
      heightCm: 181,
      ageYears: 49,
      sex: 'masculino',
      bodyFatPct: 20,
    }).method).toBe('katch-mcardle');
  });

  it('separa o dia a dia do treino e limita o déficit', () => {
    const basal = mifflinStJeor({ weightKg: 89.5, heightCm: 181, ageYears: 49, sex: 'male' });
    expect(medianValidDuration([null, 0, 7170, 18, 36, 65])).toBe(36);
    const spent = dailyExpenditure({
      basal,
      activityLevel: 'sedentário',
      sessionsPerWeek: 3,
      typicalMinutes: 36,
    });
    expect(spent.missing).toEqual([]);
    expect(spent.training).toBeCloseTo((7.5 * 36 * 3) / 7, 5);
    expect(spent.total).toBeCloseTo((basal * 1.2) + (spent.training as number), 5);

    const loss = weightLossPlan({
      weightKg: 89.5,
      expenditure: spent.total as number,
      basal,
      weeklyFraction: 0.0025,
    });
    expect(loss.capped).toBe(false);
    expect(loss.floorHit).toBe(false);
    expect(loss.eatKcal).toBeGreaterThan(basal);

    const hard = weightLossPlan({
      weightKg: 89.5,
      expenditure: spent.total as number,
      basal,
      weeklyFraction: 0.02,
    });
    expect(hard.capped || hard.floorHit).toBe(true);
    expect(hard.eatKcal).toBeGreaterThanOrEqual(basal - 0.001);
    expect(hard.deficit).toBeLessThanOrEqual(0.2 * (spent.total as number) + 0.001);
  });

  it('não soma treino quando a duração típica não existe', () => {
    const spent = dailyExpenditure({
      basal: 1800,
      activityLevel: 'leve',
      sessionsPerWeek: 3,
      typicalMinutes: null,
    });
    expect(spent.total).toBeNull();
    expect(spent.missing).toContain('treino');
    expect(activityGap(spent.dailyLife)).toBeGreaterThan(1800);
  });
});

function activityGap(dailyLife: number | null): number {
  return dailyLife ?? 0;
}
