import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Target, 
  Activity, 
  BarChart3, 
  Users, 
  Zap,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Exercise } from '../../../types';
import { calculateQualityScoreV3 } from '../services/qualityScoreV3';

interface InspectorProps {
  exercise: Exercise;
  onClose: () => void;
}

const ExercisePerformanceInspector: React.FC<InspectorProps> = ({ exercise, onClose }) => {
  const scores = calculateQualityScoreV3(exercise);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-12 py-8 bg-white border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner overflow-hidden">
                {(exercise.static_frame_url || exercise.image_url) ? (
                  <img src={exercise.static_frame_url || exercise.image_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Zap size={32} className="text-slate-300" />
                )}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance Inspector V3</p>
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{exercise.name}</h2>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-950 transition-colors">
              <X size={28} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
           {/* Detailed Scores */}
           <div className="grid grid-cols-5 gap-4">
              <DetailedMetric label="Editorial" val={scores.editorial} max={30} color="blue" />
              <DetailedMetric label="Estrutural" val={scores.structural} max={25} color="indigo" />
              <DetailedMetric label="Governança" val={scores.governance} max={10} color="slate" />
              <DetailedMetric label="Uso Real" val={scores.usage} max={25} color="amber" />
              <DetailedMetric label="Resultados" val={scores.results} max={10} color="emerald" />
           </div>

           <div className="grid grid-cols-3 gap-8">
              {/* Usage Metrics */}
              <div className="col-span-2 bg-slate-50 rounded-[2.5rem] p-10 space-y-8 border border-slate-100">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Métricas de Engajamento</h3>
                 <div className="grid grid-cols-2 gap-8">
                    <ProgressMetric label="Taxa de Conclusão" value={(exercise.completion_rate || 0) * 100} icon={CheckCircle2} color="emerald" />
                    <ProgressMetric label="Taxa de Progressão" value={(exercise.avg_progression_rate || 0) * 100} icon={TrendingUp} color="blue" />
                    <ProgressMetric label="Taxa de Abandono (Drop)" value={(exercise.drop_rate || 0) * 100} icon={AlertTriangle} color="red" />
                    <ProgressMetric label="Repetição Semanal" value={(exercise.repeat_rate || 0) * 100} icon={Activity} color="indigo" />
                 </div>
              </div>

              {/* Success Profiling */}
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Perfil de Sucesso</h3>
                 <div className="space-y-6">
                    <HealthBar label="Sucesso Iniciantes" val={(exercise.beginner_success || 0) * 100} color="blue" />
                    <HealthBar label="Sucesso Avançados" val={(exercise.advanced_success || 0) * 100} color="indigo" />
                 </div>
                 <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Uso Total</p>
                    <div className="text-4xl font-black text-slate-900">{exercise.usage_count || 0}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Sessões registradas</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="px-12 py-8 bg-white border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-10">
              <FooterStat label="Status de Ranking" value={exercise.ranking_status?.toUpperCase() || 'TESTING'} />
              <FooterStat label="Última Atualização" value={new Date(exercise.last_performance_update || '').toLocaleDateString()} />
           </div>
           <button className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
              Otimizar Exercício
           </button>
        </div>
      </motion.div>
    </div>
  );
};

function DetailedMetric({ label, val, max, color }: any) {
  const colors: any = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    slate: 'bg-slate-600',
    amber: 'bg-amber-600',
    emerald: 'bg-emerald-600',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-3">
       <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="text-xs font-black text-slate-900">{val}/{max}</span>
       </div>
       <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${(val / max) * 100}%` }} />
       </div>
    </div>
  );
}

function ProgressMetric({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-50',
    blue: 'text-blue-500 bg-blue-50',
    red: 'text-red-500 bg-red-50',
    indigo: 'text-indigo-500 bg-indigo-50',
  };

  return (
    <div className="flex items-center gap-5">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="text-xl font-black text-slate-900">{Math.round(value)}%</div>
       </div>
    </div>
  );
}

function HealthBar({ label, val, color }: any) {
  const colors: any = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
  };

  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between text-xs font-black text-slate-900">
          <span>{label}</span>
          <span>{Math.round(val)}%</span>
       </div>
       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${val}%` }} />
       </div>
    </div>
  );
}

function FooterStat({ label, value }: any) {
  return (
    <div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{value}</p>
    </div>
  );
}

export default ExercisePerformanceInspector;
