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
  GripVertical,
  RotateCcw,
  Info
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise, SystemTemplateWorkout, SystemTemplateExercise } from '../../../types';
import { geminiService } from '../../../services/geminiService';
import { authApi } from '../../../lib/api/authApi';
import { adminPreferencesApi } from '../../../lib/api/adminPreferencesApi';

interface ExerciseBuilderComponentProps {
  workouts: SystemTemplateWorkout[];
  onChangeWorkouts: (updated: SystemTemplateWorkout[]) => void;
  goal?: string;
  difficulty?: string;
  frequency?: number;
}

interface TemplateItem {
  exercise_id: string;
  fallback_name: string;
  muscle: string;
}

const TEMPLATE_STRUCTURES: Record<string, TemplateItem[]> = {
  'PEITORAL': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896002', fallback_name: 'Supino Inclinado com Halteres', muscle: 'Peito' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896001', fallback_name: 'Supino Reto com Barra', muscle: 'Peito' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896003', fallback_name: 'Crucifixo Reto com Halteres', muscle: 'Peito' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896005', fallback_name: 'Voador (Pec Deck)', muscle: 'Peito' }
  ],
  'COSTAS': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896006', fallback_name: 'Puxada Alta (Pulldown)', muscle: 'Costas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896007', fallback_name: 'Remada Curvada com Barra', muscle: 'Costas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896008', fallback_name: 'Remada Baixa Sentada no Cabo', muscle: 'Costas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896009', fallback_name: 'Barra Fixa (Pull-up)', muscle: 'Costas' }
  ],
  'OMBROS': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896010', fallback_name: 'Desenvolvimento com Halteres', muscle: 'Ombros' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896011', fallback_name: 'Elevação Lateral com Halteres', muscle: 'Ombros' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896013', fallback_name: 'Crucifixo Invertido com Halteres', muscle: 'Ombros' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896012', fallback_name: 'Elevação Frontal com Halteres', muscle: 'Ombros' }
  ],
  'BRAÇOS': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896020', fallback_name: 'Rosca Direta com Barra W', muscle: 'Braços' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896021', fallback_name: 'Rosca Martelo com Halteres', muscle: 'Braços' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896022', fallback_name: 'Tríceps Pulley (Corda)', muscle: 'Braços' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896023', fallback_name: 'Tríceps Testa com Barra W', muscle: 'Braços' }
  ],
  'QUADRÍCEPS': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896014', fallback_name: 'Agachamento Livre com Barra', muscle: 'Pernas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896015', fallback_name: 'Leg Press 45 Graus', muscle: 'Pernas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896016', fallback_name: 'Cadeira Extensora', muscle: 'Pernas' }
  ],
  'POSTERIOR': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896018', fallback_name: 'Stiff com Halteres', muscle: 'Pernas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896017', fallback_name: 'Mesa Flexora', muscle: 'Pernas' }
  ],
  'GLÚTEOS': [
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896014', fallback_name: 'Agachamento Livre com Barra', muscle: 'Pernas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896015', fallback_name: 'Leg Press 45 Graus', muscle: 'Pernas' },
    { exercise_id: 'f1b01c1c-99e6-4251-ba84-475253896018', fallback_name: 'Stiff com Halteres', muscle: 'Pernas' }
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
  
  // Authenticated User ID
  const [userId, setUserId] = useState<string | null>(null);

  // Favorites & Recents (Persisted in LocalStorage and synchronized to Cloud)
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

  // Bulk Settings States
  const [bulkSets, setBulkSets] = useState<number>(4);
  const [bulkReps, setBulkReps] = useState<string>('10');
  const [bulkRest, setBulkRest] = useState<number>(60);
  const [bulkWeight, setBulkWeight] = useState<string>('');

  // Undo System States
  const [undoTimer, setUndoTimer] = useState<any | null>(null);
  const [undoAction, setUndoAction] = useState<{
    message: string;
    previousWorkouts: SystemTemplateWorkout[];
    timestamp: number;
  } | null>(null);

  // Protocol Intelligence 1.0 Modal States
  const [showIntelModal, setShowIntelModal] = useState(false);
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [intelGoal, setIntelGoal] = useState<string>('Hipertrofia');
  const [intelLevel, setIntelLevel] = useState<string>('Intermediário');
  const [intelDays, setIntelDays] = useState<number>(4);
  const [intelLocation, setIntelLocation] = useState<string>('Academia');
  const [intelFocus, setIntelFocus] = useState<string>('Pernas completas');

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

  // Synchronized Cloud Preferences Load
  useEffect(() => {
    const loadCloudPreferences = async () => {
      try {
        const user = await authApi.getUser();
        if (user?.id) {
          setUserId(user.id);
          const prefs = await adminPreferencesApi.getPreferences(user.id);
          if (prefs) {
            let cloudFavs: string[] = [];
            let cloudRecents: string[] = [];
            
            if (Array.isArray(prefs.favorite_exercises)) {
              cloudFavs = prefs.favorite_exercises;
            } else if (typeof prefs.favorite_exercises === 'string') {
              try { cloudFavs = JSON.parse(prefs.favorite_exercises); } catch {}
            }
            
            if (Array.isArray(prefs.recent_exercises)) {
              cloudRecents = prefs.recent_exercises;
            } else if (typeof prefs.recent_exercises === 'string') {
              try { cloudRecents = JSON.parse(prefs.recent_exercises); } catch {}
            }

            if (cloudFavs.length > 0) {
              setFavorites(cloudFavs);
              localStorage.setItem('kyron_admin_favorites', JSON.stringify(cloudFavs));
            }
            if (cloudRecents.length > 0) {
              setRecents(cloudRecents);
              localStorage.setItem('kyron_admin_recents', JSON.stringify(cloudRecents));
            }
          }
        }
      } catch (err) {
        console.warn('[ExerciseBuilder] Error loading cloud preferences:', err);
      }
    };
    loadCloudPreferences();
  }, []);

  // Undo System Actions
  const registerUndoState = (message: string) => {
    if (undoTimer) {
      clearTimeout(undoTimer);
    }
    
    const deepCopy = JSON.parse(JSON.stringify(workouts));
    setUndoAction({
      message,
      previousWorkouts: deepCopy,
      timestamp: Date.now()
    });
    
    const timer = setTimeout(() => {
      setUndoAction(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const triggerUndo = () => {
    if (undoAction) {
      onChangeWorkouts(undoAction.previousWorkouts);
      setUndoAction(null);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }
    }
  };

  // Persist Favorites (Local and Cloud)
  const toggleFavorite = async (exerciseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    setFavorites(updated);
    localStorage.setItem('kyron_admin_favorites', JSON.stringify(updated));

    if (userId) {
      await adminPreferencesApi.savePreferences(userId, updated, recents);
    }
  };

  // Add to recents helper (Local and Cloud)
  const addToRecents = async (exerciseId: string) => {
    const updated = [exerciseId, ...recents.filter(id => id !== exerciseId)].slice(0, 8);
    setRecents(updated);
    localStorage.setItem('kyron_admin_recents', JSON.stringify(updated));

    if (userId) {
      await adminPreferencesApi.savePreferences(userId, favorites, updated);
    }
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
    
    registerUndoState("Adição múltipla de exercícios concluída");
    
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

    registerUndoState(`Template ${templateKey} aplicado`);

    const updated = workouts.map(w => {
      if (w.id === activeWorkoutId) {
        const currentList = w.exercises || [];
        const newItems: SystemTemplateExercise[] = [];
        
        structure.forEach((item, index) => {
          // Find exercise in DB by ID first, then fallback to name
          let foundEx = exercises.find(ex => ex.id === item.exercise_id);
          if (!foundEx) {
            foundEx = exercises.find(ex => ex.name.toLowerCase().trim() === item.fallback_name.toLowerCase().trim());
          }
          if (!foundEx) {
            foundEx = exercises.find(ex => ex.name.toLowerCase().includes(item.fallback_name.toLowerCase()));
          }

          const exercise_id = foundEx ? foundEx.id : item.exercise_id;
          const exercise_name = foundEx ? foundEx.name : item.fallback_name;

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
    if (aiSuggestions.length === 0) return;
    registerUndoState("Sugestões da IA Rubi adicionadas");
    aiSuggestions.forEach(s => addAiSuggestedExercise(s.exercise_name));
    setAiSuggestions([]);
    setShowAiPanel(false);
  };

  // Apply Bulk Settings to All Exercises of the Active Workout Day
  const applyBulkSettings = () => {
    if (!activeWorkoutId) return;
    const activeW = workouts.find(w => w.id === activeWorkoutId);
    if (!activeW || !activeW.exercises || activeW.exercises.length === 0) return;
    
    registerUndoState(`Configuração em lote aplicada em ${activeW.exercises.length} exercícios`);

    const updatedExercises = activeW.exercises.map(te => {
      const parsedWeight = bulkWeight !== '' ? Number(bulkWeight) : (te.weight || 12);
      return {
        ...te,
        sets: bulkSets,
        reps: bulkReps,
        rest_time: bulkRest,
        weight: parsedWeight,
        sets_json: Array.from({ length: bulkSets }).map(() => ({
          reps: bulkReps,
          weight: parsedWeight,
          rest_time: bulkRest
        }))
      };
    });

    const updatedWorkouts = workouts.map(w => {
      if (w.id === activeWorkoutId) {
        return { ...w, exercises: updatedExercises };
      }
      return w;
    });

    onChangeWorkouts(updatedWorkouts);
  };

  // Generate complete customized protocol via Protocol Intelligence 1.0 (Rubi AI)
  const generateProtocolIntel = async () => {
    setIsGeneratingIntel(true);
    setIntelError(null);
    try {
      const existingNames = exercises.slice(0, 100).map(e => e.name);
      
      const response = await geminiService.callAI({
        prompt: `Como Rubi, Especialista de Alta Performance e Biomecânica do KYRON OS, gere um protocolo inteligente completo:
        OBJETIVO: ${intelGoal}
        NÍVEL DO ATLETA: ${intelLevel}
        FREQUÊNCIA SEMANAL: ${intelDays} dias na semana (portanto, gere exatamente ${intelDays} treinos distintos, por exemplo Treino A, Treino B...)
        LOCAL DE TREINAMENTO: ${intelLocation}
        FOCO MUSCULAR PRINCIPAL: ${intelFocus}

        LISTA DE EXERCÍCIOS REAIS NO SISTEMA (Dê prioridade absoluta para usar estes nomes de exercícios se eles se adequarem ao plano de treino):
        ${JSON.stringify(existingNames)}

        INSTRUÇÕES:
        1. Divida o treinamento de forma equilibrada em exatamente ${intelDays} sessões de treino (ex: Treino A - Peitoral & Ombros, Treino B...).
        2. Selecione de 4 a 6 exercícios altamente eficazes e biomecanicamente coerentes para cada uma das sessões.
        3. Defina séries (entre 3 e 5), repetições (ex: "8-10", "12", "FALHA") e descanso (ex: 60, 90, 120 segundos) ideais para o objetivo e nível.
        4. Escreva dicas de progressão de carga e execução nas observações ("notes") de cada exercício.
        5. Crie observações gerais de progressão técnica e biomecânica em "general_progression_tips".

        Retorne estritamente um JSON no seguinte formato de objeto:
        {
          "workouts": [
            {
              "name": "Treino A - Peitoral & Ombros",
              "description": "Foco em estímulo tensional e forças empurradoras",
              "exercises": [
                {
                  "exercise_name": "Supino Reto com Barra",
                  "sets": 4,
                  "reps": "8-10",
                  "weight": 15,
                  "rest_time": 90,
                  "notes": "Foque na fase excêntrica de 3 segundos, mantendo escápulas aduzidas."
                }
              ]
            }
          ],
          "general_progression_tips": "Dicas de progressão..."
        }`,
        responseSchema: {
          type: "object",
          properties: {
            workouts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        exercise_name: { type: "string" },
                        sets: { type: "number" },
                        reps: { type: "string" },
                        weight: { type: "number" },
                        rest_time: { type: "number" },
                        notes: { type: "string" }
                      },
                      required: ["exercise_name", "sets", "reps", "rest_time"]
                    }
                  }
                },
                required: ["name", "description", "exercises"]
              }
            },
            general_progression_tips: { type: "string" }
          },
          required: ["workouts", "general_progression_tips"]
        }
      });

      if (response && Array.isArray(response.workouts)) {
        registerUndoState("Protocolo Inteligente Gerado");

        const updatedWorkouts = response.workouts.map((w: any, wIdx: number) => {
          const generatedExs = w.exercises || [];
          const exercisesList = generatedExs.map((ge: any, idx: number) => {
            let foundEx = exercises.find(ex => ex.name.toLowerCase().trim() === ge.exercise_name.toLowerCase().trim());
            if (!foundEx) {
              foundEx = exercises.find(ex => ex.name.toLowerCase().includes(ge.exercise_name.toLowerCase()) || ge.exercise_name.toLowerCase().includes(ex.name.toLowerCase()));
            }

            const id = foundEx ? foundEx.id : `fallback-intel-${Date.now()}-${wIdx}-${idx}`;
            const name = foundEx ? foundEx.name : ge.exercise_name;

            return {
              exercise_id: id,
              exercise_name: name,
              sets: ge.sets || 4,
              reps: ge.reps || "10",
              weight: ge.weight || 12,
              rest_time: ge.rest_time || 60,
              sort_order: idx + 1,
              sets_json: Array.from({ length: ge.sets || 4 }).map(() => ({
                reps: ge.reps || "10",
                weight: ge.weight || 12,
                rest_time: ge.rest_time || 60
              })),
              notes: ge.notes || ""
            };
          });

          return {
            id: `workout-intel-${Date.now()}-${wIdx}`,
            name: w.name,
            description: w.description || "",
            exercises: exercisesList
          };
        });

        onChangeWorkouts(updatedWorkouts);
        
        if (updatedWorkouts.length > 0) {
          setActiveWorkoutId(updatedWorkouts[0].id);
        }

        setShowIntelModal(false);
      } else {
        throw new Error("Formato de resposta inválido retornado pela IA.");
      }
    } catch (e: any) {
      console.error('Error generating intelligent protocol:', e);
      setIntelError(e?.message || "Ocorreu um erro ao comunicar com a inteligência artificial Rubi.");
    } finally {
      setIsGeneratingIntel(false);
    }
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

  const addedIds = useMemo(() => {
    return new Set(activeWorkout?.exercises?.map(te => te.exercise_id) || []);
  }, [activeWorkout]);

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Undo Banner Toast Notification */}
      <AnimatePresence>
        {undoAction && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl max-w-sm"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg">
              <RotateCcw size={14} className="text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Ação em lote realizada</p>
              <p className="text-xs text-slate-200 font-bold truncate leading-tight">{undoAction.description}</p>
            </div>
            <button
              onClick={triggerUndo}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl transition-all"
            >
              Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                {favoriteExercisesList.map(ex => {
                  const isAdded = addedIds.has(ex.id);
                  return (
                    <div 
                      key={`fav-${ex.id}`}
                      onClick={() => addSingleExercise(ex)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isAdded
                          ? 'bg-emerald-50/25 border border-emerald-300/70 hover:border-emerald-400 hover:bg-emerald-50/40'
                          : 'bg-amber-50/40 border border-amber-100/70 hover:border-amber-400 hover:bg-amber-50'
                      }`}
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
                        {isAdded ? (
                          <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-0.5 shrink-0 bg-emerald-100/50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            ✓ Já adicionado
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                            <Plus size={11} /> Adicionar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                {recentExercisesList.map(ex => {
                  const isAdded = addedIds.has(ex.id);
                  return (
                    <div 
                      key={`rec-${ex.id}`}
                      onClick={() => addSingleExercise(ex)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isAdded
                          ? 'bg-emerald-50/25 border border-emerald-300/70 hover:border-emerald-400 hover:bg-emerald-50/40'
                          : 'bg-blue-50/20 border border-blue-100/40 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
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
                          className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                        >
                          <Star size={12} />
                        </button>
                        {isAdded ? (
                          <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-0.5 shrink-0 bg-emerald-100/50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            ✓ Já adicionado
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-blue-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                            <Plus size={11} /> Adicionar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              {standardExercisesList.slice(0, 40).map(ex => {
                const isAdded = addedIds.has(ex.id);
                return (
                  <div 
                    key={`std-${ex.id}`}
                    onClick={() => addSingleExercise(ex)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isAdded
                        ? 'bg-emerald-50/20 border border-emerald-300/60 hover:border-emerald-400 hover:bg-emerald-50/30'
                        : 'bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 hover:border-slate-300'
                    }`}
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
                      {isAdded ? (
                        <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-0.5 shrink-0 bg-emerald-100/50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          ✓ Já adicionado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                          <Plus size={11} /> Inserir
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

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
            
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
              {/* Intel Generator Trigger */}
              <button
                type="button"
                onClick={() => setShowIntelModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/15 shrink-0"
              >
                <Brain size={11} className="text-indigo-200 animate-pulse" />
                🧬 Gerar com IA
              </button>

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

              {/* CONFIGURAÇÃO EM LOTE */}
              {activeWorkout.exercises && activeWorkout.exercises.length > 0 && (
                <div className="mt-3.5 p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-900 rounded-lg text-white">
                      <Layers size={12} />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Configuração em Lote</h5>
                      <p className="text-[9px] text-slate-400">Aplicar parâmetros iguais para os {activeWorkout.exercises.length} exercícios.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sets */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Séries:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={bulkSets}
                        onChange={(e) => setBulkSets(Math.max(1, Number(e.target.value)))}
                        className="w-10 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold text-slate-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Reps */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Reps:</span>
                      <input
                        type="text"
                        placeholder="10"
                        value={bulkReps}
                        onChange={(e) => setBulkReps(e.target.value)}
                        className="w-14 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold text-slate-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Carga */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Carga:</span>
                      <input
                        type="text"
                        placeholder="Manter"
                        value={bulkWeight}
                        onChange={(e) => setBulkWeight(e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold text-slate-800 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Descanso */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Descanso:</span>
                      <select
                        value={bulkRest}
                        onChange={(e) => setBulkRest(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] font-bold text-slate-800 focus:outline-none"
                      >
                        <option value={30}>30s</option>
                        <option value={45}>45s</option>
                        <option value={60}>60s</option>
                        <option value={90}>90s</option>
                        <option value={120}>120s</option>
                        <option value={150}>150s</option>
                        <option value={180}>180s</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={applyBulkSettings}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all shadow-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

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

      {/* PROTOCOL INTELLIGENCE MODAL */}
      {showIntelModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-md p-7 shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-indigo-50 rounded-2xl text-indigo-600">
                <Brain size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Protocol Intelligence 1.0</h3>
                <p className="text-[10px] text-slate-400">Geração automatizada de treinos por Rubi AI.</p>
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Goal */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Objetivo Principal</label>
                <input
                  type="text"
                  value={intelGoal}
                  onChange={(e) => setIntelGoal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  placeholder="Ex: Hipertrofia de peitorais e ombros com foco em força tensional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Level */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nível do Aluno</label>
                  <select
                    value={intelLevel}
                    onChange={(e) => setIntelLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Atleta Pro">Atleta Pro</option>
                  </select>
                </div>

                {/* Days */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Treinos Semanais (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={intelDays}
                    onChange={(e) => setIntelDays(Math.min(7, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Equipamentos / Local</label>
                  <select
                    value={intelLocation}
                    onChange={(e) => setIntelLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Academia Completa">Academia Completa</option>
                    <option value="Estúdio / Peso Livre">Estúdio / Peso Livre</option>
                    <option value="Home Gym">Home Gym</option>
                    <option value="Calistenia / Peso Corporal">Calistenia / Peso Corporal</option>
                  </select>
                </div>

                {/* Focus */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Foco de Musculatura</label>
                  <input
                    type="text"
                    value={intelFocus}
                    onChange={(e) => setIntelFocus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="Ex: Deltoide Lateral, Dorsal"
                  />
                </div>
              </div>

              {intelError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-bold leading-relaxed">
                  {intelError}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowIntelModal(false)}
                disabled={isGeneratingIntel}
                className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-650 tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generateProtocolIntel}
                disabled={isGeneratingIntel}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50"
              >
                {isGeneratingIntel ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                    Gerando Protocolo...
                  </>
                ) : (
                  <>
                    <Sparkles size={11} className="text-indigo-200" />
                    Iniciar Geração Inteligente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
