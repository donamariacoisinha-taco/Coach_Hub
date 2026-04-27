import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  ChevronDown,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Archive,
  Star,
  Copy,
  Brain,
  Download,
  Share2
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const LibraryOS: React.FC = () => {
  const { exercises, searchQuery, openEditor, setSearchQuery } = useAdminStore();
  const [view, setView] = useState<'table' | 'grid' | 'compact'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Advanced Filter Mock
  const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'improvable' | 'draft'>('all');

  const filtered = useMemo(() => {
    let result = exercises;
    
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ex => 
        ex.name.toLowerCase().includes(q) || 
        ex.muscle_group.toLowerCase().includes(q) ||
        ex.alt_name?.toLowerCase().includes(q)
      );
    }
    
    // Status Filter
    if (activeFilter === 'premium') result = result.filter(ex => ex.quality_status === 'premium');
    if (activeFilter === 'improvable') result = result.filter(ex => ex.quality_status === 'improvable');
    if (activeFilter === 'draft') result = result.filter(ex => !ex.quality_status);
    
    return result;
  }, [exercises, searchQuery, activeFilter]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(ex => ex.id));
    }
  };

  return (
    <div className="space-y-12 pb-32">
      {/* Search & Filter Bar ELITE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex-1 max-w-2xl bg-white rounded-[2rem] border border-slate-200 px-6 py-1 flex items-center shadow-sm group focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
            <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search library: name, muscle, equipment, pattern..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none py-5 px-4 font-bold text-sm outline-none placeholder:text-slate-400 text-slate-900"
            />
            <div className="flex items-center gap-2">
               <button className="p-2 text-slate-300 hover:text-slate-950 transition-all">
                  <ArrowUpDown size={18} />
               </button>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
               <ViewButton active={view === 'table'} onClick={() => setView('table')} icon={<List size={18} />} />
               <ViewButton active={view === 'grid'} onClick={() => setView('grid')} icon={<LayoutGrid size={18} />} />
               <ViewButton active={view === 'compact'} onClick={() => setView('compact')} icon={<MoreHorizontal size={18} />} />
            </div>
            
            <button className="px-6 h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm hover:border-blue-200 transition-all">
               <Filter size={18} className="text-blue-600" />
               Filters
               <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px] font-black">2</span>
            </button>
         </div>
      </div>

      {/* Filter Quick-Access Tags */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
         <QuickFilter active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} label="All Assets" count={exercises.length} />
         <QuickFilter active={activeFilter === 'premium'} onClick={() => setActiveFilter('premium')} label="Premium Base" count={exercises.filter(e => e.quality_status === 'premium').length} />
         <QuickFilter active={activeFilter === 'improvable'} onClick={() => setActiveFilter('improvable')} label="Critical Gaps" count={exercises.filter(e => e.quality_status === 'improvable').length} />
         <div className="h-6 w-px bg-slate-200 mx-2" />
         <QuickFilter active={false} onClick={() => {}} label="Chest Only" />
         <QuickFilter active={false} onClick={() => {}} label="Barbell Focused" />
         <QuickFilter active={false} onClick={() => {}} label="No Video" />
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden"
          >
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-8 py-6 w-12">
                            <button 
                              onClick={toggleSelectAll}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                selectedIds.length === filtered.length && filtered.length > 0
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                               {selectedIds.length === filtered.length && filtered.length > 0 && <CheckCircle2 size={12} />}
                            </button>
                         </th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Governance</th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Target</th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Quality</th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage</th>
                         <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filtered.map(ex => (
                        <Row 
                          key={ex.id} 
                          exercise={ex} 
                          selected={selectedIds.includes(ex.id)}
                          onSelect={(e) => toggleSelect(ex.id, e)}
                          onClick={() => openEditor(ex)}
                        />
                      ))}
                   </tbody>
                </table>
             </div>
             
             {filtered.length === 0 && (
               <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                     <Search size={32} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-900">No assets found</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tight">Try a different search or filter</p>
               </div>
             )}
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
             {filtered.map(ex => (
                <GridCard 
                   key={ex.id} 
                   exercise={ex} 
                   selected={selectedIds.includes(ex.id)}
                   onSelect={(e) => toggleSelect(ex.id, e)}
                   onClick={() => openEditor(ex)}
                />
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Operations Bar */}
      <AnimatePresence>
         {selectedIds.length > 0 && (
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 100, opacity: 0 }}
               className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-6"
            >
               <div className="bg-slate-950 rounded-[2rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between text-white backdrop-blur-3xl">
                  <div className="flex items-center gap-6 pl-6">
                     <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-[14px] font-black">{selectedIds.length}</span>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest">Assets Selected</p>
                           <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">Bulk Operations Active</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2 pr-2">
                     <BulkButton icon={<Archive size={16} />} label="Archive" />
                     <BulkButton icon={<Brain size={16} />} label="AI Sync" color="blue" />
                     <BulkButton icon={<Star size={16} />} label="Premium" color="emerald" />
                     <div className="w-px h-10 bg-white/10 mx-2" />
                     <BulkButton icon={<Trash2 size={16} />} label="Delete" color="red" />
                     <button 
                        onClick={() => setSelectedIds([])}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-black text-xs"
                     >
                        ESC
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

function ViewButton({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all ${active ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20' : 'text-slate-300 hover:text-slate-900 group'}`}
    >
      {icon}
    </button>
  );
}

function QuickFilter({ active, label, count, onClick }: { active: boolean, label: string, count?: number, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-3 ${
        active 
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900 shadow-sm'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-lg text-[9px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

interface RowProps {
  exercise: Exercise;
  selected: boolean;
  onSelect: (e: any) => void;
  onClick: () => void;
}

const Row: React.FC<RowProps> = ({ exercise, selected, onSelect, onClick }) => {
  return (
    <tr 
      onClick={onClick}
      className={`group cursor-pointer transition-all ${selected ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
    >
       <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onSelect}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 group-hover:border-slate-300'
            }`}
          >
             {selected && <CheckCircle2 size={12} />}
          </button>
       </td>
       <td className="px-6 py-6 font-black uppercase text-xs tracking-tight text-slate-900">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-slate-100 p-2 overflow-hidden border border-slate-200/50 shadow-sm">
                {exercise.image_url ? (
                  <img src={exercise.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><Dumbbell size={20} /></div>
                )}
             </div>
             <div>
                <p className="leading-tight">{exercise.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {exercise.alt_name || 'No Aliases'}
                </p>
             </div>
          </div>
       </td>
       <td className="px-6 py-6">
          <StatusChip status={exercise.quality_status || 'improvable'} active={exercise.is_active} />
       </td>
       <td className="px-6 py-6">
          <div className="space-y-1">
             <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-950 text-white rounded-lg leading-none">{exercise.muscle_group}</span>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{exercise.type}</p>
          </div>
       </td>
       <td className="px-6 py-6">
          <div className="flex items-center gap-3">
             <div className="w-16 h-1.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div 
                   className={`h-full rounded-full transition-all duration-1000 ${
                     exercise.quality_score && exercise.quality_score > 80 ? 'bg-emerald-500' :
                     exercise.quality_score && exercise.quality_score > 60 ? 'bg-blue-500' : 'bg-orange-500'
                   }`} 
                   style={{ width: `${exercise.quality_score || 0}%` }} 
                />
             </div>
             <span className="text-[10px] font-black text-slate-900">{exercise.quality_score || 0}%</span>
          </div>
       </td>
       <td className="px-6 py-6">
          <div className="flex items-center gap-2 text-slate-400">
             <Share2 size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest">{exercise.usage_count || 0} hits</span>
          </div>
       </td>
       <td className="px-8 py-6 text-right">
          <button className="p-3 rounded-xl text-slate-300 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
             <MoreHorizontal size={20} />
          </button>
       </td>
    </tr>
  );
}

interface GridCardProps {
  exercise: Exercise;
  selected: boolean;
  onSelect: (e: any) => void;
  onClick: () => void;
}

const GridCard: React.FC<GridCardProps> = ({ exercise, selected, onSelect, onClick }) => {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -5 }}
      className={`group relative bg-white rounded-[2.5rem] border overflow-hidden p-8 cursor-pointer transition-all ${selected ? 'border-blue-400 shadow-2xl shadow-blue-200/50' : 'border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50'}`}
    >
       <div className="absolute top-6 left-6 z-10" onClick={(e) => onClick && onSelect(e)}>
          <button 
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 backdrop-blur border-slate-200 group-hover:border-blue-400 opacity-0 group-hover:opacity-100'
            }`}
          >
             {selected && <CheckCircle2 size={12} />}
          </button>
       </div>

       <div className="h-48 bg-slate-50/50 rounded-[2rem] border border-slate-100 mb-8 p-6 flex items-center justify-center relative overflow-hidden group">
          {exercise.image_url ? (
            <img src={exercise.image_url} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
          ) : (
            <Dumbbell size={48} className="text-slate-200" />
          )}
          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <Play size={20} fill="currentColor" />
             </div>
          </div>
       </div>

       <div className="space-y-4">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{exercise.muscle_group}</span>
             <div className="w-1 h-1 bg-slate-200 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{exercise.type}</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">{exercise.name}</h3>
          
          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score: {exercise.quality_score || 0}%</span>
             <StatusChip status={exercise.quality_status || 'improvable'} active={exercise.is_active} compact />
          </div>
       </div>
    </motion.div>
  );
}

function StatusChip({ status, active, compact }: { status: string, active: boolean, compact?: boolean }) {
  if (!active) return <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Archived</span>;
  
  const styles = {
    premium: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    good: 'bg-blue-50 text-blue-600 border-blue-100',
    improvable: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  const labels = {
    premium: 'Premium',
    good: 'High Quality',
    improvable: 'Refinement Needed'
  };

  return (
    <span className={`inline-flex items-center gap-2 font-black uppercase tracking-widest border rounded-lg ${styles[status as keyof typeof styles] || styles.improvable} ${compact ? 'px-2 py-1 text-[8px]' : 'px-3 py-1.5 text-[9px]'}`}>
       {status === 'improvable' ? <AlertCircle size={compact ? 10 : 12} /> : <CheckCircle2 size={compact ? 10 : 12} />}
       {!compact && labels[status as keyof typeof labels]}
    </span>
  );
}

function BulkButton({ icon, label, color = 'default' }: { icon: React.ReactNode, label: string, color?: string }) {
  const colors = {
    default: 'bg-white/5 hover:bg-white/10 text-white',
    blue: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400',
    emerald: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400',
    red: 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
  } as any;

  return (
    <button className={`flex items-center gap-3 px-6 h-14 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${colors[color]}`}>
       {icon}
       <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default LibraryOS;
