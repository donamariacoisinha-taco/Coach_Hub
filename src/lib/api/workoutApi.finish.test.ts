import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), confirmation: vi.fn(), feedback: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { from: () => {
  const query: any = { update: (payload: any) => { mocks.update(payload); return query; },
    eq: () => query, select: () => query, single: mocks.confirmation };
  return query;
} } }));
vi.mock('./authApi', () => ({ GUEST_USER_ID: 'guest', authApi: {} }));
vi.mock('./exerciseApi', () => ({ exerciseApi: {} }));
vi.mock('../../domain/eke/ekeService', () => ({ ekeService: { processWorkoutFeedback: mocks.feedback } }));
import { workoutApi } from './workoutApi';

const confirmed = { data: { id: 'history', completed_at: '2026-10-25', exercises_count: 1 }, error: null };
beforeEach(() => vi.resetAllMocks());
describe('workout finish confirmation', () => {
  it.each([false, true])('confirms complete and partial sessions before feedback, partial=%s', async partial => {
    mocks.confirmation.mockResolvedValue(confirmed);
    await workoutApi.finishWorkout('history', 15, 1, partial);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ exercises_count: 1, ...(partial ? { partial: true } : {}) }));
    expect(mocks.feedback).toHaveBeenCalledWith('history');
  });
  it('supports a database without the optional partial marker while still confirming the write', async () => {
    mocks.confirmation.mockResolvedValueOnce({ error: { code: '42703', message: 'partial column absent' } }).mockResolvedValueOnce(confirmed);
    await workoutApi.finishWorkout('history', 15, 1, true);
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.update.mock.calls[1][0].partial).toBeUndefined();
  });
  it('rejects missing or incomplete confirmation instead of reporting success', async () => {
    mocks.confirmation.mockResolvedValue({ data: null, error: null });
    await expect(workoutApi.finishWorkout('history', 15, 1)).rejects.toThrow('não confirmou');
    expect(mocks.feedback).not.toHaveBeenCalled();
  });
});
