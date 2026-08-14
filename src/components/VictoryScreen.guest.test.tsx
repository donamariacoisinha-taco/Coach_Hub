// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { finishGuestWorkout, saveGuestPlan } from '../lib/guest/guestPersistence';

vi.mock('../App', () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));

import { VictoryScreen } from './VictoryScreen';

describe('VictoryScreen guest metrics', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('renders 60 seconds as 1 minute and keeps sub-ton volume in kilograms', async () => {
    const dashboard = saveGuestPlan({ workouts: [{
      name: 'Ficha A', exercises: [{ exercise_name: 'Supino', sets: 1 }],
    }] }, {});
    const workoutId = dashboard.workouts[0].id;
    finishGuestWorkout(workoutId, {
      duration_seconds: 60,
      performance: { 0: [{ weight: 20, reps: 12, rpe: 8 }] },
    });

    render(<VictoryScreen historyId={`guest-history-${workoutId}`} duration={1} exercisesCount={1} />);
    expect(screen.getByText('1 min')).toBeTruthy();
    expect(await screen.findByText('240kg')).toBeTruthy();
  });
});
