import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_USER_ID } from './authApi';

// Qualquer consulta ao Supabase para o convidado é um defeito: o id
// sentinela não é um uuid válido e a consulta sempre falharia.
const supabaseFrom = vi.fn((_table: string) => ({
  select: () => ({
    eq: () => ({
      order: () => Promise.reject(new Error('fluxo convidado não deve consultar o Supabase')),
    }),
  }),
}));
vi.mock('./supabase', () => ({ supabase: { from: (table: string) => supabaseFrom(table) } }));

import { mediaApi } from './mediaApi';

describe('mediaApi.getPhotos no modo convidado', () => {
  beforeEach(() => {
    supabaseFrom.mockClear();
  });

  it('devolve lista vazia sem consultar o Supabase', async () => {
    const photos = await mediaApi.getPhotos(GUEST_USER_ID);
    expect(supabaseFrom).not.toHaveBeenCalled();
    expect(photos).toEqual([]);
  });
});
