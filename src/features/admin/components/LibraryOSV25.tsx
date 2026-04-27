import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Columns, 
  Keyboard, 
  ChevronDown,
  Sparkles,
  Command,
  ArrowRight,
  Database,
  AlertCircle,
  Skull,
  TrendingUp
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { useLibraryStore } from '../store/libraryStore';
import { useIntelligenceStore } from '../store/intelligenceStore';
import SmartGrid from './SmartGrid';
import BulkActionBar from './BulkActionBar';
import SavedViews from './SavedViews';
import ColumnsManager from './ColumnsManager';
import { useKeyboardShortcuts } from '../utils/KeyboardShortcuts';

const LibraryOSV25: React.FC = () => {
  const { exercises, searchQuery, setSearchQuery, openEditor, selectedMuscleFilter, setMuscleFilter } = useAdminStore();
  const { 
    viewMode, 
    setViewMode, 
    visibleColumns, 
    activeViewId,
    setActiveView,
    savedViews,
    isKeyboardModeActive,
    toggleKeyboardMode
  } = useLibraryStore();
  const { openModal } = useIntelligenceStore();

  const [isColumnsManagerOpen, setColumnsManagerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Keyboard Shortcuts
  useKeyboardShortcuts([
    { key: '/', action: () => document.getElementById('universal-search')?.focus() },
    { key: 'n', action: () => openEditor() },
    { key: 'v', action: () => setViewMode(viewMode === 'table' ? 'grid' : 'table') },
    { key: 'k', meta: true, action: () => {} }, // Command palette handled elsewhere but good to reserve
    { key: 'escape', action: () => setSelectedIds([]) }
  ]);

  const muscleGroups = [
    'Todos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 
    'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 
    'Abdômen', 'Full Body', 'Cardio', 'Mobilidade'
  ];

  return (
    <div className="space-y-10 pb-32">
      {/* Universal Search & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-2xl flex items-center gap-4">
           <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 px-6 py-1 flex items-center shadow-sm group focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
              <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                id="universal-search"
                type="text" 
                placeholder="Pesquisar em tudo... (/)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none py-5 px-4 font-bold text-sm outline-none placeholder:text-slate-400 text-slate-900"
              />
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 <Command size={10} /> /
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <SavedViews />
          
          <div className="w-px h-8 bg-slate-200 mx-2" />

          <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
             <button 
               onClick={() => setViewMode('table')}
               className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-300 hover:text-slate-900'}`}
             >
                <List size={18} />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-300 hover:text-slate-900'}`}
             >
                <LayoutGrid size={18} />
             </button>
          </div>

          <button 
            onClick={() => setColumnsManagerOpen(true)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all shadow-sm group"
          >
             <Columns size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <button 
            onClick={openEditor}
            className="px-8 h-14 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
          >
             <Plus size={18} />
             Novo Exercício
          </button>
        </div>
      </div>

      {/* Muscle Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mask-fade-right">
        {muscleGroups.map((muscle) => (
          <button
            key={muscle}
            onClick={() => setMuscleFilter(muscle)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              selectedMuscleFilter === muscle
                ? 'bg-slate-950 border-slate-950 text-white shadow-lg'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-col xl:flex-row gap-10">
        <div className="flex-1 flex flex-col gap-10 min-w-0">
          {/* Smart Grid Section */}
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[700px] flex flex-col">
             <SmartGrid 
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
             />
          </div>
        </div>

        {/* Smart Insights Sidebar */}
        <aside className="w-full xl:w-96 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Sparkles size={20} />
                 </div>
                 <div>
                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Smart Insights</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analítica Realtime</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <InsightCard 
                    icon={<AlertCircle className="text-red-500" />} 
                    label="Críticos Hoje" 
                    value={exercises.filter(ex => (ex.quality_score_v3 || 0) < 40).length} 
                    desc="Necessitam revisão imediata"
                    onClick={() => openModal('fix')}
                 />
                 <InsightCard 
                    icon={<Skull className="text-slate-400" />} 
                    label="Prováveis Duplicados" 
                    value="4" 
                    desc="Nomes similares detectados"
                    onClick={() => openModal('audit')}
                 />
                 <InsightCard 
                    icon={<TrendingUp className="text-emerald-500" />} 
                    label="Rising Stars" 
                    value={exercises.filter(ex => ex.ranking_status === 'rising').length} 
                    desc="Engajamento em alta"
                    onClick={() => openModal('scores')}
                 />
                 <InsightCard 
                    icon={<Database className="text-blue-500" />} 
                    label="Sem Midia" 
                    value={exercises.filter(ex => !ex.image_url).length} 
                    desc="Impacto visual baixo"
                    onClick={() => openModal('audit')}
                 />
              </div>

              <button className="w-full mt-10 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                 Relatório Completo
                 <ArrowRight size={14} />
              </button>
           </div>

           {/* Keyboard Hint */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                 <Keyboard size={18} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Atalhos Pro</span>
              </div>
              <div className="space-y-4">
                 <ShortcutHint keys={['/']} label="Universal Search" />
                 <ShortcutHint keys={['N']} label="Novo Exercício" />
                 <ShortcutHint keys={['V']} label="Toggle Lista/Grid" />
                 <ShortcutHint keys={['ESC']} label="Limpar Seleção" />
              </div>
           </div>
        </aside>
      </div>

      <BulkActionBar 
        selectedIds={selectedIds} 
        onClear={() => setSelectedIds([])} 
      />

      <ColumnsManager 
        isOpen={isColumnsManagerOpen} 
        onClose={() => setColumnsManagerOpen(false)} 
      />
    </div>
  );
};

export default LibraryOSV25;

function InsightCard({ icon, label, value, desc, onClick }: { icon: React.ReactNode, label: string, value: string | number, desc: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-4 p-4 rounded-2xl border border-slate-50 transition-all group ${onClick ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-200' : 'cursor-default'}`}
    >
       <div className="mt-1 translate-y-1">{icon}</div>
       <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{label}</span>
             <span className="text-xs font-black text-slate-950">{value}</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{desc}</p>
       </div>
    </div>
  );
}

function ShortcutHint({ keys, label }: { keys: string[], label: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
       <div className="flex gap-1">
          {keys.map(k => (
            <kbd key={k} className="px-2 py-1 bg-white/10 rounded-md text-[9px] font-black text-slate-200">{k}</kbd>
          ))}
       </div>
    </div>
  );
}
