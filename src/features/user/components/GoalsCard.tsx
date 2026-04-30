import React from 'react';
import { useUserStore } from '../../../store/userStore';
import { profileApi } from '../../../lib/api/profileApi';
import { motion } from 'motion/react';
import { Target, Calendar } from 'lucide-react';

export function GoalsCard() {
  const { profile, updateProfile } = useUserStore();

  const handleUpdate = async (field: string, value: string) => {
    if (!profile) return;
    try {
      await profileApi.updateProfile(profile.id, { [field]: value });
      updateProfile({ [field]: value });
    } catch (err) {
      console.error('[GOALS_UPDATE_ERROR]', err);
    }
  };

  const goals = [
    'Hipertrofia',
    'Emagrecimento',
    'Condicionamento',
    'Força Máxima',
    'Flexibilidade'
  ];

  const frequencies = [
    { label: '3x por semana', value: '3' },
    { label: '4x por semana', value: '4' },
    { label: '5x por semana', value: '5' },
    { label: 'Diário', value: '7' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6 border border-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
          <Target size={18} strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-[1000] uppercase tracking-widest text-slate-900">Metas Fitness</h2>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-[1000] uppercase tracking-widest text-slate-400 ml-1">Objetivo Principal</label>
          <div className="relative group">
            <select
              value={profile?.goal || ''}
              onChange={(e) => handleUpdate('goal', e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="" disabled>Selecione um objetivo</option>
              {goals.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Target size={14} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-[1000] uppercase tracking-widest text-slate-400 ml-1">Frequência Semanal</label>
          <div className="relative group">
            <select
              value={profile?.frequency || ''}
              onChange={(e) => handleUpdate('frequency', e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="" disabled>Selecione a frequência</option>
              {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Calendar size={14} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
