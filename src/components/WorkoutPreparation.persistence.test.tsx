// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), init: vi.fn(), prescriptions: vi.fn(), error: vi.fn(), success: vi.fn(),
  insert: vi.fn(), remove: vi.fn(), removeExcept: vi.fn(),
}));
vi.mock('../App', () => ({ useNavigation: () => ({ navigate: mocks.navigate, goBack: vi.fn() }) }));
vi.mock('../context/ExercisePreviewContext', () => ({ useExercisePreview: () => ({ showPreview: vi.fn() }) }));
vi.mock('../services/athleteMemoryEngine', () => ({ playHapticFeedback: vi.fn() }));
vi.mock('../hooks/useErrorHandler', () => ({ useErrorHandler: () => ({ showError: mocks.error, showSuccess: mocks.success }) }));
vi.mock('../lib/api/authApi', () => ({ GUEST_USER_ID: 'guest', authApi: { getUser: async () => ({ id: 'user' }) } }));
vi.mock('../lib/api/workoutApi', () => ({ workoutApi: {
  getWorkoutInitData: mocks.init, insertWorkoutExercises: mocks.insert,
  deleteExercisesByCategory: mocks.remove, deleteExercisesByCategoryExcept: mocks.removeExcept,
} }));
vi.mock('../lib/api/exerciseApi', () => ({ exerciseApi: { getExercises: async () => [], getFavorites: async () => [] } }));
vi.mock('../lib/exercisePrescriptions', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/exercisePrescriptions')>(), loadPrescriptions: mocks.prescriptions,
}));
vi.mock('./ExerciseReplaceScreen', () => ({ ExerciseReplaceScreen: ({ isOpen, onSelect }: any) =>
  isOpen ? <button onClick={() => onSelect({ id: 'replacement', name: 'Remada teste', muscle_group: 'Costas' })}>Escolher substituto teste</button> : null,
}));

import { WorkoutPreparation } from './WorkoutPreparation';

const saved = [{ reps: '8', weight: 42, rpe: 7, rest_time: 120 }, { reps: '6', weight: 45, rpe: 9, rest_time: 150 }];
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mocks.init.mockResolvedValue({ category: { id: 'plan', name: 'Ficha de teste' }, exercises: [{
    id: 'row', category_id: 'plan', exercise_id: 'original', exercise_name: 'Puxada teste',
    sets: 3, reps: '12', weight: 10, rest_time: 60, sets_json: [{ reps: '12', weight: 10 }],
  }] });
  mocks.prescriptions.mockResolvedValue({ original: saved, replacement: saved });
});
afterEach(cleanup);

describe('preparation UI persistence', () => {
  it('displays the latest saved values when opening an old ficha', async () => {
    render(<WorkoutPreparation workoutId="plan" />);
    await screen.findByText('Puxada teste');
    expect(screen.getByText('2 séries')).toBeTruthy();
    expect(screen.getByText('8 reps')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'INICIAR PROTOCOLO' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('workout', { id: 'plan' }));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('stages a replacement with its own latest values, leaving the saved ficha intact', async () => {
    render(<React.StrictMode><WorkoutPreparation workoutId="plan" /></React.StrictMode>);
    await screen.findByText('Puxada teste');
    fireEvent.click(screen.getByRole('button', { name: 'Opções de Puxada teste' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Substituir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Escolher substituto teste' }));
    await screen.findByText('Remada teste');
    const staged = JSON.parse(localStorage.getItem('workout_session_temp_plan')!);
    expect(staged[0]).toMatchObject({ exercise_id: 'replacement', weight: 42, reps: '8', default_rpe: 7, rest_time: 120, sets_json: saved });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.removeExcept).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
});
