// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  comFoto: {
    id: 'ex-com-foto', name: 'Supino reto', muscle_group: 'Peito', is_active: true,
    image_url: 'https://cdn.example.com/supino.jpg',
  },
  semFoto: {
    id: 'ex-sem-foto', name: 'Terra romeno', muscle_group: 'Pernas', is_active: true,
    image_url: null, static_frame_url: null,
  },
}));

vi.mock('../App', () => ({
  useNavigation: () => ({ navigate: vi.fn(), current: { params: {} } }),
}));
vi.mock('./ExerciseProgress', () => ({ ExerciseProgress: () => null }));
vi.mock('../services/geminiService', () => ({
  geminiService: { callAI: vi.fn().mockRejectedValue(new Error('sem sessão')) },
}));
vi.mock('../lib/api/authApi', async () => {
  const actual = await vi.importActual<typeof import('../lib/api/authApi')>('../lib/api/authApi');
  return { ...actual, authApi: { getUser: vi.fn().mockResolvedValue({ id: 'user-1' }) } };
});
vi.mock('../lib/api/workoutApi', () => ({ workoutApi: {} }));
vi.mock('../lib/api/exerciseApi', () => ({
  exerciseApi: {
    getExercises: vi.fn().mockResolvedValue([fixtures.comFoto, fixtures.semFoto]),
    getMuscleGroups: vi.fn().mockResolvedValue([]),
    getFavorites: vi.fn().mockResolvedValue([]),
    isAdmin: vi.fn().mockResolvedValue(false),
  },
}));

import ExerciseLibrary from './ExerciseLibrary';

const renderLibrary = () => render(<ExerciseLibrary />);

describe('Biblioteca de Exercícios: imagem ausente e busca sem resultado', () => {
  afterEach(cleanup);

  it('mostra um ícone neutro (não uma foto genérica) quando o exercício não tem imagem', async () => {
    const { container } = renderLibrary();
    await screen.findByText('Terra romeno');

    const semFotoCard = screen.getByText('Terra romeno').closest('.relative') as HTMLElement;
    expect(semFotoCard.querySelector('img')).toBeNull();
    expect(semFotoCard.querySelector('svg')).toBeTruthy();

    const comFotoCard = screen.getByText('Supino reto').closest('.relative') as HTMLElement;
    expect(comFotoCard.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/supino.jpg');
    // Nenhum card deve usar a foto de banco de imagens genérica como fallback.
    expect(container.querySelectorAll('img[src*="unsplash.com"]').length).toBe(0);
  });

  it('mostra um estado vazio claro quando a busca não encontra nada', async () => {
    renderLibrary();
    await screen.findByText('Supino reto');

    fireEvent.change(screen.getByPlaceholderText('BUSCAR EXERCÍCIO...'), {
      target: { value: 'zzzznoexistexyz' },
    });

    await waitFor(() => expect(screen.getByText('Nenhum resultado')).toBeTruthy());
    expect(screen.queryByText('Supino reto')).toBeNull();
  });
});
