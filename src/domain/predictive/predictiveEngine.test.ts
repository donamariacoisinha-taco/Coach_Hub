import { afterEach, describe, expect, it, vi } from 'vitest';
import { getContext, getNextBestAction, getNextWorkoutInSequence } from './predictiveEngine';
import { UserProfile, WorkoutCategory, WorkoutHistory } from '../../types';

const profile = { id: 'u1', days_per_week: 3, workout_streak: 0 } as unknown as UserProfile;
const workouts = [{ id: 'w1', name: 'Treino A' }] as unknown as WorkoutCategory[];
const sequence = [
  { id: 'a', name: 'Treino A' },
  { id: 'b', name: 'Treino B' },
  { id: 'c', name: 'Treino C' },
  { id: 'd', name: 'Treino D' },
] as unknown as WorkoutCategory[];

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

describe('getNextWorkoutInSequence', () => {
  it('sugere o próximo da sequência após o último feito (A → B)', () => {
    expect(getNextWorkoutInSequence(sequence, 'a')?.id).toBe('b');
  });

  it('sugere o próximo da sequência (C → D)', () => {
    expect(getNextWorkoutInSequence(sequence, 'c')?.id).toBe('d');
  });

  it('volta ao início ao terminar a sequência (D → A)', () => {
    expect(getNextWorkoutInSequence(sequence, 'd')?.id).toBe('a');
  });

  it('sem histórico, sugere a primeira da lista', () => {
    expect(getNextWorkoutInSequence(sequence, undefined)?.id).toBe('a');
  });

  it('ficha do último treino não existe mais na lista: cai na primeira', () => {
    expect(getNextWorkoutInSequence(sequence, 'ficha-excluida')?.id).toBe('a');
  });

  it('lista vazia: não sugere nada', () => {
    expect(getNextWorkoutInSequence([], 'a')).toBeNull();
  });
});

describe('rotação de sequência aplicada ao motor preditivo', () => {
  // Datas fixas (não a data real do teste) porque isTrainingDay depende do dia da
  // semana: sem isso, estes testes ficariam instáveis dependendo de quando rodam.
  afterEach(() => {
    vi.useRealTimers();
  });

  it('em dia de treino, sugere o próximo da sequência após o último feito, não só "qualquer outro"', () => {
    // 2026-01-05 é uma segunda-feira: com days_per_week=3, isTrainingDay é sempre true nesse dia.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T10:00:00'));

    const action = getNextBestAction(
      getContext(profile, [session({ completed_at: daysAgo(1), category_id: 'b', category_name: 'Treino B' })]),
      sequence
    );
    expect(action.type).toBe('start_workout');
    expect(action.suggestedWorkoutId).toBe('c');
  });

  it('mesmo após vários dias sem treinar, retoma a partir da última ficha feita (não sempre a primeira)', () => {
    // 2026-01-04 é um domingo: com days_per_week=3, isTrainingDay é sempre false nesse dia.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-04T10:00:00'));

    const action = getNextBestAction(
      getContext(profile, [session({ completed_at: daysAgo(5), category_id: 'c', category_name: 'Treino C' })]),
      sequence
    );
    expect(action.type).toBe('motivation');
    expect(action.suggestedWorkoutId).toBe('d');
  });
});
