import { describe, expect, it } from 'vitest';
import { WorkoutHistory } from '../../types';
import { getWorkoutCardAvgDuration, getWorkoutCardEvolutionInsight } from './workoutCardInsights';

const entry = (overrides: Partial<WorkoutHistory>): WorkoutHistory => ({
  id: 'h', user_id: 'u', category_id: 'w', category_name: 'Treino',
  created_at: '2026-01-01T00:00:00.000Z', completed_at: '2026-01-01T00:00:00.000Z',
  duration_minutes: 45, exercises_count: 5, partial: false,
  ...overrides,
});

describe('getWorkoutCardAvgDuration', () => {
  it('calcula a média real das sessões concluídas, ignorando sessões parciais', () => {
    const history = [
      entry({ duration_minutes: 40, partial: false }),
      entry({ duration_minutes: 50, partial: false }),
      entry({ duration_minutes: 20, partial: true }),
    ];
    expect(getWorkoutCardAvgDuration(history)).toBe(45);
  });

  it('não fabrica um número quando não há nenhuma sessão concluída', () => {
    expect(getWorkoutCardAvgDuration([])).toBeNull();
    expect(getWorkoutCardAvgDuration([entry({ partial: true, duration_minutes: 30 })])).toBeNull();
  });
});

describe('getWorkoutCardEvolutionInsight', () => {
  it('reporta a contagem real de sessões concluídas', () => {
    const history = [
      entry({ partial: false }),
      entry({ partial: false }),
      entry({ partial: true }),
    ];
    expect(getWorkoutCardEvolutionInsight(history)).toBe('2 sessões concluídas');
  });

  it('não inventa percentual de evolução nem "nova melhor marca"', () => {
    // Duas fichas com IDs diferentes e o mesmo histórico real devem produzir
    // exatamente o mesmo texto — a versão antiga variava por hash do ID.
    const history = [entry({ partial: false }), entry({ partial: false })];
    const resultA = getWorkoutCardEvolutionInsight(history);
    const resultB = getWorkoutCardEvolutionInsight(history);
    expect(resultA).toBe(resultB);
    expect(resultA).not.toMatch(/% evolução/);
    expect(resultA).not.toBe('↑ Nova melhor marca');
    expect(resultA).not.toBe('Consistência elevada');
  });

  it('avisa quando só há sessões parciais', () => {
    expect(getWorkoutCardEvolutionInsight([entry({ partial: true })])).toBe('Apenas sessões parciais até agora');
  });

  it('sem histórico: primeira execução, ou recém-adicionado se criado há poucos dias', () => {
    expect(getWorkoutCardEvolutionInsight([], { createdAt: null })).toBe('Primeira execução');
    expect(getWorkoutCardEvolutionInsight([], { createdAt: new Date().toISOString() })).toBe('Treino recém-adicionado');
  });

  it('ficha pública administrativa tem texto fixo', () => {
    expect(getWorkoutCardEvolutionInsight([], { isPublicAdmin: true })).toBe('✓ Ficha pública oficial');
  });
});
