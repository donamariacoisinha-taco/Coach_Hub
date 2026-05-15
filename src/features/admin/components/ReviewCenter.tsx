import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  MoreVertical,
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  RefreshCcw,
  Maximize2,
  Play
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const columns = [
  { id: 'draft', title: 'Inbox / New', desc: 'Needs initial evaluation', color: 'bg-slate-100/50' },
  { id: 'improvable', title: 'Critical Refinement', desc: 'AI detected major gaps', color: 'bg-orange-50/50' },
  { id: 'review', title: 'Human Review', desc: 'Awaiting expert sign-off', color: 'bg-blue-50/50' },
  { id: 'good', title: 'Ready / Approved', desc: 'Passed all tests', color: 'bg-emerald-50/50' },
  { id: 'premium', title: 'Premium Assets', desc: 'Elite library content', color: 'bg-indigo-50/50' }
];

const ReviewCenter: React.FC = () => {
  const { exercises, openEditor } = useAdminStore();
  const [view, setView] = useState<'kanban' | 'fast-approve' | 'inbox'>('kanban');
  
  const getExercisesByStatus = (status: string) => {
    return exercises.filter(ex => {
      const qStatus = (ex as any).quality_status;
      if (status === 'draft') return !qStatus || qStatus === '';
      return qStatus === status;
    });
  };

  return (
    <div className="space-y-12">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Quality Control</h2>
            <h3 className="text-3xl font-black tracking-tighter uppercase whitespace-pre-line">Review & Metadata{"\n"}Governance Hub</h3>
         </div>

         <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
            <ViewTab active={view === 'kanban'} onClick={() => setView('kanban')} label="Workflow" />
            <ViewTab active={view === 'inbox'} onClick={() => setView('inbox')} label="Inbox" />
            <ViewTab active={view === 'fast-approve'} onClick={() => setView('fast-approve')} label="Fast Approve" />
         </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'kanban' && (
          <motion.div 
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-8 overflow-x-auto no-scrollbar pb-12 min-h-[700px]"
          >
             {columns.map(col => (
                <div key={col.id} className="min-w-[340px] w-[340px] flex flex-col gap-6">
                   <div className="px-4">
                      <div className="flex items-center justify-between mb-2">
                         <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{col.title}</h4>
                         <span className="text-[10px] font-black bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm text-slate-400">
                           {getExercisesByStatus(col.id).length}
                         </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{col.desc}</p>
                   </div>
                   
                   <div className={`flex-1 rounded-[2.5rem] border border-dashed border-slate-200 p-4 space-y-4 ${col.color}`}>
                      {getExercisesByStatus(col.id).map(ex => (
                         <ReviewCard key={ex.id} exercise={ex} onClick={() => openEditor(ex)} />
                      ))}
                      
                      <button className="w-full py-6 rounded-3xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white text-slate-300 hover:text-blue-600 transition-all text-[10px] font-black uppercase tracking-widest">
                         + Add to {col.id}
                      </button>
                   </div>
                </div>
             ))}
          </motion.div>
        )}

        {view === 'fast-approve' && (
           <motion.div 
             key="fast-approve"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="max-w-4xl mx-auto py-12"
           >
              <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-12 relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
                 
                 <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="w-full md:w-1/2 aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center p-8">
                       <img 
                         src={getExercisesByStatus('draft')[0]?.image_url || getExercisesByStatus('draft')[0]?.static_frame_url || 'https://placehold.co/600x600'} 
                         alt="" 
                         className="w-full h-full object-contain"
                         referrerPolicy="no-referrer"
                       />
                    </div>
                    
                    <div className="flex-1 space-y-8">
                       <div>
                          <div className="flex items-center gap-3 mb-4">
                             <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Draft Phase</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quality: 42%</span>
                          </div>
                          <h4 className="text-4xl font-black tracking-tighter uppercase leading-none">
                             {getExercisesByStatus('draft')[0]?.name || 'No more items'}
                          </h4>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-4">Target: {getExercisesByStatus('draft')[0]?.muscle_group}</p>
                       </div>

                       <div className="space-y-4">
                          <ReviewMetric icon={<Sparkles size={14} />} label="AI Completeness" value="65%" warning />
                          <ReviewMetric icon={<Zap size={14} />} label="Technical Metadata" value="Missing" error />
                          <ReviewMetric icon={<Maximize2 size={14} />} label="Biomechanics Sync" value="Passed" />
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-8">
                          <button className="h-20 rounded-[2rem] bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95">
                             <X size={20} />
                             Fix Item
                          </button>
                          <button className="h-20 rounded-[2rem] bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all active:scale-95">
                             <Check size={20} />
                             Approve
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="mt-12 flex items-center justify-center gap-8">
                 <button className="text-slate-300 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">Skip Item</button>
                 <div className="h-4 w-px bg-slate-200" />
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">64 Items Remaining</p>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ViewTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20 active:scale-95' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

interface ReviewCardProps {
  exercise: Exercise;
  onClick: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ exercise, onClick }) => {
  const score = exercise.quality_score || 0;
  
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.02 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group"
    >
       <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-2">
             {exercise.image_url || exercise.static_frame_url ? (
               <img 
                src={exercise.image_url || exercise.static_frame_url} 
                alt="" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
               />
             ) : (
               <Dumbbell size={20} className="text-slate-200" />
             )}
          </div>
          <button className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
             <MoreVertical size={16} />
          </button>
       </div>
       
       <div className="space-y-4">
          <div>
             <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg uppercase tracking-widest">
               {exercise.muscle_group}
             </span>
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-2 leading-snug line-clamp-2">
               {exercise.name}
             </h4>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${score > 70 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                <span className="text-[10px] font-black text-slate-900 uppercase">Score: {score}%</span>
             </div>
             
             <div className="flex items-center gap-2">
                {exercise.video_url && <Play size={12} className="text-blue-500" fill="currentColor" />}
                {exercise.instructions && <CheckCircle2 size={12} className="text-emerald-500" />}
             </div>
          </div>
       </div>
    </motion.div>
  );
}

function ReviewMetric({ icon, label, value, error, warning }: { icon: React.ReactNode, label: string, value: string, error?: boolean, warning?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
       <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${error ? 'bg-red-100 text-red-600' : warning ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
       </div>
       <span className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-red-600' : warning ? 'text-orange-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

export default ReviewCenter;
