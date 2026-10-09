// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutHistory } from '../types';
const { fetchLogs } = vi.hoisted(() => ({ fetchLogs: vi.fn() }));
vi.mock('../lib/api/workoutApi', () => ({ workoutApi: { getEvolutionLogs: fetchLogs } }));
vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }: any) => <div>{children}</div>, LineChart: ({ children }: any) => <div>{children}</div>, Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null }));
import { EvolutionPanel } from './EvolutionPanel';
const recent = new Date(Date.now() - 86400000).toISOString();
const earlier = new Date(Date.now() - 2 * 86400000).toISOString();
const history = [{ id: 'a', completed_at: earlier }, { id: 'b', completed_at: recent }] as WorkoutHistory[];
const logs = [{ history_id: 'a', exercise_id: 'e1', exercise_name_snapshot: 'Supino', weight_achieved: 100, reps_achieved: 1 }, { history_id: 'b', exercise_id: 'e1', exercise_name_snapshot: 'Supino', weight_achieved: 90, reps_achieved: 10 }];
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('EvolutionPanel', () => {
  it('opens the exercise from summary and distinguishes record from last result', async () => {
    fetchLogs.mockResolvedValue(logs);
    const open = vi.fn();
    const view = render(<EvolutionPanel history={history} revision={0} mode="summary" onExercise={open} />);
    fireEvent.click(await screen.findByText('Supino'));
    expect(open).toHaveBeenCalled();
    view.rerender(<EvolutionPanel history={history} revision={0} mode="exercises" onExercise={open} />);
    expect(await screen.findByText('Melhor resultado no período')).toBeTruthy();
    expect(screen.getByText('-10 kg')).toBeTruthy();
    expect(screen.getByText('1.000 kg·reps')).toBeTruthy();
    fireEvent.click(screen.getByText('1RM estimado'));
    expect(screen.getByText(/Estimativa pela fórmula/)).toBeTruthy();
    expect(fetchLogs).toHaveBeenCalledTimes(1);
  });
  it('shows an error and retries instead of presenting empty history', async () => {
    fetchLogs.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(logs);
    render(<EvolutionPanel history={history} revision={0} mode="summary" onExercise={() => {}} />);
    fireEvent.click(await screen.findByText('Tentar novamente'));
    expect(await screen.findByText('Supino')).toBeTruthy();
  });
  it('ignores a late response after the data revision changes', async () => {
    let resolveOld: (value: any) => void;
    fetchLogs.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(logs);
    const view = render(<EvolutionPanel history={history} revision={0} mode="summary" onExercise={() => {}} />);
    view.rerender(<EvolutionPanel history={history} revision={1} mode="summary" onExercise={() => {}} />);
    await screen.findByText('Supino');
    resolveOld!([]);
    await waitFor(() => expect(screen.getByText('Supino')).toBeTruthy());
  });
});
