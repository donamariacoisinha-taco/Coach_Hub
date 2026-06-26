import React, { useState, useMemo, useEffect } from 'react';
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

      // 4. Duplicate (Ctrl+D or Cmd+D) - Only when active exercises selected
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          bulkDuplicate();
        }
      }

      // 5. Delete (Delete or Backspace) - When active exercises selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedExerciseIds.length > 0) {
          e.preventDefault();
          bulkDelete();
        }
      }

      // 6. Escape (to clear select lists or cancel workflow)
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
    cancelEditing
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
            {/* Header bar */}
            <ProtocolHeader
              selectedProtocol={selectedProtocol}
              isCreating={isCreating}
              isSaving={saving}
              onCancel={cancelEditing}
              onSave={saveProtocol}
              onDelete={selectedProtocol?.id ? softDeleteProtocol : undefined}
              hasChanges={hasChanges}
            />

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

            {/* Protocol Stat Summary Toolbar */}
            <ProtocolToolbar
              daysCount={totals.daysCount}
              exercisesCount={totals.exercisesCount}
              setsCount={totals.setsCount}
              volumeIndex={totals.volumeIndex}
              estimatedDuration={totals.estimatedDuration}
              difficulty={selectedProtocol?.difficulty || 'Iniciante'}
              category={selectedProtocol?.category || 'Pública'}
              durationWeeks={selectedProtocol?.duration_weeks || 4}
              autosaveStatus={autosaveStatus}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
            />

            {/* Main Workspace Grid: Three Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ==========================================
                 COLUMN 1: PROTOCOL GENERAL DATA (4 Cols)
                 ========================================== */}
              <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-5">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Dados do Protocolo</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações Principais</p>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Protocolo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Hipertrofia Avançada Masculina"
                      value={selectedProtocol?.name || ''}
                      onChange={(e) => updateProtocolField('name', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Description field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição Detalhada</label>
                    <textarea
                      placeholder="Foco, público-alvo, detalhes do ciclo..."
                      value={selectedProtocol?.description || ''}
                      onChange={(e) => updateProtocolField('description', e.target.value)}
                      rows={3}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Image URL field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={selectedProtocol?.image_url || ''}
                        onChange={(e) => updateProtocolField('image_url', e.target.value)}
                        className="w-full h-11 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                      <ImageIcon size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
                      <select
                        value={selectedProtocol?.category}
                        onChange={(e) => updateProtocolField('category', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="public">Gratuita</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                      <select
                        value={selectedProtocol?.status}
                        onChange={(e) => updateProtocolField('status', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicado</option>
                      </select>
                    </div>
                  </div>

                  {/* Goal & Difficulty */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objetivo</label>
                      <input
                        type="text"
                        placeholder="Ex: Hipertrofia"
                        value={selectedProtocol?.goal || ''}
                        onChange={(e) => updateProtocolField('goal', e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nível</label>
                      <select
                        value={selectedProtocol?.difficulty || 'Iniciante'}
                        onChange={(e) => updateProtocolField('difficulty', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                        <option value="Elite">Elite</option>
                      </select>
                    </div>
                  </div>

                  {/* Weeks & Estimated Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semanas (Ciclo)</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedProtocol?.duration_weeks || 4}
                        onChange={(e) => updateProtocolField('duration_weeks', Number(e.target.value) || 1)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duração Est. (Min)</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedProtocol?.estimated_duration || 60}
                        onChange={(e) => updateProtocolField('estimated_duration', Number(e.target.value) || 1)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Environment & Active Switch */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ambiente</label>
                      <select
                        value={selectedProtocol?.environment || 'Academia'}
                        onChange={(e) => updateProtocolField('environment', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="Academia">Academia</option>
                        <option value="Home Gym">Home Gym</option>
                        <option value="Calistenia / Parque">Parque</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-4.5 bg-slate-50 px-3 rounded-xl border border-slate-100">
                      <input
                        type="checkbox"
                        id="isActiveToggle"
                        checked={selectedProtocol?.is_active !== false}
                        onChange={(e) => updateProtocolField('is_active', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-200 cursor-pointer"
                      />
                      <label htmlFor="isActiveToggle" className="text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==========================================
                 COLUMN 2: PROTOCOL DAYS (3 Cols)
                 ========================================== */}
              <div className="lg:col-span-3">
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
                 COLUMN 3: SELECT DAY EXERCISES LIST (5 Cols)
                 ========================================== */}
              <div className="lg:col-span-5">
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
