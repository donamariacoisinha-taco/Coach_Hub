import { profileApi } from '../api/profileApi';
import { getGuestCheckIns, saveGuestCheckIn } from '../guest/guestPersistence';
import { parseWeightCheckInLogs, WeightCheckInLog } from '../../domain/checkin/weightCheckInHistory';

/**
 * Ponto único de leitura/escrita do histórico de check-in — convidado vs
 * autenticado nunca deve ser decidido de novo em cada tela que precisa
 * dessa lista (foi exatamente esquecer esse desvio que já quebrou Evolução
 * e Histórico neste projeto).
 *
 * `checkin_logs` é criada por SQL manual (ver CLAUDE.md) — até isso
 * acontecer, toda chamada autenticada cai no catch abaixo e o app continua
 * funcionando com o cache local de sempre, sem quebrar.
 */

const localCacheKey = (userId: string) => `rubi_checkin_cache_${userId}`;

const readLocalCache = (userId: string): WeightCheckInLog[] => (
  parseWeightCheckInLogs(localStorage.getItem(localCacheKey(userId)))
);

const writeLocalCache = (userId: string, logs: WeightCheckInLog[]): void => {
  localStorage.setItem(localCacheKey(userId), JSON.stringify(logs));
};

export const getCheckInLogs = async (userId: string, isGuest: boolean): Promise<WeightCheckInLog[]> => {
  if (isGuest) return getGuestCheckIns();

  try {
    let remote = await profileApi.getCheckIns(userId);

    // checkin_logs nunca foi sincronizada antes de hoje: se está vazia mas
    // este aparelho tem histórico local, migra uma única vez em vez de
    // deixar o usuário achar que perdeu os check-ins já registrados.
    if (remote.length === 0) {
      const legacyLocal = readLocalCache(userId);
      if (legacyLocal.length > 0) {
        try {
          await Promise.all(legacyLocal.map((log) => profileApi.upsertCheckIn(userId, log)));
          remote = await profileApi.getCheckIns(userId);
        } catch (migrationErr) {
          console.warn('[checkInStore] Falha ao migrar check-ins locais para checkin_logs:', migrationErr);
          remote = legacyLocal;
        }
      }
    }

    writeLocalCache(userId, remote);
    return remote;
  } catch (err) {
    console.warn('[checkInStore] checkin_logs indisponível, usando cache local:', err);
    return readLocalCache(userId);
  }
};

export const submitCheckInLog = async (
  userId: string,
  isGuest: boolean,
  log: WeightCheckInLog,
): Promise<WeightCheckInLog[]> => {
  if (isGuest) return saveGuestCheckIn(log);

  const next = readLocalCache(userId).filter((entry) => entry.date !== log.date);
  next.push(log);
  writeLocalCache(userId, next);

  try {
    await profileApi.upsertCheckIn(userId, log);
  } catch (err) {
    console.warn('[checkInStore] checkin_logs indisponível, check-in salvo apenas localmente por enquanto:', err);
  }

  return next;
};
