import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Save, 
  X, 
  Award, 
  Clock, 
  Dumbbell, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Wifi, 
  RefreshCw,
  FileText,
  Eye,
  Info,
  Layers,
  Sparkles,
  MapPin,
  Undo2,
  Redo2,
  Copy,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { useProtocolBuilder } from '../hooks/useProtocolBuilder';
import { ProtocolHeader } from './ProtocolHeader';
import { ProtocolDays } from './ProtocolDays';
import { ProtocolExerciseList } from './ProtocolExerciseList';
import { ProtocolToolbar } from './ProtocolToolbar';
import { motion, AnimatePresence } from 'motion/react';

export const ProtocolBuilder40: React.FC = () => {
  const {
    protocols,
    exerciseLibrary,
    loading,
    saving,
    selectedProtocol,
    isCreating,
    days,
    selectedDayId,
    exercises,
    activeDayExercises,
    toast,
    conflictError,
    totals,
    hasChanges,
    setSelectedDayId,
    loadProtocolDetails,
    startCreateMode,
    cancelEditing,
    updateProtocolField,
    addDay,
    removeDay,
    duplicateDay,
    moveDay,
    addExercise,
    pasteExercises,
    updateExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    saveProtocol,
    forceReloadProtocol,
    softDeleteProtocol,

    // Advanced features
    undo,
    redo,
    canUndo,
    canRedo,
    autosaveStatus,
    selectedExerciseIds,
    toggleSelectExercise,
    selectAllExercises,
    bulkUpdateField,
    bulkDuplicate,
    bulkDelete,
    setSelectedExerciseIds,
    reorderDays,
    updateDayField,
    reorderExercises,
    moveExerciseToDay
  } = useProtocolBuilder();

  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Tab state: 'info' | 'days' | 'exercises' | 'metrics'
  const [activeMobileTab, setActiveMobileTab] = useState<'info' | 'days' | 'exercises' | 'metrics'>('exercises');

  // Toggle advanced protocol configuration fields
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local clipboard state for copying exercises
  const [copiedExerciseData, setCopiedExerciseData] = useState<any[]>([]);

  // Productivity stopwatch
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (selectedProtocol || isCreating) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedProtocol, isCreating]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}m ${remainingSecs.toString().padStart(2, '0')}s`;
  };

  // Helper function to focus exercise search input
  const handleFocusSearch = () => {
    setActiveMobileTab('exercises');
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Pesquisar & Adicionar"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  // Function to handle keyboard copying
  const handleCopy = useCallback(() => {
    if (!selectedDayId || selectedExerciseIds.length === 0) return;
    const toCopy = activeDayExercises.filter(ex => selectedExerciseIds.includes(ex.id));
    if (toCopy.length > 0) {
      setCopiedExerciseData(toCopy);
    }
  }, [selectedDayId, selectedExerciseIds, activeDayExercises]);

  const handlePaste = useCallback(() => {
    if (!selectedDayId || copiedExerciseData.length === 0) return;
    pasteExercises(selectedDayId, copiedExerciseData);
  }, [selectedDayId, copiedExerciseData, pasteExercises]);

  // Muscular Distribution calculations
  const muscleDistribution = useMemo(() => {
    const dist: Record<string, number> = {
      'Peitoral': 0,
      'Costas': 0,
      'Quadríceps': 0,
      'Posterior': 0,
      'Glúteos': 0,
      'Ombros': 0,
      'Bíceps': 0,
      'Tríceps': 0,
      'Panturrilhas': 0,
      'Core': 0,
    };

    const exerciseMap = new Map();
    exerciseLibrary.forEach(ex => exerciseMap.set(ex.id, ex));

    Object.values(exercises).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((pEx) => {
          const details = exerciseMap.get(pEx.exercise_id);
          const muscle = details?.muscle_group || 'Outros';
          const sets = Number(pEx.sets) || 0;

          if (muscle.includes('Peito') || muscle.includes('Peitoral')) {
            dist['Peitoral'] += sets;
          } else if (muscle.includes('Costas') || muscle.includes('Dorsal')) {
            dist['Costas'] += sets;
          } else if (muscle.includes('Quadriceps') || muscle.includes('Quadríceps') || muscle.includes('Anterior de Coxa')) {
            dist['Quadríceps'] += sets;
          } else if (muscle.includes('Posterior') || muscle.includes('Isquiotibiais')) {
            dist['Posterior'] += sets;
          } else if (muscle.includes('Glúteo') || muscle.includes('Glúteos')) {
            dist['Glúteos'] += sets;
          } else if (muscle.includes('Ombro') || muscle.includes('Deltoide') || muscle.includes('Ombros')) {
            dist['Ombros'] += sets;
          } else if (muscle.includes('Bíceps') || muscle.includes('Biceps')) {
            dist['Bíceps'] += sets;
          } else if (muscle.includes('Tríceps') || muscle.includes('Triceps')) {
            dist['Tríceps'] += sets;
          } else if (muscle.includes('Panturrilha') || muscle.includes('Panturrilhas') || muscle.includes('Gastrocnêmio')) {
            dist['Panturrilhas'] += sets;
          } else if (muscle.includes('Abdom') || muscle.includes('Core') || muscle.includes('Abdômen') || muscle.includes('Lombar')) {
            dist['Core'] += sets;
          }
        });
      }
    });

    return dist;
  }, [exercises, exerciseLibrary]);

  // Balance Indicators
  const balanceIndicators = useMemo(() => {
    const indicators: { type: 'success' | 'warning'; text: string }[] = [];
    
    const peitoral = (muscleDistribution['Peitoral'] || 0) as number;
    const quadriceps = (muscleDistribution['Quadríceps'] || 0) as number;
    const posterior = (muscleDistribution['Posterior'] || 0) as number;
    const panturrilhas = (muscleDistribution['Panturrilhas'] || 0) as number;
    const totalSets = Object.values(muscleDistribution).reduce((a, b) => (a as number) + ((b || 0) as number), 0) as number;

    if (totalSets === 0) {
      return [{ type: 'warning' as const, text: 'Adicione exercícios para ver o balanço' }];
    }

    if (totalSets > 60) {
      indicators.push({ type: 'warning' as const, text: 'Volume semanal total muito alto (>60 séries)' });
    }
    if (posterior < 6) {
      indicators.push({ type: 'warning' as const, text: 'Posterior pouco estimulado (<6 séries)' });
    }
    if (panturrilhas === 0) {
      indicators.push({ type: 'warning' as const, text: 'Panturrilhas ausentes' });
    }
    if (peitoral > 24) {
      indicators.push({ type: 'warning' as const, text: 'Peitoral acima do recomendado (>24 séries)' });
    }
    if (quadriceps > 0 && posterior > 0 && quadriceps / posterior > 2) {
      indicators.push({ type: 'warning' as const, text: 'Desbalanço: Quadríceps muito maior que Posterior' });
    }

    if (indicators.length === 0) {
      indicators.push({ type: 'success' as const, text: 'Excelente Equilíbrio Biomecânico' });
    }

    return indicators;
  }, [muscleDistribution]);

  // Keyboard Shortcuts listener for high-productivity workouts structuring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Save (Ctrl+S or Cmd+S)
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProtocol();
      }

      // 2. Undo (Ctrl+Z or Cmd+Z)
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      // 3. Redo (Ctrl+Shift+Z or Ctrl+Y)
      if ((isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') || (isCmdOrCtrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }

      // 4. Copy (Ctrl+C or Cmd+C)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c' && !isInput) {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          handleCopy();
        }
      }

      // 5. Paste (Ctrl+V or Cmd+V)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v' && !isInput) {
        if (copiedExerciseData.length > 0) {
          e.preventDefault();
          handlePaste();
        }
      }

      // 6. Duplicate Day (Ctrl+Shift+D or Cmd+Shift+D)
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
        if (selectedDayId) {
          e.preventDefault();
          const dayObj = days.find(d => d.id === selectedDayId);
          if (dayObj) {
            duplicateDay(dayObj);
          }
        }
      }

      // Safeguard input typing from triggering other navigation/bulk commands
      if (isInput) {
        if (e.key === 'Escape') {
          if (selectedExerciseIds.length > 0) {
            e.preventDefault();
            setSelectedExerciseIds([]);
          }
        }
        return;
      }

      // 7. Duplicate Selection (Ctrl+D or Cmd+D) - Only when active exercises selected
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          bulkDuplicate();
        }
      }

      // 8. Delete (Delete or Backspace) - When active exercises selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          bulkDelete();
        }
      }

      // 9. Escape (to clear select lists or cancel workflow)
      if (e.key === 'Escape') {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          setSelectedExerciseIds([]);
        } else if (selectedProtocol || isCreating) {
          e.preventDefault();
          cancelEditing();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedProtocol, 
    isCreating, 
    selectedExerciseIds, 
    saveProtocol, 
    undo, 
    redo, 
    bulkDuplicate, 
    bulkDelete, 
    setSelectedExerciseIds, 
    cancelEditing,
    selectedDayId,
    copiedExerciseData,
    handleCopy,
    handlePaste,
    days,
    duplicateDay
  ]);

  // Filtered protocols list
  const filteredProtocols = useMemo(() => {
    return protocols.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(searchLower) ||
        (p.description || '').toLowerCase().includes(searchLower) ||
        (p.goal || '').toLowerCase().includes(searchLower)
      );
    });
  }, [protocols, searchQuery]);

  // Selected Day Title
  const activeDayTitle = useMemo(() => {
    const found = days.find((d) => d.id === selectedDayId);
    return found ? found.title || 'Este Dia' : 'Este Dia';
  }, [days, selectedDayId]);

  return (
    <div className="w-full flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {!selectedProtocol && !isCreating ? (
          /* =========================================================================
             1. WELCOME & LIST VIEW (NO SELECTION)
             ========================================================================= */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Header Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  KYRON Protocol Builder <span className="text-blue-500 text-xs font-bold px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200">v4.0</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Arquitetura puramente relacional com Sincronização Realtime e Transações Seguras de Alteração.
                </p>
              </div>

              <button
                type="button"
                onClick={startCreateMode}
                className="h-11 px-5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 border-none cursor-pointer self-start sm:self-center"
              >
                <Plus size={16} />
                Novo Protocolo
              </button>
            </div>

            {/* Protocols Grid list */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar protocolos cadastrados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Carregando Protocolos...</span>
                </div>
              ) : filteredProtocols.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center gap-3">
                  <Award size={36} className="text-slate-300 animate-pulse" />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">Nenhum protocolo encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Crie um novo protocolo para iniciar</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProtocols.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => loadProtocolDetails(p)}
                      className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                    >
                      {/* Image section */}
                      <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                        <img
                          src={p.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop"}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            p.category === 'premium' 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-slate-900 text-white'
                          }`}>
                            {p.category}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-md">
                            V{p.version}
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {p.description || "Sem descrição disponível."}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-100/60 pt-3">
                          <span className="flex items-center gap-1">
                            <Dumbbell size={12} className="text-slate-400" />
                            {p.goal || 'Geral'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {p.duration_weeks || 4} sem
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {p.estimated_duration || 60} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             2. EDITING / CREATING THREE-COLUMN WORKSPACE
             ========================================================================= */
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Fixed Action Toolbar (Sticky on top on Desktop, Fixed on bottom on Mobile) */}
            <div className="sticky top-0 lg:relative z-40 bg-white/95 backdrop-blur-md shadow-md lg:shadow-none border border-slate-200/80 lg:border-none rounded-2xl p-3 lg:p-0 flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                  title="Voltar para a Lista"
                >
                  <X size={15} />
                </button>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Builder Workspace 4.1
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {isCreating ? 'Novo Protocolo' : `Editando: ${selectedProtocol?.name || 'Protocolo'}`}
                  </p>
                </div>
              </div>

              {/* Toolbar Actions container */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Desfazer (Undo) */}
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className={`h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    canUndo
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                      : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Desfazer alteração (Ctrl + Z)"
                >
                  <Undo2 size={12} />
                  Desfazer
                </button>

                {/* Refazer (Redo) */}
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className={`h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    canRedo
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                      : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Refazer alteração (Ctrl + Shift + Z)"
                >
                  <Redo2 size={12} />
                  Refazer
                </button>

                {/* Duplicar Dia ou Exercícios */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedExerciseIds.length > 0) {
                      bulkDuplicate();
                    } else if (selectedDayId) {
                      const dayObj = days.find(d => d.id === selectedDayId);
                      if (dayObj) duplicateDay(dayObj);
                    }
                  }}
                  disabled={!selectedDayId}
                  className={`h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                  title="Duplica seleção ativa (Dia ou Exercícios)"
                >
                  <Copy size={12} />
                  Duplicar
                </button>

                {/* Excluir Dia ou Exercícios */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedExerciseIds.length > 0) {
                      bulkDelete();
                    } else if (selectedDayId) {
                      removeDay(selectedDayId);
                    }
                  }}
                  disabled={!selectedDayId}
                  className={`h-9 px-3 bg-rose-50 border border-rose-200 hover:bg-rose-100/50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                  title="Exclui seleção ativa (Dia ou Exercícios)"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>

                {/* Adicionar Dia */}
                <button
                  type="button"
                  onClick={addDay}
                  className="h-9 px-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={12} />
                  Add Dia
                </button>

                {/* Adicionar Exercício / Buscar */}
                <button
                  type="button"
                  onClick={handleFocusSearch}
                  disabled={!selectedDayId}
                  className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Search size={12} />
                  Add Exercício
                </button>

                {/* Salvar Tudo */}
                <button
                  type="button"
                  onClick={saveProtocol}
                  disabled={saving}
                  className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    hasChanges
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-500/10'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/30'
                  }`}
                >
                  {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                  Salvar
                </button>
              </div>
            </div>

            {/* Conflict Alert overlay if any */}
            {conflictError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-black text-rose-800">Conflito de Versão Detectado</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">{conflictError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={forceReloadProtocol}
                  className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-none cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} />
                  Forçar Recarga
                </button>
              </div>
            )}

            {/* Mobile-Only Segmented View Switcher Tabs */}
            <div className="flex lg:hidden bg-slate-100 border border-slate-200/60 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveMobileTab('info')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  activeMobileTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText size={13} />
                Geral
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('days')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  activeMobileTab === 'days' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Calendar size={13} />
                Dias ({days.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('exercises')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  activeMobileTab === 'exercises' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Dumbbell size={13} />
                Treino
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('metrics')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  activeMobileTab === 'metrics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Activity size={13} />
                Métricas
              </button>
            </div>

            {/* Main Workspace Grid: Four Columns on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ==========================================
                 COLUMN 1: PROTOCOL GENERAL DATA (3 Cols)
                 ========================================== */}
              <div className={`lg:col-span-3 bg-white rounded-3xl border border-slate-200/50 shadow-sm p-5 flex flex-col gap-5 ${
                activeMobileTab === 'info' ? 'block' : 'hidden lg:flex'
              }`}>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-500" />
                    Protocolo
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Identidade & Escopo</p>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nome do Protocolo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Hipertrofia Avançada Masculina"
                      value={selectedProtocol?.name || ''}
                      onChange={(e) => updateProtocolField('name', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  {/* Description field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Diretrizes & Foco</label>
                    <textarea
                      placeholder="Ex: Foco no ganho de massa, público intermediário..."
                      value={selectedProtocol?.description || ''}
                      onChange={(e) => updateProtocolField('description', e.target.value)}
                      rows={2}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Goal & Weeks */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Objetivo</label>
                      <input
                        type="text"
                        placeholder="Hipertrofia"
                        value={selectedProtocol?.goal || ''}
                        onChange={(e) => updateProtocolField('goal', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Semanas (Ciclo)</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedProtocol?.duration_weeks || 4}
                        onChange={(e) => updateProtocolField('duration_weeks', Number(e.target.value) || 1)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-center"
                      />
                    </div>
                  </div>

                  {/* Advanced Configuration Accordion Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between py-2 text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings size={12} className={showAdvanced ? 'text-blue-500 animate-spin-slow' : ''} />
                      Configurações Avançadas
                    </span>
                    {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {/* Advanced Collapsible content */}
                  <AnimatePresence initial={false}>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden space-y-4 pt-1"
                      >
                        {/* Image URL field */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Capa do Protocolo (URL)</label>
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={selectedProtocol?.image_url || ''}
                              onChange={(e) => updateProtocolField('image_url', e.target.value)}
                              className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                            <ImageIcon size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>

                        {/* Category & Status */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Categoria</label>
                            <select
                              value={selectedProtocol?.category}
                              onChange={(e) => updateProtocolField('category', e.target.value)}
                              className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="public">Gratuita</option>
                              <option value="premium">Premium</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Status</label>
                            <select
                              value={selectedProtocol?.status}
                              onChange={(e) => updateProtocolField('status', e.target.value)}
                              className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="draft">Rascunho</option>
                              <option value="published">Publicado</option>
                            </select>
                          </div>
                        </div>

                        {/* Difficulty & Est. Duration */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Dificuldade</label>
                            <select
                              value={selectedProtocol?.difficulty || 'Iniciante'}
                              onChange={(e) => updateProtocolField('difficulty', e.target.value)}
                              className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="Iniciante">Iniciante</option>
                              <option value="Intermediário">Intermediário</option>
                              <option value="Avançado">Avançado</option>
                              <option value="Elite">Elite</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Duração (Min)</label>
                            <input
                              type="number"
                              min={1}
                              value={selectedProtocol?.estimated_duration || 60}
                              onChange={(e) => updateProtocolField('estimated_duration', Number(e.target.value) || 1)}
                              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none text-center"
                            />
                          </div>
                        </div>

                        {/* Environment & Active Switch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Ambiente</label>
                            <select
                              value={selectedProtocol?.environment || 'Academia'}
                              onChange={(e) => updateProtocolField('environment', e.target.value)}
                              className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="Academia">Academia</option>
                              <option value="Home Gym">Home Gym</option>
                              <option value="Calistenia / Parque">Parque</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 mt-4 bg-slate-50 px-3 rounded-xl border border-slate-100/60 h-10">
                            <input
                              type="checkbox"
                              id="isActiveToggle"
                              checked={selectedProtocol?.is_active !== false}
                              onChange={(e) => updateProtocolField('is_active', e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-200 cursor-pointer"
                            />
                            <label htmlFor="isActiveToggle" className="text-[9px] font-black uppercase tracking-wider text-slate-500 cursor-pointer select-none">
                              Ativo
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ==========================================
                 COLUMN 2: PROTOCOL DAYS (2 Cols)
                 ========================================== */}
              <div className={`lg:col-span-2 ${
                activeMobileTab === 'days' ? 'block' : 'hidden lg:block'
              }`}>
                <ProtocolDays
                  days={days}
                  selectedDayId={selectedDayId}
                  onSelectDay={setSelectedDayId}
                  onAddDay={addDay}
                  onRemoveDay={removeDay}
                  onDuplicateDay={duplicateDay}
                  onMoveDay={moveDay}
                  onUpdateDayField={updateDayField}
                  onReorderDays={reorderDays}
                  onMoveExerciseToDay={moveExerciseToDay}
                />
              </div>

              {/* ==========================================
                 COLUMN 3: SELECT DAY EXERCISES LIST (4 Cols)
                 ========================================== */}
              <div className={`lg:col-span-4 ${
                activeMobileTab === 'exercises' ? 'block' : 'hidden lg:block'
              }`}>
                {selectedDayId ? (
                  <ProtocolExerciseList
                    exercises={activeDayExercises}
                    exerciseLibrary={exerciseLibrary}
                    onAddExercise={addExercise}
                    onUpdateExercise={updateExercise}
                    onDeleteExercise={deleteExercise}
                    onDuplicateExercise={duplicateExercise}
                    onMoveExercise={moveExercise}
                    selectedDayTitle={activeDayTitle}
                    selectedDayId={selectedDayId}
                    selectedExerciseIds={selectedExerciseIds}
                    onToggleSelectExercise={toggleSelectExercise}
                    onSelectAllExercises={selectAllExercises}
                    onBulkUpdateField={bulkUpdateField}
                    onBulkDuplicate={bulkDuplicate}
                    onBulkDelete={bulkDelete}
                    onReorderExercises={reorderExercises}
                    onMoveExerciseToDay={moveExerciseToDay}
                  />
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <Calendar size={22} />
                    </div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Crie ou Selecione um Dia</h5>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mt-1.5 leading-relaxed">
                      Selecione um treino na Coluna 2 para iniciar a prescrição dos exercícios.
                    </p>
                  </div>
                )}
              </div>

              {/* ====================================================
                 COLUMN 4: SMART FIXED METRICS & ANALYTICS SIDEBAR (3 Cols)
                 ==================================================== */}
              <div className={`lg:col-span-3 flex flex-col gap-5 ${
                activeMobileTab === 'metrics' ? 'block' : 'hidden lg:flex'
              }`}>
                {/* 1. Productivity Ticking Stopwatch widget */}
                <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700/50 shrink-0">
                      <Clock size={14} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Ergonomia & Foco</h5>
                      <p className="text-xs font-bold text-slate-100 truncate mt-0.5">Tempo Ativo de Montagem</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-black tracking-tight text-white px-2.5 py-1.5 bg-slate-800 border border-slate-700/50 rounded-lg shadow-inner">
                      {formatTimer(secondsElapsed)}
                    </span>
                  </div>
                </div>

                {/* 2. Micro Stats Board */}
                <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Métricas do Ciclo</h5>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tempo Real</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Exercícios</span>
                      <p className="text-base font-black text-slate-800 mt-1">{totals.exercisesCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Séries Semanais</span>
                      <p className="text-base font-black text-slate-800 mt-1">{totals.setsCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Dias de Treino</span>
                      <p className="text-base font-black text-slate-800 mt-1">{totals.daysCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Status Sync</span>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-ping" />
                        {autosaveStatus === 'dirty' ? 'Editando' : 'Sincronizado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Muscular Distribution Progress list */}
                <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-5 flex flex-col gap-4">
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Volume de Treino Semanal</h5>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Séries por grupo muscular (Alvo: 10-20 séries)</p>
                  </div>
                  <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {Object.entries(muscleDistribution).map(([muscle, setsRaw]) => {
                      const sets = setsRaw as number;
                      // Target ranges checklist: Under (sets < 10), Optimal (10 <= sets <= 20), Over (sets > 20)
                      let rangeStatus = 'Insuficiente';
                      let barColor = 'bg-sky-400';
                      if (sets >= 10 && sets <= 20) {
                        rangeStatus = 'Ideal';
                        barColor = 'bg-blue-600';
                      } else if (sets > 20) {
                        rangeStatus = 'Sobrecarga';
                        barColor = 'bg-amber-500';
                      } else if (sets === 0) {
                        rangeStatus = 'Zero';
                        barColor = 'bg-slate-200';
                      }

                      return (
                        <div key={muscle} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-wider">
                            <span>{muscle}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono text-[10px]">{sets} {sets === 1 ? 'série' : 'séries'}</span>
                              {sets > 0 && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  rangeStatus === 'Ideal'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : rangeStatus === 'Sobrecarga'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-sky-50 text-sky-600 border border-sky-100'
                                }`}>
                                  {rangeStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 border border-slate-200/20 rounded-full overflow-hidden relative">
                            {/* Tick mark at optimal range starts (10 sets) and ends (20 sets) */}
                            <div className="absolute left-[41.6%] top-0 bottom-0 w-px bg-white/40 z-10" /> {/* 10/24 */}
                            <div className="absolute left-[83.3%] top-0 bottom-0 w-px bg-white/40 z-10" /> {/* 20/24 */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (sets / 24) * 100)}%` }}
                              className={`h-full rounded-full transition-all ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Workout Balance dynamic alerts */}
                <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-5 flex flex-col gap-4">
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Diagnóstico Biomecânico</h5>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Balanciamento Científico de Cargas</p>
                  </div>
                  <div className="space-y-2.5">
                    {balanceIndicators.map((ind, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 text-[10px] font-black uppercase tracking-wider leading-relaxed ${
                          ind.type === 'success'
                            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                            : 'bg-amber-50/50 border-amber-100 text-amber-700'
                        }`}
                      >
                        {ind.type === 'success' ? (
                          <CheckCircle2 size={13} className="shrink-0 text-emerald-600 mt-0.5" />
                        ) : (
                          <AlertTriangle size={13} className="shrink-0 text-amber-600 animate-pulse mt-0.5" />
                        )}
                        <span className="leading-tight">{ind.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-scale-up ${
          toast.type === 'success'
            ? 'bg-emerald-500 border-emerald-600 text-white'
            : 'bg-rose-500 border-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
export default ProtocolBuilder40;
