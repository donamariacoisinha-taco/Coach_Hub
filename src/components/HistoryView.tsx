
import React, { useEffect, useState } from 'react';
import { WorkoutHistory } from '../types';
import { authApi } from '../lib/api/authApi';
import { workoutApi } from '../lib/api/workoutApi';
import ProgressPhotos from './ProgressPhotos';
import BioReport from './BioReport';
import ShareCard from './ShareCard';
import { ExerciseProgress } from './ExerciseProgress';
import { MoreVertical, Share2, Trash2, ChevronDown, ChevronUp, History, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenState } from './ui/ScreenState';
import { WorkoutSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { useErrorHandler } from '../hooks/useErrorHandler';

type TabType = 'sessions' | 'charts' | 'visual' | 'bio';

const HistoryView: React.FC = () => {
  const { showError } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const historyState = useAsyncState<WorkoutHistory[]>([]);
  const exerciseListState = useAsyncState<{id: string, name: string}[]>([]);
  
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [shareData, setShareData] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
          const exName = curr.exercises.name;
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

  const handleDeleteHistory = async (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation();
    if (!confirm("Deseja apagar este registro permanentemente?")) return;

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
        {activeTab === 'visual' ? <ProgressPhotos /> : activeTab === 'bio' ? <BioReport /> : activeTab === 'charts' ? (
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
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 size={14} /> {isDeleting === item.id ? 'Excluindo...' : 'Excluir'}
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
    </div>
  );
};

export default HistoryView;
