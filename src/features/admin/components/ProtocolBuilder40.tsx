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
  Image as ImageIcon,
  CloudLightning,
  Send,
  ArrowLeft,
  Cloud,
  Edit2
} from 'lucide-react';
import { useProtocolBuilder } from '../hooks/useProtocolBuilder';
import { ProtocolHeader } from './ProtocolHeader';
import { ProtocolDays } from './ProtocolDays';
import { ProtocolExerciseList } from './ProtocolExerciseList';
import { ProtocolToolbar } from './ProtocolToolbar';
import { motion, AnimatePresence } from 'motion/react';
import { mediaApi } from '../api/mediaApi';

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

  // Collapsible drawer and sidebar states for high-efficiency layout
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Local clipboard state for copying exercises
  const [copiedExerciseData, setCopiedExerciseData] = useState<any[]>([]);

  // Protocol image uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleProtocolImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Formato inválido. Use JPG, JPEG, PNG ou WEBP.');
      return;
    }

    // Validate size: Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('O arquivo é muito grande. Tamanho máximo permitido: 5MB.');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const path = `protocol-${selectedProtocol?.id || 'new'}`;
      // Try 'protocol-images' bucket first
      const publicUrl = await mediaApi.uploadAsset(file, path, 'protocol-images');
      
      if (!publicUrl || publicUrl === 'undefined' || publicUrl === 'null') {
        throw new Error('Retornou URL inválida');
      }

      updateProtocolField('image_url', publicUrl);
    } catch (err: any) {
      console.error('[PROTOCOL_IMAGE_UPLOAD_ERROR]', err);
      try {
        console.log('[PROTOCOL_IMAGE_UPLOAD] Retrying with fallback bucket exercise-images...');
        const path = `protocol-${selectedProtocol?.id || 'new'}`;
        const publicUrl = await mediaApi.uploadAsset(file, path, 'exercise-images');
        if (!publicUrl || publicUrl === 'undefined' || publicUrl === 'null') {
          throw new Error('Retornou URL inválida no fallback');
        }
        updateProtocolField('image_url', publicUrl);
      } catch (fallbackErr: any) {
        setUploadError('Erro ao enviar imagem. Tente novamente.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

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
    const foundIdx = days.findIndex((d) => d.id === selectedDayId);
    if (foundIdx === -1) return 'Este Dia';
    const found = days[foundIdx];
    const letter = String.fromCharCode(65 + foundIdx); // A, B, C, etc.
    return found.title || `Treino ${letter}`;
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
             2. EDITING / CREATING TWO-COLUMN DESKTOP WORKSPACE
             ========================================================================= */
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-5 relative min-h-screen animate-fade-in"
          >
            {/* Central Big Modal for Protocol Metadata */}
            <AnimatePresence>
              {isDrawerOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                  {/* Backdrop overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDrawerOpen(false)}
                    className="fixed inset-0 bg-slate-950/50 backdrop-blur-md"
                  />
                  
                  {/* Modal Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden text-slate-800"
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          Configurações Gerais
                        </span>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mt-1">
                          Dados do Protocolo
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Modal Body - Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                      
                      {/* Top Row: Visual Cover & Main Info (Grid) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* Column 1: Image and Presets (5 cols) */}
                        <div className="md:col-span-5 flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Imagem de Capa</label>
                          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                            <img
                              src={selectedProtocol?.image_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600'}
                              alt={selectedProtocol?.name || 'Protocolo'}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-white bg-blue-600 px-2.5 py-0.5 rounded-md shadow">
                                {selectedProtocol?.goal || 'Geral'}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700 shadow">
                                v{selectedProtocol?.version || 1}
                              </span>
                            </div>
                          </div>

                          {/* Preset Images Buttons */}
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Escolher presets de capa</span>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { name: 'Força', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400' },
                                { name: 'Corrida', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=400' },
                                { name: 'Funcional', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400' },
                                { name: 'Mind', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400' },
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => updateProtocolField('image_url', preset.url)}
                                  className={`text-[9px] font-bold py-1 px-1.5 rounded-lg border text-center transition-all cursor-pointer truncate ${
                                    selectedProtocol?.image_url === preset.url
                                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-black'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Upload image button */}
                          <div className="mt-1 flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-dashed border-blue-300 rounded-xl px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all text-center">
                              <ImageIcon size={14} className="shrink-0" />
                              {uploadingImage ? 'Enviando...' : 'Enviar Imagem Própria (Max 5MB)'}
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleProtocolImageUpload}
                                disabled={uploadingImage}
                                className="hidden"
                              />
                            </label>
                            <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-wider mt-0.5">
                              Recomendado: 1408 × 768. Para melhor resultado, use imagem em 1408 × 768.
                            </p>
                            {uploadError && (
                              <p className="text-[10px] font-bold text-rose-500 leading-tight mt-0.5">{uploadError}</p>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Protocol Name & Description (7 cols) */}
                        <div className="md:col-span-7 flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome do Protocolo</label>
                            <input
                              id="protocol-name-input"
                              type="text"
                              required
                              placeholder="Ex: Protocolo de Hipertrofia Avançada"
                              value={selectedProtocol?.name || ''}
                              onChange={(e) => updateProtocolField('name', e.target.value)}
                              className="h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Diretrizes e Notas Gerais</label>
                            <textarea
                              placeholder="Adicione diretrizes, recomendações de cardio ou foco principal deste protocolo..."
                              value={selectedProtocol?.description || ''}
                              onChange={(e) => updateProtocolField('description', e.target.value)}
                              className="w-full flex-1 min-h-[100px] p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-slate-100" />

                      {/* Bottom Row: Specs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Objetivo</label>
                          <input
                            type="text"
                            placeholder="Ex: Hipertrofia, Definição"
                            value={selectedProtocol?.goal || ''}
                            onChange={(e) => updateProtocolField('goal', e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Duração (Semanas)</label>
                          <input
                            type="number"
                            min={1}
                            max={52}
                            value={selectedProtocol?.duration_weeks || 4}
                            onChange={(e) => updateProtocolField('duration_weeks', Number(e.target.value) || 1)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dificuldade</label>
                          <select
                            value={selectedProtocol?.difficulty || 'Iniciante'}
                            onChange={(e) => updateProtocolField('difficulty', e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
                          >
                            <option value="Iniciante">Iniciante</option>
                            <option value="Intermediário">Intermediário</option>
                            <option value="Avançado">Avançado</option>
                            <option value="Elite">Elite</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categoria de Acesso</label>
                          <select
                            value={selectedProtocol?.category || 'public'}
                            onChange={(e) => updateProtocolField('category', e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
                          >
                            <option value="public">Gratuita</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status de Publicação</label>
                          <select
                            value={selectedProtocol?.status || 'draft'}
                            onChange={(e) => updateProtocolField('status', e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
                          >
                            <option value="draft">Rascunho</option>
                            <option value="published">Publicado</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">URL da Imagem Personalizada</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={selectedProtocol?.image_url || ''}
                            onChange={(e) => updateProtocolField('image_url', e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>

                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none shadow-md shadow-slate-900/10"
                      >
                        Salvar e Fechar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Compact Header (Max 72px) */}
            <div className="flex items-center justify-between h-[72px] min-h-[72px] px-6 bg-white border-b border-slate-200 shrink-0 select-none mb-4 rounded-3xl shadow-sm">
              {/* Left Section: Back button & Protocol Name */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                  title="Voltar para a Lista"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0 flex items-center gap-2">
                  <div className="min-w-0">
                    <h1 className="text-sm font-black text-slate-900 truncate leading-none">
                      {selectedProtocol?.name || 'Novo Protocolo'}
                    </h1>
                    <span className="inline-block text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                      Kyron Protocol Builder 6.0
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(true);
                      setTimeout(() => {
                        const input = document.getElementById('protocol-name-input');
                        if (input) {
                          (input as HTMLInputElement).focus();
                          (input as HTMLInputElement).select();
                        }
                      }, 150);
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Editar nome do protocolo"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>

              {/* Center Section: Sync Status & Discreet Undo/Redo */}
              <div className="hidden md:flex items-center gap-4">
                {/* Realtime Sync Status */}
                <div className="flex items-center gap-1.5 text-slate-500">
                  {saving ? (
                    <RefreshCw size={11} className="animate-spin text-blue-500" />
                  ) : hasChanges ? (
                    <CloudLightning size={11} className="text-amber-500 animate-pulse" />
                  ) : (
                    <Cloud size={11} className="text-emerald-500" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {saving ? 'Salvando...' : hasChanges ? 'Modificações não salvas' : 'Sincronizado'}
                  </span>
                </div>

                {/* Discreet Undo / Redo buttons */}
                <div className="flex items-center gap-1 bg-slate-100/60 p-0.5 rounded-lg border border-slate-200/50">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded-md border-none bg-transparent transition-all ${
                      canUndo
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="Desfazer (Ctrl + Z)"
                  >
                    <Undo2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded-md border-none bg-transparent transition-all ${
                      canRedo
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="Refazer (Ctrl + Shift + Z)"
                  >
                    <Redo2 size={12} />
                  </button>
                </div>
              </div>

              {/* Right Section: Main Actions & Sidebar/Drawer toggles */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Dados do Protocolo (Left Drawer Toggle) */}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDrawerOpen
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Dados do Protocolo (Configurações)"
                >
                  <Settings size={14} />
                </button>

                {/* Painel Inteligente (Right Sidebar Toggle) */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isSidebarOpen
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Painel Inteligente (Métricas)"
                >
                  <Activity size={14} />
                </button>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                {/* Salvar Rascunho (Draft) */}
                <button
                  type="button"
                  onClick={saveProtocol}
                  disabled={saving}
                  className={`h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    hasChanges
                      ? 'bg-white border border-slate-250 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-sm'
                      : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  {saving ? <RefreshCw size={11} className="animate-spin text-slate-400" /> : <Save size={11} />}
                  Salvar
                </button>

                {/* Publicar */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    updateProtocolField('status', 'published');
                    setTimeout(() => {
                      saveProtocol();
                    }, 100);
                  }}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Send size={11} />
                  Publicar
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

            {/* Main Workspace: 2-Column Responsive Layout */}
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
              
              {/* EDITOR COLUMN (occupies 72% if Sidebar is open, 100% if closed!) */}
              <div className={`w-full flex flex-col gap-4 transition-all duration-300 ${
                isSidebarOpen ? 'lg:w-[72%]' : 'lg:w-[100%]'
              }`}>
                {/* Horizontal day tabs at the top of active editor area */}
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
                  exercises={exercises}
                />

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
                    onUpdateDayField={updateDayField}
                  />
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <Calendar size={22} />
                    </div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Crie ou Selecione um Treino</h5>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mt-1.5 leading-relaxed">
                      Selecione uma aba de treino acima ou crie um novo treino para iniciar a prescrição de exercícios.
                    </p>
                  </div>
                )}
              </div>

              {/* SMART ANALYTICS COLLAPSIBLE SIDEBAR (28% width) */}
              {isSidebarOpen && (
                <div className={`w-full lg:w-[28%] shrink-0 bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col ${
                  activeMobileTab === 'metrics' ? 'block' : 'hidden lg:flex'
                }`}>
                  {/* Sidebar Header */}
                  <div className="p-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Painel de Inteligência
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase border-none bg-transparent cursor-pointer hidden lg:block"
                    >
                      Ocultar
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Section 1: Active Timer */}
                    <div className="p-4 border-b border-slate-150 bg-slate-50/40">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tempo de Edição</span>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock size={11} className="text-blue-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-black text-slate-700 truncate">{formatTimer(secondsElapsed)}</span>
                        </div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1 shrink-0 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                          Ativo
                        </span>
                      </div>
                    </div>

                    {/* Section 2: Resumo do Ciclo */}
                    <div className="p-4 border-b border-slate-150">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Volume Total do Ciclo</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 text-center shadow-inner">
                          <p className="text-[15px] font-black text-slate-800 leading-none">{totals.exercisesCount}</p>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">Exercícios</span>
                        </div>
                        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 text-center shadow-inner">
                          <p className="text-[15px] font-black text-slate-800 leading-none">{totals.setsCount}</p>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">Séries</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Weekly Volume distribution with WARNINGS & COACH INSTRUCTIONS */}
                    <div className="p-4 border-b border-slate-150 flex-1 overflow-y-auto pr-2 scrollbar-none space-y-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Distribuição de Volume Semanal</span>
                      
                      <div className="space-y-3 pt-1">
                        {Object.entries(muscleDistribution).map(([muscle, setsRaw]) => {
                          const sets = setsRaw as number;
                          
                          // Let's compute custom coaching tips and alerts
                          let barColor = 'bg-slate-200';
                          let rangeStatus = 'Sem séries';
                          let coachTip = 'Nenhum exercício prescrito para este grupo.';
                          
                          if (sets > 0 && sets < 10) {
                            barColor = 'bg-amber-400';
                            rangeStatus = 'Volume Baixo';
                            coachTip = `⚠ Volume insuficiente. Adicione +${10 - sets} séries para alcançar estímulo mínimo.`;
                          } else if (sets >= 10 && sets <= 20) {
                            barColor = 'bg-emerald-500';
                            rangeStatus = 'Faixa Ideal';
                            coachTip = '✔ Hipertrofia ótima. Distribuição muscular perfeita.';
                          } else if (sets > 20) {
                            barColor = 'bg-rose-500';
                            rangeStatus = 'Volume Elevado';
                            coachTip = `⚠ Atenção: Risco de overtraining. Sugerido reduzir -${sets - 20} séries.`;
                          }

                          return (
                            <div key={muscle} className="space-y-1 bg-slate-50/40 p-2 rounded-xl border border-slate-100/60">
                              <div className="flex items-center justify-between text-[9px] font-black text-slate-700 uppercase tracking-wider">
                                <span>{muscle}</span>
                                <span className="text-[8px] font-black text-slate-400">{sets} s. ({rangeStatus})</span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (sets / 24) * 100)}%` }}
                                  className={`h-full rounded-full ${barColor}`}
                                />
                              </div>

                              {/* Intelligent Coach Tip Text */}
                              <p className="text-[8px] font-semibold leading-normal text-slate-500 mt-1">
                                {coachTip}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 4: Diagnóstico Biomecânico Alerts */}
                    <div className="p-4 max-h-[180px] overflow-y-auto pr-2 scrollbar-none shrink-0 border-t border-slate-100 bg-slate-50/10">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diagnóstico Biomecânico</span>
                      <div className="space-y-1.5">
                        {balanceIndicators.map((ind, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border flex items-start gap-1.5 text-[9px] font-bold uppercase tracking-wider leading-tight ${
                              ind.type === 'success'
                                ? 'bg-emerald-50/40 border-emerald-100 text-emerald-700'
                                : 'bg-amber-50/40 border-amber-100 text-amber-700'
                            }`}
                          >
                            {ind.type === 'success' ? (
                              <CheckCircle2 size={10} className="shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                              <AlertTriangle size={10} className="shrink-0 text-amber-600 animate-pulse mt-0.5" />
                            )}
                            <span className="leading-tight truncate block w-full">{ind.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
