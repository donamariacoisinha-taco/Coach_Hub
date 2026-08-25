import { describe, expect, it } from 'vitest';
import { FetchTimeoutError, withTimeout } from './utils';

describe('withTimeout', () => {
  it('retorna o resultado quando a consulta responde dentro do prazo', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok');
  });

  it('falha de forma tratável quando a consulta fica pendurada', async () => {
    const pending = new Promise<never>(() => undefined);

    await expect(withTimeout(pending, 10)).rejects.toBeInstanceOf(FetchTimeoutError);
  });
});
