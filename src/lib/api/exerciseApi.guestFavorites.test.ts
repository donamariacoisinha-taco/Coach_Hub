import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from './authApi';

// Qualquer consulta ao Supabase para favoritos do convidado é um defeito:
// user_id sentinela ('guest-user-id') não é um uuid válido e não tem sessão
// real, a consulta sempre falharia (foi exatamente isso que quebrou o botão
// de favoritar silenciosamente).
const supabaseFrom = vi.fn((_table: string) => {
  throw new Error('favoritar exercício para o convidado não deve consultar o Supabase');
});
vi.mock('./supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));

import { exerciseApi } from './exerciseApi';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
};

describe('Biblioteca de Exercícios: favoritar (convidado)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    supabaseFrom.mockClear();
  });

  it('adiciona um favorito localmente sem tocar o Supabase', async () => {
    await exerciseApi.toggleFavorite(GUEST_USER_ID, 'ex-1', false);
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(await exerciseApi.getFavorites(GUEST_USER_ID)).toEqual(['ex-1']);
  });

  it('remove um favorito localmente sem tocar o Supabase', async () => {
    await exerciseApi.toggleFavorite(GUEST_USER_ID, 'ex-1', false);
    await exerciseApi.toggleFavorite(GUEST_USER_ID, 'ex-2', false);
    await exerciseApi.toggleFavorite(GUEST_USER_ID, 'ex-1', true);
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(await exerciseApi.getFavorites(GUEST_USER_ID)).toEqual(['ex-2']);
  });

  it('persiste favoritos do convidado entre chamadas (simulando reabrir o app)', async () => {
    await exerciseApi.toggleFavorite(GUEST_USER_ID, 'ex-1', false);
    expect(await exerciseApi.getFavorites(GUEST_USER_ID)).toEqual(['ex-1']);
  });
});
