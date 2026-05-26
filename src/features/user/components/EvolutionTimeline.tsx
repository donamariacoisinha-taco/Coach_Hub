import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../store/userStore';
import { motion } from 'motion/react';
import { CheckCircle2, Trophy, Flame, TrendingUp, Sparkles, Scale } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  desc: string;
  date: string;
  icon: any;
  color: string;
  bg: string;
}

export function EvolutionTimeline() {
  const { profile } = useUserStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!profile) return;

    const list: TimelineEvent[] = [];
    const todayStr = 'Hoje';

    // 1. Dynamic Check-in item
    const storedHistory = localStorage.getItem(`rubi_history_${profile.id}`);
    if (storedHistory) {
      const logs = JSON.parse(storedHistory);
      if (logs.length > 0) {
        // Sort descending
        logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastLog = logs[0];
        
        list.push({
          id: 'checkin',
          title: `Check-in de Peso (${lastLog.weight} kg)`,
          desc: 'Seus dados corporais foram sincronizados com a biometria do app.',
          date: todayStr,
          icon: Scale,
          color: 'text-blue-500',
          bg: 'bg-blue-50'
        });
      }
    }

    // 2. Completed workout milestones
    const completed = profile.workouts_completed || 0;
    if (completed > 0) {
      list.push({
        id: 'milestone-workouts',
        title: `${completed} Treinos Realizados`,
        desc: 'Sua densidade e volume total acumulados crescem consistentemente.',
        date: 'Esta Semana',
        icon: Trophy,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
      });
    }

    // 3. Streak Milestones
    const streak = profile.workout_streak || 0;
    if (streak > 0) {
      list.push({
        id: 'milestone-streak',
        title: `${streak} Dias Seguidos`,
        desc: 'Mantendo o ritmo ativo sob disciplina exemplar.',
        date: 'Ativo',
        icon: Flame,
        color: 'text-[#818CF8]',
        bg: 'bg-[#818CF8]/10'
      });
    }

    // Default milestones to enrich the timeline
    list.push({
      id: 'dna-type',
      title: 'Ajuste de Célula Biológica',
      desc: `Perfil de treino configurado focado em ${profile.goal || 'Performance'}.`,
      date: 'Recente',
      icon: TrendingUp,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    });

    list.push({
      id: 'welcome',
      title: 'Início da Jornada Rubi',
      desc: 'Primeiro login integrado – cadastro do core de dados.',
      date: 'Inicial',
      icon: Sparkles,
      color: 'text-violet-500',
      bg: 'bg-violet-50'
    });

    setEvents(list);
  }, [profile]);

  if (!profile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-xl">
          <Trophy size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Minha Evolução</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cronologia de conquistas</p>
        </div>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
        {events.map((event, idx) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative"
          >
            {/* Timeline icon indicator */}
            <div className={`absolute -left-[30px] top-0 p-1 rounded-full bg-white border border-slate-100 shadow-sm z-10`}>
              <div className={`${event.bg} ${event.color} p-1 rounded-lg`}>
                <event.icon size={12} strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 tracking-tight leading-none">{event.title}</h4>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                  {event.date}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                {event.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
