import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn(), upsert: vi.fn(), remove: vi.fn(), read: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { from: mocks.from } }));
import { workoutApi } from './workoutApi';

const logs = [{ history_id: 'history-a', user_id: 'user-a', exercise_id: 'exercise-a', set_number: 1,
  weight_achieved: 30, reps_achieved: 12, rpe: 8 }];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation(() => ({
    upsert: (rows: any[]) => { mocks.upsert(rows); return { select: () => mocks.read(rows) }; },
    delete: () => { mocks.remove(); return { eq: () => ({ not: () => Promise.resolve({ error: null }) }) }; },
    select: () => ({ eq: () => Promise.resolve({ count: logs.length, error: null }) }),
  }));
  mocks.read.mockImplementation(async (rows: any[]) => ({ data: rows.map(row => ({ id: row.id })), error: null }));
});

describe('Final workout snapshot', () => {
  it('never deletes existing series when the final write fails', async () => {
    mocks.read.mockResolvedValue({ error: new Error('offline') });
    await expect(workoutApi.saveWorkoutBatch('history-a', logs)).rejects.toThrow('offline');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('never deletes existing series when the returned rows are missing', async () => {
    mocks.read.mockResolvedValue({ data: [], error: null });
    await expect(workoutApi.saveWorkoutBatch('history-a', logs)).rejects.toThrow('confirmar');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('keeps retry ids stable despite new timestamps and preserves repeated exercises', async () => {
    const duplicate = [...logs, { ...logs[0] }];
    vi.spyOn(workoutApi, 'validateWorkoutIntegrity').mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    await workoutApi.saveWorkoutBatch('history-a', duplicate);
    await workoutApi.saveWorkoutBatch('history-a', duplicate.map(log => ({ ...log, created_at: 'later' })));
    const first = mocks.upsert.mock.calls[0][0];
    const retry = mocks.upsert.mock.calls[1][0];
    expect(first.map((row: any) => row.id)).toEqual(retry.map((row: any) => row.id));
    expect(first[0].id).not.toBe(first[1].id);
  });

  it('saves and confirms new rows before cleaning up old rows', async () => {
    await workoutApi.saveWorkoutBatch('history-a', logs);
    expect(mocks.upsert.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
  });

  it('rejects empty or mixed sessions without changing any rows', async () => {
    await expect(workoutApi.saveWorkoutBatch('history-a', [])).rejects.toThrow();
    await expect(workoutApi.saveWorkoutBatch('wrong-history', logs)).rejects.toThrow();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('does not report success if final integrity validation fails', async () => {
    vi.spyOn(workoutApi, 'validateWorkoutIntegrity').mockResolvedValueOnce(false);
    await expect(workoutApi.saveWorkoutBatch('history-a', logs)).rejects.toThrow('conferência');
  });

  it('does not report success when cleanup is denied, and a retry can finish', async () => {
    mocks.from.mockImplementationOnce(() => ({ upsert: (rows: any[]) => ({ select: () => mocks.read(rows) }) }))
      .mockImplementationOnce(() => ({ delete: () => ({ eq: () => ({ not: () => Promise.resolve({ error: new Error('cleanup denied') }) }) }) }));
    await expect(workoutApi.saveWorkoutBatch('history-a', logs)).rejects.toThrow('cleanup denied');
    await expect(workoutApi.saveWorkoutBatch('history-a', logs)).resolves.toBeUndefined();
  });
});
