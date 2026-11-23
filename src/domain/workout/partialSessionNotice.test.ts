import { describe, expect, it } from 'vitest';
import { partialSessionAgeDays, partialSessionBanner, shouldRedirectToPartialSession } from './partialSessionNotice';

describe('sessão parcial antiga', () => {
  const now = Date.parse('2026-11-23T12:00:00Z');

  it('não desvia a rota para o player', () => {
    expect(shouldRedirectToPartialSession()).toBe(false);
  });

  it('conta os dias desde o início, inclusive uma sessão de 54 horas', () => {
    const start = new Date(now - 54 * 60 * 60 * 1000).toISOString();
    expect(partialSessionAgeDays(start, now)).toBe(2);
    expect(partialSessionBanner(start, now)).toBe('Treino em andamento há 2 dias');
  });
});
