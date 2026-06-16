
import React, { useEffect, useState } from 'react';
import { WorkoutHistory } from '../types';
import { authApi } from '../lib/api/authApi';
import { workoutApi } from '../lib/api/workoutApi';
import { profileApi } from '../lib/api/profileApi';
import { systemTemplatesApi } from '../lib/api/systemTemplatesApi';
import { supabase } from '../lib/api/supabase';
import ProgressPhotos from './ProgressPhotos';
import BioReport from './BioReport';
import ShareCard from './ShareCard';
import { ExerciseProgress } from './ExerciseProgress';
import { 
  MoreVertical, 
  Share2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  History, 
  TrendingUp, 
  Check, 
  Flame, 
  ArrowRight, 
  RefreshCw, 
  GitMerge, 
  Zap, 
  CornerDownRight, 
  CheckCircle2,
  Calendar,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ui/ConfirmModal';
import { ScreenState } from './ui/ScreenState';
import { WorkoutSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNavigation } from '../App';

type TabType = 'journey' | 'sessions' | 'charts' | 'visual' | 'bio';

const HistoryView: React.FC = () => {
  const { showError } = useErrorHandler();
  const { current, navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>(current.params?.tab || 'journey');

  useEffect(() => {
    if (current.params?.tab) {
      setActiveTab(current.params.tab);
    }
  }, [current.params?.tab]);

  const historyState = useAsyncState<WorkoutHistory[]>([]);
  const exerciseListState = useAsyncState<{id: string, name: string}[]>([]);
  
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [shareData, setShareData] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Journeys Stats
  const [profile, setProfile] = useState<any>(null);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [earliestWorkout, setEarliestWorkout] = useState<WorkoutHistory | null>(null);
  const [latestWorkout, setLatestWorkout] = useState<WorkoutHistory | null>(null);
  const [volumeData, setVolumeData] = useState<{ earVol: number; latVol: number } | null>(null);
  const [protocolUpdates, setProtocolUpdates] = useState<any[]>([]);
  const [loadingJourney, setLoadingJourney] = useState<boolean>(true);

  // Strength & Personal Records (PR) stats
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [recentNewPRs, setRecentNewPRs] = useState<Set<string>>(new Set());
  const [top5Strongest, setTop5Strongest] = useState<any[]>([]);
  const [exerciseEvolutions, setExerciseEvolutions] = useState<any[]>([]);
  const [beforeVsNow, setBeforeVsNow] = useState<any | null>(null);

  useEffect(() => {
    const loadJourneyData = async () => {
      setLoadingJourney(true);
      try {
        const user = await authApi.getUser();
        if (!user) return;
        
        // 1. Get profile and body measurements
        const p = await profileApi.getProfile(user.id);
        setProfile(p);
        
        const measurements = await profileApi.getBodyMeasurements();
        if (measurements && measurements.length > 0) {
          const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
          setStartingWeight(sorted[0].weight);
        } else if (p && p.weight) {
          setStartingWeight(p.weight);
        }

        // 2. Load folders and detect protocol updates
        const dashData = await workoutApi.getDashboardData(user.id);
        const folders = dashData?.folders || [];
        const detected = await systemTemplatesApi.detectUpdates(user.id, folders);
        setProtocolUpdates(detected);

        // 3. Load all workout sets logs to extract PRs, Top 5 Lifts, and Exercise Evolutions
        const { data: rawLogs, error: logsError } = await supabase
          .from('workout_sets_log')
          .select('*, exercises(id, name, muscle_group)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }); // chronological order

        if (logsError) throw logsError;

        if (rawLogs && rawLogs.length > 0) {
          const prsMap = new Map<string, any>(); // exercise_id -> Best overall log
          const exerciseLogsOrdered = new Map<string, any[]>(); // exercise_id -> chronological logs list
          
          rawLogs.forEach(log => {
            if (!log.weight_achieved || log.weight_achieved <= 0 || !log.reps_achieved || log.reps_achieved <= 0) return;
            const exId = log.exercise_id;
            if (!exerciseLogsOrdered.has(exId)) {
              exerciseLogsOrdered.set(exId, []);
            }
            exerciseLogsOrdered.get(exId)!.push(log);
          });

          const detectedRecentPRs = new Set<string>();
          const newestWorkoutId = historyState.data?.[0]?.id || null;

          exerciseLogsOrdered.forEach((logs, exId) => {
            let maxWeightSeen = 0;
            const maxRepsForWeight = new Map<number, number>();
            let max1RMSeen = 0;
            let bestOverallLog: any = null;

            logs.forEach((log, index) => {
              const weight = Number(log.weight_achieved || 0);
              const reps = Number(log.reps_achieved || 0);
              const est1RM = weight * (1 + reps / 30.0);

              const isFirst = index === 0;
              const isNewWeightRecord = weight > maxWeightSeen;
              const isNewRepsRecord = reps > (maxRepsForWeight.get(weight) || 0);
              const isNew1RMRecord = est1RM > max1RMSeen;

              let isNewPR = false;
              if (isFirst) {
                isNewPR = true;
              } else if (isNewWeightRecord || isNewRepsRecord || isNew1RMRecord) {
                isNewPR = true;
              }

              log.isNewPR = isNewPR;

              // Updates
              if (weight > maxWeightSeen) maxWeightSeen = weight;
              const currentMaxReps = maxRepsForWeight.get(weight) || 0;
              if (reps > currentMaxReps) maxRepsForWeight.set(weight, reps);
              if (est1RM > max1RMSeen) max1RMSeen = est1RM;

              // Best log selector
              if (!bestOverallLog || est1RM > (bestOverallLog.weight_achieved * (1 + bestOverallLog.reps_achieved / 30.0))) {
                bestOverallLog = log;
              }

              // Flag as recent PR if achieved in the latest workout
              if (isNewPR && log.history_id === newestWorkoutId && !isFirst) {
                detectedRecentPRs.add(exId);
              }
            });

            if (bestOverallLog) {
              prsMap.set(exId, bestOverallLog);
            }
          });

          setRecentNewPRs(detectedRecentPRs);

          const isCompound = (name: string): boolean => {
            const lower = name.toLowerCase();
            return lower.includes('supino') || 
                   lower.includes('agachamento') || 
                   lower.includes('leg press') || 
                   lower.includes('terra') || 
                   lower.includes('remada') || 
                   lower.includes('puxada') || 
                   lower.includes('desenvolvimento') ||
                   lower.includes('bench press') ||
                   lower.includes('squat');
          };

          // 1. List of all PRs per exercise
          const prsList = Array.from(prsMap.values()).map(log => {
            const exName = log.exercises?.name || 'Exercício';
            return {
              exerciseId: log.exercise_id,
              exerciseName: exName,
              bestWeight: Number(log.weight_achieved),
              bestReps: Number(log.reps_achieved),
              date: log.created_at,
              isRecentPR: detectedRecentPRs.has(log.exercise_id),
              isCompound: isCompound(exName)
            };
          });

          // Sort PRs to focus on most important compound exercises with high weights
          const sortedPRs = [...prsList].sort((a, b) => {
            if (a.isCompound && !b.isCompound) return -1;
            if (!a.isCompound && b.isCompound) return 1;
            return b.bestWeight - a.bestWeight;
          });
          setPersonalRecords(sortedPRs);

          // 2. Seus Melhores Resultados (Top 5 Strongest Exercises based on weight & compound status)
          const top5 = [...prsList]
            .sort((a, b) => {
              const scoreA = a.bestWeight * (a.isCompound ? 1.5 : 1.0);
              const scoreB = b.bestWeight * (b.isCompound ? 1.5 : 1.0);
              return scoreB - scoreA;
            })
            .slice(0, 5);
          setTop5Strongest(top5);

          // 3. Exercise progression evolution
          const evols: any[] = [];
          exerciseLogsOrdered.forEach((logs, exId) => {
            if (logs.length >= 2) {
              const firstLog = logs[0];
              const bestLog = prsMap.get(exId);
              if (bestLog && firstLog && bestLog.id !== firstLog.id) {
                const exName = bestLog.exercises?.name || 'Exercício';
                const firstWeight = Number(firstLog.weight_achieved);
                const bestWeight = Number(bestLog.weight_achieved);
                const weightDiff = bestWeight - firstWeight;

                evols.push({
                  exerciseId: exId,
                  exerciseName: exName,
                  firstWeight,
                  firstReps: Number(firstLog.reps_achieved),
                  bestWeight,
                  bestReps: Number(bestLog.reps_achieved),
                  weightDiff,
                  isCompound: isCompound(exName)
                });
              }
            }
          });

          const sortedEvols = evols.sort((a, b) => b.weightDiff - a.weightDiff);
          setExerciseEvolutions(sortedEvols);

          // 4. Before vs Now core focus
          if (sortedEvols.length > 0) {
            const bestEvol = sortedEvols.find(e => e.isCompound) || sortedEvols[0];
            setBeforeVsNow(bestEvol);
          }
        }
      } catch (err) {
        console.error('Error loading athlete evolution stats:', err);
      } finally {
        setLoadingJourney(false);
      }
    };
    loadJourneyData();
  }, [historyState.data]);

  useEffect(() => {
    if (historyState.data && historyState.data.length > 0) {
      const data = historyState.data;
      const newest = data[0];
      const oldest = data[data.length - 1];
      setLatestWorkout(newest);
      setEarliestWorkout(oldest);

      // Fetch volume levels
      const calcVolume = async () => {
        try {
          const [eLogs, lLogs] = await Promise.all([
            workoutApi.getWorkoutLogsSimple(oldest.id),
            workoutApi.getWorkoutLogsSimple(newest.id)
          ]);
          const earVol = eLogs?.reduce((acc: number, curr: any) => acc + (curr.weight_achieved * (curr.reps_achieved || 10)), 0) || 0;
          const latVol = lLogs?.reduce((acc: number, curr: any) => acc + (curr.weight_achieved * (curr.reps_achieved || 10)), 0) || 0;
          setVolumeData({ earVol, latVol });
        } catch (e) {
          console.error("Volume narrative query error", e);
        }
      };
      calcVolume();
    }
  }, [historyState.data]);

  useEffect(() => {
    fetchHistory();
    fetchExerciseList();
  }, []);

  const fetchHistory = async () => {
    historyState.setLoading(true);
    try {
      const user = await authApi.getUser();
      if (!user) return;
      const data = await workoutApi.getWorkoutHistory(user.id);
      if (data) historyState.setData(data);
    } catch (err) { 
      historyState.setError(err);
      showError(err);
    }
  };

  const fetchExerciseList = async () => {
    exerciseListState.setLoading(true);
    try {
      const data = await workoutApi.getExerciseList();
      if (data) {
        const unique = new Map();
        data.forEach((d: any) => {
          if (d.exercises) unique.set(d.exercise_id, d.exercises.name);
        });
        const list = Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
        exerciseListState.setData(list);
        if (list.length > 0 && !selectedExerciseId) setSelectedExerciseId(list[0].id);
      }
    } catch (err) { 
      exerciseListState.setError(err);
    }
  };

  const fetchWorkoutDetails = async (historyId: string) => {
    setLoadingDetails(true);
    setSelectedWorkout(historyId);
    try {
      const data = await workoutApi.getWorkoutDetails(historyId);
      if (data) {
        const grouped = data.reduce((acc: any, curr: any) => {
          const exName = curr.exercises?.name || curr.exercise_name_snapshot || 'Exercício Indisponível';
          if (!acc[exName]) acc[exName] = [];
          acc[exName].push(curr);
          return acc;
        }, {});
        setWorkoutLogs(Object.entries(grouped));
      }
    } catch (err) { console.error(err); }
    finally { setLoadingDetails(false); }
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
      fetchExerciseList();
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32">
      <header className="px-6 pt-12 pb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance</p>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Evolução</h2>
        
        <div className="flex gap-8 mt-10 overflow-x-auto no-scrollbar border-b border-slate-100">
          {[
            { id: 'journey', label: 'Jornada' },
            { id: 'sessions', label: 'Sessões' },
            { id: 'charts', label: 'Força' },
            { id: 'visual', label: 'Visual' },
            { id: 'bio', label: 'Bio' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6">
        {activeTab === 'journey' ? (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-16">
            {loadingJourney ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                <div className="w-8 h-8 border-2 border-[#5C8CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Analisando Métricas de Evolução...</span>
              </div>
            ) : (personalRecords.length === 0) ? (
              /* JOURNEY EMPTY STATE */
              <div className="flex-1 flex flex-col justify-center items-center py-12 px-2 text-center">
                <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 max-w-md space-y-6">
                  <div className="w-16 h-16 bg-[#5C8CFF]/10 text-[#5C8CFF] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <Flame size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-[#5C8CFF] uppercase tracking-[0.25em] block leading-none">Início da Sua Evolução</span>
                    <h3 className="text-xl font-[1000] text-slate-900 tracking-tighter uppercase leading-tight mt-1.5">Evolução de Força</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 mx-auto max-w-xs">
                      Complete seus primeiros treinos para acompanhar seus recordes de força e evolução ao longo do tempo.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if ('vibrate' in navigator) navigator.vibrate(5);
                      navigate('dashboard');
                    }}
                    className="w-full py-4.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15"
                  >
                    <span>Iniciar Primeiro Treino</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE JOURNEY NARRATIVE */
              <div className="space-y-10">
                {/* Section A: Before vs Now */}
                {beforeVsNow && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Antes vs Agora</h3>
                    <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="relative space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-black text-[#7BA7FF] uppercase tracking-[0.2em] block leading-none">Maior Evolução de Força</span>
                            <h4 className="text-sm font-black uppercase text-white mt-2 leading-none">{beforeVsNow.exerciseName}</h4>
                          </div>
                          <span className="text-[8.5px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
                            +{beforeVsNow.weightDiff} kg Ganho
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                          <div className="bg-white/5 p-3 rounded-2xl">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Primeiro Treino</span>
                            <p className="text-xs font-bold text-slate-200 mt-2 tracking-tight tabular-nums">{beforeVsNow.firstWeight} kg × {beforeVsNow.firstReps} reps</p>
                          </div>
                          
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                            <span className="text-[7.5px] font-black text-[#5C8CFF] uppercase tracking-widest block leading-none">Melhor Resultado</span>
                            <p className="text-xs font-bold text-white mt-2 tracking-tight tabular-nums">{beforeVsNow.bestWeight} kg × {beforeVsNow.bestReps} reps</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section B: Personal Records (PRs) */}
                {personalRecords && personalRecords.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Recordes Pessoais (PRs)</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {personalRecords.slice(0, 8).map((pr) => (
                        <div key={pr.exerciseId} className="bg-white rounded-2xl p-5 border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="space-y-1 pr-2">
                            <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase line-clamp-1">{pr.exerciseName}</h4>
                            <p className="text-[8.5px] font-[1000] text-slate-400 uppercase tracking-wider block">
                              {new Date(pr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                            <span className="text-xs font-[1000] text-slate-900 tabular-nums bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                              {pr.bestWeight} kg <span className="text-[9.5px] text-slate-400 font-medium select-none">×</span> {pr.bestReps}
                            </span>
                            {pr.isRecentPR && (
                              <span className="text-[7px] font-[1000] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 tracking-wider uppercase inline-block leading-none select-none">
                                Novo Recorde
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section C: Top 5 Strongest Exercises */}
                {top5Strongest && top5Strongest.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Award size={15} className="text-indigo-500" />
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Seus Melhores Resultados</h3>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-50">
                      {top5Strongest.map((item, idx) => (
                        <div key={item.exerciseId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-indigo-500 w-5 bg-indigo-50 border border-indigo-100 rounded-lg h-5 flex items-center justify-center select-none">{idx + 1}</span>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight line-clamp-1">{item.exerciseName}</span>
                          </div>
                          <span className="text-xs font-[1000] text-slate-800 tabular-nums">
                            {item.bestWeight} kg <span className="text-[10px] text-slate-400 font-medium select-none">×</span> {item.bestReps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section D: Exercise Evolution */}
                {exerciseEvolutions && exerciseEvolutions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Evolução dos Exercícios</h3>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4.5">
                      {exerciseEvolutions.slice(0, 5).map((evol) => (
                        <div key={evol.exerciseId} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 border-b border-slate-50 last:border-0">
                          <div className="space-y-1 pr-2">
                            <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase line-clamp-1">{evol.exerciseName}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black tracking-wide uppercase select-none">
                              <span>Inicial: {evol.firstWeight} kg</span>
                              <span>→</span>
                              <span className="text-slate-500">Recorde: {evol.bestWeight} kg</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block text-[10px] font-[1000] px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 tabular-nums leading-none">
                              +{evol.weightDiff} kg
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section E: Narrative & Body weight metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Evolution Panel */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Evolução Corporal</h3>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 grid grid-cols-2 gap-4 relative">
                      <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-slate-50" />
                      
                      <div className="text-center py-3 bg-slate-50/50 rounded-2xl flex flex-col justify-center">
                        <span className="text-[7.5px] font-[1000] text-slate-400 uppercase tracking-wider leading-none">Peso Inicial</span>
                        <p className="text-base font-[1000] text-slate-800 tracking-tight mt-2.5 tabular-nums">{startingWeight ? `${startingWeight} kg` : '--'}</p>
                      </div>

                      <div className="text-center py-4 bg-[#5C8CFF]/5 border border-[#5C8CFF]/10 rounded-2xl flex flex-col justify-center">
                        <span className="text-[7.5px] font-[1000] text-[#5C8CFF] uppercase tracking-wider leading-none font-bold">Peso Atual</span>
                        <p className="text-base font-[1000] text-slate-900 tracking-tight mt-2.5 tabular-nums">{profile?.weight ? `${profile.weight} kg` : '--'}</p>
                        {startingWeight && profile?.weight && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-2 inline-block mx-auto leading-none ${profile.weight - startingWeight >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-blue-50 text-blue-600 border border-blue-100/50'}`}>
                            {(profile.weight - startingWeight) >= 0 ? `+${(profile.weight - startingWeight).toFixed(1)}kg` : `${(profile.weight - startingWeight).toFixed(1)}kg`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Volume level progress */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Carga Útil Total</h3>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[7.5px] font-[1000] text-slate-400 uppercase tracking-wider leading-none">Carga Acumulada</span>
                          <p className="text-base font-[1000] text-slate-800 tracking-tight mt-1.5 tabular-nums">{volumeData?.latVol ? `${volumeData.latVol} kg` : '--'}</p>
                        </div>
                        {volumeData?.earVol && volumeData?.latVol && (
                          <span className={`text-[8px] font-[1000] px-2 py-1 rounded-xl uppercase tracking-wider font-bold leading-none shrink-0 ${volumeData.latVol - volumeData.earVol >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-red-50 text-red-500 border border-red-100/50'}`}>
                            {(volumeData.latVol - volumeData.earVol) >= 0 
                              ? `▲ +${(((volumeData.latVol - volumeData.earVol) / volumeData.earVol) * 100).toFixed(0)}% Força`
                              : `▼ ${(((volumeData.latVol - volumeData.earVol) / volumeData.earVol) * 100).toFixed(0)}%`
                            }
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        Carga útil (Tonnage) representa o peso total transferido sob contração muscular nas sessões principais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section F: Consistency Adherence Grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Fidelização & Compromisso</h3>
                  
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5">
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Adesão de Foco</span>
                        <p className="text-lg font-[1000] text-slate-800 leading-none mt-2">100%</p>
                        <span className="text-[6.5px] font-black text-[#5C8CFF] uppercase tracking-widest block mt-1.5 leading-none">Planejado</span>
                      </div>
                      
                      <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/50">
                        <span className="text-[7.5px] font-black text-[#5C8CFF] uppercase tracking-widest block leading-none">Frequência</span>
                        <p className="text-lg font-[1000] text-[#5C8CFF] leading-none mt-2">{profile?.days_per_week || 3}x</p>
                        <span className="text-[6.5px] font-black text-[#5C8CFF] uppercase tracking-widest block mt-1.5 leading-none">Por Semana</span>
                      </div>

                      <div className="bg-emerald-50/45 p-3 rounded-2xl border border-emerald-100/50">
                        <span className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest block leading-none">Regularidade</span>
                        <p className="text-lg font-[1000] text-emerald-600 leading-none mt-2">Excelente</p>
                        <span className="text-[6.5px] font-black text-emerald-500 uppercase tracking-widest block mt-1.5 leading-none">Adesão Sec</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-center bg-slate-50/50 py-3 px-4.5 rounded-2xl">
                      Sua constância e disciplina semanal são os pilares científicos para a evolução saudável de força e recomposição.
                    </p>
                  </div>
                </div>

                {/* Section G: Protocol versioning / safe merge updates */}
                <div className="space-y-4">
                  <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Evolução do Protocolo</h3>
                  
                  {protocolUpdates && protocolUpdates.length > 0 ? (
                    protocolUpdates.map((up, upIdx) => (
                      <div key={upIdx} className="bg-gradient-to-br from-[#121926] to-[#0A0F19] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden space-y-4">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[7.5px] font-black text-[#7BA7FF] uppercase tracking-widest block leading-none">Alterações Científicas Disponíveis</span>
                            <h4 className="text-[15px] font-black uppercase tracking-tight text-white mt-2 leading-none">{up.templateName}</h4>
                            <p className="text-[9px] font-bold text-slate-400 mt-1.5">Evolução da Versão v{up.currentVersion} para v{up.latestVersion}</p>
                          </div>
                          <span className="text-[7.5px] font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Versão Atualizada</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Refinamentos Científicos da Equipe Médica</span>
                          <div className="space-y-2">
                            {up.changes && up.changes.length > 0 ? (
                              up.changes.map((ch: string, cIdx: number) => (
                                <div key={cIdx} className="flex gap-2 text-xs text-slate-300 font-semibold leading-relaxed">
                                  <CornerDownRight size={14} className="text-[#7BA7FF] shrink-0 mt-0.5" />
                                  <span>{ch}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 font-medium pb-1">Refinamento geral de cadência, tempo sob tensão e segurança articular.</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if ('vibrate' in navigator) navigator.vibrate(10);
                            const success = await systemTemplatesApi.mergeTemplate(
                              profile.id,
                              up.folderId,
                              up.templateId,
                              up.latestVersion,
                              'safe'
                            );
                            if (success) {
                              alert('Protocolo sincronizado para a nova versão com absoluto sucesso! Suas anotações personalizadas foram protegidas.');
                              window.location.reload();
                            }
                          }}
                          className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-center shadow-lg shadow-indigo-650/15"
                        >
                          <RefreshCw size={11} className="animate-pulse" />
                          <span>Atualizar Protocolo para v{up.latestVersion} (Safe Merge)</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-black text-slate-800 uppercase leading-none">Protocolo Pristine Ativo</h5>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-relaxed">
                          Sua pasta está rodando plenamente de acordo com os modelos biomecânicos e científicos mais recentes do Kyron.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'visual' ? <ProgressPhotos /> : activeTab === 'bio' ? <BioReport /> : activeTab === 'charts' ? (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
             <ScreenState
               status={exerciseListState.status}
               skeleton={<div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6"><div className="w-32 h-12 bg-slate-200 animate-pulse rounded-full" /><div className="w-32 h-12 bg-slate-200 animate-pulse rounded-full" /></div>}
             >
               <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                  {(exerciseListState.data || []).map(ex => (
                    <button 
                      key={ex.id} 
                      onClick={() => { setSelectedExerciseId(ex.id); if ('vibrate' in navigator) navigator.vibrate(5); }}
                      className={`px-8 py-5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedExerciseId === ex.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                      {ex.name}
                    </button>
                  ))}
               </div>

               {selectedExerciseId && (
                 <ExerciseProgress 
                   exerciseId={selectedExerciseId} 
                   name={(exerciseListState.data || []).find(e => e.id === selectedExerciseId)?.name || ''} 
                 />
               )}
             </ScreenState>
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
                      onClick={() => selectedWorkout === item.id ? setSelectedWorkout(null) : fetchWorkoutDetails(item.id)}
                      className={`flex justify-between items-center py-8 active:bg-slate-50 transition-colors cursor-pointer ${idx !== (historyState.data || []).length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                       <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{item.category_name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                            {new Date(item.completed_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} • {item.duration_minutes || '--'} min
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <button 
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
                            workoutLogs.map(([exName, sets]: [string, any[]]) => (
                              <div key={exName} className="space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{exName}</h5>
                                 <div className="grid grid-cols-4 gap-6">
                                    {sets.map((set, sIdx) => (
                                      <div key={sIdx} className="space-y-1">
                                         <p className="text-lg font-black text-slate-900 tracking-tighter tabular-nums">{set.weight_achieved}<span className="text-[10px] ml-0.5">kg</span></p>
                                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{set.reps_achieved} reps</p>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            ))
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
