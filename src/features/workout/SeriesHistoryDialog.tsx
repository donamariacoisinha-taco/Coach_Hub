import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { workoutApi } from '../../lib/api/workoutApi';

type Sessions = Awaited<ReturnType<typeof workoutApi.getLastThreeExerciseSessions>>;

interface SeriesHistoryDialogProps {
  setNumber: number;
  exerciseName?: string;
  volume: number;
  sessions: Sessions;
  loading: boolean;
  error: boolean;
  onClose: () => void;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function SeriesHistoryDialog({ setNumber, exerciseName, volume, sessions, loading, error, onClose }: SeriesHistoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const rows = sessions.map(session => ({
    ...session,
    recorded: session.sets.find(item => item.set_number === setNumber)
  }));
  const newest = rows[0]?.recorded;
  const oldest = rows.slice().reverse().find(row => row.recorded)?.recorded;
  const difference = newest && oldest && newest !== oldest && newest.weight_achieved != null && oldest.weight_achieved != null
    ? Number(newest.weight_achieved) - Number(oldest.weight_achieved)
    : NaN;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Histórico da série ${setNumber}`}
      onClose={onClose}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom) {
          event.currentTarget.close();
        }
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[min(85dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/55 sm:inset-y-0 sm:my-auto sm:rounded-3xl"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight">Histórico da série {setNumber}</h2>
          {exerciseName && <p className="mt-1 break-words text-sm text-slate-600">{exerciseName}</p>}
        </div>
        <button type="button" autoFocus aria-label="Fechar histórico" onClick={() => dialogRef.current?.close()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <X size={19} aria-hidden="true" />
        </button>
      </header>
      <div className="space-y-4 px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5">
        {Number.isFinite(volume) && volume > 0 && (
          <dl className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-2xl bg-blue-50 px-3 py-2.5 text-sm">
            <dt>
              <span className="block font-semibold text-slate-900">Volume desta série</span>
              <span className="text-xs text-slate-600">Carga × repetições atuais</span>
            </dt>
            <dd className="font-bold tabular-nums text-blue-900">{formatNumber(volume)} kg</dd>
          </dl>
        )}
        <section aria-labelledby="series-history-recent">
          <h3 id="series-history-recent" className="mb-2 text-sm font-semibold">Treinos anteriores</h3>
          {loading ? <p role="status" className="py-3 text-sm text-slate-600">Carregando histórico…</p>
            : error ? <p role="status" className="py-3 text-sm text-red-700">Não foi possível consultar o histórico.</p>
            : !rows.length ? <p className="py-3 text-sm text-slate-600">Nenhum treino anterior encontrado para este exercício.</p>
            : <>
              <div className="rounded-2xl border border-slate-200">
                <table className="w-full table-fixed text-right text-sm tabular-nums">
                  <caption className="sr-only">Até três treinos anteriores, do mais recente ao mais antigo</caption>
                  <thead className="text-xs text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th scope="col" className="w-[36%] px-2 py-2.5 text-left font-semibold sm:px-3">Data</th>
                      <th scope="col" className="w-[24%] px-1 py-2.5 font-semibold">Carga</th>
                      <th scope="col" aria-label="Repetições" className="w-[22%] px-1 py-2.5 font-semibold">Reps</th>
                      <th scope="col" aria-label="Esforço (RPE)" className="w-[18%] px-2 py-2.5 font-semibold sm:px-3">RPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map(session => (
                      <tr key={session.history_id}>
                        <th scope="row" className="break-words px-2 py-3 text-left text-xs font-medium text-slate-700 sm:px-3 sm:text-sm">
                          {session.date ? new Date(session.date).toLocaleDateString('pt-BR') : '—'}
                        </th>
                        <td className="break-words px-1 py-3 font-semibold">{session.recorded?.weight_achieved != null ? `${formatNumber(Number(session.recorded.weight_achieved))} kg` : '—'}</td>
                        <td className="px-1 py-3 font-semibold">{session.recorded?.reps_achieved ?? '—'}</td>
                        <td className="px-2 py-3 font-semibold sm:px-3">{session.recorded?.rpe ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Number.isFinite(difference) && (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-slate-600">
                  <strong className="font-semibold text-slate-800">{difference > 0 ? '+' : ''}{formatNumber(difference)} kg</strong>
                  <span>do registro mais antigo ao mais recente.</span>
                </p>
              )}
            </>}
        </section>
      </div>
    </dialog>
  );
}
