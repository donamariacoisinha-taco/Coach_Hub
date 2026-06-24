import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { premiumProtocolsApi, PremiumProtocol } from '../../../lib/api/premiumProtocolsApi';
import { UserProfile } from '../../../types';
import { isAdmin } from '../../../lib/utils/auth';

interface PremiumLibraryV3Props {
  profile: UserProfile | null;
  onRefreshDashboard: () => void;
  onTabChange: (tab: 'protocols' | 'evolution' | 'premium') => void;
  history?: any[];
}

const GRADIENTS = [
  'from-purple-600 to-blue-500',
  'from-blue-800 to-black',
  'from-green-600 to-blue-500',
  'from-orange-600 to-red-600',
  'from-yellow-600 to-black'
];

export const PremiumLibraryV3: React.FC<PremiumLibraryV3Props> = ({ profile, onRefreshDashboard, onTabChange }) => {
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [activeTab, setActiveTab] = useState<'premium' | 'public'>('public');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await premiumProtocolsApi.getProtocols();
    const filteredList = list.filter(p => {
      if (p.is_active === false) return false;
      const status = p.status || 'published';
      if (status !== 'published') return false;
      return true;
    });
    setProtocols(filteredList);
  };

  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      return activeTab === 'premium' ? p.premium : !p.premium;
    });
  }, [protocols, activeTab]);

  const getGradientForGoal = (goal: string) => {
    if (goal.includes('hypertrophy')) return GRADIENTS[0];
    if (goal.includes('strength')) return GRADIENTS[1];
    if (goal.includes('weight_loss')) return GRADIENTS[2];
    if (goal.includes('performance')) return GRADIENTS[3];
    return GRADIENTS[4];
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Biblioteca de Protocolos</h1>
        <p className="text-slate-500 mt-1">Escolha um protocolo e comece hoje.</p>
      </header>

      <div className="flex space-x-2 mb-8 bg-slate-100 p-1 rounded-full w-fit">
        {(['public', 'premium'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === tab 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab === 'premium' ? '🏆 Premium' : '🌎 Pública'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProtocols.map(p => {
          // @ts-ignore
          const coverUrl = p.cover_image_url;
          const gradient = getGradientForGoal(p.goal);
          
          const GOAL_MAP: Record<string, string> = {
            'hypertrophy': 'Hipertrofia',
            'strength': 'Força',
            'weight_loss': 'Emagrecimento',
            'performance': 'Performance',
            'specialization': 'Especialização'
          };
          
          const DIFFICULTY_MAP: Record<string, string> = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário',
            'advanced': 'Avançado'
          };
          
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className={`h-40 ${coverUrl ? '' : `bg-gradient-to-br ${gradient}`}`}>
                {coverUrl && <img src={coverUrl} alt={p.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-5 flex-grow">
                <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{GOAL_MAP[p.goal?.toLowerCase()] || p.goal}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{DIFFICULTY_MAP[p.difficulty?.toLowerCase()] || p.difficulty}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{p.frequency}x/semana</span>
                </div>
              </div>
              <div className="p-5 pt-0">
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
                  Ver Protocolo
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
