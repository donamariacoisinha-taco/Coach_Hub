import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  ChevronDown, 
  Brain, 
  Dumbbell, 
  Layers, 
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise, SystemTemplateWorkout, SystemTemplateExercise } from '../../../types';
import { geminiService } from '../../../services/geminiService';

interface ExerciseBuilderComponentProps {
  workouts: SystemTemplateWorkout[];
  onChangeWorkouts: (updated: SystemTemplateWorkout[]) => void;
  goal?: string;
  difficulty?: string;
  frequency?: number;
}

const TEMPLATE_STRUCTURES: Record<string, { name: string; muscle: string }[]> = {
  'PEITORAL': [
    { name: 'Supino Inclinado', muscle: 'Peito' },
    { name: 'Supino Reto', muscle: 'Peito' },
    { name: 'Crucifixo', muscle: 'Peito' },
    { name: 'Peck Deck', muscle: 'Peito' },
    { name: 'Paralelas', muscle: 'Peito' }
  ],
  'COSTAS': [
    { name: 'Pulldown', muscle: 'Costas' },
    { name: 'Remada Baixa', muscle: 'Costas' },
    { name: 'Remada Curvada', muscle: 'Costas' },
    { name: 'Pullover', muscle: 'Costas' }
  ],
  'OMBROS': [
    { name: 'Desenvolvimento Militar', muscle: 'Ombros' },
    { name: 'Elevação Lateral', muscle: 'Ombros' },
    { name: 'Face Pull', muscle: 'Ombros' },
    { name: 'Elevação Frontal', muscle: 'Ombros' }
  ],
  'BRAÇOS': [
    { name: 'Rosca Direta', muscle: 'Braços' },
    { name: 'Rosca Alternada', muscle: 'Braços' },
    { name: 'Tríceps Pulley', muscle: 'Braços' },
    { name: 'Tríceps Francês', muscle: 'Braços' }
  ],
  'QUADRÍCEPS': [
    { name: 'Agachamento Livre', muscle: 'Pernas' },
    { name: 'Leg Press', muscle: 'Pernas' },
    { name: 'Cadeira Extensora', muscle: 'Pernas' },
    { name: 'Afundo', muscle: 'Pernas' }
  ],
  'POSTERIOR': [
    { name: 'Stiff', muscle: 'Pernas' },
    { name: 'Mesa Flexora', muscle: 'Pernas' },
    { name: 'Flexora Sentada', muscle: 'Pernas' },
    { name: 'Glute Ham Raise', muscle: 'Pernas' }
  ],
  'GLÚTEOS': [
    { name: 'Hip Thrust', muscle: 'Pernas' },
    { name: 'Glute Bridge', muscle: 'Pernas' },
    { name: 'Afundo Búlgaro', muscle: 'Pernas' },
    { name: 'Abdução Máquina', muscle: 'Pernas' }
  ]
};

const MUSCLE_FILTER_CHIPS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 
  'Core', 'Cardio', 'Mobilidade'
];

