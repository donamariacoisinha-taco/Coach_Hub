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
    const rejection = Promise.reject(new Error('A API de automação de mídia não respondeu com JSON neste ambiente — provavelmente o servidor de backend não está disponível aqui.'));
    rejection.catch(() => {}); // evita o aviso de "unhandled rejection" do próprio harness de teste
    getDashboard.mockReturnValue(rejection);
    render(<ExerciseMediaAutomation />);
    expect(await screen.findByText(/não está disponível aqui/)).toBeTruthy();
  });
});
