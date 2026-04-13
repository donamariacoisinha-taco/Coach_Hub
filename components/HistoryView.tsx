
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando Histórico...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance</p>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Evolução</h2>
        
        {/* Tab Switcher Minimalista */}
        <div className="flex gap-8 mt-10 overflow-x-auto no-scrollbar border-b border-slate-100">
          {[
            { id: 'sessions', label: 'Sessões' },
            { id: 'bio', label: 'Bio' },
            { id: 'charts', label: 'Força' },
            { id: 'visual', label: 'Visual' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6">
        {activeTab === 'visual' ? <ProgressPhotos /> : activeTab === 'bio' ? <BioReport /> : activeTab === 'charts' ? (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
             <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                {exerciseList.map(ex => (
                  <button 
                    key={ex.id} 
                    onClick={() => { setSelectedExerciseId(ex.id); if ('vibrate' in navigator) navigator.vibrate(5); }}
                    className={`px-8 py-5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedExerciseId === ex.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {ex.name}
                  </button>
                ))}
             </div>

             {chartPoints.length < 2 ? (
               <div className="py-24 text-center">
                  <i className="fas fa-chart-line text-slate-100 text-4xl mb-6"></i>
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Aguardando dados</p>
               </div>
             ) : (
               <div className="space-y-10">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estimativa 1RM</p>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{exerciseList.find(e => e.id === selectedExerciseId)?.name}</h4>
                     </div>
                     <div className="text-right">
                        <p className="text-4xl font-black text-blue-600 tabular-nums tracking-tighter">{chartPoints[chartPoints.length - 1].val}<span className="text-xs font-black opacity-30 ml-1">KG</span></p>
                     </div>
                  </div>

                  <div className="relative h-64 w-full">
                     <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                           <linearGradient id="strengthGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
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
                          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="white" stroke="#3b82f6" strokeWidth="2" />
                        ))}
                     </svg>
                  </div>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-1">
             {history.length === 0 ? (
                <div className="py-20 text-center">
                   <i className="fas fa-history text-slate-100 text-4xl mb-4"></i>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Sem registros</p>
                </div>
             ) : (
               history.map((item, idx) => (
                 <div 
                   key={item.id} 
                   className={`${idx !== history.length - 1 ? 'border-b border-slate-100' : ''}`}
                 >
                    <div 
                      onClick={() => selectedWorkout === item.id ? setSelectedWorkout(null) : fetchWorkoutDetails(item.id)}
                      className="flex justify-between items-center py-8 active:bg-slate-50 transition-colors cursor-pointer"
                    >
                       <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{item.category_name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                            {new Date(item.completed_at).toLocaleDateString()} • {item.duration_minutes || '--'} min
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => handleShareHistory(e, item)}
                            className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"
                          >
                             <i className="fas fa-share-alt"></i>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteHistory(e, item.id)}
                            disabled={!!isDeleting}
                            className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-red-500 transition-colors"
                          >
                             {isDeleting === item.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash-alt"></i>}
                          </button>
                          <i className={`fas fa-chevron-${selectedWorkout === item.id ? 'up' : 'down'} text-[10px] text-slate-200 ml-2`}></i>
                       </div>
                    </div>

                    {selectedWorkout === item.id && (
                      <div className="pb-10 space-y-10 animate-in fade-in duration-500">
                         {loadingDetails ? (
                           <div className="text-center py-4">
                             <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                           </div>
                         ) : (
                            workoutLogs.map(([exName, sets]: [string, any[]]) => (
                              <div key={exName} className="space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{exName}</h5>
                                 <div className="grid grid-cols-4 gap-6">
                                    {sets.map((set, idx) => (
                                      <div key={idx} className="space-y-1">
                                         <p className="text-lg font-black text-slate-900 tracking-tighter">{set.weight_achieved}<span className="text-[10px] ml-0.5">kg</span></p>
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
               ))
             )}
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
