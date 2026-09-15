import { describe, expect, it } from 'vitest';
import {
  computeReadinessScore,
  computeWeightDelta,
  formatWeightDeltaSentence,
  parseWeightCheckInLogs,
  sortWeightCheckInLogsDesc,
} from './weightCheckInHistory';

const log = (date: string, weight: number) => ({ date, weight });
const checkin = (date: string, overrides: Partial<{ energy: number; sleep: number; recovery: number; hydration: boolean }>) => ({
  date, weight: 80, energy: 3, sleep: 3, recovery: 3, hydration: true, ...overrides,
});

describe('leitura do histórico de check-in de peso', () => {
  it('tolera ausência e JSON inválido sem lançar', () => {
    expect(parseWeightCheckInLogs(null)).toEqual([]);
    expect(parseWeightCheckInLogs(undefined)).toEqual([]);
    expect(parseWeightCheckInLogs('{not json')).toEqual([]);
    expect(parseWeightCheckInLogs('{"not":"an array"}')).toEqual([]);
  });

  it('descarta entradas sem data ou peso numérico', () => {
    const raw = JSON.stringify([
      { date: '2026-08-20', weight: 80 },
      { date: '2026-08-21' },
      { weight: 79 },
      { date: '2026-08-22', weight: 'oitenta' },
    ]);
    expect(parseWeightCheckInLogs(raw)).toEqual([{ date: '2026-08-20', weight: 80 }]);
  });

  it('ordena do mais recente para o mais antigo', () => {
    const logs = [log('2026-08-10', 82), log('2026-08-24', 80), log('2026-08-17', 81)];
    expect(sortWeightCheckInLogsDesc(logs).map(l => l.date)).toEqual([
      '2026-08-24', '2026-08-17', '2026-08-10',
    ]);
  });
});

describe('variação de peso entre check-ins', () => {
  it('não afirma variação com menos de dois check-ins', () => {
    expect(computeWeightDelta([])).toBeNull();
    expect(computeWeightDelta([log('2026-08-24', 80)])).toBeNull();
  });

  it('calcula a perda real entre os dois check-ins mais recentes', () => {
    const delta = computeWeightDelta([log('2026-08-17', 80.6), log('2026-08-24', 80)]);
    expect(delta).toMatchObject({ deltaKg: -0.6, days: 7 });
  });

  it('calcula o ganho real entre os dois check-ins mais recentes', () => {
    const delta = computeWeightDelta([log('2026-08-17', 79), log('2026-08-24', 80)]);
    expect(delta).toMatchObject({ deltaKg: 1, days: 7 });
  });

  it('usa somente os dois check-ins mais recentes, ignorando o resto do histórico', () => {
    const delta = computeWeightDelta([
      log('2026-07-01', 90), log('2026-08-17', 80.6), log('2026-08-24', 80),
    ]);
    expect(delta).toMatchObject({ deltaKg: -0.6, days: 7 });
  });

  it('não trava com uma data igual à outra', () => {
    const delta = computeWeightDelta([log('2026-08-24', 80), log('2026-08-24', 81)]);
    expect(delta?.days).toBe(1);
  });
});

describe('texto da variação de peso', () => {
  it('descreve perda real, sem número fixo', () => {
    const delta = computeWeightDelta([log('2026-08-17', 80.6), log('2026-08-24', 80)])!;
    expect(formatWeightDeltaSentence(delta)).toBe(
      'Seu peso caiu 0,6 kg nos últimos 7 dias, entre os dois últimos check-ins.',
    );
  });

  it('descreve ganho real', () => {
    const delta = computeWeightDelta([log('2026-08-17', 79), log('2026-08-24', 80)])!;
    expect(formatWeightDeltaSentence(delta)).toBe(
      'Seu peso subiu 1,0 kg nos últimos 7 dias, entre os dois últimos check-ins.',
    );
  });

  it('descreve peso estável sem inventar direção', () => {
    const delta = computeWeightDelta([log('2026-08-17', 80), log('2026-08-24', 80)])!;
    expect(formatWeightDeltaSentence(delta)).toContain('estável');
  });

  it('usa singular para intervalo de 1 dia', () => {
    const delta = computeWeightDelta([log('2026-08-23', 80.5), log('2026-08-24', 80)])!;
    expect(formatWeightDeltaSentence(delta)).toContain('no último dia');
  });
});

describe('prontidão a partir do check-in real', () => {
  it('não afirma prontidão sem nenhum check-in', () => {
    expect(computeReadinessScore([])).toBeNull();
  });

  it('não afirma prontidão quando o log mais recente não tem os três sinais', () => {
    expect(computeReadinessScore([{ date: '2026-08-24', weight: 80, energy: 4 }])).toBeNull();
  });

  it('usa somente o check-in mais recente, ignorando o resto do histórico', () => {
    const logs = [
      checkin('2026-08-17', { energy: 1, sleep: 1, recovery: 1, hydration: false }),
      checkin('2026-08-24', { energy: 5, sleep: 5, recovery: 5, hydration: true }),
    ];
    expect(computeReadinessScore(logs)).toBe(100);
  });

  it('fica dentro da faixa 20-100', () => {
    const baixo = computeReadinessScore([checkin('2026-08-24', { energy: 1, sleep: 1, recovery: 1, hydration: false })]);
    expect(baixo).toBeGreaterThanOrEqual(20);
    const alto = computeReadinessScore([checkin('2026-08-24', { energy: 5, sleep: 5, recovery: 5, hydration: true })]);
    expect(alto).toBeLessThanOrEqual(100);
  });
});
