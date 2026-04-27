
import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MoreVertical, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { Exercise } from '../../../types';

const columns = [
  { id: 'draft', title: 'Draft / Novo', color: 'bg-slate-100/50' },
  { id: 'improvable', title: 'A Melhorar', color: 'bg-orange-50/50' },
  { id: 'review', title: 'Em Revisão', color: 'bg-blue-50/50' },
  { id: 'good', title: 'Aprovado (Bom)', color: 'bg-emerald-50/50' },
  { id: 'premium', title: 'Publicado (Premium)', color: 'bg-indigo-50/50' },
];

const ReviewBoard: React.FC = () => {
  const { exercises, openEditor } = useAdminStore();

  const getExercisesByStatus = (status: string) => {
    return exercises.filter(ex => {
      const qStatus = (ex as any).quality_status;
      if (status === 'draft') return !qStatus || qStatus === '';
      return qStatus === status;
    });
  };

  return (
    <div className="space-y-12 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Workflow de Revisão</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão de estado da biblioteca</p>
        </div>
        
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button className="px-5 py-2 text-[10px] font-black uppercase rounded-lg bg-slate-900 text-white">Quadro</button>
          <button className="px-5 py-2 text-[10px] font-black uppercase rounded-lg text-slate-400">Lista</button>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] flex gap-6 overflow-x-auto no-scrollbar pb-10">
        {columns.map((col) => {
          const colExercises = getExercisesByStatus(col.id);
          return (
            <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col gap-6">
              <div className="flex items-center justify-between px-3">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      col.id === 'premium' ? 'bg-indigo-500' : 
                      col.id === 'good' ? 'bg-emerald-500' :
                      col.id === 'review' ? 'bg-blue-500' :
                      col.id === 'improvable' ? 'bg-orange-500' : 'bg-slate-400'
                    }`} />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{col.title}</h3>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg leading-none">{colExercises.length}</span>
              </div>

              <div className={`flex-1 rounded-[2.5rem] border border-dashed border-slate-200 p-4 space-y-4 ${col.color}`}>
                {colExercises.map(ex => (
                  <KanbanCard key={ex.id} exercise={ex} onClick={() => openEditor(ex)} />
                ))}
                
                {colExercises.length === 0 && (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sem itens</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface KanbanCardProps {
  exercise: Exercise;
  onClick: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ exercise, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
         <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {exercise.muscle_group}
         </span>
         <button className="p-1 text-slate-200 hover:text-slate-900 group-hover:text-slate-400 transition-colors">
            <MoreVertical size={14} />
         </button>
      </div>
      
      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug line-clamp-2">{exercise.name}</h4>
      
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-50">
               {exercise.quality_score >= 70 ? <CheckCircle size={12} className="text-emerald-500" /> : <Clock size={12} />}
            </div>
            <span className="text-[10px] font-black text-slate-900">{exercise.quality_score || 0}%</span>
         </div>
         
         <div className="flex -space-x-1.5 shrink-0">
            {exercise.image_url && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden"><img src={exercise.image_url} className="w-full h-full object-cover" /></div>}
            {exercise.video_url && <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600"><FileText size={10} /></div>}
         </div>
      </div>
    </div>
  );
}

export default ReviewBoard;
