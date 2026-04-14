
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigation } from "../App";
import { WorkoutExercise, SetType } from "../types";

export default function WorkoutPlayer({ workoutId }: { workoutId: string }) {
  const { navigate, goBack } = useNavigation();
  
  // State for workout data
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for current set execution
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(8);
  
  // Session tracking
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [lastPerformance, setLastPerformance] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  const currentEx = useMemo(() => exercises[currentIndex] || null, [exercises, currentIndex]);

  // Timer for duration
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Timer for rest
  useEffect(() => {
    if (!isResting) return;

    if (timeLeft <= 0) {
      handleNextStep();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isResting, timeLeft]);

  // Initial data fetch
  useEffect(() => {
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
          const loadedExercises = exRes.data.filter((item: any) => item.exercises).map((item: any) => ({
            ...item,
            exercise_name: item.exercises.name,
            muscle_group: item.exercises.muscle_group,
            image_url: item.exercises.image_url
          }));
          setExercises(loadedExercises);

          if (partialRes.data) {
            setHistoryId(partialRes.data.history_id);
            setStartTime(new Date(partialRes.data.start_time || Date.now()).getTime());
            setCurrentIndex(partialRes.data.current_index || 0);
            setCurrentSet(partialRes.data.current_set || 1);
          } else {
            const { data: newHistory } = await supabase.from('workout_history').insert([{ 
              user_id: user.id, 
              category_id: workoutId, 
              category_name: catRes.data?.name || 'Treino' 
            }]).select().single();
            
            setHistoryId(newHistory?.id);
            setStartTime(Date.now());
            
            await supabase.from('partial_workout_sessions').upsert({ 
              user_id: user.id, 
              workout_id: workoutId, 
              history_id: newHistory?.id, 
              exercises_json: loadedExercises,
              start_time: new Date().toISOString(),
              updated_at: new Date().toISOString() 
            });
          }
        }
      } catch (err) {
        console.error("Error initializing workout:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [workoutId]);

  // Update weight/reps when exercise or set changes
  useEffect(() => {
    if (currentEx) {
      const plan = currentEx.sets_json?.[currentSet - 1];
      if (plan) {
        setWeight(plan.weight);
        setReps(parseInt(plan.reps as string) || 0);
      }
      fetchLastPerformance(currentEx.exercise_id);
    }
  }, [currentIndex, currentSet, currentEx]);

  const fetchLastPerformance = async (exerciseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('workout_sets_log')
        .select('weight_achieved, reps_achieved')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLastPerformance(`último: ${data.weight_achieved}kg × ${data.reps_achieved}`);
      } else {
        setLastPerformance(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCompleteSet = async () => {
    if (saving || !currentEx || !historyId) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('workout_sets_log').upsert([{ 
        history_id: historyId,
        user_id: user?.id,
        exercise_id: currentEx.exercise_id,
        set_number: currentSet,
        weight_achieved: weight,
        reps_achieved: reps,
        rpe: 8,
        set_type: SetType.NORMAL
      }], { onConflict: 'history_id,exercise_id,set_number' });

      // Update partial session
      await supabase.from('partial_workout_sessions').update({
        current_index: currentIndex,
        current_set: currentSet,
        updated_at: new Date().toISOString()
      }).eq('history_id', historyId);

      const restTime = currentEx.rest_time || 90;
      setTimeLeft(restTime);
      setIsResting(true);
      if ('vibrate' in navigator) navigator.vibrate(20);
    } catch (err) {
      console.error("Error saving set:", err);
      alert("Erro ao salvar série.");
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    setIsResting(false);
    if (!currentEx) return;
    
    const totalSets = currentEx.sets_json?.length || 3;
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    } else if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSet(1);
    } else {
      finishWorkout(true);
    }
  };

  const finishWorkout = async (isSuccess: boolean) => {
    if (!historyId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isSuccess) {
        await supabase.from('workout_history').update({ 
          duration_minutes: Math.round((Date.now() - startTime) / 60000), 
          completed_at: new Date().toISOString(), 
          exercises_count: exercises.length 
        }).eq('id', historyId);
      } else {
        await supabase.from('workout_history').delete().eq('id', historyId);
      }
      await supabase.from('partial_workout_sessions').delete().eq('user_id', user?.id);
      navigate('dashboard');
    } catch (err) {
      console.error("Error finishing workout:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <div className="max-w-md mx-auto w-full px-5 pt-6 pb-24 flex-1 flex flex-col">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Exercise Image */}
            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
              {currentEx?.image_url && (
                <img src={currentEx.image_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">{currentEx?.exercise_name || 'Exercício'}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                {currentEx?.muscle_group || 'Geral'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold tabular-nums text-gray-400">
              {formatTime(workoutDuration)}
            </span>

            <button 
              onClick={() => setShowExitModal(true)}
              className="p-2 text-gray-400 active:scale-95 transition-transform"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* MAIN DISPLAY */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {!isResting ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="text-7xl font-black tracking-tighter tabular-nums text-gray-900">
                {weight}<span className="text-2xl ml-1 text-gray-300">kg</span> <span className="text-4xl text-gray-200 mx-1">×</span> {reps}
              </div>

              {/* CONTEXTO */}
              <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 space-y-2">
                {lastPerformance && <p>{lastPerformance}</p>}
                <p className="text-blue-500">Próxima: {weight + 2.5}kg × {reps - 2 > 0 ? reps - 2 : reps}</p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="text-8xl font-black tracking-tighter tabular-nums text-gray-900">
                {formatTime(timeLeft)}
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-4">Descanso</p>

              {/* +15 / -15 */}
              <div className="flex items-center gap-6 mt-10">
                <button
                  onClick={() => setTimeLeft((t) => Math.max(0, t - 15))}
                  className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 active:scale-90 active:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <Minus size={20} />
                </button>

                <button
                  onClick={() => setTimeLeft((t) => t + 15)}
                  className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 active:scale-90 active:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLES */}
        {!isResting && (
          <div className="flex items-center justify-between mb-10 animate-in slide-in-from-bottom-4 duration-500">
            {/* navegação sets */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentSet > 1) setCurrentSet(s => s - 1);
                  else if (currentIndex > 0) {
                    setCurrentIndex(i => i - 1);
                    setCurrentSet(exercises[currentIndex - 1].sets_json?.length || 3);
                  }
                }}
                className="p-2 text-gray-300 active:text-gray-900 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                Série {currentSet} de {currentEx?.sets_json?.length || 3}
              </span>

              <button
                onClick={() => {
                  const totalSets = currentEx?.sets_json?.length || 3;
                  if (currentSet < totalSets) setCurrentSet(s => s + 1);
                  else if (currentIndex < exercises.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setCurrentSet(1);
                  }
                }}
                className="p-2 text-gray-300 active:text-gray-900 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* ajustes */}
            <div className="flex items-center gap-6">
              {/* peso */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeight((w) => Math.max(0, w - 2.5))}
                  className="p-2 text-gray-300 active:text-gray-900 transition-colors"
                >
                  <Minus size={18} />
                </button>

                <span className="text-sm font-black tabular-nums min-w-[3rem] text-center">{weight}</span>

                <button
                  onClick={() => setWeight((w) => w + 2.5)}
                  className="p-2 text-gray-300 active:text-gray-900 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* reps */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReps((r) => Math.max(0, r - 1))}
                  className="p-2 text-gray-300 active:text-gray-900 transition-colors"
                >
                  <Minus size={18} />
                </button>

                <span className="text-sm font-black tabular-nums min-w-[2rem] text-center">{reps}</span>

                <button
                  onClick={() => setReps((r) => r + 1)}
                  className="p-2 text-gray-300 active:text-gray-900 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={isResting ? handleNextStep : handleCompleteSet}
          disabled={saving}
          className={`h-20 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${
            isResting 
              ? "bg-gray-100 text-gray-900" 
              : "bg-black text-white shadow-black/20"
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : isResting ? (
            "Pular descanso"
          ) : (
            "Concluir série"
          )}
        </button>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[1100] bg-black/5 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-xs bg-white rounded-[3rem] p-10 shadow-2xl space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Encerrar?</h3>
              <p className="text-gray-500 text-xs font-medium mt-4 leading-relaxed">Deseja salvar esta sessão ou descartar o progresso?</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => finishWorkout(true)} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Salvar e Sair</button>
              <button onClick={() => finishWorkout(false)} className="w-full py-5 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Descartar</button>
              <button onClick={() => setShowExitModal(false)} className="w-full py-3 text-gray-400 font-black uppercase text-[9px] tracking-widest">Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
