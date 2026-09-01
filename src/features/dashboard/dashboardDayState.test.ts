import { describe, expect, it } from 'vitest';
import { buildCalendarDays, buildEmotionalGuidance, splitSessionDates } from './dashboardDayState';

const NOW = new Date('2026-09-02T15:00:00.000Z'); // quarta-feira
const at = (date: Date, overrides: Record<string, any> = {}) => ({
  id: `h-${Math.random()}`,
  category_id: 'w1',
  completed_at: date.toISOString(),
  ...overrides,
});

const todayCell = (history: any[], preferred: string[] = []) =>
  buildCalendarDays(history, preferred, NOW).find(day => day.isToday)!;

describe('calendário do dashboard com sessões parciais', () => {
  it('marca o dia como parcial, sem check de treino completo', () => {
    const cell = todayCell([at(NOW, { partial: true })]);
    expect(cell.state).toBe('partial');
    expect(cell.isCompleted).toBe(false);
    expect(cell.isPartial).toBe(true);
  });

  it('marca o dia como concluído quando a sessão é completa', () => {
    const cell = todayCell([at(NOW)]);
    expect(cell.state).toBe('completed');
    expect(cell.isPartial).toBe(false);
  });

  it('faz a sessão completa prevalecer sobre a parcial no mesmo dia, em qualquer ordem', () => {
    const parcial = at(NOW, { partial: true });
    const completa = at(NOW);

    expect(todayCell([parcial, completa]).state).toBe('completed');
    expect(todayCell([completa, parcial]).state).toBe('completed');
    expect(todayCell([completa, parcial]).isPartial).toBe(false);
  });

  it('não deixa a sessão parcial virar "missed" num dia preferido', () => {
    const cell = todayCell([at(NOW, { partial: true })], ['wednesday']);
    expect(cell.state).toBe('partial');
  });

  it('separa corretamente as datas completas das apenas parciais', () => {
    const ontem = new Date(NOW.getTime() - 86400000);
    const { completedDates, partialDates } = splitSessionDates([
      at(NOW, { partial: true }),
      at(ontem),
    ]);
    expect(completedDates.has(ontem.toDateString())).toBe(true);
    expect(partialDates.has(NOW.toDateString())).toBe(true);
    expect(completedDates.has(NOW.toDateString())).toBe(false);
  });
});

describe('orientação diária com sessões parciais', () => {
  it('avisa sobre a sessão parcial mesmo com streak alto, sem sugerir sobrecarga', () => {
    const guidance = buildEmotionalGuidance([at(NOW, { partial: true })], {
      streak: 9,
      preferredTrainingDays: ['wednesday'],
      now: NOW,
    });
    expect(guidance.kind).toBe('partial');
    expect(guidance.text).not.toContain('respondendo perfeitamente');
  });

  it('mantém a mensagem de streak quando a sessão do dia é completa', () => {
    const guidance = buildEmotionalGuidance([at(NOW)], { streak: 9, now: NOW });
    expect(guidance.kind).toBe('streak');
  });

  it('faz a sessão completa prevalecer sobre a parcial do mesmo dia', () => {
    const history = [at(NOW, { partial: true }), at(NOW)];
    expect(buildEmotionalGuidance(history, { streak: 9, now: NOW }).kind).toBe('streak');
    expect(buildEmotionalGuidance(history.reverse(), { streak: 9, now: NOW }).kind).toBe('streak');
  });

  it('preserva o comportamento anterior quando não há sessão hoje', () => {
    expect(buildEmotionalGuidance([], { streak: 0, preferredTrainingDays: ['wednesday'], now: NOW }).kind)
      .toBe('no-guilt');
    expect(buildEmotionalGuidance([], { streak: 2, preferredTrainingDays: ['wednesday'], now: NOW }).kind)
      .toBe('last-call');
    expect(buildEmotionalGuidance([], { streak: 0, preferredTrainingDays: ['monday'], now: NOW }).kind)
      .toBe('rest');
  });
});
