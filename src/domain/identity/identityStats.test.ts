import { describe, expect, it } from 'vitest';
import { buildIdentityStats, trainingLevel } from './identityStats';

const monday = (iso: string) => iso;

describe('identityStats', () => {
  it('conta só o que tem completed_at e separa a parcial', () => {
    const stats = buildIdentityStats({
      profile: { days_per_week: 3, frequency: '5', experience_level: 'Avançado' },
      sessions: [
        { id: 'a', completed_at: '2026-11-02T10:00:00', partial: false, duration_minutes: 36 },
        { id: 'b', completed_at: '2026-11-04T10:00:00', partial: true, duration_minutes: 20 },
        { id: 'c', completed_at: null },
        { id: 'd', completed_at: '2026-10-26T10:00:00', duration_minutes: 7170 },
        { id: 'e', completed_at: '2026-10-28T10:00:00', duration_minutes: 40 },
        { id: 'f', completed_at: '2026-10-30T10:00:00', duration_minutes: 50 },
      ],
      logs: [
        { history_id: 'a', weight_achieved: 80, reps_achieved: 10, set_type: 'Trabalho' },
        { history_id: 'a', weight_achieved: 20, reps_achieved: 15, set_type: 'Aquecimento' },
        { history_id: 'c', weight_achieved: 100, reps_achieved: 10, set_type: 'Trabalho' },
      ],
      now: new Date('2026-11-05T12:00:00'),
    });

    expect(stats.daysPerWeek).toBe(3);
    expect(stats.level).toBe('Avançado');
    expect(trainingLevel(null)).toBeNull();
    expect(stats.finishedWorkouts).toBe(5);
    expect(stats.partialWorkouts).toBe(1);
    expect(stats.volumeKg).toBe(800);
    expect(stats.sessionsWithSets).toBe(1);
    expect(stats.typicalDurationMinutes).toBe(38);
    expect(stats.activeWeeks).toBe(2);
    expect(stats.finishedThisWeek).toBe(2);
    expect(stats.fulfilledWeekStreak).toBe(1);
    expect(monday('2026-10-26')).toBe('2026-10-26');
  });

  it('não deduz o nível pelo número de treinos e não inventa a sequência sem frequência', () => {
    const stats = buildIdentityStats({
      profile: { days_per_week: null, frequency: null, experience_level: null },
      sessions: [
        { id: 'a', completed_at: '2026-11-02T10:00:00' },
        { id: 'b', completed_at: '2026-11-03T10:00:00' },
      ],
      logs: [],
      now: new Date('2026-11-05T12:00:00'),
    });
    expect(stats.level).toBeNull();
    expect(stats.fulfilledWeekStreak).toBeNull();
    expect(stats.volumeKg).toBeNull();
    expect(stats.finishedWorkouts).toBe(2);
  });
});
