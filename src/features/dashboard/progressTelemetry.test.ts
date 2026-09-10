import { describe, expect, it } from 'vitest';
import {
  buildSessionsWithTelemetry,
  computePerformanceScore,
  computeVolumeChangePercent,
  flattenGuestSetLogs,
  formatRpe,
  formatScore,
  groupLogsByHistory,
} from './progressTelemetry';

const log = (overrides: Record<string, any> = {}) => ({
  exercise_id: 'e1',
  set_number: 1,
  weight_achieved: 0,
  reps_achieved: 10,
  rpe: 0,
  ...overrides,
});

const entry = (id: string, overrides: Record<string, any> = {}) => ({
  id,
  category_id: 'w1',
  completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  exercises_count: 4,
  ...overrides,
});

describe('telemetria de evolução sem dados inventados', () => {
  it('mantém volume 0 quando a sessão não teve carga', () => {
    const [session] = buildSessionsWithTelemetry(
      [entry('h1')],
      { h1: [log({ weight_achieved: 0, reps_achieved: 10, rpe: 7 })] },
    );
    expect(session.total_volume).toBe(0);
    expect(session.hasMeasurableLoad).toBe(false);
  });

  it('preserva o RPE real de um exercício de peso corporal', () => {
    const [session] = buildSessionsWithTelemetry(
      [entry('h1')],
      { h1: [log({ weight_achieved: 0, reps_achieved: 10, rpe: 7 })] },
    );
    expect(session.avg_rpe).toBe(7);
    expect(formatRpe(session.avg_rpe)).toBe('7.0');
  });

  it('mostra "—" no lugar de um RPE inventado quando nada foi registrado', () => {
    const [session] = buildSessionsWithTelemetry([entry('h1')], { h1: [log({ rpe: 0 })] });
    expect(session.avg_rpe).toBeNull();
    expect(formatRpe(session.avg_rpe)).toBe('—');
  });

  it('não calcula score sem carga mensurável, mesmo com RPE corporal real', () => {
    const sessions = buildSessionsWithTelemetry(
      [entry('h1')],
      { h1: [log({ weight_achieved: 0, reps_achieved: 10, rpe: 7 })] },
    );
    const score = computePerformanceScore({
      streak: 12,
      sessions,
      latestSession: sessions[0],
      volChangePercent: null,
    });
    expect(score).toBeNull();
    expect(formatScore(score)).toBe('—');
  });

  it('calcula o score quando existe carga mensurável', () => {
    const sessions = buildSessionsWithTelemetry(
      [entry('h1')],
      { h1: [log({ weight_achieved: 40, reps_achieved: 10, rpe: 8 })] },
    );
    const score = computePerformanceScore({
      streak: 1,
      sessions,
      latestSession: sessions[0],
      volChangePercent: 5,
    });
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThan(0);
  });

  it('não compara progressão sem carga mensurável nos dois lados', () => {
    const [semCarga] = buildSessionsWithTelemetry([entry('h1')], { h1: [log({ weight_achieved: 0 })] });
    const [comCarga] = buildSessionsWithTelemetry(
      [entry('h2')],
      { h2: [log({ weight_achieved: 40, reps_achieved: 10 })] },
    );
    expect(computeVolumeChangePercent(semCarga, comCarga)).toBeNull();
    expect(computeVolumeChangePercent(comCarga, semCarga)).toBeNull();
    expect(computeVolumeChangePercent(comCarga, comCarga)).toBe(0);
  });
});

describe('telemetria de convidado', () => {
  const guestHistory = [{
    id: 'guest-completed-1',
    partial: true,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    category_id: 'w1',
    workout_sets_logs: [
      { exercise_id: 'e1', set_number: 1, weight_achieved: 0, reps_achieved: 10, rpe: 7 },
    ],
  }];

  it('achata os logs locais preservando o history_id', () => {
    const logs = flattenGuestSetLogs(guestHistory);
    expect(logs).toHaveLength(1);
    expect(logs[0].history_id).toBe('guest-completed-1');
  });

  it('convidado com sessão parcial de 0 kg e RPE 7: volume 0, RPE 7.0, score "—"', () => {
    const logs = flattenGuestSetLogs(guestHistory);
    const sessions = buildSessionsWithTelemetry(guestHistory, groupLogsByHistory(logs));
    const [session] = sessions;

    expect(session.total_volume).toBe(0);
    expect(formatRpe(session.avg_rpe)).toBe('7.0');

    const score = computePerformanceScore({
      streak: 0,
      sessions,
      latestSession: session,
      volChangePercent: computeVolumeChangePercent(session, null),
    });
    expect(formatScore(score)).toBe('—');
  });

  it('tolera histórico local sem logs', () => {
    expect(flattenGuestSetLogs([{ id: 'h1' }])).toEqual([]);
    expect(flattenGuestSetLogs([])).toEqual([]);
  });
});
