import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProtocolService } from '../../../lib/api/protocol40/ProtocolService';
import { ProtocolDayService } from '../../../lib/api/protocol40/ProtocolDayService';
import { ProtocolExerciseService } from '../../../lib/api/protocol40/ProtocolExerciseService';
import { exerciseApi } from '../../../lib/api/exerciseApi';
import { PremiumProtocol, PremiumProtocolDay, PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { Exercise } from '../../../types';
import { supabase } from '../../../lib/api/supabase';

export const useProtocolBuilder = () => {
  // Lists
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active States
  const [selectedProtocol, setSelectedProtocol] = useState<PremiumProtocol | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [days, setDays] = useState<PremiumProtocolDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Record<string, PremiumProtocolExercise[]>>({});

  // Deleted Tracks (Crucial for transaction logical deletion)
  const [deletedDayIds, setDeletedDayIds] = useState<string[]>([]);
  const [deletedExerciseIds, setDeletedExerciseIds] = useState<string[]>([]);

  // Selection for Bulk Actions
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Autosave Status
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');

  // Feedback State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Snapshot history state for Undo/Redo
  const [history, setHistory] = useState<{
    past: Array<{
      selectedProtocol: PremiumProtocol | null;
      days: PremiumProtocolDay[];
      exercises: Record<string, PremiumProtocolExercise[]>;
      deletedDayIds: string[];
      deletedExerciseIds: string[];
    }>;
    future: Array<{
      selectedProtocol: PremiumProtocol | null;
      days: PremiumProtocolDay[];
      exercises: Record<string, PremiumProtocolExercise[]>;
      deletedDayIds: string[];
      deletedExerciseIds: string[];
    }>;
  }>({ past: [], future: [] });

  // Helper to trigger Toast
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Commit current state to past history before updating
  const commitState = useCallback((
    nextDays: PremiumProtocolDay[],
    nextExercises: Record<string, PremiumProtocolExercise[]>,
    nextDeletedDays: string[] = deletedDayIds,
    nextDeletedExercises: string[] = deletedExerciseIds,
    nextProtocol: PremiumProtocol | null = selectedProtocol
  ) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-49), { selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds }],
      future: []
    }));
    setDays(nextDays);
    setExercises(nextExercises);
    setDeletedDayIds(nextDeletedDays);
    setDeletedExerciseIds(nextDeletedExercises);
    setSelectedProtocol(nextProtocol);
    setAutosaveStatus('dirty');
  }, [days, exercises, deletedDayIds, deletedExerciseIds, selectedProtocol]);

  // Undo and Redo Actions
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory((prev) => ({
      past: newPast,
      future: [{ selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds }, ...prev.future]
    }));

    setSelectedProtocol(previous.selectedProtocol);
    setDays(previous.days);
    setExercises(previous.exercises);
    setDeletedDayIds(previous.deletedDayIds);
    setDeletedExerciseIds(previous.deletedExerciseIds);
    setAutosaveStatus('dirty');
    setSelectedExerciseIds([]);
    showToast('success', 'Alteração desfeita (Undo)');
  }, [history, selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds, showToast]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory((prev) => ({
      past: [...prev.past, { selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds }],
      future: newFuture
    }));

    setSelectedProtocol(next.selectedProtocol);
    setDays(next.days);
    setExercises(next.exercises);
    setDeletedDayIds(next.deletedDayIds);
    setDeletedExerciseIds(next.deletedExerciseIds);
    setAutosaveStatus('dirty');
    setSelectedExerciseIds([]);
    showToast('success', 'Alteração refeita (Redo)');
  }, [history, selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds, showToast]);

  // 1. Initial Load: user, protocols list, and exercise library
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });

    const initLoad = async () => {
      setLoading(true);
      try {
        const [protocolList, exerciseList] = await Promise.all([
          ProtocolService.list(),
          exerciseApi.getExercises()
        ]);
        setProtocols(protocolList);
        setExerciseLibrary(exerciseList);
      } catch (err) {
        console.error('[useProtocolBuilder] Initial load error:', err);
        showToast('error', 'Erro ao carregar dados iniciais.');
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, [showToast]);

  // Real-time listener for high-level protocols
  useEffect(() => {
    const unsubscribe = ProtocolService.subscribeToChanges((payload) => {
      console.log('[useProtocolBuilder] Real-time protocols payload:', payload);
      const eventType = payload.eventType;
      const newRecord = payload.new as PremiumProtocol;
      const oldRecord = payload.old as { id: string };

      setProtocols((prev) => {
        if (eventType === 'INSERT') {
          if (prev.some((p) => p.id === newRecord.id) || newRecord.is_deleted) return prev;
          return [newRecord, ...prev];
        }
        if (eventType === 'UPDATE') {
          if (newRecord.is_deleted) return prev.filter((p) => p.id !== newRecord.id);
          return prev.map((p) => (p.id === newRecord.id ? newRecord : p));
        }
        if (eventType === 'DELETE') {
          return prev.filter((p) => p.id !== oldRecord.id);
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Load complete relational data of selected protocol
  const loadProtocolDetails = useCallback(async (protocol: PremiumProtocol) => {
    setLoading(true);
    setConflictError(null);
    setSelectedExerciseIds([]);
    setAutosaveStatus('idle');
    try {
      setSelectedProtocol(protocol);
      setIsCreating(false);
      setDeletedDayIds([]);
      setDeletedExerciseIds([]);
      setHistory({ past: [], future: [] });

      // Fetch days
      const daysRes = await ProtocolDayService.getByProtocolId(protocol.id);
      if (daysRes.error) throw daysRes.error;
      const loadedDays = (daysRes.data || []) as PremiumProtocolDay[];
      
      const sortedDays = [...loadedDays].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setDays(sortedDays);

      const exercisesMap: Record<string, PremiumProtocolExercise[]> = {};
      if (sortedDays.length > 0) {
        await Promise.all(
          sortedDays.map(async (day) => {
            const exRes = await ProtocolExerciseService.getByDayId(day.id);
            if (!exRes.error && exRes.data) {
              exercisesMap[day.id] = (exRes.data || []).sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0));
            } else {
              exercisesMap[day.id] = [];
            }
          })
        );
        setSelectedDayId(sortedDays[0].id);
      } else {
        setSelectedDayId(null);
      }
      setExercises(exercisesMap);
    } catch (err) {
      console.error('[useProtocolBuilder] Error loading protocol details:', err);
      showToast('error', 'Falha ao carregar detalhes completos do protocolo.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // 3. Initiate Creating Mode with clean structures
  const startCreateMode = useCallback(() => {
    setIsCreating(true);
    setSelectedExerciseIds([]);
    setAutosaveStatus('idle');
    setHistory({ past: [], future: [] });

    const initialProtocol: PremiumProtocol = {
      id: '',
      name: 'Novo Protocolo de Treinamento',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
      category: 'public',
      goal: 'Hipertrofia',
      difficulty: 'Iniciante',
      environment: 'Academia',
      training_days: 3,
      duration_weeks: 4,
      estimated_duration: 60,
      status: 'draft',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };
    setSelectedProtocol(initialProtocol);

    const tempDay1Id = `temp_day_1_${Date.now()}`;
    const tempDay2Id = `temp_day_2_${Date.now()}`;
    const tempDay3Id = `temp_day_3_${Date.now()}`;

    const defaultDays: PremiumProtocolDay[] = [
      { id: tempDay1Id, protocol_id: '', day_number: 1, title: 'Treino A', description: 'Membros Superiores', sort_order: 1 },
      { id: tempDay2Id, protocol_id: '', day_number: 2, title: 'Treino B', description: 'Membros Inferiores', sort_order: 2 },
      { id: tempDay3Id, protocol_id: '', day_number: 3, title: 'Treino C', description: 'Cardio & Abdômen', sort_order: 3 }
    ];
    setDays(defaultDays);
    setSelectedDayId(tempDay1Id);

    setExercises({
      [tempDay1Id]: [],
      [tempDay2Id]: [],
      [tempDay3Id]: []
    });

    setDeletedDayIds([]);
    setDeletedExerciseIds([]);
    setConflictError(null);
  }, []);

  // 4. Update General Protocol Fields
  const updateProtocolField = useCallback((field: keyof PremiumProtocol, value: any) => {
    if (!selectedProtocol) return;
    const nextProtocol = {
      ...selectedProtocol,
      [field]: value
    };
    commitState(days, exercises, deletedDayIds, deletedExerciseIds, nextProtocol);
  }, [selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds, commitState]);

  // 5. Days Management
  const addDay = useCallback(() => {
    const tempDayId = `temp_day_${Date.now()}`;
    const nextDayNumber = days.length + 1;
    const letter = String.fromCharCode(65 + ((nextDayNumber - 1) % 26));

    const newDay: PremiumProtocolDay = {
      id: tempDayId,
      protocol_id: selectedProtocol?.id || '',
      day_number: nextDayNumber,
      title: `Treino ${letter}`,
      description: '',
      sort_order: nextDayNumber
    };

    const nextDays = [...days, newDay];
    const nextExercises = {
      ...exercises,
      [tempDayId]: []
    };

    commitState(nextDays, nextExercises);
    setSelectedDayId(tempDayId);
    showToast('success', `Treino ${letter} adicionado!`);
  }, [days, exercises, selectedProtocol, commitState, showToast]);

  const removeDay = useCallback((dayId: string) => {
    const dayToRemove = days.find(d => d.id === dayId);
    const title = dayToRemove?.title || 'Dia';

    const nextDeletedDays = [...deletedDayIds];
    if (!dayId.startsWith('temp_')) {
      nextDeletedDays.push(dayId);
    }

    const remainingDays = days.filter((d) => d.id !== dayId);
    const renumberedDays = remainingDays.map((d, index) => ({
      ...d,
      day_number: index + 1,
      sort_order: index + 1
    }));

    const exercisesForDay = exercises[dayId] || [];
    const nextDeletedExs = [...deletedExerciseIds];
    exercisesForDay.forEach((ex) => {
      if (ex.id && !ex.id.startsWith('temp_')) {
        nextDeletedExs.push(ex.id);
      }
    });

    const nextExercises = { ...exercises };
    delete nextExercises[dayId];

    commitState(renumberedDays, nextExercises, nextDeletedDays, nextDeletedExs);

    const remainingIds = renumberedDays.map(d => d.id);
    setSelectedDayId(remainingIds.length > 0 ? remainingIds[0] : null);
    setSelectedExerciseIds([]);
    showToast('success', `Dia "${title}" removido.`);
  }, [days, exercises, deletedDayIds, deletedExerciseIds, commitState, showToast]);

  const updateDayField = useCallback((dayId: string, field: keyof PremiumProtocolDay, value: any) => {
    const updatedDays = days.map((d) => {
      if (d.id === dayId) {
        return { ...d, [field]: value };
      }
      return d;
    });
    // Direct state updates for visual typing performance, but triggers autosave status
    setDays(updatedDays);
    setAutosaveStatus('dirty');
  }, [days]);

  const duplicateDay = useCallback((day: PremiumProtocolDay) => {
    const tempDayId = `temp_day_dup_${Date.now()}`;
    const nextDayNumber = days.length + 1;

    const duplicatedDay: PremiumProtocolDay = {
      id: tempDayId,
      protocol_id: selectedProtocol?.id || '',
      day_number: nextDayNumber,
      title: `${day.title || 'Treino'} (Cópia)`,
      description: day.description || '',
      sort_order: nextDayNumber
    };

    const originalExercises = exercises[day.id] || [];
    const duplicatedExercises = originalExercises.map((ex, index) => ({
      ...ex,
      id: `temp_ex_dup_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 3)}`,
      day_id: tempDayId,
      exercise_order: index + 1
    }));

    const nextDays = [...days, duplicatedDay];
    const nextExercises = {
      ...exercises,
      [tempDayId]: duplicatedExercises
    };

    commitState(nextDays, nextExercises);
    setSelectedDayId(tempDayId);
    showToast('success', `Treino "${day.title}" duplicado com sucesso!`);
  }, [days, exercises, selectedProtocol, commitState, showToast]);

  const moveDay = useCallback((dayId: string, direction: 'up' | 'down') => {
    const index = days.findIndex((d) => d.id === dayId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= days.length) return;

    const nextDays = [...days];
    const temp = nextDays[index];
    nextDays[index] = nextDays[targetIndex];
    nextDays[targetIndex] = temp;

    const updatedDays = nextDays.map((d, idx) => ({
      ...d,
      day_number: idx + 1,
      sort_order: idx + 1
    }));

    commitState(updatedDays, exercises);
    showToast('success', `Dias reordenados.`);
  }, [days, exercises, commitState, showToast]);

  // Drag and drop for reordering days
  const reorderDays = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= days.length || toIndex >= days.length) return;
    
    const nextDays = [...days];
    const [removed] = nextDays.splice(fromIndex, 1);
    nextDays.splice(toIndex, 0, removed);

    const updatedDays = nextDays.map((d, idx) => ({
      ...d,
      day_number: idx + 1,
      sort_order: idx + 1
    }));

    commitState(updatedDays, exercises);
    showToast('success', 'Estrutura de dias reorganizada!');
  }, [days, exercises, commitState, showToast]);

  // 6. Exercises Management
  const addExercise = useCallback((exerciseId: string) => {
    if (!selectedDayId) {
      showToast('error', 'Selecione um dia antes de adicionar exercícios.');
      return;
    }

    const currentExList = exercises[selectedDayId] || [];
    const tempExId = `temp_ex_${Date.now()}`;

    const newEx: PremiumProtocolExercise = {
      id: tempExId,
      day_id: selectedDayId,
      exercise_id: exerciseId,
      exercise_order: currentExList.length + 1,
      sets: 3,
      reps: '10',
      rest_seconds: 60,
      load_type: '',
      rpe: '',
      tempo: '',
      cadence: '',
      notes: '',
      drop_set: false,
      rest_pause: false,
      superset: false
    };

    const nextExercises = {
      ...exercises,
      [selectedDayId]: [...currentExList, newEx]
    };

    commitState(days, nextExercises);
    showToast('success', 'Exercício adicionado.');
  }, [selectedDayId, exercises, days, commitState, showToast]);

  const updateExercise = useCallback((index: number, field: keyof PremiumProtocolExercise, value: any) => {
    if (!selectedDayId) return;

    const dayExs = [...(exercises[selectedDayId] || [])];
    if (!dayExs[index]) return;

    dayExs[index] = {
      ...dayExs[index],
      [field]: value
    };

    const nextExercises = {
      ...exercises,
      [selectedDayId]: dayExs
    };

    // Safe direct state update to prevent keypress input lag, and flag dirty for autosave
    setExercises(nextExercises);
    setAutosaveStatus('dirty');
  }, [selectedDayId, exercises]);

  const deleteExercise = useCallback((index: number) => {
    if (!selectedDayId) return;

    const dayExs = exercises[selectedDayId] || [];
    const exToRemove = dayExs[index];
    if (!exToRemove) return;

    const nextDeletedExs = [...deletedExerciseIds];
    if (exToRemove.id && !exToRemove.id.startsWith('temp_')) {
      nextDeletedExs.push(exToRemove.id);
    }

    const remaining = dayExs.filter((_, idx) => idx !== index);
    const updated = remaining.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    const nextExercises = {
      ...exercises,
      [selectedDayId]: updated
    };

    commitState(days, nextExercises, deletedDayIds, nextDeletedExs);
    setSelectedExerciseIds((prev) => prev.filter((id) => id !== exToRemove.id));
    showToast('success', 'Exercício removido.');
  }, [selectedDayId, exercises, days, deletedDayIds, deletedExerciseIds, commitState, showToast]);

  const duplicateExercise = useCallback((index: number) => {
    if (!selectedDayId) return;

    const dayExs = exercises[selectedDayId] || [];
    const exToDup = dayExs[index];
    if (!exToDup) return;

    const tempId = `temp_ex_dup_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`;
    const duplicated: PremiumProtocolExercise = {
      ...exToDup,
      id: tempId,
      exercise_order: dayExs.length + 1
    };

    const nextExercises = {
      ...exercises,
      [selectedDayId]: [...dayExs, duplicated]
    };

    commitState(days, nextExercises);
    showToast('success', 'Exercício duplicado.');
  }, [selectedDayId, exercises, days, commitState, showToast]);

  const moveExercise = useCallback((index: number, direction: 'up' | 'down') => {
    if (!selectedDayId) return;

    const dayExs = [...(exercises[selectedDayId] || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= dayExs.length) return;

    const temp = dayExs[index];
    dayExs[index] = dayExs[targetIdx];
    dayExs[targetIdx] = temp;

    const updated = dayExs.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    const nextExercises = {
      ...exercises,
      [selectedDayId]: updated
    };

    commitState(days, nextExercises);
  }, [selectedDayId, exercises, days, commitState]);

  // Reorder exercises within same day (Drag and Drop)
  const reorderExercises = useCallback((dayId: string, fromIndex: number, toIndex: number) => {
    const list = [...(exercises[dayId] || [])];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return;
    
    const [removed] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, removed);

    const updated = list.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    commitState(days, {
      ...exercises,
      [dayId]: updated
    });
    showToast('success', 'Exercícios reorganizados!');
  }, [days, exercises, commitState, showToast]);

  // Drag and drop an exercise between different days
  const moveExerciseToDay = useCallback((fromDayId: string, exerciseIndex: number, toDayId: string) => {
    if (fromDayId === toDayId) return;
    const fromList = [...(exercises[fromDayId] || [])];
    const toList = [...(exercises[toDayId] || [])];

    const [movedEx] = fromList.splice(exerciseIndex, 1);
    if (!movedEx) return;

    const updatedEx = {
      ...movedEx,
      day_id: toDayId,
      exercise_order: toList.length + 1
    };

    const reorderedFrom = fromList.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    const reorderedTo = [...toList, updatedEx];

    commitState(days, {
      ...exercises,
      [fromDayId]: reorderedFrom,
      [toDayId]: reorderedTo
    });

    setSelectedExerciseIds([]);
    showToast('success', 'Exercício movido para outro treino!');
  }, [days, exercises, commitState, showToast]);

  // 7. Bulk Action Helpers
  const toggleSelectExercise = useCallback((id: string) => {
    setSelectedExerciseIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAllExercises = useCallback((dayId: string, select: boolean) => {
    if (select) {
      const list = exercises[dayId] || [];
      setSelectedExerciseIds(list.map((ex) => ex.id));
    } else {
      setSelectedExerciseIds([]);
    }
  }, [exercises]);

  const bulkUpdateField = useCallback((field: keyof PremiumProtocolExercise, value: any) => {
    if (!selectedDayId || selectedExerciseIds.length === 0) return;

    const currentList = exercises[selectedDayId] || [];
    const updated = currentList.map((ex) => {
      if (selectedExerciseIds.includes(ex.id)) {
        return { ...ex, [field]: value };
      }
      return ex;
    });

    commitState(days, {
      ...exercises,
      [selectedDayId]: updated
    });

    showToast('success', `Aplicado em lote para ${selectedExerciseIds.length} itens.`);
  }, [selectedDayId, selectedExerciseIds, exercises, days, commitState, showToast]);

  const bulkDuplicate = useCallback(() => {
    if (!selectedDayId || selectedExerciseIds.length === 0) return;

    const currentList = exercises[selectedDayId] || [];
    const duplicates: PremiumProtocolExercise[] = [];
    
    currentList.forEach((ex) => {
      if (selectedExerciseIds.includes(ex.id)) {
        duplicates.push({
          ...ex,
          id: `temp_ex_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          exercise_order: 9999
        });
      }
    });

    const newList = [...currentList, ...duplicates].map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    commitState(days, {
      ...exercises,
      [selectedDayId]: newList
    });

    setSelectedExerciseIds([]);
    showToast('success', `Duplicados ${duplicates.length} exercícios.`);
  }, [selectedDayId, selectedExerciseIds, exercises, days, commitState, showToast]);

  const bulkDelete = useCallback(() => {
    if (!selectedDayId || selectedExerciseIds.length === 0) return;

    const currentList = exercises[selectedDayId] || [];
    const remaining: PremiumProtocolExercise[] = [];
    const newlyDeleted: string[] = [];

    currentList.forEach((ex) => {
      if (selectedExerciseIds.includes(ex.id)) {
        if (ex.id && !ex.id.startsWith('temp_')) {
          newlyDeleted.push(ex.id);
        }
      } else {
        remaining.push(ex);
      }
    });

    const updated = remaining.map((ex, idx) => ({
      ...ex,
      exercise_order: idx + 1
    }));

    commitState(
      days,
      {
        ...exercises,
        [selectedDayId]: updated
      },
      deletedDayIds,
      [...deletedExerciseIds, ...newlyDeleted]
    );

    setSelectedExerciseIds([]);
    showToast('success', `Removidos ${selectedExerciseIds.length} exercícios.`);
  }, [selectedDayId, selectedExerciseIds, exercises, days, deletedDayIds, deletedExerciseIds, commitState, showToast]);

  // 8. Core Transaction Saving Engine
  const saveProtocol = useCallback(async () => {
    if (!selectedProtocol) return;
    if (!selectedProtocol.name?.trim()) {
      showToast('error', 'O nome do protocolo é obrigatório.');
      return;
    }

    setSaving(true);
    setConflictError(null);
    setAutosaveStatus('saving');

    try {
      const payloadProtocol = {
        ...selectedProtocol,
        updated_by: currentUserId,
        created_by: isCreating ? currentUserId : selectedProtocol.created_by
      };

      const result = await ProtocolService.saveCompleteProtocol(
        payloadProtocol,
        days,
        exercises,
        deletedDayIds,
        deletedExerciseIds
      );

      showToast('success', 'Protocolo e periodização salvos com sucesso!');

      setSelectedProtocol(result.protocol);
      setDays(result.days);
      setExercises(result.exercises);

      if (selectedDayId && selectedDayId.startsWith('temp_')) {
        const match = result.days.find((d) => d.day_number === days.find(x => x.id === selectedDayId)?.day_number);
        if (match) setSelectedDayId(match.id);
      }

      setIsCreating(false);
      setDeletedDayIds([]);
      setDeletedExerciseIds([]);
      setAutosaveStatus('saved');
      setTimeout(() => setAutosaveStatus('idle'), 2000);

      const freshList = await ProtocolService.list();
      setProtocols(freshList);

    } catch (err: any) {
      console.error('[useProtocolBuilder] Error saving complete protocol:', err);
      setAutosaveStatus('error');
      if (err.message && err.message.includes('alterado em outro dispositivo')) {
        setConflictError(err.message);
        showToast('error', 'Conflito detectado. O protocolo foi atualizado por outro usuário.');
      } else {
        showToast('error', err.message || 'Erro ao processar salvamento transacional.');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds, isCreating, currentUserId, selectedDayId, showToast]);

  // Force Reload Protocol to resolve conflict
  const forceReloadProtocol = useCallback(async () => {
    if (!selectedProtocol?.id) return;
    try {
      setLoading(true);
      const refreshed = await ProtocolService.getById(selectedProtocol.id);
      await loadProtocolDetails(refreshed);
      showToast('success', 'Protocolo recarregado com a versão mais recente do servidor.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Não foi possível recarregar o protocolo.');
    } finally {
      setLoading(false);
    }
  }, [selectedProtocol, loadProtocolDetails, showToast]);

  // Soft Delete
  const softDeleteProtocol = useCallback(async () => {
    if (!selectedProtocol?.id) return;
    if (!confirm('Tem certeza de que deseja realizar o soft-delete deste protocolo? Esta ação preservará a integridade histórica dos treinos.')) return;

    try {
      setSaving(true);
      await ProtocolService.softDelete(selectedProtocol.id, currentUserId);
      showToast('success', 'Protocolo arquivado com sucesso.');
      setSelectedProtocol(null);
      setIsCreating(false);
      setDays([]);
      setExercises({});
      setSelectedDayId(null);

      const freshList = await ProtocolService.list();
      setProtocols(freshList);
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao excluir protocolo.');
    } finally {
      setSaving(false);
    }
  }, [selectedProtocol, currentUserId, showToast]);

  const pasteExercises = useCallback((dayId: string, exercisesToPaste: any[]) => {
    if (!dayId || !exercisesToPaste || exercisesToPaste.length === 0) return;

    const currentExList = [...(exercises[dayId] || [])];
    const nextIndex = currentExList.length;

    const newExs = exercisesToPaste.map((ex, idx) => {
      const tempExId = `temp_ex_paste_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 3)}`;
      return {
        id: tempExId,
        day_id: dayId,
        exercise_id: ex.exercise_id,
        exercise_order: nextIndex + idx + 1,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? '10',
        rest_seconds: ex.rest_seconds ?? 60,
        load_type: ex.load_type ?? '',
        rpe: ex.rpe ?? '',
        tempo: ex.tempo ?? '',
        cadence: ex.cadence ?? '',
        notes: ex.notes ?? '',
        drop_set: ex.drop_set ?? false,
        rest_pause: ex.rest_pause ?? false,
        superset: ex.superset ?? false
      };
    });

    const nextExercises = {
      ...exercises,
      [dayId]: [...currentExList, ...newExs]
    };

    commitState(days, nextExercises);
    showToast('success', `${exercisesToPaste.length} ${exercisesToPaste.length === 1 ? 'exercício colado' : 'exercícios colados'}.`);
  }, [exercises, days, commitState, showToast]);

  // 9. Autosave Effect (debounced local autosave)
  useEffect(() => {
    if (!selectedProtocol || isCreating || loading || saving || autosaveStatus !== 'dirty') return;

    const delay = 5000; // 5 seconds of idle typing
    const handler = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        const payloadProtocol = {
          ...selectedProtocol,
          updated_by: currentUserId
        };

        const result = await ProtocolService.saveCompleteProtocol(
          payloadProtocol,
          days,
          exercises,
          deletedDayIds,
          deletedExerciseIds
        );

        setSelectedProtocol(result.protocol);
        setDays(result.days);
        setExercises(result.exercises);

        setDeletedDayIds([]);
        setDeletedExerciseIds([]);
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 2000);
      } catch (err) {
        console.error('[Autosave] Failed to auto save changes:', err);
        setAutosaveStatus('error');
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [selectedProtocol, days, exercises, deletedDayIds, deletedExerciseIds, isCreating, loading, saving, autosaveStatus, currentUserId]);

  // Calculated totals for real-time visualization with high-fidelity volume
  const totals = useMemo(() => {
    let totalExs = 0;
    let totalSets = 0;
    let totalVolume = 0;

    Object.values(exercises).forEach((list) => {
      if (Array.isArray(list)) {
        totalExs += list.length;
        list.forEach((ex) => {
          totalSets += Number(ex.sets) || 0;
          
          const repsVal = parseInt(ex.reps) || 10;
          const loadVal = parseInt(ex.load_type || '') || 0;
          totalVolume += (Number(ex.sets) || 0) * repsVal * loadVal;
        });
      }
    });

    return {
      daysCount: days.length,
      exercisesCount: totalExs,
      setsCount: totalSets,
      volumeIndex: totalVolume,
      estimatedDuration: selectedProtocol?.estimated_duration || 60,
    };
  }, [days, exercises, selectedProtocol]);

  const hasChanges = useMemo(() => {
    return history.past.length > 0 || autosaveStatus === 'dirty';
  }, [history.past.length, autosaveStatus]);

  return {
    protocols,
    exerciseLibrary,
    loading,
    saving,
    selectedProtocol,
    isCreating,
    days,
    selectedDayId,
    exercises,
    activeDayExercises: selectedDayId ? (exercises[selectedDayId] || []) : [],
    toast,
    conflictError,
    totals,
    hasChanges,
    setSelectedDayId,
    loadProtocolDetails,
    startCreateMode,
    cancelEditing: () => {
      setSelectedProtocol(null);
      setIsCreating(false);
      setDays([]);
      setExercises({});
      setSelectedDayId(null);
      setSelectedExerciseIds([]);
      setAutosaveStatus('idle');
      setHistory({ past: [], future: [] });
    },
    updateProtocolField,
    addDay,
    removeDay,
    updateDayField,
    duplicateDay,
    moveDay,
    reorderDays,
    addExercise,
    pasteExercises,
    updateExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    reorderExercises,
    moveExerciseToDay,
    saveProtocol,
    forceReloadProtocol,
    softDeleteProtocol,

    // Undo/Redo
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,

    // Autosave Status
    autosaveStatus,

    // Selection and mass actions
    selectedExerciseIds,
    toggleSelectExercise,
    selectAllExercises,
    bulkUpdateField,
    bulkDuplicate,
    bulkDelete,
    setSelectedExerciseIds
  };
};
