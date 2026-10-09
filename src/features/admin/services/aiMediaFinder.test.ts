import { describe, expect, it, vi } from 'vitest';
import { aiMediaFinder } from './aiMediaFinder';
import type { Exercise } from '../../../types';

describe('aiMediaFinder', () => {
  it('does not recommend unrelated stock photos when the media lookup fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('lookup unavailable'));
    const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await aiMediaFinder.findMedia({ name: 'Adução de Quadril no Cabo', equipment: 'Cabo', muscle_group: 'Pernas' } as Exercise);
      expect(result).toEqual({ main_images: [], videos: [], guides: [] });
    } finally {
      fetchMock.mockRestore();
      consoleMock.mockRestore();
    }
  });
});