export const ExerciseBuilderComponent: React.FC<ExerciseBuilderComponentProps> = ({
  workouts,
  onChangeWorkouts,
  goal = 'hypertrophy',
  difficulty = 'intermediate',
  frequency = 4
}) => {
  const { exercises } = useAdminStore();
  
  // Active state
  const [activeWorkoutId, setActiveWorkoutId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  
  // Multi-selection state
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  
  // Favorites & Recents (Persisted in LocalStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('kyron_admin_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('kyron_admin_recents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Smart suggestions
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ exercise_name: string; reason: string }[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [suggestionFocusMuscle, setSuggestionFocusMuscle] = useState<string>('Peito');

  // Set default active workout
  useEffect(() => {
    if (workouts && workouts.length > 0) {
      if (!activeWorkoutId || !workouts.some(w => w.id === activeWorkoutId)) {
        setActiveWorkoutId(workouts[0].id);
      }
    }
  }, [workouts, activeWorkoutId]);

  // Persist Favorites
  const toggleFavorite = (exerciseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    setFavorites(updated);
    localStorage.setItem('kyron_admin_favorites', JSON.stringify(updated));
  };

  // Add to recents helper
  const addToRecents = (exerciseId: string) => {
    const updated = [exerciseId, ...recents.filter(id => id !== exerciseId)].slice(0, 8);
    setRecents(updated);
    localStorage.setItem('kyron_admin_recents', JSON.stringify(updated));
  };

  // Filter & search exercises
  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return exercises.filter(ex => {
      if (!ex.is_active) return false;
      
      const matchesSearch = !query || 
        ex.name?.toLowerCase().includes(query) ||
        ex.muscle_group?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query) ||
        (ex.description && ex.description.toLowerCase().includes(query));

      const matchesMuscle = !selectedMuscle || 
        ex.muscle_group?.toLowerCase() === selectedMuscle.toLowerCase() ||
        (selectedMuscle === 'Quadríceps' && ex.muscle_group?.toLowerCase().includes('perna')) ||
        (selectedMuscle === 'Posterior' && ex.muscle_group?.toLowerCase().includes('perna')) ||
        (selectedMuscle === 'Glúteos' && ex.muscle_group?.toLowerCase().includes('glúteo'));

      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  // Split library exercises into sections
  const favoriteExercisesList = useMemo(() => {
    return filteredExercises.filter(ex => favorites.includes(ex.id));
  }, [filteredExercises, favorites]);

  const recentExercisesList = useMemo(() => {
    // Only show recents that aren't already favorites (to avoid duplication on screen)
    return filteredExercises.filter(ex => recents.includes(ex.id) && !favorites.includes(ex.id));
  }, [filteredExercises, recents, favorites]);

  const standardExercisesList = useMemo(() => {
    return filteredExercises.filter(ex => !favorites.includes(ex.id) && !recents.includes(ex.id));
  }, [filteredExercises, favorites, recents]);

  // Multi-selection toggles
  const toggleSelectExercise = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedExerciseIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedExerciseIds(next);
  };

  const handleSelectAllFiltered = () => {
    if (selectedExerciseIds.size === filteredExercises.length) {
      setSelectedExerciseIds(new Set());
    } else {
      setSelectedExerciseIds(new Set(filteredExercises.slice(0, 30).map(ex => ex.id)));
    }
  };

  // Insertion functions
  const addSingleExercise = (ex: Exercise) => {
    if (!activeWorkoutId) return;
    
    addToRecents(ex.id);
    
    const updated = workouts.map(w => {
      if (w.id === activeWorkoutId) {
        const order = (w.exercises?.length || 0) + 1;
        const newEx: SystemTemplateExercise = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets: 4,
          reps: '10',
          weight: 12,
          rest_time: 60,
          sort_order: order,
          sets_json: Array.from({ length: 4 }).map(() => ({ reps: '10', weight: 12, rest_time: 60 })),
          notes: ''
        };
        return {
          ...w,
          exercises: [...(w.exercises || []), newEx]
        };
      }
      return w;
    });
    onChangeWorkouts(updated);
  };

  const addSelectedExercises = () => {
    if (!activeWorkoutId || selectedExerciseIds.size === 0) return;
    
    const exercisesToAdd = exercises.filter(ex => selectedExerciseIds.has(ex.id));
    
    const updated = workouts.map(w => {
      if (w.id === activeWorkoutId) {
        const currentList = w.exercises || [];
        const newItems = exercisesToAdd.map((ex, idx) => {
          addToRecents(ex.id);
          return {
            exercise_id: ex.id,
            exercise_name: ex.name,
            sets: 4,
            reps: '10',
            weight: 12,
            rest_time: 60,
            sort_order: currentList.length + idx + 1,
            sets_json: Array.from({ length: 4 }).map(() => ({ reps: '10', weight: 12, rest_time: 60 })),
            notes: ''
          };
        });
        return {
          ...w,
          exercises: [...currentList, ...newItems]
        };
      }
      return w;
    });
    
    onChangeWorkouts(updated);
    setSelectedExerciseIds(new Set());
  };

  // Add muscle template structures
  const addTemplateStructure = (templateKey: string) => {
    if (!activeWorkoutId) return;
    const structure = TEMPLATE_STRUCTURES[templateKey];
    if (!structure) return;

    const updated = workouts.map(w => {
      if (w.id === activeWorkoutId) {
        const currentList = w.exercises || [];
        const newItems: SystemTemplateExercise[] = [];
        
        structure.forEach((item, index) => {
          // Find exercise in DB or fallback
          let foundEx = exercises.find(ex => ex.name.toLowerCase().trim() === item.name.toLowerCase().trim());
          if (!foundEx) {
            foundEx = exercises.find(ex => ex.name.toLowerCase().includes(item.name.toLowerCase()));
          }

          const exercise_id = foundEx ? foundEx.id : `fallback-${Date.now()}-${index}`;
          const exercise_name = foundEx ? foundEx.name : item.name;

          newItems.push({
            exercise_id,
            exercise_name,
            sets: 4,
            reps: '10',
            weight: 15,
            rest_time: 60,
            sort_order: currentList.length + index + 1,
            sets_json: Array.from({ length: 4 }).map(() => ({ reps: '10', weight: 15, rest_time: 60 })),
            notes: ''
          });
        });

        return {
          ...w,
          exercises: [...currentList, ...newItems]
        };
      }
      return w;
    });

    onChangeWorkouts(updated);
  };

  // Reorder exercises
  const moveExercise = (workoutId: string, fromIndex: number, toIndex: number) => {
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        const list = [...(w.exercises || [])];
        if (toIndex >= 0 && toIndex < list.length) {
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          
          // Re-map sort orders
          const remapped = list.map((ex, idx) => ({
            ...ex,
            sort_order: idx + 1
          }));
          return { ...w, exercises: remapped };
        }
      }
      return w;
    });
    onChangeWorkouts(updated);
  };

  const removeExercise = (workoutId: string, index: number) => {
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        const filtered = (w.exercises || []).filter((_, i) => i !== index);
        const remapped = filtered.map((ex, idx) => ({
          ...ex,
          sort_order: idx + 1
        }));
        return { ...w, exercises: remapped };
      }
      return w;
    });
    onChangeWorkouts(updated);
  };

  const updateExerciseParam = (workoutId: string, index: number, fields: Partial<SystemTemplateExercise>) => {
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        const list = [...(w.exercises || [])];
        if (list[index]) {
          list[index] = { ...list[index], ...fields };
          // Keep sets_json in sync if sets count changes
          if (fields.sets !== undefined) {
            const count = fields.sets;
            const currentSetsJson = list[index].sets_json || [];
            list[index].sets_json = Array.from({ length: count }).map((_, sIdx) => ({
              reps: currentSetsJson[sIdx]?.reps || list[index].reps || '10',
              weight: currentSetsJson[sIdx]?.weight || list[index].weight || 10,
              rest_time: currentSetsJson[sIdx]?.rest_time || list[index].rest_time || 60
            }));
          }
        }
        return { ...w, exercises: list };
      }
      return w;
    });
    onChangeWorkouts(updated);
  };

  // Calculate Muscle Group Volume (Weekly Sets)
  const muscleGroupVolume = useMemo(() => {
    const volume: Record<string, number> = {
      'Peito': 0,
      'Costas': 0,
      'Ombros': 0,
      'Braços': 0,
      'Pernas': 0,
      'Core': 0,
      'Cardio': 0
    };

    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        let muscle = matchingEx?.muscle_group || 'Outros';
        
        // Normalize
        if (muscle.includes('Peito') || muscle.includes('Peitoral')) muscle = 'Peito';
        else if (muscle.includes('Costa') || muscle.includes('Dorsal')) muscle = 'Costas';
        else if (muscle.includes('Ombro') || muscle.includes('Deltoide')) muscle = 'Ombros';
        else if (muscle.includes('Bíceps') || muscle.includes('Tríceps') || muscle.includes('Antebraço') || muscle.includes('Braço')) muscle = 'Braços';
        else if (muscle.includes('Perna') || muscle.includes('Quadríceps') || muscle.includes('Posterior') || muscle.includes('Glúteo') || muscle.includes('Panturrilha') || muscle.includes('Femoral')) muscle = 'Pernas';
        else if (muscle.includes('Core') || muscle.includes('Abdom') || muscle.includes('Lombar')) muscle = 'Core';
        else if (muscle.includes('Cardio') || muscle.includes('Aerob')) muscle = 'Cardio';
        else muscle = 'Outros';

        if (volume[muscle] !== undefined) {
          volume[muscle] += (ex.sets || 4);
        }
      });
    });

    return volume;
  }, [workouts, exercises]);

  // AI Suggestions Integration
  const generateAiSuggestions = async () => {
    setIsSuggesting(true);
    setAiSuggestions([]);
    setShowAiPanel(true);
    try {
      const response = await geminiService.callAI({
        prompt: `Como Rubi, Especialista de Alta Performance e Biomecânica do KYRON OS, analise:
        OBJETIVO DO PROTOCOLO: ${goal}
        NÍVEL DO ATLETA: ${difficulty}
        FREQUÊNCIA SEMANAL: ${frequency} dias
        FOCO MUSCULAR REQUISITADO: ${suggestionFocusMuscle}

        Gere uma sugestão científica e otimizada de 5 exercícios adequados para este perfil.
        Retorne estritamente um array de JSON no formato especificado.`,
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exercise_name: { type: "string" },
              reason: { type: "string" }
            },
            required: ["exercise_name", "reason"]
          }
        }
      });

      if (Array.isArray(response)) {
        setAiSuggestions(response);
      }
    } catch (e) {
      console.error('Error suggesting exercises:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const addAiSuggestedExercise = (name: string) => {
    let foundEx = exercises.find(ex => ex.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (!foundEx) {
      foundEx = exercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
    }
    
    if (foundEx) {
      addSingleExercise(foundEx);
    } else {
      // Fallback virtual exercise
      if (!activeWorkoutId) return;
      const updated = workouts.map(w => {
        if (w.id === activeWorkoutId) {
          const order = (w.exercises?.length || 0) + 1;
          const newEx: SystemTemplateExercise = {
            exercise_id: `fallback-ai-${Date.now()}`,
            exercise_name: name,
            sets: 4,
            reps: '10',
            weight: 12,
            rest_time: 60,
            sort_order: order,
            sets_json: Array.from({ length: 4 }).map(() => ({ reps: '10', weight: 12, rest_time: 60 })),
            notes: 'Sugerido por Rubi AI'
          };
          return { ...w, exercises: [...(w.exercises || []), newEx] };
        }
        return w;
      });
      onChangeWorkouts(updated);
    }
  };

  // Add all AI suggestions at once
  const addAllAiSuggestions = () => {
    aiSuggestions.forEach(s => addAiSuggestedExercise(s.exercise_name));
    setAiSuggestions([]);
    setShowAiPanel(false);
  };

  // HTML5 Drag & Drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveExercise(activeWorkoutId, draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  // Active workout details
  const activeWorkout = workouts.find(w => w.id === activeWorkoutId) || workouts[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: EXERCISE LIBRARY */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col h-[760px]">
        
        {/* Search header */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="text-blue-500" size={14} />
              Biblioteca de Exercícios
            </h4>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">
              {filteredExercises.length} disponíveis
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, grupo muscular, halter..."
              className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Muscle chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedMuscle(null)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                selectedMuscle === null 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {MUSCLE_FILTER_CHIPS.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                  selectedMuscle === m 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Scroll Container */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1.5">
          
          {/* SEÇÃO FAVORITOS */}
          {favoriteExercisesList.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                <Star size={11} fill="currentColor" /> Exercícios Favoritos
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {favoriteExercisesList.map(ex => (
                  <div 
                    key={`fav-${ex.id}`}
                    onClick={() => addSingleExercise(ex)}
                    className="group flex items-center justify-between p-2.5 bg-amber-50/40 border border-amber-100/70 hover:border-amber-400 hover:bg-amber-50 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.has(ex.id)}
                        onChange={(e) => toggleSelectExercise(ex.id, e as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{ex.name}</p>
                        <span className="text-[9px] text-amber-700/80 font-bold uppercase">{ex.muscle_group} • {ex.equipment || 'Livre'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={(e) => toggleFavorite(ex.id, e)}
                        className="p-1 text-amber-500 hover:text-amber-600"
                      >
                        <Star size={12} fill="currentColor" />
                      </button>
                      <span className="text-[10px] font-black text-amber-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                        <Plus size={11} /> Adicionar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO RECENTES */}
          {recentExercisesList.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider flex items-center gap-1">
                <Clock size={11} /> Utilizados Recentemente
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {recentExercisesList.map(ex => (
                  <div 
                    key={`rec-${ex.id}`}
                    onClick={() => addSingleExercise(ex)}
                    className="group flex items-center justify-between p-2.5 bg-blue-50/20 border border-blue-100/40 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.has(ex.id)}
                        onChange={(e) => toggleSelectExercise(ex.id, e as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{ex.name}</p>
                        <span className="text-[9px] text-blue-700/80 font-bold uppercase">{ex.muscle_group} • {ex.equipment || 'Livre'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={(e) => toggleFavorite(ex.id, e)}
                        className="p-1 text-slate-300 hover:text-amber-500"
                      >
                        <Star size={12} />
                      </button>
                      <span className="text-[10px] font-black text-blue-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                        <Plus size={11} /> Adicionar
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ESTOQUE GERAL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Lista Geral de Exercícios
              </span>
              {filteredExercises.length > 0 && (
                <button 
                  onClick={handleSelectAllFiltered}
                  className="text-[9px] font-black uppercase text-blue-600 hover:underline"
                >
                  {selectedExerciseIds.size === filteredExercises.length ? 'Desmarcar Todos' : 'Selecionar Visíveis'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {standardExercisesList.slice(0, 40).map(ex => (
                <div 
                  key={`std-${ex.id}`}
                  onClick={() => addSingleExercise(ex)}
                  className="group flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 hover:border-slate-300 rounded-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedExerciseIds.has(ex.id)}
                      onChange={(e) => toggleSelectExercise(ex.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{ex.name}</p>
                      <span className="text-[9px] text-slate-400 uppercase tracking-tight">{ex.muscle_group} • {ex.equipment || 'Livre'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={(e) => toggleFavorite(ex.id, e)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                    >
                      <Star size={12} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                      <Plus size={11} /> Inserir
                    </span>
                  </div>
                </div>
              ))}

              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum exercício encontrado para os critérios de busca.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Floating multi-select control panel */}
        {selectedExerciseIds.size > 0 && (
          <div className="shrink-0 mt-3 pt-3 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-700">
              {selectedExerciseIds.size} selecionados
            </span>
            <button
              onClick={addSelectedExercises}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10"
            >
              <Plus size={12} /> Adicionar Selecionados
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: WORKOUT IN CONSTRUCTION */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Real-time balance volume & control actions */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="text-emerald-500" size={14} />
                Volume do Protocolo (Séries Semanais)
              </h4>
              <p className="text-[10px] text-slate-400">Verifique o balanço biomecânico do treinamento.</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Muscle Template Trigger */}
              <div className="relative group/tpl">
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  Adicionar Estrutura Base
                  <ChevronDown size={11} />
                </button>
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 hidden group-hover/tpl:block hover:block">
                  {Object.keys(TEMPLATE_STRUCTURES).map((tplName) => (
                    <button
                      key={tplName}
                      type="button"
                      onClick={() => addTemplateStructure(tplName)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[10px] font-black uppercase text-slate-700 hover:text-slate-900 flex items-center justify-between"
                    >
                      {tplName}
                      <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-normal">+{TEMPLATE_STRUCTURES[tplName].length} Exs</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Suggestion Trigger */}
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/55 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Sparkles size={11} className="text-emerald-500" />
                ✨ Sugerir Exercícios
              </button>
            </div>
          </div>

          {/* Volume progress bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(muscleGroupVolume).map(([muscle, sets]) => {
              const maxSets = Math.max(...(Object.values(muscleGroupVolume) as number[]), 8);
              const pct = maxSets > 0 ? ((sets as number) / maxSets) * 100 : 0;
              return (
                <div key={muscle} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <span>{muscle}</span>
                    <span className="font-black text-slate-900">{sets} séries</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Suggestion Overlay Drawer */}
          {showAiPanel && (
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4.5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="text-emerald-500" size={15} />
                  <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                    Sugerir Exercícios via Rubi IA
                  </span>
                </div>
                <button 
                  onClick={() => setShowAiPanel(false)}
                  className="text-[10px] text-slate-400 font-bold hover:text-red-500 uppercase"
                >
                  Fechar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] text-emerald-700 font-bold">Focar em:</span>
                {['Peito', 'Costas', 'Ombros', 'Quadríceps', 'Posterior', 'Glúteos', 'Braços'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSuggestionFocusMuscle(m)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                      suggestionFocusMuscle === m 
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
                
                <button
                  onClick={generateAiSuggestions}
                  disabled={isSuggesting}
                  className="ml-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {isSuggesting ? 'Consultando IA...' : 'Gerar Sugestão'}
                </button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="bg-white border border-emerald-100 rounded-xl p-3.5 space-y-3 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Sugestões Estruturadas</span>
                    <button 
                      onClick={addAllAiSuggestions}
                      className="text-[9px] font-black uppercase text-emerald-600 hover:underline"
                    >
                      + Inserir Todas as Sugestões ({aiSuggestions.length})
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {aiSuggestions.map((s, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">{s.exercise_name}</p>
                          <p className="text-[10px] text-slate-400 italic">{s.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addAiSuggestedExercise(s.exercise_name)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-[9px] uppercase tracking-wide shrink-0"
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSuggesting && (
                <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Gerações biomecânicas personalizadas em progresso...
                </div>
              )}
            </div>
          )}
        </div>

        {/* WORKOUT DAYS SELECTOR (TREINO A, B, C...) */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col min-h-[500px]">
          
          {/* Days Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-3 overflow-x-auto shrink-0 scrollbar-thin">
            {workouts.map((w, wIdx) => {
              const isActive = w.id === activeWorkoutId;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setActiveWorkoutId(w.id);
                    setSelectedExerciseIds(new Set());
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-400'
                  }`}
                >
                  {w.name || `Treino ${String.fromCharCode(65 + wIdx)}`}
                  <span className="ml-1.5 text-[9px] opacity-60 font-bold">({w.exercises?.length || 0})</span>
                </button>
              );
            })}
          </div>

          {/* Active Workout Info Edit */}
          {activeWorkout && (
            <div className="pt-4 flex-1 flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 shrink-0">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nome da Ficha</label>
                  <input
                    type="text"
                    value={activeWorkout.name}
                    onChange={(e) => {
                      const updated = workouts.map(item => item.id === activeWorkoutId ? { ...item, name: e.target.value } : item);
                      onChangeWorkouts(updated);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Metodologia / Descrição</label>
                  <input
                    type="text"
                    value={activeWorkout.description || ''}
                    onChange={(e) => {
                      const updated = workouts.map(item => item.id === activeWorkoutId ? { ...item, description: e.target.value } : item);
                      onChangeWorkouts(updated);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-slate-650 text-xs focus:outline-none"
                    placeholder="Progressão linear, fadigamento parcial..."
                  />
                </div>
              </div>

              {/* Active workout Exercises Table */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
                {(activeWorkout.exercises || []).map((te, index) => (
                  <div
                    key={`${activeWorkoutId}-${te.exercise_id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`bg-slate-50 border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/85 hover:border-slate-300 relative ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/10' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Reorder and title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 hidden md:block">
                          <GripVertical size={14} />
                        </div>
                        {/* Fallback buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button 
                            type="button"
                            onClick={() => moveExercise(activeWorkoutId, index, index - 1)}
                            className="text-slate-300 hover:text-slate-700 disabled:opacity-20"
                            disabled={index === 0}
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveExercise(activeWorkoutId, index, index + 1)}
                            className="text-slate-300 hover:text-slate-700 disabled:opacity-20"
                            disabled={index === (activeWorkout.exercises?.length || 0) - 1}
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">{te.exercise_name}</p>
                        <span className="text-[9px] bg-blue-50 border border-blue-100/50 text-blue-600 font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 mt-1 inline-block">Posição {index + 1}</span>
                      </div>
                    </div>

                    {/* Params editor row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Séries</span>
                        <input
                          type="number"
                          value={te.sets || 4}
                          onChange={(e) => updateExerciseParam(activeWorkoutId, index, { sets: Number(e.target.value) })}
                          className="w-10 h-7 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reps</span>
                        <input
                          type="text"
                          value={te.reps || '10'}
                          onChange={(e) => updateExerciseParam(activeWorkoutId, index, { reps: e.target.value })}
                          className="w-14 h-7 bg-white border border-slate-200 rounded-lg text-center text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">KG</span>
                        <input
                          type="number"
                          value={te.weight || 10}
                          onChange={(e) => updateExerciseParam(activeWorkoutId, index, { weight: Number(e.target.value) })}
                          className="w-12 h-7 bg-white border border-slate-200 rounded-lg text-center text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rest</span>
                        <input
                          type="number"
                          value={te.rest_time || 60}
                          onChange={(e) => updateExerciseParam(activeWorkoutId, index, { rest_time: Number(e.target.value) })}
                          className="w-12 h-7 bg-white border border-slate-200 rounded-lg text-center text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1 flex-1 md:flex-initial">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Obs</span>
                        <input
                          type="text"
                          value={te.notes || ''}
                          onChange={(e) => updateExerciseParam(activeWorkoutId, index, { notes: e.target.value })}
                          className="w-full md:w-28 h-7 bg-white border border-slate-200 rounded-lg px-2 text-[10px]"
                          placeholder="Ex: Pegada aberta"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExercise(activeWorkoutId, index)}
                        className="text-red-400 hover:text-red-600 p-1 shrink-0 ml-1"
                        title="Remover exercício"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {(activeWorkout.exercises || []).length === 0 && (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs uppercase tracking-widest bg-slate-50/20">
                    Sua ficha está vazia. Toque em qualquer exercício na coluna esquerda para acoplá-lo aqui.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
