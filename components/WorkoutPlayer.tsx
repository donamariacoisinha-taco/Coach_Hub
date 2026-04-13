
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

  if (loading) return <div className="h-screen bg-[#F7F8FA] flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (exercises.length === 0) return (
    <div className="h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 mb-6 shadow-sm">
        <i className="fas fa-dumbbell text-2xl"></i>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Treino Vazio</h2>
      <p className="text-slate-500 text-sm mb-8">Esta ficha não possui exercícios configurados.</p>
      <button onClick={() => navigate('dashboard')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20">Voltar ao Início</button>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#F7F8FA] flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-500">
       {/* Barra de Progresso Minimalista */}
       <div className="h-1 w-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${((currentIndex + (currentSet/(currentEx?.sets_json?.length || 1))) / exercises.length) * 100}%` }}></div>
       </div>

       {/* Vitória / Conclusão */}
       {showVictory && (
         <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl mb-12 shadow-sm animate-bounce">
              <i className="fas fa-trophy"></i>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">Treino Concluído</h2>
            <p className="text-slate-500 font-medium mb-16 leading-relaxed">Sua performance foi sincronizada com sucesso. Ótimo trabalho hoje.</p>
            <button 
              onClick={() => navigate('dashboard')} 
              className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              Finalizar Sessão
            </button>
         </div>
       )}

       {/* Modal de Saída */}
       {showExitModal && (
         <div className="fixed inset-0 z-[1100] bg-slate-900/20 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-8">
               <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Encerrar?</h3>
                  <p className="text-slate-500 text-xs font-medium mt-4 leading-relaxed">Deseja finalizar esta sessão ou descartar o progresso atual?</p>
               </div>
               <div className="space-y-4">
                  <button onClick={async () => { await finishWorkout(true); navigate('dashboard'); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Salvar e Sair</button>
                  <button onClick={async () => { await finishWorkout(false); navigate('dashboard'); }} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Descartar</button>
                  <button onClick={() => setShowExitModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest">Continuar Treinando</button>
               </div>
            </div>
         </div>
       )}

       {/* Header Minimalista */}
       <header className="px-6 pt-12 pb-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowExitModal(true)} 
               className="w-10 h-10 flex items-center justify-center text-slate-300 active:scale-90 transition-all"
             >
               <i className="fas fa-times text-lg"></i>
             </button>
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">EX {currentIndex + 1} / {exercises.length}</p>
               <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase truncate max-w-[180px]">{currentEx?.exercise_name || '...'}</h2>
             </div>
          </div>
          
          <button 
            onClick={() => setShowExerciseList(true)}
            className="w-10 h-10 flex items-center justify-center text-blue-600 active:scale-90 transition-all"
          >
            <i className="fas fa-list-ul text-lg"></i>
          </button>
       </header>

       {/* Área Principal */}
       <div className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col items-center">
          {isResting ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500 w-full max-w-sm">
                <div className="relative">
                   <svg className="w-64 h-64 -rotate-90">
                      <circle cx="128" cy="128" r="110" className="stroke-slate-100 fill-none" strokeWidth="4" />
                      <circle cx="128" cy="128" r="110" className="stroke-blue-600 fill-none transition-all duration-1000 ease-linear" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: '691', strokeDashoffset: 691 - (691 * (timeLeft / (currentEx?.rest_time || 60))) }} />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Descanso</p>
                      <p className="text-7xl font-black tabular-nums text-slate-900 tracking-tighter">{timeLeft}s</p>
                      
                      <div className="flex gap-4 mt-6">
                        <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 15))} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-slate-100 shadow-sm active:scale-90">-15</button>
                        <button onClick={() => setTimeLeft(prev => prev + 15)} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-slate-100 shadow-sm active:scale-90">+15</button>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={handleNextStep} 
                  className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                >
                  Pular Descanso
                </button>
             </div>
          ) : (
             <div className="w-full max-w-sm space-y-10 py-8 animate-in slide-in-from-bottom-4 duration-500 pb-32">
                {/* Imagem do Exercício - Estilo Minimalista */}
                <div className="aspect-square bg-white rounded-[3rem] overflow-hidden flex items-center justify-center p-12 relative">
                   <img 
                    src={currentEx?.exercise_image || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&h=300&auto=format&fit=crop'} 
                    className="w-full h-full object-contain mix-blend-multiply" 
                   />
                   <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Série {currentSet}</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">de {currentEx?.sets_json?.length || 3}</p>
                   </div>
                </div>

                {/* Inputs de Carga e Reps - Minimalistas */}
                <div className="grid grid-cols-2 gap-12">
                  <div className="text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Carga (kg)</p>
                     <div className="flex items-center justify-center gap-6">
                        <button onClick={() => setLiveWeight(w => Math.max(0, w - 1))} className="text-slate-300 active:text-blue-600 transition-colors"><i className="fas fa-minus"></i></button>
                        <input 
                          type="number" 
                          inputMode="decimal" 
                          value={liveWeight} 
                          onChange={e => setLiveWeight(parseFloat(e.target.value) || 0)} 
                          className="w-20 bg-transparent text-5xl font-black text-slate-900 text-center outline-none tracking-tighter" 
                        />
                        <button onClick={() => setLiveWeight(w => w + 1)} className="text-slate-300 active:text-blue-600 transition-colors"><i className="fas fa-plus"></i></button>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Reps</p>
                     <div className="flex items-center justify-center gap-6">
                        <button onClick={() => setLiveReps(r => Math.max(0, r - 1))} className="text-slate-300 active:text-blue-600 transition-colors"><i className="fas fa-minus"></i></button>
                        <input 
                          type="number" 
                          inputMode="numeric" 
                          value={liveReps} 
                          onChange={e => setLiveReps(parseInt(e.target.value) || 0)} 
                          className="w-20 bg-transparent text-5xl font-black text-slate-900 text-center outline-none tracking-tighter" 
                        />
                        <button onClick={() => setLiveReps(r => r + 1)} className="text-slate-300 active:text-blue-600 transition-colors"><i className="fas fa-plus"></i></button>
                     </div>
                  </div>
                </div>

                {/* RPE - Minimalista */}
                <div className="pt-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Esforço (RPE)</p>
                  <div className="flex justify-between items-center gap-2">
                    {[6, 7, 8, 9, 10].map((val) => (
                      <button 
                        key={val} 
                        onClick={() => setLiveRpe(val)} 
                        className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all ${liveRpe === val ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white border border-slate-100 text-slate-400'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão de Conclusão - Thumb Zone */}
                <div className="fixed bottom-32 left-0 right-0 px-6 flex flex-col gap-4 pointer-events-none">
                  <button 
                    onClick={handleSetComplete} 
                    disabled={saving} 
                    className="pointer-events-auto w-full py-6 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                  >
                    {saving ? <i className="fas fa-spinner animate-spin"></i> : `Concluir Série ${currentSet}`}
                  </button>
                  <button 
                    onClick={handleAddSetDuringWorkout}
                    className="pointer-events-auto w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 active:text-blue-600 transition-colors"
                  >
                    + Adicionar Série
                  </button>
                </div>
             </div>
          )}
       </div>

       {/* Footer Minimalista com Dados da Sessão */}
       <footer className="bg-white px-8 py-6 flex justify-between items-center shrink-0 pb-safe border-t border-slate-50">
          <div className="text-center">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Tempo</p>
             <p className="text-xs font-black text-slate-900 tabular-nums">{formatDuration(now - startTime)}</p>
          </div>
          <div className="text-center">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Volume</p>
             <p className="text-xs font-black text-slate-900 tabular-nums">{(sessionTonnage >= 1000 ? (sessionTonnage/1000).toFixed(1) + 'T' : sessionTonnage + 'kg')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              disabled={currentIndex === 0} 
              onClick={() => { setCurrentIndex(prev => prev - 1); setCurrentSet(1); }}
              className="w-10 h-10 flex items-center justify-center text-slate-300 disabled:opacity-20 active:text-blue-600"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              disabled={currentIndex === exercises.length - 1} 
              onClick={() => { setCurrentIndex(prev => prev + 1); setCurrentSet(1); }}
              className="w-10 h-10 flex items-center justify-center text-slate-300 disabled:opacity-20 active:text-blue-600"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
       </footer>

       {/* Cronograma - iOS Style */}
       {showExerciseList && (
        <div className="fixed inset-0 z-[1200] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cronograma</p>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sua Jornada</h3>
            </div>
            <button 
              onClick={() => setShowExerciseList(false)} 
              className="w-10 h-10 flex items-center justify-center text-slate-900 active:scale-90 transition-all"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
            <div className="space-y-1">
              {exercises.map((ex, idx) => (
                <div 
                  key={ex.id} 
                  onClick={() => { setCurrentIndex(idx); setCurrentSet(1); setShowExerciseList(false); }}
                  className={`flex items-center justify-between py-5 active:bg-slate-50 transition-colors cursor-pointer ${idx !== exercises.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${idx === currentIndex ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-300'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-black uppercase tracking-tight truncate pr-4 ${idx === currentIndex ? 'text-blue-600' : 'text-slate-900'}`}>{ex.exercise_name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{ex.muscle_group} • {ex.sets_json?.length || 3} Séries</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('editor', { id: workoutId })}
              className="w-full py-8 mt-8 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-slate-300 active:text-blue-600 active:border-blue-200 transition-all"
            >
              <i className="fas fa-plus text-xl"></i>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Exercício</span>
            </button>
          </div>
          
          <div className="px-6 pb-12">
            <button 
              onClick={() => setShowExerciseList(false)}
              className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              Voltar ao Treino
            </button>
          </div>
        </div>
       )}
    </div>
  );
};

export default WorkoutPlayer;
