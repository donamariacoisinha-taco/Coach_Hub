import React from 'react';
import { useUserStore } from '../../../store/userStore';
import { motion } from 'motion/react';
import { Award, Zap, Clock } from 'lucide-react';

export function ProgressStats() {
  const { profile } = useUserStore();
  
  const stats = [
    { 
      label: 'Treinos', 
      value: profile?.workouts_completed || 0, 
      icon: Award,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Streak', 
      value: profile?.workout_streak || 0, 
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    },
    { 
      label: 'Minutos', 
      value: profile?.total_minutes || 0, 
      icon: Clock,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] grid grid-cols-3 gap-2 border border-slate-50"
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex flex-col items-center justify-center space-y-2 py-2">
          <div className={`${stat.bg} ${stat.color} p-2.5 rounded-2xl`}>
            <stat.icon size={18} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-xl font-[1000] text-slate-900 tracking-tighter leading-none">{stat.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
