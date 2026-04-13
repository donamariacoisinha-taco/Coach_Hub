
import React, { useEffect, useState, useMemo } from 'react';
import { WorkoutHistory } from '../types';
import { supabase } from '../lib/supabase';
import ProgressPhotos from './ProgressPhotos';
import BioReport from './BioReport';
import ShareCard from './ShareCard';

type TabType = 'sessions' | 'charts' | 'visual' | 'bio' | 'monthly';

const HistoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [shareData, setShareData] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchProgression();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // CORREÇÃO ITEM (2): Filtro "not.is.null" em completed_at garante que treinos descartados ou não salvos sejam omitidos
      const { data } = await supabase
        .from('workout_history')
        .select('*')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });
      
      if (data) setHistory(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProgression = async () => {
    try {
      const { data } = await supabase.from('view_strength_progression').select('*').order('workout_date', { ascending: true });
      if (data) {
        setProgressionData(data);
        if (data.length > 0 && !selectedExerciseId) setSelectedExerciseId(data[0].exercise_id);
      }
    } catch (err) { console.error(err); }
  };

  const fetchWorkoutDetails = async (historyId: string) => {
    setLoadingDetails(true);
    setSelectedWorkout(historyId);
    try {
      const { data } = await supabase.from('workout_sets_log').select(`*, exercises (name, muscle_group)`).eq('history_id', historyId).order('created_at', { ascending: true });
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
      const { data } = await supabase.from('workout_sets_log').select('*').eq('history_id', item.id);
      const totalTonnage = data?.reduce((acc, curr) => acc + (curr.weight_achieved * curr.reps_achieved), 0) || 0;
      setShareData({
        category_name: item.category_name,
        completed_at: item.completed_at,
        duration_minutes: item.duration_minutes,
        exercises_count: item.exercises_count,
        totalTonnage: totalTonnage
      });
    } catch (err) { console.error(err); }
    finally { setLoadingDetails(false); }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, historyId: string) => {
    e.stopPropagation();
    if (!confirm("⚠️ ATENÇÃO: Deseja apagar este treino permanentemente? Isso removerá todos os recordes e volumes associados a esta sessão.")) return;

    setIsDeleting(historyId);
    try {
      const { error } = await supabase
        .from('workout_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;

      setHistory(prev => prev.filter(h => h.id !== historyId));
      if (selectedWorkout === historyId) setSelectedWorkout(null);
      if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
      
      fetchProgression();
    } catch (err) {
      alert("Erro ao excluir treino. Tente novamente.");
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const exerciseList = useMemo(() => {
    const unique = new Map();
    progressionData.forEach(d => unique.set(d.exercise_id, d.exercise_name));
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [progressionData]);

  const chartPoints = useMemo(() => {
    if (!selectedExerciseId) return [];
    const filtered = progressionData.filter(d => d.exercise_id === selectedExerciseId);
    if (filtered.length < 2) return filtered.map((d, i) => ({ x: i * 50 + 25, y: 50, val: d.daily_max_1rm, date: d.workout_date }));

    const maxVal = Math.max(...filtered.map(d => d.daily_max_1rm));
    const minVal = Math.min(...filtered.map(d => d.daily_max_1rm));
    const range = (maxVal - minVal) || (maxVal * 0.1) || 10;

    return filtered.map((d, i) => ({
      x: (i / (filtered.length - 1)) * 100,
      y: 100 - ((d.daily_max_1rm - minVal) / range) * 70 - 15,
      val: Math.round(d.daily_max_1rm),
      date: d.workout_date
    }));
  }, [progressionData, selectedExerciseId]);

  const bezierPath = useMemo(() => {
    if (chartPoints.length < 2) return "";
    return chartPoints.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = a[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      return `${acc} C ${cp1x},${prev.y} ${cp1x},${p.y} ${p.x},${p.y}`;
    }, "");
  }, [chartPoints]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 px-4 pt-6 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Evolução <span className="text-blue-600">_</span></h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronização de Bio-Dados</p>
        </div>
        <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('sessions')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'sessions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Sessões</button>
          <button onClick={() => setActiveTab('bio')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'bio' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Bio</button>
          <button onClick={() => setActiveTab('charts')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'charts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Força</button>
          <button onClick={() => setActiveTab('visual')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'visual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Visual</button>
        </div>
      </header>

      {activeTab === 'visual' ? <ProgressPhotos /> : activeTab === 'bio' ? <BioReport /> : activeTab === 'charts' ? (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2 py-2">
              {exerciseList.map(ex => (
                <button 
                  key={ex.id} 
                  onClick={() => { setSelectedExerciseId(ex.id); if ('vibrate' in navigator) navigator.vibrate(5); }}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${selectedExerciseId === ex.id ? 'bg-white border-white text-slate-900 shadow-xl' : 'bg-slate-900 border-white/5 text-slate-500'}`}
                >
                  {ex.name}
                </button>
              ))}
           </div>

           {chartPoints.length < 2 ? (
             <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20">
                <i className="fas fa-chart-line text-slate-800 text-5xl mb-6"></i>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aguardando mais dados para projetar curva de força</p>
             </div>
           ) : (
             <div className="bg-slate-900/60 p-8 lg:p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-12 relative z-10">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimativa 1RM</p>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{exerciseList.find(e => e.id === selectedExerciseId)?.name}</h4>
                   </div>
                   <div className="text-right">
                      <p className="text-4xl font-black text-blue-500 tabular-nums">{chartPoints[chartPoints.length - 1].val}<span className="text-sm font-bold opacity-30 ml-1">KG</span></p>
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Último Recorde</p>
                   </div>
                </div>

                <div className="relative h-64 w-full">
                   <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                         <linearGradient id="strengthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                         </linearGradient>
                      </defs>
                      <path 
                        d={`${bezierPath} L ${chartPoints[chartPoints.length - 1].x} 100 L ${chartPoints[0].x} 100 Z`}
                        fill="url(#strengthGradient)"
                        className="animate-in fade-in duration-1000"
                      />
                      <path 
                        d={bezierPath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-in slide-in-from-left-4 duration-1000"
                      />
                      {chartPoints.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" className="hover:r-4 transition-all" />
                      ))}
                   </svg>
                </div>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-4">
           {history.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                 <i className="fas fa-history text-5xl mb-4"></i>
                 <p className="text-xs font-black uppercase tracking-widest">Nenhuma sessão registrada</p>
              </div>
           ) : (
             history.map(item => (
               <div 
                 key={item.id} 
                 onClick={() => selectedWorkout === item.id ? setSelectedWorkout(null) : fetchWorkoutDetails(item.id)}
                 className={`bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 transition-all ${selectedWorkout === item.id ? 'border-blue-500/30 ring-1 ring-blue-500/10' : ''}`}
               >
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-white/5">
                           {isDeleting === item.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-calendar-alt text-lg"></i>}
                        </div>
                        <div>
                           <h4 className="font-black text-white uppercase text-sm">{item.category_name}</h4>
                           <p className="text-[9px] font-black text-slate-500 uppercase mt-1">{new Date(item.completed_at).toLocaleDateString()} • {item.duration_minutes || '--'} min</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleShareHistory(e, item)}
                          className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                        >
                           <i className="fas fa-share-alt text-[10px]"></i>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          disabled={!!isDeleting}
                          className="w-10 h-10 bg-red-600/5 rounded-xl flex items-center justify-center text-red-500/40 hover:bg-red-600/20 hover:text-red-500 transition-all active:scale-90"
                        >
                           <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                        <i className={`fas fa-chevron-${selectedWorkout === item.id ? 'up' : 'down'} text-[10px] text-slate-600 ml-1`}></i>
                     </div>
                  </div>

                  {selectedWorkout === item.id && (
                    <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in fade-in duration-500">
                       {loadingDetails ? <div className="text-center py-4"><i className="fas fa-spinner animate-spin text-blue-500"></i></div> : (
                          workoutLogs.map(([exName, sets]: [string, any[]]) => (
                            <div key={exName} className="space-y-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest">{exName}</h5>
                               </div>
                               <div className="grid grid-cols-4 gap-2">
                                  {sets.map((set, idx) => (
                                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center">
                                       <p className="text-[9px] font-black text-white uppercase">{set.weight_achieved}kg</p>
                                       <p className="text-[8px] font-bold text-blue-500 uppercase">{set.reps_achieved} reps</p>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          ))
                       )}
                    </div>
                  )}
               </div>
             ))
           )}
        </div>
      )}

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
