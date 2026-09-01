import { describe, expect, it } from 'vitest';
import {
  formatSessionVolume,
  formatSetWeight,
  sessionDataBadge,
  sessionStatusBadge,
  summarizeSession,
  summarizeSetLogs,
} from './sessionSummary';

const log = (overrides: Record<string, any> = {}) => ({
  exercise_id: 'e1',
  weight_achieved: 0,
  reps_achieved: 10,
  rpe: 0,
  ...overrides,
});

describe('classificação de sessão', () => {
  it('reconhece sessão com carga mensurável', () => {
    const summary = summarizeSetLogs([log({ weight_achieved: 40, reps_achieved: 10, rpe: 8 })]);
    expect(summary.loadKind).toBe('measurable');
    expect(summary.totalVolume).toBe(400);
    expect(summary.avgRpe).toBe(8);
    expect(summary.hasMeasurableLoad).toBe(true);
  });

  it('reconhece sessão de peso corporal sem transformar em volume', () => {
    const summary = summarizeSetLogs([log({ weight_achieved: 0, reps_achieved: 10, rpe: 7 })]);
    expect(summary.loadKind).toBe('bodyweight');
    expect(summary.totalVolume).toBe(0);
    expect(summary.avgRpe).toBe(7);
    expect(summary.hasMeasurableLoad).toBe(false);
  });

  it('reconhece sessão sem nenhuma série registrada', () => {
    const summary = summarizeSetLogs([]);
    expect(summary.loadKind).toBe('no-data');
    expect(summary.avgRpe).toBeNull();
    expect(summary.setCount).toBe(0);
  });

  it('separa o estado da sessão da qualidade do dado', () => {
    const parcialComCarga = summarizeSession(
      { partial: true },
      [log({ weight_achieved: 40, reps_achieved: 10 })],
    );
    expect(parcialComCarga.partial).toBe(true);
    expect(parcialComCarga.loadKind).toBe('measurable');

    const completaCorporal = summarizeSession({ partial: false }, [log({ rpe: 7 })]);
    expect(completaCorporal.partial).toBe(false);
    expect(completaCorporal.loadKind).toBe('bodyweight');
  });

  it('ignora RPE zerado no cálculo da média', () => {
    const summary = summarizeSetLogs([log({ rpe: 0 }), log({ rpe: 8 }), log({ rpe: 0 })]);
    expect(summary.avgRpe).toBe(8);
  });
});

describe('rótulos do histórico', () => {
  it('rotula sessão parcial e concluída de forma distinta', () => {
    expect(sessionStatusBadge({ partial: true }).label).toBe('Sessão parcial');
    expect(sessionStatusBadge({ partial: true }).tone).toBe('partial');
    expect(sessionStatusBadge({ partial: false }).label).toBe('Treino concluído');
  });

  it('rotula a qualidade do dado registrado', () => {
    expect(sessionDataBadge({ loadKind: 'measurable' }).label).toBe('Com carga');
    expect(sessionDataBadge({ loadKind: 'bodyweight' }).label).toBe('Peso corporal');
    expect(sessionDataBadge({ loadKind: 'no-data' }).label).toBe('Sem dados suficientes');
  });

  it('formata o volume sem inventar número', () => {
    expect(formatSessionVolume({ loadKind: 'no-data', totalVolume: 0 })).toBe('—');
    expect(formatSessionVolume({ loadKind: 'bodyweight', totalVolume: 0 })).toBe('Peso corporal');
    expect(formatSessionVolume({ loadKind: 'measurable', totalVolume: 400 })).toBe('400 kg');
    expect(formatSessionVolume({ loadKind: 'measurable', totalVolume: 4200 })).toBe('4.2 ton');
  });

  it('mostra "Peso corporal" no lugar de um seco "0 kg"', () => {
    expect(formatSetWeight({ weight_achieved: 0 })).toBe('Peso corporal');
    expect(formatSetWeight({ weight_achieved: 40 })).toBe('40 kg');
  });
});
