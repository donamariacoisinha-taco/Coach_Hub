import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutHistory } from '../../types';
const mocks = vi.hoisted(() => ({ user: vi.fn(), range: vi.fn(), from: vi.fn(), guest: vi.fn(), eq: vi.fn() }));
vi.mock('./authApi', () => ({ GUEST_USER_ID: 'guest-user-id', authApi: { getUser: mocks.user } }));
vi.mock('./supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('./exerciseApi', () => ({ exerciseApi: { getExercises: vi.fn().mockResolvedValue([]) } }));
vi.mock('../guest/guestPersistence', () => ({ getGuestDashboard: mocks.guest }));
import { workoutApi } from './workoutApi';
beforeEach(() => {
  vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: 'u1' });
  const query: any = { select: () => query, eq: (...args: any[]) => { mocks.eq(...args); return query; }, order: () => query, range: mocks.range };
  mocks.from.mockReturnValue(query);
});
describe('Evolution data API', () => {
  it('reads all pages, scopes by current user and excludes orphan or other-user sessions', async () => {
    const row = { history_id: 'h1', exercise_id: 'e1' };
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ ...row, id: `set-${i}` })) })
      .mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ ...row, id: `set-${i + 500}` })) })
      .mockResolvedValueOnce({ data: [{ ...row, id: 'last' }, { history_id: 'other' }, { history_id: 'deleted' }] });
    const logs = await workoutApi.getEvolutionLogs([{ id: 'h1', user_id: 'u1' }, { id: 'other', user_id: 'u2' }] as WorkoutHistory[]);
    expect(logs).toHaveLength(1001);
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(mocks.range).toHaveBeenLastCalledWith(1000, 1499);
  });
  it('propagates a failed page instead of returning partial or empty results', async () => {
    mocks.range.mockResolvedValue({ error: new Error('offline') });
    await expect(workoutApi.getEvolutionLogs([])).rejects.toThrow('offline');
  });
  it('loads bodyweight logs from guest storage without querying Supabase', async () => {
    mocks.user.mockResolvedValue({ id: 'guest-user-id' });
    mocks.guest.mockReturnValue({ history: [{ id: 'guest-1', workout_sets_logs: [{ exercise_id: 'e2', exercise_name: 'Flexão', weight_achieved: 0, reps_achieved: 15 }] }] });
    const logs = await workoutApi.getEvolutionLogs([]);
    expect(logs[0]).toMatchObject({ history_id: 'guest-1', exercise_name_snapshot: 'Flexão', reps_achieved: 15 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
