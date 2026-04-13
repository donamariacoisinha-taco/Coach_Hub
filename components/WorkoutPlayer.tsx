
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkoutExercise, SetType, Exercise, MuscleGroup, SetConfig } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';

interface LoggedSet {
  id?: string;
  set_number: number;
  exercise_id: string;
  weight_achieved: number;
  reps_achieved: number;
  rpe: number;
  set_type: SetType;
}

const WorkoutPlayer: React.FC<{ workoutId: string }> = ({ workoutId }) => {
  const { navigate } = useNavigation();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [historyId, setHistoryId] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [totalRestMs, setTotalRestMs] = useState<number>(0);
  const [restStartTs, setRestStartTs] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const [sessionLogs, setSessionLogs] = useState<LoggedSet[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [liveWeight, setLiveWeight] = useState(0);
  const [liveReps, setLiveReps] = useState(0);
  const [liveRpe, setLiveRpe] = useState(8);
  
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  
  const timerRef = useRef<any>(null);
  const globalTickerRef = useRef<any>(null);
  const audioUnlockedRef = useRef(false);
  
  const currentEx = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;
    return exercises[currentIndex] || null;
  }, [exercises, currentIndex]);

  const sessionTonnage = useMemo(() => {
    return sessionLogs.reduce((acc, log) => acc + (log.weight_achieved * log.reps_achieved), 0);
  }, [sessionLogs]);

  const totalExecutionMs = useMemo(() => {
    const elapsed = now - startTime;
    return elapsed - totalRestMs - (isResting && restStartTs ? (now - restStartTs) : 0);
  }, [now, startTime, totalRestMs, isResting, restStartTs]);

  useEffect(() => {
    if (isResting && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isResting && timeLeft === 0) {
      handleNextStep();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isResting, timeLeft]);

  // CORREÇÃO ITEM (1): Preservar valores ao navegar entre séries
  useEffect(() => {
    if (currentEx) {
      // 1. Verificar se já existe log para esta série no estado temporário (sessionLogs)
      const existingLog = sessionLogs.find(l => 
        l.exercise_id === currentEx.exercise_id && l.set_number === currentSet
      );

      if (existingLog) {
        setLiveWeight(existingLog.weight_achieved);
        setLiveReps(existingLog.reps_achieved);
        setLiveRpe(existingLog.rpe);
      } else if (currentEx.sets_json && currentEx.sets_json[currentSet - 1]) {
        // 2. Se não houver log, usa o planejado
        const plan = currentEx.sets_json[currentSet - 1];
        setLiveWeight(plan.weight);
        setLiveReps(parseInt(plan.reps as string) || 0);
        setLiveRpe(8);
      }
    }
  }, [currentIndex, currentSet, currentEx, sessionLogs]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    ['timer-beep', 'workout-victory'].forEach(id => {
      const el = document.getElementById(id) as HTMLAudioElement;
      if (el) el.play().then(() => { el.pause(); el.currentTime = 0; }).catch(() => {});
    });
    audioUnlockedRef.current = true;
  };

  useEffect(() => {
    init();
    globalTickerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current);
      if (globalTickerRef.current) clearInterval(globalTickerRef.current);
    };
  }, [workoutId]);

  useEffect(() => {
    if (!loading && historyId) {
      const timer = setTimeout(() => { savePartialState(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentSet, liveWeight, liveReps, liveRpe, exercises]);

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [catRes, exRes, partialRes] = await Promise.all([
        supabase.from('workout_categories').select('*').eq('id', workoutId).single(),
        supabase.from('workout_exercises').select(`*, exercises (*)`).eq('category_id', workoutId).order('sort_order'),
        supabase.from('partial_workout_sessions').select('*').eq('user_id', user.id).eq('workout_id', workoutId).maybeSingle()
      ]);
      
      if (exRes.data) {
        let loadedExercises = [];
        if (partialRes.data?.exercises_json) {
          loadedExercises = partialRes.data.exercises_json;
        } else {
          loadedExercises = exRes.data.filter((item: any) => item.exercises).map((item: any) => ({ 
            ...item, 
            exercise_name: item.exercises.name, 
            exercise_image: item.exercises.image_url, 
            muscle_group: item.exercises.muscle_group 
          }));
        }
        setExercises(loadedExercises);

        if (partialRes.data) {
          setHistoryId(partialRes.data.history_id);
          setStartTime(new Date(partialRes.data.start_time).getTime());
          setCurrentIndex(partialRes.data.current_index);
          setCurrentSet(partialRes.data.current_set);
          const { data: logs } = await supabase.from('workout_sets_log').select('*').eq('history_id', partialRes.data.history_id);
          if (logs) setSessionLogs(logs);
        }

        if (!partialRes.data?.history_id) {
          const { data: newHistory } = await supabase.from('workout_history').insert([{ user_id: user.id, category_id: workoutId, category_name: catRes.data?.name || 'Treino' }]).select().single();
          setHistoryId(newHistory?.id);
          setStartTime(Date.now());
          await supabase.from('partial_workout_sessions').upsert({ user_id: user.id, workout_id: workoutId, history_id: newHistory?.id, exercises_json: loadedExercises, updated_at: new Date().toISOString() });
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const savePartialState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !historyId) return;
    await supabase.from('partial_workout_sessions').upsert({ user_id: user.id, workout_id: workoutId, current_index: currentIndex, current_set: currentSet, history_id: historyId, current_weight: liveWeight, current_reps: liveReps, current_rpe: liveRpe, exercises_json: exercises, start_time: new Date(startTime).toISOString(), updated_at: new Date().toISOString() });
  };

  const handleSetComplete = async () => {
    unlockAudio(); 
    if (saving || !currentEx || !historyId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const logData: LoggedSet = { set_number: currentSet, exercise_id: currentEx.exercise_id, weight_achieved: liveWeight, reps_achieved: liveReps, rpe: liveRpe, set_type: SetType.NORMAL };
      await supabase.from('workout_sets_log').upsert([{ ...logData, history_id: historyId, user_id: user?.id }], { onConflict: 'history_id,exercise_id,set_number' });
      setSessionLogs(prev => [...prev.filter(l => !(l.exercise_id === currentEx.exercise_id && l.set_number === currentSet)), logData]);
      const totalSets = currentEx.sets_json?.length || 3;
      if (currentIndex === exercises.length - 1 && currentSet === totalSets) { setShowVictory(true); await finishWorkout(true); return; }
      
      setRestStartTs(Date.now());
      setTimeLeft(currentEx.rest_time || 60);
      setIsResting(true);
      if ('vibrate' in navigator) navigator.vibrate(20);
    } catch (err: any) { alert("Erro ao salvar."); } finally { setSaving(false); }
  };

  // CORREÇÃO ITEM (2): Descartar treino remove o histórico para não aparecer na evolução
  const finishWorkout = async (isSuccess: boolean) => {
    if (!historyId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isSuccess) {
        await supabase.from('workout_history').update({ 
          duration_minutes: Math.round((Date.now() - startTime) / 60000), 
          completed_at: new Date().toISOString(), 
          exercises_count: new Set(sessionLogs.map(l => l.exercise_id)).size 
        }).eq('id', historyId);
      } else {
        // Se descartado, deletamos o registro de histórico iniciado para limpar a evolução
        await supabase.from('workout_history').delete().eq('id', historyId);
      }
      await supabase.from('partial_workout_sessions').delete().eq('user_id', user?.id);
    } catch (err) { console.error(err); }
  };

  const handleNextStep = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (restStartTs) {
      setTotalRestMs(prev => prev + (Date.now() - restStartTs));
      setRestStartTs(null);
    }
    setIsResting(false);
    if (!currentEx) return;
    const totalSets = currentEx.sets_json?.length || 3;
    if (currentSet < totalSets) setCurrentSet(prev => prev + 1);
    else if (currentIndex < exercises.length - 1) { setCurrentIndex(prev => prev + 1); setCurrentSet(1); }
    else { navigate('dashboard'); }
  };

  const handleAddSetDuringWorkout = () => {
    if (!currentEx) return;
    const newExs = [...exercises];
    const newSet: SetConfig = { reps: '12', weight: liveWeight || 0, rest_time: 60, type: SetType.NORMAL };
    if (!newExs[currentIndex].sets_json) newExs[currentIndex].sets_json = [];
    newExs[currentIndex].sets_json!.push(newSet);
    setExercises(newExs);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (exercises.length === 0) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
      <i className="fas fa-exclamation-circle text-4xl text-slate-700 mb-4"></i>
      <h2 className="text-xl font-black uppercase mb-2">Treino Vazio</h2>
      <p className="text-slate-500 text-sm mb-8">Esta ficha não possui exercícios configurados.</p>
      <button onClick={() => navigate('dashboard')} className="px-8 py-4 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Voltar ao Início</button>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-slate-950 flex flex-col overflow-hidden text-white safe-top">
       <div className="h-1.5 w-full bg-slate-900 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${((currentIndex + (currentSet/(currentEx?.sets_json?.length || 1))) / exercises.length) * 100}%` }}></div>
       </div>

       {showVictory && (
         <div className="fixed inset-0 z-[1000] bg-blue-600 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
            <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center text-blue-600 text-6xl mb-8 shadow-2xl animate-bounce"><i className="fas fa-trophy"></i></div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Missão Cumprida!</h2>
            <p className="text-blue-100 text-lg font-bold mb-12 uppercase tracking-widest">Sua performance foi sincronizada.</p>
            <button onClick={() => navigate('dashboard')} className="w-full py-6 bg-slate-950 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Sair do Player</button>
         </div>
       )}

       {showExitModal && (
         <div className="fixed inset-0 z-[1100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="w-full max-sm bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl space-y-6">
               <div className="text-center">
                  <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4"><i className="fas fa-sign-out-alt text-2xl"></i></div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Encerrar Treino?</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2">Deseja finalizar esta sessão ou descartar o progresso?</p>
               </div>
               <div className="space-y-3">
                  <button onClick={async () => { await finishWorkout(true); navigate('dashboard'); }} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white uppercase text-[10px] tracking-widest">Finalizar e Salvar</button>
                  <button onClick={async () => { await finishWorkout(false); navigate('dashboard'); }} className="w-full py-5 bg-slate-800 rounded-2xl font-black text-red-500 uppercase text-[10px] tracking-widest">Descartar Treino</button>
                  <button onClick={() => setShowExitModal(false)} className="w-full py-4 text-slate-500 font-black uppercase text-[9px] tracking-[0.2em]">Voltar ao Exercício</button>
               </div>
            </div>
         </div>
       )}

       <header className="px-6 pt-8 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setShowExitModal(true)} className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 active:scale-90 transition-all">
               <i className="fas fa-times"></i>
             </button>
             <div>
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">EX {currentIndex + 1} / {exercises.length}</p>
               <h2 className="text-xl font-black uppercase tracking-tighter leading-none truncate max-w-[150px]">{currentEx?.exercise_name || '...'}</h2>
             </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-white/5">
            <button 
              disabled={currentIndex === 0} 
              onClick={() => { setCurrentIndex(prev => prev - 1); setCurrentSet(1); }}
              className="w-10 h-10 flex items-center justify-center text-slate-500 disabled:opacity-20 active:text-blue-500"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              onClick={() => setShowExerciseList(true)}
              className="w-10 h-10 flex items-center justify-center text-blue-500"
            >
              <i className="fas fa-list-ul"></i>
            </button>
            <button 
              disabled={currentIndex === exercises.length - 1} 
              onClick={() => { setCurrentIndex(prev => prev + 1); setCurrentSet(1); }}
              className="w-10 h-10 flex items-center justify-center text-slate-500 disabled:opacity-20 active:text-blue-500"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
       </header>

       <div className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col items-center relative">
          {isResting ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500 w-full max-w-sm">
                <div className="relative">
                   <svg className="w-64 h-64 -rotate-90">
                      <circle cx="128" cy="128" r="110" className="stroke-slate-900 fill-none" strokeWidth="12" />
                      <circle cx="128" cy="128" r="110" className="stroke-blue-600 fill-none transition-all duration-1000 ease-linear" strokeWidth="12" strokeLinecap="round" style={{ strokeDasharray: '691', strokeDashoffset: 691 - (691 * (timeLeft / (currentEx?.rest_time || 60))) }} />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Descanso</p>
                      <p className="text-7xl font-black tabular-nums tracking-tighter">{timeLeft}s</p>
                      
                      <div className="flex gap-4 mt-4">
                        <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 15))} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border border-white/5">-15</button>
                        <button onClick={() => setTimeLeft(prev => prev + 15)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border border-white/5">+15</button>
                      </div>
                   </div>
                </div>
                <button onClick={handleNextStep} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Pular Descanso</button>
             </div>
          ) : (
             <div className="w-full max-sm space-y-6 py-4 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="relative aspect-video rounded-[2.5rem] bg-white p-6 shadow-2xl group overflow-hidden">
                   <img src={currentEx?.exercise_image || 'https://via.placeholder.com/200'} className="w-full h-full object-contain" />
                   <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white">SÉRIE {currentSet} / {currentEx?.sets_json?.length || 3}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-5 rounded-[2.5rem] border border-white/5 flex flex-col items-center">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Carga (kg)</p>
                     <div className="flex items-center gap-3">
                        <button onClick={() => setLiveWeight(w => Math.max(0, w - 1))} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 text-[10px]">-</button>
                        <input type="number" inputMode="decimal" value={liveWeight} onChange={e => setLiveWeight(parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-3xl font-black text-white text-center outline-none" />
                        <button onClick={() => setLiveWeight(w => w + 1)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 text-[10px]">+</button>
                     </div>
                  </div>
                  <div className="bg-slate-900 p-5 rounded-[2.5rem] border border-white/5 flex flex-col items-center">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Reps</p>
                     <div className="flex items-center gap-3">
                        <button onClick={() => setLiveReps(r => Math.max(0, r - 1))} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 text-[10px]">-</button>
                        <input type="number" inputMode="numeric" value={liveReps} onChange={e => setLiveReps(parseInt(e.target.value) || 0)} className="w-16 bg-transparent text-3xl font-black text-white text-center outline-none" />
                        <button onClick={() => setLiveReps(r => r + 1)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 text-[10px]">+</button>
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button onClick={handleSetComplete} disabled={saving} className="w-full py-8 bg-blue-600 rounded-[2.5rem] font-black text-white uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
                    {saving ? <i className="fas fa-spinner animate-spin"></i> : `CONCLUIR SÉRIE ${currentSet}`}
                  </button>
                  
                  <button 
                    onClick={handleAddSetDuringWorkout}
                    className="w-full py-4 border border-dashed border-slate-700 rounded-2xl text-[9px] font-black uppercase text-slate-500 hover:text-blue-500 transition-colors"
                  >
                    + Adicionar Série Extra
                  </button>
                </div>
                
                <div className="bg-slate-900 p-5 rounded-[2.5rem] border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Esforço Percebido (RPE)</p>
                  <div className="flex justify-between items-center gap-2">
                    {[6, 7, 8, 9, 10].map((val) => (
                      <button key={val} onClick={() => setLiveRpe(val)} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${liveRpe === val ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-white/5 text-slate-600'}`}>{val}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                   <div className="space-y-3">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Saltar para Série</p>
                      <div className="flex flex-wrap justify-center gap-2">
                         {Array.from({ length: currentEx?.sets_json?.length || 0 }).map((_, i) => (
                           <button 
                             key={i} 
                             onClick={() => { setCurrentSet(i + 1); if ('vibrate' in navigator) navigator.vibrate(5); }}
                             className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border ${currentSet === i + 1 ? 'bg-white text-slate-950 border-white' : 'bg-slate-800 text-slate-500 border-white/5'}`}
                           >
                             S{i + 1}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="h-px bg-white/5 w-1/2 mx-auto"></div>

                   <div className="flex items-center justify-between gap-4">
                      <button 
                        disabled={currentIndex === 0}
                        onClick={() => { setCurrentIndex(prev => prev - 1); setCurrentSet(1); if ('vibrate' in navigator) navigator.vibrate(10); }}
                        className="flex-1 py-3 bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5 disabled:opacity-10"
                      >
                        <i className="fas fa-arrow-left mr-2"></i> Anterior
                      </button>
                      <button 
                        disabled={currentIndex === exercises.length - 1}
                        onClick={() => { setCurrentIndex(prev => prev + 1); setCurrentSet(1); if ('vibrate' in navigator) navigator.vibrate(10); }}
                        className="flex-1 py-3 bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5 disabled:opacity-10"
                      >
                        Próximo <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>

       <footer className="bg-slate-950/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 grid grid-cols-4 gap-2 shrink-0 pb-safe">
          <div className="text-center">
             <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Treino</p>
             <p className="text-[10px] font-black text-white tabular-nums">{formatDuration(now - startTime)}</p>
          </div>
          <div className="text-center">
             <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Execução</p>
             <p className="text-[10px] font-black text-blue-400 tabular-nums">{formatDuration(totalExecutionMs)}</p>
          </div>
          <div className="text-center">
             <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Descanso</p>
             <p className="text-[10px] font-black text-orange-400 tabular-nums">{formatDuration(totalRestMs + (isResting && restStartTs ? (now - restStartTs) : 0))}</p>
          </div>
          <div className="text-center border-l border-white/5">
             <p className="text-[6px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Carga Total</p>
             <p className="text-[10px] font-black text-white tabular-nums">{(sessionTonnage >= 1000 ? (sessionTonnage/1000).toFixed(1) + 'T' : sessionTonnage + 'kg')}</p>
          </div>
       </footer>

       {/* CORREÇÃO ITEM (3): Restaurar botões de Substituir e Adicionar no Cronograma */}
       {showExerciseList && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/98 backdrop-blur-xl flex flex-col p-8 animate-in slide-in-from-bottom duration-300">
          <header className="flex justify-between items-center mb-10 pt-10">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Cronograma</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Navegação e Ajuste Técnico</p>
            </div>
            <button onClick={() => setShowExerciseList(false)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5"><i className="fas fa-times"></i></button>
          </header>
          
          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
            {exercises.map((ex, idx) => (
              <div 
                key={ex.id} 
                className={`p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all relative ${idx === currentIndex ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-white/5'}`}
                onClick={() => { setCurrentIndex(idx); setCurrentSet(1); setShowExerciseList(false); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-[10px] shrink-0 border border-white/5">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black uppercase truncate text-white">{ex.exercise_name}</h4>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{ex.muscle_group} • {ex.sets_json?.length || 3} Séries</p>
                </div>
                
                {/* Botão de Substituição: Redireciona para o editor com o ID do treino */}
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('editor', { id: workoutId }); }}
                  className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 active:scale-90"
                >
                  <i className="fas fa-exchange-alt text-xs"></i>
                </button>
              </div>
            ))}

            {/* Botão de Adicionar: Redireciona para o editor para adicionar novos itens */}
            <button 
              onClick={() => navigate('editor', { id: workoutId })}
              className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-500 transition-all mt-4"
            >
              <i className="fas fa-plus-circle text-xl"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Movimento</span>
            </button>
          </div>
          
          <button 
            onClick={() => setShowExerciseList(false)}
            className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase text-xs tracking-widest mb-10 active:scale-95 transition-all shadow-2xl"
          >
            Voltar ao Treino
          </button>
        </div>
       )}
    </div>
  );
};

export default WorkoutPlayer;
