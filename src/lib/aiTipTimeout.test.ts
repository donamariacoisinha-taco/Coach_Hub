import { describe, expect, it } from 'vitest';
import { AI_TIP_TIMEOUT_MS, raceWithTimeout } from './aiTipTimeout';

describe('dica biomecânica', () => {
  it('espera o bastante para uma resposta lenta e não corta aos 8 segundos', async () => {
    expect(AI_TIP_TIMEOUT_MS).toBeGreaterThanOrEqual(20000);
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('dica pronta'), 50));
    await expect(raceWithTimeout(slow, AI_TIP_TIMEOUT_MS)).resolves.toBe('dica pronta');
  });
});
