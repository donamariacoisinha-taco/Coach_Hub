import { beforeEach, describe, expect, it, vi } from 'vitest';

// A IA da Rubi ficou quebrada para todo mundo depois do hardening de
// segurança (P0/P0.2, commit 498af47): o servidor passou a exigir um bearer
// token em /api/intelligence/*, mas o cliente nunca foi atualizado para
// enviá-lo. Estes testes travam o contrato: sessão real -> token anexado;
// sem sessão real (deslogado ou convidado) -> nem chega a bater na rede.
const getSession = vi.fn();
vi.mock('../lib/api/authApi', () => ({
  authApi: { getSession: () => getSession() },
  isGuestSession: (session: any) => (
    session?.user?.id === 'guest-user-id' || session?.access_token === 'guest-token'
  ),
}));

import { geminiService } from './geminiService';

describe('geminiService.callAI: autenticação', () => {
  beforeEach(() => {
    getSession.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('anexa o bearer token da sessão real ao chamar o proxy de IA', async () => {
    getSession.mockResolvedValue({ access_token: 'real-token-123', user: { id: 'user-1' } });
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'ok' }),
    });

    await geminiService.callAI({ prompt: 'oi' });

    expect(fetch).toHaveBeenCalledWith('/api/intelligence/proxy', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer real-token-123' }),
    }));
  });

  it('não chama a rede e falha rápido para uma sessão de convidado', async () => {
    getSession.mockResolvedValue({ access_token: 'guest-token', user: { id: 'guest-user-id' } });

    await expect(geminiService.callAI({ prompt: 'oi' })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('não chama a rede e falha rápido sem nenhuma sessão', async () => {
    getSession.mockResolvedValue(null);

    await expect(geminiService.callAI({ prompt: 'oi' })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
