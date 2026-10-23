// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getDashboard = vi.fn();
vi.mock('../../../lib/api/exerciseMediaAdminApi', () => ({
  exerciseMediaAdminApi: { getDashboard: (...args: unknown[]) => getDashboard(...args) },
}));

import ExerciseMediaAutomation from './ExerciseMediaAutomation';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const fullDashboard = {
  policy: null,
  summary: [],
  candidates: [],
  pilot: { required: 6, approved: 2, awaitingApproval: 0, unlocked: false },
};

describe('ExerciseMediaAutomation', () => {
  it('mostra o progresso real do lote piloto quando a API responde por completo', async () => {
    getDashboard.mockResolvedValue(fullDashboard);
    render(<ExerciseMediaAutomation />);
    expect(await screen.findByText(/2 de 6 aprovadas/)).toBeTruthy();
  });

  it('não quebra a tela quando a resposta não traz o campo pilot (ex.: ambiente sem a API de backend)', async () => {
    // Reproduz o cenário real: um ambiente sem o servidor de API (a Vercel
    // deste projeto, que não roda o server.ts customizado) devolvia um
    // payload vazio, e o componente tentava ler dashboard.pilot.unlocked
    // sem checar se `pilot` existia — quebrando a tela inteira.
    getDashboard.mockResolvedValue({});
    render(<ExerciseMediaAutomation />);
    expect(await screen.findByText(/0 de 6 aprovadas/)).toBeTruthy();
  });

  it('mostra um erro discreto quando a chamada à API falha, em vez de travar', async () => {
    getDashboard.mockRejectedValue(new Error('A API de automação de mídia não respondeu com JSON neste ambiente — provavelmente o servidor de backend não está disponível aqui.'));
    render(<ExerciseMediaAutomation />);
    expect(await screen.findByText(/não está disponível aqui/)).toBeTruthy();
  });

  it('bloqueia a geração piloto quando não existem imagens pendentes', async () => {
    getDashboard.mockResolvedValue({
      ...fullDashboard,
      policy: {
        id: 'policy-1',
        name: 'KYRON Anatomia Educacional 3:2',
        version: 1,
        status: 'approved',
        criteria: {},
        prompt_template: 'Imagem educacional.',
        aspect_ratio: '3:2',
        image_size: '2K',
        target_width: 1536,
        target_height: 1024,
        require_manual_approval: true,
        pilot_required: 6,
        pilot_approved: false,
        approved_at: '2026-10-03T00:00:00.000Z',
      },
      pilot: { required: 6, approved: 0, awaitingApproval: 0, unlocked: false },
    });

    render(<ExerciseMediaAutomation />);

    expect(await screen.findByText(/Não há imagens pendentes para geração/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Gerar pilotos/i }).hasAttribute('disabled')).toBe(true);
  });
});
