import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCheckIns: vi.fn(),
  upsertCheckIn: vi.fn(),
}));

vi.mock('../api/profileApi', () => ({
  profileApi: {
    getCheckIns: mocks.getCheckIns,
    upsertCheckIn: mocks.upsertCheckIn,
  },
}));

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

import { getCheckInLogs, submitCheckInLog } from './checkInStore';

const USER_ID = 'real-user-1';
const log = (date: string, overrides: Partial<{ weight: number }> = {}) => (
  { date, weight: 80, energy: 3, sleep: 3, recovery: 3, hydration: true, ...overrides }
);

describe('checkInStore — usuário autenticado', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    mocks.getCheckIns.mockReset();
    mocks.upsertCheckIn.mockReset();
  });

  it('busca do Supabase e espelha no cache local', async () => {
    mocks.getCheckIns.mockResolvedValue([log('2026-09-15')]);

    const logs = await getCheckInLogs(USER_ID, false);

    expect(logs).toEqual([log('2026-09-15')]);
    expect(JSON.parse(localStorage.getItem('rubi_checkin_cache_real-user-1')!)).toEqual([log('2026-09-15')]);
  });

  it('cai no cache local quando checkin_logs ainda não existe (SQL manual pendente)', async () => {
    localStorage.setItem('rubi_checkin_cache_real-user-1', JSON.stringify([log('2026-09-10')]));
    mocks.getCheckIns.mockRejectedValue(new Error('relation "checkin_logs" does not exist'));

    const logs = await getCheckInLogs(USER_ID, false);

    expect(logs).toEqual([log('2026-09-10')]);
  });

  it('migra o histórico local uma única vez quando a tabela está vazia', async () => {
    localStorage.setItem('rubi_checkin_cache_real-user-1', JSON.stringify([log('2026-09-01'), log('2026-09-08')]));
    mocks.getCheckIns
      .mockResolvedValueOnce([]) // primeira leitura: tabela vazia
      .mockResolvedValueOnce([log('2026-09-01'), log('2026-09-08')]); // releitura pós-migração
    mocks.upsertCheckIn.mockResolvedValue(undefined);

    const logs = await getCheckInLogs(USER_ID, false);

    expect(mocks.upsertCheckIn).toHaveBeenCalledTimes(2);
    expect(logs).toEqual([log('2026-09-01'), log('2026-09-08')]);
  });

  it('grava no Supabase e sempre mantém o cache local como rede de segurança', async () => {
    mocks.upsertCheckIn.mockResolvedValue(undefined);

    const result = await submitCheckInLog(USER_ID, false, log('2026-09-15'));

    expect(mocks.upsertCheckIn).toHaveBeenCalledWith(USER_ID, log('2026-09-15'));
    expect(result).toEqual([log('2026-09-15')]);
  });

  it('não perde o check-in se o Supabase falhar — salva local mesmo assim', async () => {
    mocks.upsertCheckIn.mockRejectedValue(new Error('relation "checkin_logs" does not exist'));

    const result = await submitCheckInLog(USER_ID, false, log('2026-09-15'));

    expect(result).toEqual([log('2026-09-15')]);
    expect(JSON.parse(localStorage.getItem('rubi_checkin_cache_real-user-1')!)).toEqual([log('2026-09-15')]);
  });

  it('substitui o log do mesmo dia em vez de duplicar', async () => {
    localStorage.setItem('rubi_checkin_cache_real-user-1', JSON.stringify([log('2026-09-15', { weight: 81 })]));
    mocks.upsertCheckIn.mockResolvedValue(undefined);

    const result = await submitCheckInLog(USER_ID, false, log('2026-09-15', { weight: 79 }));

    expect(result).toEqual([log('2026-09-15', { weight: 79 })]);
  });
});

describe('checkInStore — convidado nunca chama o Supabase', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    mocks.getCheckIns.mockReset();
    mocks.upsertCheckIn.mockReset();
  });

  it('getCheckInLogs não toca profileApi quando isGuest é true', async () => {
    await getCheckInLogs('guest-user-id', true);
    expect(mocks.getCheckIns).not.toHaveBeenCalled();
  });

  it('submitCheckInLog não toca profileApi quando isGuest é true', async () => {
    await submitCheckInLog('guest-user-id', true, log('2026-09-15'));
    expect(mocks.upsertCheckIn).not.toHaveBeenCalled();
  });
});
