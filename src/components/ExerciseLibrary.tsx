
import React, { useState, useEffect, useMemo } from 'react';
import { Exercise, MuscleGroup } from '../types';
import { authApi } from '../lib/api/authApi';
import { exerciseApi } from '../lib/api/exerciseApi';
import { workoutApi } from '../lib/api/workoutApi';
import { geminiService } from '../services/geminiService';
import { useNavigation } from '../App';
import { ExerciseProgress } from './ExerciseProgress';
import { ScreenState } from './ui/ScreenState';
import { ExerciseSkeleton } from './ui/Skeleton';
import { useSmartQuery } from '../hooks/useSmartQuery';
import { usePrefetch } from '../hooks/usePrefetch';
import { Search, MoreVertical, Info, History, TrendingUp, X, ChevronRight, Heart, Settings, Sparkles, Dumbbell, Shield, Star, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ekeService } from '../domain/eke/ekeService';
import { EKEExplanation } from './eke/EKEExplanation';
import { Goal, ExperienceLevel } from '../types';

const ExerciseLibrary: React.FC = () => {
  const { navigate } = useNavigation();
  const prefetch = usePrefetch();
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedSide, setSelectedSide] = useState<'all' | 'front' | 'back'>('all');
  const [adminActiveFilter, setAdminActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showEkeExplanation, setShowEkeExplanation] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const libraryQuery = useSmartQuery('exercise_library', async () => {
    const user = await authApi.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const [exercises, muscleGroups, favorites, isAdminUser] = await Promise.all([
      exerciseApi.getExercises(),
      exerciseApi.getMuscleGroups(),
      exerciseApi.getFavorites(user.id),
      exerciseApi.isAdmin(user.id)
    ]);

    return {
      exercises,
      muscleGroups,
      favorites: new Set(favorites),
      isAdmin: isAdminUser
    };
  }, {
    revalidateOnFocus: true,
    refreshInterval: 300000 // 5 minutes
  });

  const { data, status, isFetching, refresh } = libraryQuery;
  const exercises = data?.exercises || [];
  const muscleGroups = data?.muscleGroups || [];

  useEffect(() => {
    if (data) {
      setFavoriteExerciseIds(data.favorites);
      setIsAdmin(data.isAdmin);
    }
  }, [data]);

  const toggleFavorite = async (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    const user = await authApi.getUser();
    if (!user) return;
    const isFav = favoriteExerciseIds.has(exerciseId);
    try {
      await exerciseApi.toggleFavorite(user.id, exerciseId, isFav);
      if (isFav) {
        setFavoriteExerciseIds(prev => { const next = new Set(prev); next.delete(exerciseId); return next; });
      } else {
        setFavoriteExerciseIds(prev => new Set(prev).add(exerciseId));
      }
      if ('vibrate' in navigator) navigator.vibrate(5);
    } catch (err) { console.error(err); }
  };

  const fetchAiTip = async (exName: string) => {
    setLoadingAi(true);
    setAiTip(null);
    try {
      const result = await geminiService.callAI({
        prompt: `Dê uma dica biomecânica avançada (curta) para o exercício: ${exName}.`
      });
      setAiTip(result.text || "Foque na técnica.");
    } catch (err) { 
      console.warn("[AI] Tip error:", err);
      setAiTip("Conexão mente-músculo."); 
    }
    finally { setLoadingAi(false); }
  };

  const handleOpenDetail = (ex: Exercise) => {
    setSelectedExercise(ex);
    fetchAiTip(ex.name);
  };

  const handlePrefetchProgress = (id: string) => {
    prefetch(`exercise_progress_${id}`, async () => {
      return exerciseApi.getExerciseProgress(id);
    });
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const name = ex.name || '';
      const exMuscleGroupId = ex.muscle_group_id;
      const exMuscleGroupName = (ex.muscle_group || '').trim();
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Find the muscle group object for this exercise - try ID first, then name fallback
      const mg = muscleGroups.find(m => m.id === exMuscleGroupId) || 
                 muscleGroups.find(m => m.name.toLowerCase() === exMuscleGroupName.toLowerCase());
      
      // Parent matching logic
      let isParentMatch = selectedMuscle === 'Todos';
      if (!isParentMatch) {
        // Direct match (case insensitive)
        if (exMuscleGroupName.toLowerCase() === selectedMuscle.toLowerCase()) {
          isParentMatch = true;
        } 
        // Hierarchy match: if the exercise's muscle group belongs to the selected parent
        else if (mg) {
          if (mg.name.toLowerCase() === selectedMuscle.toLowerCase()) {
            isParentMatch = true;
          } else if (mg.parent_id) {
            const parent = muscleGroups.find(p => p.id === mg.parent_id);
            if (parent && parent.name.toLowerCase() === selectedMuscle.toLowerCase()) {
              isParentMatch = true;
            }
          }
        }
      }

      const matchesSide = selectedSide === 'all' || (mg && mg.body_side === selectedSide);
      
      let matchesStatus = true;
      if (isAdmin) {
        if (adminActiveFilter === 'active') matchesStatus = ex.is_active;
        else if (adminActiveFilter === 'inactive') matchesStatus = !ex.is_active;
      } else {
        matchesStatus = ex.is_active;
      }

      return matchesSearch && matchesSide && isParentMatch && matchesStatus;
    }).sort((a, b) => favoriteExerciseIds.has(b.id) ? -1 : 1);
  }, [exercises, searchQuery, selectedMuscle, selectedSide, muscleGroups, favoriteExerciseIds, isAdmin, adminActiveFilter]);

  const parentMuscleGroups = useMemo(() => {
    return muscleGroups.filter(mg => !mg.parent_id && (selectedSide === 'all' || !mg.body_side || mg.body_side === selectedSide));
  }, [muscleGroups, selectedSide]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Enciclopédia</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Exercícios</h2>
        </div>
        {isAdmin && (
          <button 
            onClick={() => navigate('admin', { initialTab: 'anatomy' })} 
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 active:scale-90 transition-all bg-white border border-slate-100 rounded-2xl shadow-sm"
          >
            <Settings size={20} />
          </button>
        )}
      </header>

      <div className="px-6 space-y-8">
        <div className="relative">
          <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="BUSCAR EXERCÍCIO..." value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-100 rounded-2xl text-slate-900 font-extrabold text-xs outline-none focus:border-slate-900 transition-all uppercase tracking-widest shadow-sm" 
          />
        </div>

        <div className="space-y-5">
          <div className="bg-slate-200/50 p-1 rounded-2xl flex items-center justify-between w-full border border-slate-200/20 shadow-inner">
            {['all', 'front', 'back'].map(side => (
              <button 
                key={side} 
                onClick={() => { setSelectedSide(side as any); setSelectedMuscle('Todos'); }} 
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-3 rounded-xl transition-all whitespace-nowrap text-center ${selectedSide === side ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {side === 'all' ? 'Tudo' : side === 'front' ? 'Anterior' : 'Posterior'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
            <button 
              onClick={() => setSelectedMuscle('Todos')} 
              className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${selectedMuscle === 'Todos' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800'}`}
            >
              Todos
            </button>
            {parentMuscleGroups.map(mg => (
              <button 
                key={mg.id} 
                onClick={() => setSelectedMuscle(mg.name)} 
                className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${selectedMuscle === mg.name ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800'}`}
              >
                {mg.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <ScreenState
            status={status}
            isFetching={isFetching}
            skeleton={<ExerciseSkeleton />}
            onRetry={refresh}
          >
            {filteredExercises.map((ex, idx) => (
              <div key={ex.id} className="relative">
                <div 
                  onClick={() => handleOpenDetail(ex)}
                  onMouseEnter={() => handlePrefetchProgress(ex.id)}
                  className={`bg-white hover:bg-slate-50/50 active:bg-slate-100/50 transition-all cursor-pointer p-4 rounded-3xl border border-slate-100 mb-3 shadow-[0_4px_16px_rgba(15,23,42,0.015)] flex items-center justify-between ${!ex.is_active ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 shrink-0 shadow-inner">
                      <img 
                        src={ex.image_url || ex.static_frame_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate leading-tight">{ex.name}</h4>
                        {ex.quality_status === 'premium' && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 border border-blue-100/30 rounded text-[6.5px] font-[1000] text-blue-600 uppercase tracking-widest shrink-0">
                            <Shield size={6} fill="currentColor" /> Premium
                          </div>
                        )}
                        {(ex.performance_score || 0) > 85 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 border border-amber-100/30 rounded text-[6.5px] font-[1000] text-amber-600 uppercase tracking-widest shrink-0">
                            <Star size={6} fill="currentColor" /> Top
                          </div>
                        )}
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{ex.muscle_group}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 grow-0 shrink-0">
                    <button 
                      onClick={(e) => toggleFavorite(e, ex.id)} 
                      className={`w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 flex items-center justify-center transition-all active:scale-90 ${favoriteExerciseIds.has(ex.id) ? 'text-amber-500 bg-amber-50/30' : 'text-slate-300'}`}
                    >
                      <Heart size={14} fill={favoriteExerciseIds.has(ex.id) ? "currentColor" : "none"} />
                    </button>
                    <ChevronRight size={14} className="text-slate-300 mr-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </ScreenState>
        </div>
      </div>

      <AnimatePresence>
        {selectedExercise && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col"
          >
            <header className="px-6 pt-12 pb-8 flex justify-between items-center border-b border-slate-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase truncate pr-4">{selectedExercise.name}</h3>
                  <button 
                    onClick={() => setShowEkeExplanation(true)}
                    className="flex items-center gap-2"
                  >
                    {selectedExercise.quality_status === 'premium' && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 rounded text-[7px] font-black text-blue-600 uppercase tracking-widest shrink-0">
                        <Shield size={8} fill="currentColor" /> Premium
                      </div>
                    )}
                    {(selectedExercise.performance_score || 0) > 85 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[7px] font-black text-amber-600 uppercase tracking-widest shrink-0">
                        <Star size={8} fill="currentColor" /> Top
                      </div>
                    )}
                    <Info size={12} className="text-slate-300" />
                  </button>
                </div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{selectedExercise.muscle_group}</p>
              </div>
              <button onClick={() => setSelectedExercise(null)} className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-12 no-scrollbar pb-32">
              <div className="w-full aspect-square bg-[#F7F8FA] rounded-[3rem] overflow-hidden flex items-center justify-center p-12">
                <img 
                  src={selectedExercise.image_url || selectedExercise.static_frame_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=100&h=100&auto=format&fit=crop'} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={14} className="text-blue-600" />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Dica Biomecânica</p>
                  </div>
                  <div className="bg-[#F7F8FA] p-10 rounded-[3rem] italic text-slate-900 text-xl font-black leading-relaxed tracking-tight">
                    {loadingAi ? (
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-400 text-[10px] not-italic font-black uppercase tracking-widest">Sincronizando...</span>
                      </div>
                    ) : `"${aiTip || "Foque na técnica."}"`}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Instruções</p>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    {selectedExercise.instructions || "Protocolo em catalogação."}
                  </p>
                </div>

                <div className="border-t border-slate-50 pt-12">
                  <ExerciseProgress exerciseId={selectedExercise.id} name={selectedExercise.name} />
                </div>
              </div>
            </div>

            <footer className="px-6 py-10 border-t border-slate-50 bg-white pb-safe">
              <button 
                onClick={() => setSelectedExercise(null)}
                className="w-full py-6 bg-slate-900 rounded-3xl font-black text-white uppercase text-xs tracking-[0.3em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
              >Fechar</button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <EKEExplanation 
        exercise={selectedExercise!}
        context={{
          muscleGroup: selectedExercise?.muscle_group || '',
          goal: Goal.HYPERTROPHY, // Default context for library explanation
          level: ExperienceLevel.INTERMEDIATE
        }}
        isOpen={showEkeExplanation && !!selectedExercise}
        onClose={() => setShowEkeExplanation(false)}
      />
    </div>
  );
};

export default ExerciseLibrary;
