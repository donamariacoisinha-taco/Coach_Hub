
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
  const { showError } = useErrorHandler();
  const { current, navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>(current.params?.tab || 'journey');

  const getDaysSince = (dateString: string) => {
    const recordDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - recordDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
  const [longestStandingRecord, setLongestStandingRecord] = useState<any | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState<boolean>(false);
  const [maxWorkoutVolume, setMaxWorkoutVolume] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

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

          // 1. List of all PRs per exercise with 30-day evolution, progress, and momentum
          const prsList = Array.from(prsMap.values()).map(log => {
            const exName = log.exercises?.name || 'Exercício';
            const logs = exerciseLogsOrdered.get(log.exercise_id) || [];
            
            // Calculate 30-day window from current time
            const nowMs = Date.now();
            const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;
            
            // Filter logs which are within the last 30 days and those before
            const logs30 = logs.filter(l => new Date(l.created_at).getTime() >= thirtyDaysAgoMs);
            const logsBefore = logs.filter(l => new Date(l.created_at).getTime() < thirtyDaysAgoMs);
            
            let recentStartWeight = 0;
            let recentStartReps = 0;
            let recentEndWeight = 0;
            let recentEndReps = 0;
            let momentum: 'Em evolução' | 'Estável' | 'Sem registros recentes' = 'Sem registros recentes';
            let has30DayProgress = false;
            let weightDiff30 = 0;
            
            if (logs30.length > 0) {
              // We have activity in the last 30 days
              let startLog = logs30[0];
              if (logsBefore.length > 0) {
                // If there's prior history, progress should start from the latest log before 30 days
                startLog = logsBefore[logsBefore.length - 1];
              }
              const endLog = logs30[logs30.length - 1];
              
              recentStartWeight = Number(startLog.weight_achieved || 0);
              recentStartReps = Number(startLog.reps_achieved || 0);
              recentEndWeight = Number(endLog.weight_achieved || 0);
              recentEndReps = Number(endLog.reps_achieved || 0);
              
              const start1RM = recentStartWeight * (1 + recentStartReps / 30.0);
              const end1RM = recentEndWeight * (1 + recentEndReps / 30.0);
              
              weightDiff30 = recentEndWeight - recentStartWeight;
              
              if (end1RM > start1RM + 0.1 || recentEndWeight > recentStartWeight) {
                momentum = 'Em evolução';
              } else {
                momentum = 'Estável';
              }
              
              if (startLog.id !== endLog.id) {
                has30DayProgress = true;
              }
            } else {
              momentum = 'Sem registros recentes';
            }
            
            return {
              exerciseId: log.exercise_id,
              exerciseName: exName,
              bestWeight: Number(log.weight_achieved),
              bestReps: Number(log.reps_achieved),
              date: log.created_at,
              isRecentPR: detectedRecentPRs.has(log.exercise_id),
              isCompound: isCompound(exName),
              recentStartWeight,
              recentStartReps,
              recentEndWeight,
              recentEndReps,
              weightDiff30,
              momentum,
              has30DayProgress
            };
          });

          // Sort PRs to focus on most important compound exercises with high weights
          const sortedPRs = [...prsList].sort((a, b) => {
            if (a.isCompound && !b.isCompound) return -1;
            if (!a.isCompound && b.isCompound) return 1;
            return b.bestWeight - a.bestWeight;
          });
          setPersonalRecords(sortedPRs);

          // Find longest standing record among the PR list (oldest PR by date)
          let lsr = null;
          if (prsList.length > 0) {
            const sortedByDate = [...prsList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            lsr = sortedByDate[0];
          }
          setLongestStandingRecord(lsr);

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

          // Calculate maxWorkoutVolume
          const workoutVolumes = new Map<string, number>();
          rawLogs.forEach(log => {
            if (!log.weight_achieved || !log.reps_achieved || !log.history_id) return;
            const vol = Number(log.weight_achieved) * Number(log.reps_achieved);
            workoutVolumes.set(log.history_id, (workoutVolumes.get(log.history_id) || 0) + vol);
          });
          let maxVol = 0;
          workoutVolumes.forEach(vol => {
            if (vol > maxVol) maxVol = vol;
          });
          setMaxWorkoutVolume(maxVol);

          // Calculate maxStreak
          const dates = (historyState.data || [])
            .map(h => (h as any).completed_at ? new Date((h as any).completed_at).toDateString() : '')
            .filter(Boolean);
          const uniqueDates = Array.from(new Set(dates)).map((d: any) => new Date(d));
          uniqueDates.sort((a, b) => a.getTime() - b.getTime());

          let mStreak = 0;
          let tempStreak = 0;
          let lastDate: Date | null = null;

          uniqueDates.forEach((d) => {
            if (!lastDate) {
              tempStreak = 1;
            } else {
              const diffTime = d.getTime() - lastDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                tempStreak += 1;
              } else if (diffDays > 1) {
                tempStreak = 1;
              }
            }
            if (tempStreak > mStreak) {
              mStreak = tempStreak;
            }
            lastDate = d;
          });
          if (mStreak === 0 && (historyState.data || []).length > 0) {
            mStreak = (historyState.data || []).length;
          }
          setMaxStreak(mStreak);
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Evolução de Força</p>
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
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Recuperando seus recordes de força...</span>
              </div>
            ) : (personalRecords.length === 0) ? (
              /* JOURNEY EMPTY STATE */
              <div className="flex-1 flex flex-col justify-center items-center py-12 px-2 text-center">
                <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 max-w-md space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-[1000] text-slate-900 tracking-tighter uppercase leading-tight">Sua evolução começa no primeiro treino</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-3 mx-auto max-w-xs">
                      Conclua seu primeiro treino para começar a registrar seus recordes pessoais e acompanhar sua progressão de força.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if ('vibrate' in navigator) navigator.vibrate(5);
                      navigate('dashboard');
                    }}
                    className="w-full py-4.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15"
                  >
                    <span>Iniciar Primeiro Treino</span>
                    <ArrowRight size={14} />
                  </button>

                  <span className="text-[10px] font-medium text-slate-400 block pt-1 select-none">
                    Os resultados que você construir aparecerão aqui.
                  </span>
                </div>
              </div>
            ) : (
              /* ACTIVE JOURNEY NARRATIVE */
              <div className="space-y-10 animate-in fade-in duration-500">
                {/* Block 1: SEU MAIOR PROGRESSO */}
                {beforeVsNow && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                      Maior evolução da sua jornada
                    </h3>
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center py-12">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-[#7BA7FF]/10 rounded-full blur-[80px] pointer-events-none" />
                      
                      <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-6">
                        {beforeVsNow.exerciseName}
                      </h4>

                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-sm font-semibold text-slate-400">
                          {beforeVsNow.firstWeight}kg <span className="text-slate-500 font-medium select-none">×</span> {beforeVsNow.firstReps}
                        </div>
                        
                        <div className="text-[#7BA7FF] select-none text-lg font-black leading-none">
                          ↓
                        </div>
                        
                        <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                          {beforeVsNow.bestWeight}kg <span className="text-slate-400 font-normal select-none">×</span> {beforeVsNow.bestReps}
                        </div>

                        <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-6 leading-none">
                          +{beforeVsNow.weightDiff}kg
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Block 2: SEUS MELHORES RESULTADOS */}
                {top5Strongest && top5Strongest.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                      Seus Melhores Resultados
                    </h3>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100 font-sans">
                      {top5Strongest.slice(0, 5).map((item) => (
                        <div key={item.exerciseId} className="flex items-center justify-between py-4 first:pt-2 last:pb-2">
                          <div className="space-y-1 pr-4 flex-1 min-w-0">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight block truncate">
                              {item.exerciseName}
                            </span>
                            {item.date && (
                              <span className="text-[9px] font-semibold text-slate-400 block leading-none">
                                {formatDateObj(item.date)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                            {item.bestWeight}kg <span className="text-slate-400 font-medium select-none">×</span> {item.bestReps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block 3: EVOLUÇÃO DOS ÚLTIMOS 30 DIAS */}
                {((personalRecords && personalRecords.filter(pr => pr.recentStartWeight > 0 && pr.recentEndWeight > 0).length > 0) || (exerciseEvolutions && exerciseEvolutions.length > 0)) && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                      Evolução dos Últimos 30 Dias
                    </h3>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
                      {(() => {
                        const logs30 = personalRecords.filter(pr => pr.recentStartWeight > 0 && pr.recentEndWeight > 0);
                        const displayItems = logs30.length > 0 
                          ? logs30.slice(0, 5) 
                          : exerciseEvolutions.slice(0, 5).map(e => ({
                              exerciseId: e.exerciseId,
                              exerciseName: e.exerciseName,
                              recentStartWeight: e.firstWeight,
                              recentEndWeight: e.bestWeight
                            }));

                        return displayItems.map((r) => {
                          const diff = r.recentEndWeight - r.recentStartWeight;
                          return (
                            <div key={r.exerciseId} className="flex items-center justify-between py-4 first:pt-2 last:pb-2">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1 pr-4 flex-1 animate-in">
                                {r.exerciseName}
                              </span>
                              <div className="flex items-center gap-4 shrink-0 font-sans">
                                <span className="text-xs font-bold text-slate-500 font-mono">
                                  {r.recentStartWeight}kg → <span className="text-slate-950 font-black">{r.recentEndWeight}kg</span>
                                </span>
                                <span className={`text-xs font-black font-mono tracking-tight shrink-0 ${diff > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {diff >= 0 ? `+${diff}` : diff}kg
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Progressive Disclosure Action */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      if ('vibrate' in navigator) navigator.vibrate(5);
                      setShowDetailedAnalysis(!showDetailedAnalysis);
                    }}
                    className="px-6 py-3.5 bg-white border border-slate-200 text-slate-850 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer flex items-center gap-2 hover:shadow-xs active:scale-95"
                  >
                    <span>{showDetailedAnalysis ? 'Fechar análise detalhada' : 'Ver análise completa →'}</span>
                  </button>
                </div>

                {/* SECONDARY INFORMATION (Moved to Progressive Disclosure container) */}
                {showDetailedAnalysis && (
                  <div className="space-y-10 pt-4 border-t border-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Section A: Antes vs Agora detalhado */}
                    {beforeVsNow && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest">Antes vs Agora Detalhado</h3>
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
                                <span className="text-[7.5px] font-black text-slate-400 tracking-widest block leading-none">Primeiro Treino</span>
                                <p className="text-xs font-bold text-slate-200 mt-2 tracking-tight tabular-nums">{beforeVsNow.firstWeight} kg × {beforeVsNow.firstReps} reps</p>
                              </div>
                              
                              <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                                <span className="text-[7.5px] font-black text-[#5C8CFF] tracking-widest block leading-none">Melhor Resultado</span>
                                <p className="text-xs font-bold text-white mt-2 tracking-tight tabular-nums">{beforeVsNow.bestWeight} kg × {beforeVsNow.bestReps} reps</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recorde Mantido Card */}
                    {longestStandingRecord && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest font-sans">Recorde Mantido</h3>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden">
                          <div className="space-y-4">
                            <h4 className="text-base font-black uppercase text-slate-900 tracking-tight leading-none">{longestStandingRecord.exerciseName}</h4>
                            
                            <div className="pt-2">
                              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Carga Alcançada:</span>
                              <p className="text-xs font-extrabold text-slate-800 tracking-tight mt-1.5 tabular-nums inline-block bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                                {longestStandingRecord.bestWeight} kg <span className="text-[9.5px] text-slate-400 font-medium select-none">×</span> {longestStandingRecord.bestReps}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center bg-slate-100/30 -mx-6 -mb-6 px-6 py-4.5 rounded-b-3xl">
                            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Tempo Invicto:</span>
                            <span className="text-[11px] font-black text-slate-700 bg-slate-50 border border-slate-100/80 px-3 py-1 rounded-full tabular-nums">
                              {getDaysSince(longestStandingRecord.date) === 0 ? 'Feito hoje' : `Há ${getDaysSince(longestStandingRecord.date)} dias`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. NOVO RECORDE SECTION */}
                    {(() => {
                      const recentPR = personalRecords?.find(p => p.isRecentPR || (p.date && getDaysSince(p.date) <= 5));
                      if (!recentPR) return null;
                      const daysAgo = getDaysSince(recentPR.date);
                      const relativeTimeStr = daysAgo === 0 ? 'Feito hoje' : daysAgo === 1 ? 'Ontem' : `há ${daysAgo} dias`;
                      return (
                        <div className="space-y-4">
                          <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">
                            Novo Recorde
                          </h3>
                          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between font-sans">
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                {recentPR.exerciseName}
                              </h4>
                              <span className="text-[10px] font-semibold text-slate-400 block leading-none mt-1">
                                {relativeTimeStr}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-900 tabular-nums bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl leading-none">
                              {recentPR.bestWeight}kg <span className="text-[10px] text-slate-400 font-medium select-none">×</span> {recentPR.bestReps}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Suas Melhores Marcas (Formerly Hall de Recordes) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">
                        Suas Melhores Marcas
                      </h3>
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100 font-sans">
                        {(() => {
                          const getBestPRByKeywords = (keywords: string[]) => {
                            const pr = personalRecords?.find(p => 
                              keywords.some(k => p.exerciseName.toLowerCase().includes(k))
                            );
                            if (pr) {
                              return {
                                value: `${pr.bestWeight}kg × ${pr.bestReps}`,
                                dateStr: new Date(pr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                                hasValue: true
                              };
                            }
                            return {
                              value: '--',
                              dateStr: '',
                              hasValue: false
                            };
                          };

                          const strengthAchievements = [
                            { 
                              label: 'Seu melhor Supino', 
                              conquistaText: 'Melhor marca',
                              ...getBestPRByKeywords(['supino', 'bench press'])
                            },
                            { 
                              label: 'Seu melhor Agachamento', 
                              conquistaText: 'Recorde atual',
                              ...getBestPRByKeywords(['agachamento', 'squat', 'agacha'])
                            },
                            { 
                              label: 'Seu melhor Leg Press', 
                              conquistaText: 'Melhor marca',
                              ...getBestPRByKeywords(['leg press'])
                            },
                            { 
                              label: 'Sua melhor Remada', 
                              conquistaText: 'Recorde atual',
                              ...getBestPRByKeywords(['remada', 'row'])
                            },
                            { 
                              label: 'Seu melhor Desenvolvimento', 
                              conquistaText: 'Melhor marca',
                              ...getBestPRByKeywords(['desenvolvimento', 'shoulder press', 'overhead'])
                            }
                          ];

                          return strengthAchievements.map((rec, rIdx) => (
                            <div key={rIdx} className="flex items-center justify-between py-4 first:pt-2 last:pb-2">
                              <div className="space-y-1">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">
                                  {rec.label}
                                </span>
                                {rec.hasValue && (
                                  <span className="text-[10px] font-semibold text-slate-400 block tracking-tight leading-none mt-1">
                                    {rec.conquistaText} • {rec.dateStr}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                                {rec.value}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Evolução Corporal */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">Evolução Corporal</h3>
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
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase mt-2 inline-block mx-auto leading-none ${(profile.weight - startingWeight) >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-blue-50 text-blue-600 border border-blue-100/50'}`}>
                              {(profile.weight - startingWeight) >= 0 ? `+${(profile.weight - startingWeight).toFixed(1)}kg` : `${(profile.weight - startingWeight).toFixed(1)}kg`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Carga Útil Total (Volume/Tonnage) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">Volume Total de Treino</h3>
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
                        <div className="flex justify-between py-4 first:pt-2 last:pb-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Carga Acumulada</span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            {volumeData?.latVol ? `${volumeData.latVol.toLocaleString('pt-BR')} kg` : '--'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pt-2">
                          O volume total de treino (tonnage) representa o peso total deslocado sob contração muscular nas suas sessões principais.
                        </p>
                      </div>
                    </div>

                    {/* Consistência de Treino (Secondary achievements moved to bottom of analysis) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">Consistência e Volume</h3>
                      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 divide-y divide-slate-100 font-sans">
                        <div className="flex items-center justify-between py-4 first:pt-2 last:pb-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            Maior Volume em uma Sessão
                          </span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            {maxWorkoutVolume > 0 ? `${Math.round(maxWorkoutVolume).toLocaleString('pt-BR')} kg` : '--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-2 last:pb-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            Maior Sequência de Treinos
                          </span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            {maxStreak > 0 ? `${maxStreak} ${maxStreak === 1 ? 'treino' : 'treinos'}` : '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 6. Histórico de Protocolos */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-[1000] text-slate-400 uppercase tracking-widest pl-2">Histórico de Protocolos</h3>
                      
                      {protocolUpdates && protocolUpdates.length > 0 ? (
                        protocolUpdates.map((up, upIdx) => (
                          <div key={upIdx} className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden space-y-4">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7BA7FF]/10 rounded-full blur-xl pointer-events-none" />
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[7.5px] font-black text-[#5C8CFF] uppercase tracking-widest block leading-none">Alterações de Protocolo</span>
                                <h4 className="text-[15px] font-black uppercase tracking-tight text-white mt-1.5 leading-none">{up.templateName}</h4>
                                <p className="text-[9px] font-bold text-slate-400 mt-1.5 font-mono">v{up.currentVersion} → v{up.latestVersion}</p>
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
                                  alert('Protocolo sincronizado para a nova versão com absoluto sucesso!');
                                  window.location.reload();
                                }
                              }}
                              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                            >
                              <RefreshCw size={11} className="animate-pulse" />
                              <span>Atualizar Protocolo (Safe Merge)</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-slate-100 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-xs font-black text-slate-800 uppercase leading-none">Protocolo Ativo e Atualizado</h5>
                            <p className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-relaxed">
                              Sua rotina está perfeitamente alinhada com as recomendações de biomecânica do Kyron.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
