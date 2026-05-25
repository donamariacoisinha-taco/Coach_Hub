import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { motion } from 'motion/react';
import { Zap, Activity, HelpCircle, ShieldAlert } from 'lucide-react';

interface CheckInLog {
  date: string;
  weight: number;
  energy: number; // 1-5
  recovery: number; // 1-5
  sleep: number; // 1-5
  hydration: boolean;
}

export function ReadinessScore() {
  const { profile } = useUserStore();
  const [score, setScore] = useState<number>(75);
  const [status, setStatus] = useState<string>('Pronto para Treinar');
  const [desc, setDesc] = useState<string>('Seus níveis corporais estão equilibrados.');
  const [colorClass, setColorClass] = useState<string>('from-blue-500 to-indigo-600');
  const [accentText, setAccentText] = useState<string>('text-blue-400');
  const [isFinelyTuned, setIsFinelyTuned] = useState(false);

  const calculateScore = () => {
    if (!profile) return;

    // Load custom metrics from checkin history
    const storedHistory = localStorage.getItem(`rubi_history_${profile.id}`);
    let latestLog: CheckInLog | null = null;
    
    if (storedHistory) {
      const logs: CheckInLog[] = JSON.parse(storedHistory);
      if (logs.length > 0) {
        // Sort by date descending
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        latestLog = logs[0];
      }
    }

    let calculated = 70; // baseline
    const streak = profile.workout_streak || 0;
    
    // Impact of workout streak
    calculated += Math.min(streak * 2, 10);

    if (latestLog) {
      setIsFinelyTuned(true);
      // latestLog parameters (energy, sleep, recovery are 1 to 5)
      const avgCheckIn = (latestLog.energy + latestLog.sleep + latestLog.recovery) / 3; // 1 to 5
      const checkInWeight = (avgCheckIn - 1) * 15; // scales 0 to 60
      
      const hydrationImpact = latestLog.hydration ? 10 : -5;
      
      calculated = Math.round(30 + checkInWeight + hydrationImpact);
    } else {
      setIsFinelyTuned(false);
    }

    // Bound output
    const finalScore = Math.max(15, Math.min(100, calculated));
    setScore(finalScore);

    // Diagnostics set
    if (finalScore >= 80) {
      setStatus('Pronto para Intensidade');
      setDesc('Seus marcadores de regeneração estão excelentes. Momento ideal para buscar recordes pessoais (PBs) ou treinos de alta carga.');
      setColorClass('from-emerald-500 to-teal-600');
      setAccentText('text-emerald-400');
    } else if (finalScore >= 55) {
      setStatus('Atividade Estratégica');
      setDesc('Nível de prontidão intermediário. Treinos volumétricos ou técnicos são recomendados. Evite falhas neurológicas críticas hoje.');
      setColorClass('from-blue-500 to-indigo-600');
      setAccentText('text-blue-400');
    } else {
      setStatus('Foco em Recuperação');
      setDesc('Fadiga acumulada alta ou sono subótimo detectado. Priorize mobilidade, alongamentos ou um treino regenerativo leve.');
      setColorClass('from-amber-500 to-rose-600');
      setAccentText('text-amber-400');
    }
  };

  useEffect(() => {
    calculateScore();

    // Listen to updates made in WeeklyCheckIn
    window.addEventListener('rubi_checkin_updated', calculateScore);
    return () => {
      window.removeEventListener('rubi_checkin_updated', calculateScore);
    };
  }, [profile]);

  if (!profile) return null;

  // Render svg gauge coefficients
  const radius = 52;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Background radial glow matching score level */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} rounded-full blur-[90px] opacity-25 animate-pulse`} />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full blur-[80px] opacity-10 pointer-events-none" />

      <div className="flex items-center justify-between pb-6">
        <div className="space-y-1">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Engine</h3>
          <h2 className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
            <Activity size={16} className="text-blue-500" />
            Training Readiness
          </h2>
        </div>
        <span className={`px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest ${accentText} border border-white/10`}>
          {isFinelyTuned ? 'Sintonizado' : 'Aproximado'}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Radial Progress Gauge */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              stroke="rgba(255,255,255,0.05)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Animated foreground ring */}
            <motion.circle
              stroke={`url(#readinessGlow)`}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="round"
              animate={{ strokeDashoffset }}
              transition={{ type: 'spring', damping: 15 }}
            />
            <defs>
              <linearGradient id="readinessGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Central Score Text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-[1000] text-white tracking-tighter leading-none">{score}</span>
            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">score</span>
          </div>
        </div>

        {/* Actionable readiness advice and status */}
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1 text-slate-100">
            <Zap size={14} className="text-amber-400 fill-amber-400 animate-bounce" />
            <h4 className="text-sm font-[1000] tracking-wider uppercase">{status}</h4>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-[280px] mx-auto md:mx-0">
            {desc}
          </p>
        </div>
      </div>

      {!isFinelyTuned && (
        <div className="mt-5 bg-white/[0.03] rounded-2xl p-3 border border-white/[0.05] flex items-center gap-2.5">
          <HelpCircle size={14} className="text-slate-400 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 font-semibold leading-snug">
            Realize o <strong className="text-slate-200 uppercase tracking-wider text-[9px]">Check-in da Semana</strong> acima para sintonizar a inteligência corporal do Coach de forma precisa.
          </p>
        </div>
      )}
    </motion.div>
  );
}
