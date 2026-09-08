import { describe, expect, it } from 'vitest';
import { getContext, getNextBestAction } from './predictiveEngine';
import { UserProfile, WorkoutCategory, WorkoutHistory } from '../../types';

const profile = { id: 'u1', days_per_week: 3, workout_streak: 0 } as unknown as UserProfile;
const workouts = [{ id: 'w1', name: 'Treino A' }] as unknown as WorkoutCategory[];

const session = (overrides: Partial<WorkoutHistory> & { completed_at: string }): WorkoutHistory => ({
  id: `h-${Math.random()}`,
  user_id: 'u1',
  category_id: 'w1',
  category_name: 'Treino A',
  created_at: overrides.completed_at,
  duration_minutes: 30,
  exercises_count: 3,
  ...overrides,
});

const today = () => new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

const actionFor = (history: WorkoutHistory[]) =>
  getNextBestAction(getContext(profile, history), workouts);

describe('sessões parciais no motor preditivo', () => {
  it('não trata uma sessão parcial de hoje como treino cumprido', () => {
    const action = actionFor([session({ completed_at: today(), partial: true })]);
    expect(action.title).toBe('Sessão parcial registrada');
    expect(action.type).toBe('partial');
    expect(action.description).not.toContain('já treinou hoje');
  });

  it('reconhece a sessão completa de hoje', () => {
    const action = actionFor([session({ completed_at: today() })]);
    expect(action.title).toBe('Missão Cumprida!');
  });

  it('faz a sessão completa prevalecer sobre a parcial no mesmo dia', () => {
    const parcial = session({ completed_at: today(), partial: true });
    const completa = session({ completed_at: today() });

    expect(actionFor([parcial, completa]).title).toBe('Missão Cumprida!');
    expect(actionFor([completa, parcial]).title).toBe('Missão Cumprida!');
  });

  it('não mostra "Dia de Descanso" quando o dia tem apenas sessão parcial', () => {
    const context = getContext(profile, [session({ completed_at: today(), partial: true })]);
    expect(context.completedToday).toBe(false);
    expect(context.partialToday).toBe(true);
    expect(getNextBestAction(context, workouts).title).not.toBe('Dia de Descanso');
  });

  it('oferece retomar a mesma ficha da sessão parcial', () => {
    const action = actionFor([session({ completed_at: today(), partial: true, category_id: 'w1' })]);
    expect(action.suggestedWorkoutId).toBe('w1');
    expect(action.suggestedWorkoutName).toBe('Treino A');
  });

  it('preserva o comportamento anterior quando não há sessão hoje', () => {
    const action = actionFor([session({ completed_at: daysAgo(5) })]);
    expect(['Hoje para você: Treino A', 'Sentimos sua falta!', 'Dia de Descanso']).toContain(action.title);
    expect(action.title).not.toBe('Missão Cumprida!');
  });
});
