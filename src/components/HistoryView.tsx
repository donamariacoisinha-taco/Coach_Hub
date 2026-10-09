
import React, { useEffect, useRef, useState } from 'react';
import { WorkoutHistory } from '../types';
import { authApi } from '../lib/api/authApi';
import { workoutApi } from '../lib/api/workoutApi';
import {
  SessionSummary,
  formatSessionVolume,
  formatSetWeight,
  sessionDataBadge,
  sessionStatusBadge,
  summarizeSession,
} from '../domain/workout/sessionSummary';
import ProgressPhotos from './ProgressPhotos';
import BioReport from './BioReport';
import ShareCard from './ShareCard';
import { EvolutionPanel } from './EvolutionPanel';
import { 
  MoreVertical,
  Share2,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Check,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ui/ConfirmModal';
import { ScreenState } from './ui/ScreenState';
import { WorkoutSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNavigation } from '../App';

type TabType = 'journey' | 'sessions' | 'charts' | 'visual' | 'bio';

const formatDateObj = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return '';
  }
};

const HistoryView: React.FC = () => {
  const { showError, showSuccess } = useErrorHandler();
  const { current, navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>(current.params?.tab || 'journey');

  useEffect(() => {
    if (current.params?.tab) {
      setActiveTab(current.params.tab);
    }
  }, [current.params?.tab]);

  const historyState = useAsyncState<WorkoutHistory[]>([]);
  
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [workoutSummary, setWorkoutSummary] = useState<SessionSummary | null>(null);
  const detailsRequest = useRef(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [shareData, setShareData] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { weight: string; reps: string; rpe: string }>>({});
  const [savingEdits, setSavingEdits] = useState(false);

  const [evolutionRevision, setEvolutionRevision] = useState(0);
  const [bodyTab, setBodyTab] = useState<'visual' | 'bio'>('bio');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    historyState.setLoading(true);
    try {
      const user = await authApi.getUser();
      if (!user) throw new Error('Entre na sua conta para carregar o histórico.');
      const data = await workoutApi.getWorkoutHistory(user.id);
      if (data) historyState.setData(data);
    } catch (err) { 
      historyState.setError(err);
      showError(err);
    }
  };

  const fetchWorkoutDetails = async (entry: WorkoutHistory) => {
    const request = ++detailsRequest.current;
    const historyId = entry.id;
    setWorkoutLogs([]);
    setLoadingDetails(true);
    setSelectedWorkout(historyId);
    setWorkoutSummary(null);
    try {
      const data = await workoutApi.getWorkoutDetails(historyId);
      if (request !== detailsRequest.current) return;
      const logs = data || [];
      const grouped = logs.reduce((acc: any, curr: any) => {
        const exName = curr.exercises?.name || curr.exercise_name_snapshot || 'Exercício Indisponível';
        if (!acc[exName]) acc[exName] = [];
        acc[exName].push(curr);
        return acc;
      }, {});
      setWorkoutLogs(Object.entries(grouped));
      setWorkoutSummary(summarizeSession(entry, logs));
    } catch (err) { if (request === detailsRequest.current) showError(err); }
    finally { if (request === detailsRequest.current) setLoadingDetails(false); }
  };

  const handleShareHistory = async (e: React.MouseEvent, item: WorkoutHistory) => {
    e.stopPropagation();
    setLoadingDetails(true);
    try {
      const data = await workoutApi.getWorkoutLogsSimple(item.id);
      const totalTonnage = data?.reduce((acc, curr) => acc + (curr.weight_achieved * curr.reps_achieved), 0) || 0;
      setShareData({
        category_name: item.category_name,
        completed_at: item.completed_at,
        duration_minutes: item.duration_minutes,
        exercises_count: item.exercises_count,
        totalTonnage: totalTonnage
      });
      setActiveMenuId(null);
    } catch (err) { console.error(err); }
    finally { setLoadingDetails(false); }
  };

  const handleDeleteHistory = async (historyId: string) => {
    setShowDeleteConfirm(null);
    setIsDeleting(historyId);
    try {
      await workoutApi.abandonWorkout(historyId);
      historyState.setData((historyState.data || []).filter(h => h.id !== historyId));
      if (selectedWorkout === historyId) setSelectedWorkout(null);
      setActiveMenuId(null);
      setEvolutionRevision(value => value + 1);
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(null);
    }
  };

  // Inicializa os campos editáveis a partir dos logs já carregados, sempre que
  // a sessão em edição terminar de expandir/carregar seus detalhes.
  useEffect(() => {
    if (!editingHistoryId || selectedWorkout !== editingHistoryId) return;
    const initial: Record<string, { weight: string; reps: string; rpe: string }> = {};
    workoutLogs.forEach(([, sets]: [string, any[]]) => {
      sets.forEach((set) => {
        const key = `${set.exercise_id}__${set.set_number}`;
        initial[key] = {
          weight: set.weight_achieved ? String(set.weight_achieved) : '',
          reps: set.reps_achieved ? String(set.reps_achieved) : '',
          rpe: Number(set.rpe) > 0 ? String(set.rpe) : '',
        };
      });
    });
    setEditValues(initial);
  }, [editingHistoryId, selectedWorkout, workoutLogs]);

  const handleStartEdit = (e: React.MouseEvent, item: WorkoutHistory) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setEditingHistoryId(item.id);
    if (selectedWorkout !== item.id) {
      fetchWorkoutDetails(item);
    }
  };

  const handleCancelEdit = () => {
    setEditingHistoryId(null);
    setEditValues({});
  };

  const handleSaveEdits = async (item: WorkoutHistory) => {
    setSavingEdits(true);
    try {
      const updates: Promise<any>[] = [];
      workoutLogs.forEach(([, sets]: [string, any[]]) => {
        sets.forEach((set) => {
          const key = `${set.exercise_id}__${set.set_number}`;
          const edited = editValues[key];
          if (!edited) return;
          const weight = edited.weight === '' ? 0 : Number(edited.weight);
          const reps = edited.reps === '' ? 0 : Number(edited.reps);
          const rpe = edited.rpe === '' ? 0 : Number(edited.rpe);
          const unchanged = weight === Number(set.weight_achieved || 0)
            && reps === Number(set.reps_achieved || 0)
            && rpe === Number(set.rpe || 0);
          if (unchanged) return;
          updates.push(workoutApi.updateWorkoutSetLog(
            { id: set.id, history_id: item.id, exercise_id: set.exercise_id, set_number: set.set_number },
            { weight_achieved: weight, reps_achieved: reps, rpe },
          ));
        });
      });
      await Promise.all(updates);
      await fetchWorkoutDetails(item);
      setEditingHistoryId(null);
      setEditValues({});
      showSuccess('Sessão atualizada', 'As séries dessa sessão foram atualizadas.');
    } catch (err) {
      showError(err);
    } finally {
      setEvolutionRevision(value => value + 1);
      setSavingEdits(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32">
      <header className="px-6 pt-12 pb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Seus resultados</p>
        <div className="flex items-center justify-between gap-4"><h2 className="text-3xl font-bold text-slate-900 tracking-tight">Evolução</h2><button onClick={() => setActiveTab(bodyTab)} className="text-sm font-semibold text-blue-600 px-3 py-2 rounded-xl border border-blue-100 bg-white">Medidas e fotos</button></div>
        
        <div className="flex gap-6 mt-6 overflow-x-auto no-scrollbar border-b border-slate-100">
          {[
            { id: 'journey', label: 'Resumo' },
            { id: 'charts', label: 'Exercícios' },
            { id: 'sessions', label: 'Histórico' }
          ].map(tab => (
            <button 
              key={tab.id}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`text-sm font-semibold pb-3 pt-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6">
        {activeTab === 'journey' || activeTab === 'charts' ? (
          <ScreenState status={historyState.status} skeleton={<WorkoutSkeleton />} onRetry={fetchHistory}
            emptyState={<div className="p-6 bg-white rounded-2xl border border-slate-200"><h3 className="font-semibold">Sua evolução começa com seus registros</h3><p className="text-sm text-slate-500 mt-2">Registre um treino para acompanhar seus resultados aqui.</p><button className="mt-4 text-blue-600 font-semibold" onClick={() => navigate('dashboard')}>Ir para meus treinos</button></div>}>
            <EvolutionPanel history={historyState.data || []} revision={evolutionRevision}
              mode={activeTab === 'journey' ? 'summary' : 'exercises'}
              onExercise={() => setActiveTab('charts')} onSession={id => { setActiveTab('sessions'); const entry = historyState.data?.find(h => h.id === id); if (entry) fetchWorkoutDetails(entry); }} />
          </ScreenState>
        ) : activeTab === 'visual' || activeTab === 'bio' ? (
          <div>
            <div className="flex gap-2 mb-6" aria-label="Evolução corporal">
              {(['bio', 'visual'] as const).map(tab => <button key={tab} onClick={() => { setBodyTab(tab); setActiveTab(tab); }}
                aria-pressed={activeTab === tab} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {tab === 'bio' ? 'Medidas' : 'Fotos'}
              </button>)}
            </div>
            {activeTab === 'visual' ? <ProgressPhotos /> : <BioReport />}
          </div>
        ) : (
          <div className="space-y-1">
             <ScreenState
               status={historyState.status}
               skeleton={<WorkoutSkeleton />}
               onRetry={fetchHistory}
             >
               {(historyState.data || []).map((item, idx) => (
                 <div key={item.id} className="relative">
                    <div 
                      onClick={() => selectedWorkout === item.id ? setSelectedWorkout(null) : fetchWorkoutDetails(item)}
                      className={`flex justify-between items-center py-8 active:bg-slate-50 transition-colors cursor-pointer ${idx !== (historyState.data || []).length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                       <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{item.category_name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                            {new Date(item.completed_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} • {item.duration_minutes || '--'} min
                          </p>
                          {(() => {
                            const badge = sessionStatusBadge(item);
                            return (
                              <span
                                title={badge.description}
                                className={`inline-block mt-2.5 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-tight border ${
                                  badge.tone === 'partial'
                                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                                    : 'text-blue-700 bg-blue-50 border-blue-200'
                                }`}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                       </div>
                       <div className="flex items-center gap-4">
                          <button 
                            aria-label={`Ações da sessão ${item.category_name}`}
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                            className="w-12 h-12 flex items-center justify-center text-slate-200 active:text-slate-900 transition-colors"
                          >
                             <MoreVertical size={18} />
                          </button>
                          {selectedWorkout === item.id ? <ChevronUp size={14} className="text-slate-200" /> : <ChevronDown size={14} className="text-slate-200" />}
                       </div>
                    </div>

                    <AnimatePresence>
                      {activeMenuId === item.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-2xl border border-slate-50 p-4 min-w-[160px] space-y-2"
                        >
                          <button
                            onClick={(e) => handleStartEdit(e, item)}
                            className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                          >
                            <Pencil size={14} /> Editar
                          </button>
                          <button
                            onClick={(e) => handleShareHistory(e, item)}
                            className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                          >
                            <Share2 size={14} /> Compartilhar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(item.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedWorkout === item.id && (
                      <div className="pb-10 pt-4 space-y-10 animate-in fade-in duration-500">
                         {loadingDetails ? (
                           <div className="text-center py-4">
                             <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                           </div>
                         ) : (
                          <>
                            {workoutSummary && (() => {
                              const badge = sessionDataBadge(workoutSummary);
                              const tone = badge.tone === 'measurable'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : badge.tone === 'bodyweight'
                                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                                  : 'text-slate-500 bg-slate-50 border-slate-200 border-dashed';
                              return (
                                <div className={`rounded-2xl border p-4 space-y-2 ${tone}`}>
                                  <p className="text-[13px] font-black tracking-tight">{badge.label}</p>
                                  <p className="text-[12px] font-semibold leading-relaxed opacity-90">{badge.description}</p>
                                  <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-[12px] font-bold">
                                    <span>Volume: {formatSessionVolume(workoutSummary)}</span>
                                    <span>RPE médio: {workoutSummary.avgRpe === null ? '—' : workoutSummary.avgRpe.toFixed(1)}</span>
                                    <span>Séries: {workoutSummary.setCount || '—'}</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {workoutLogs.length === 0 && !loadingDetails && (
                              <p className="text-[12px] font-bold text-slate-400 text-center py-4">
                                Nenhuma série registrada nesta sessão.
                              </p>
                            )}

                            {workoutLogs.map(([exName, sets]: [string, any[]]) => (
                              <div key={exName} className="space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{exName}</h5>
                                 <div className={editingHistoryId === item.id ? "grid grid-cols-2 gap-4" : "grid grid-cols-3 gap-6"}>
                                    {sets.map((set, sIdx) => {
                                      if (editingHistoryId !== item.id) {
                                        return (
                                          <div key={sIdx} className="space-y-1">
                                             <p className="text-[15px] font-black text-slate-900 tracking-tight tabular-nums">{formatSetWeight(set)}</p>
                                             <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">{set.reps_achieved} reps</p>
                                             {Number(set.rpe) > 0 && (
                                               <p className="text-[11px] font-bold text-slate-400">RPE {Number(set.rpe).toFixed(1)}</p>
                                             )}
                                          </div>
                                        );
                                      }
                                      const key = `${set.exercise_id}__${set.set_number}`;
                                      const values = editValues[key] || { weight: '', reps: '', rpe: '' };
                                      return (
                                        <div key={sIdx} className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Série {set.set_number}</span>
                                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                                            <div>
                                              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Kg</label>
                                              <input
                                                type="number"
                                                inputMode="decimal"
                                                value={values.weight}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, weight: e.target.value } }))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Reps</label>
                                              <input
                                                type="number"
                                                inputMode="numeric"
                                                value={values.reps}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, reps: e.target.value } }))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">RPE</label>
                                              <input
                                                type="number"
                                                inputMode="decimal"
                                                step="0.5"
                                                min="0"
                                                max="10"
                                                value={values.rpe}
                                                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: { ...values, rpe: e.target.value } }))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                 </div>
                              </div>
                            ))}

                            {editingHistoryId === item.id && (
                              <div className="flex gap-3 pt-2 sticky bottom-4">
                                <button
                                  onClick={() => handleSaveEdits(item)}
                                  disabled={savingEdits}
                                  className="flex-1 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition disabled:opacity-50 cursor-pointer"
                                >
                                  {savingEdits ? 'Salvando...' : 'Salvar alterações'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={savingEdits}
                                  className="px-6 py-3.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </>
                         )}
                      </div>
                    )}
                 </div>
               ))}
             </ScreenState>
          </div>
        )}
      </div>

      {shareData && (
        <ShareCard 
          workout={shareData} 
          onClose={() => setShareData(null)} 
        />
      )}

      <ConfirmModal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteHistory(showDeleteConfirm)}
        title="Excluir Registro"
        message="Deseja apagar este registro de treino permanentemente do seu histórico?"
        confirmText="Sim, Apagar"
        loading={!!isDeleting}
      />
    </div>
  );
};

export default HistoryView;
