import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { premiumProtocolsApi, PremiumProtocol } from '../../../lib/api/premiumProtocolsApi';
import { authApi } from '../../../lib/api/authApi';
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
  const [activeTab, setActiveTab] = useState<'public' | 'premium'>('premium');
  const [selectedProtocol, setSelectedProtocol] = useState<PremiumProtocol | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await premiumProtocolsApi.getProtocols();
    const filteredList = list.filter(p => {
      // Keep only active protocols
      if (p.is_active === false) return false;
      
      // Allow published and potentially missing status, but NOT archived or draft
      const status = p.status || 'published';
      return status !== 'archived' && status !== 'draft';
    });
    setProtocols(filteredList);
  };

  const filteredProtocols = useMemo(() => {
    return protocols.filter(p => {
      return activeTab === 'premium' ? !!p.premium : !p.premium;
    });
  }, [protocols, activeTab]);

  const getGradientForGoal = (goal: string) => {
    const g = goal?.toLowerCase() || '';
    if (g.includes('hypertrophy') || g.includes('hipertrofia')) return GRADIENTS[0];
    if (g.includes('strength') || g.includes('força')) return GRADIENTS[1];
    if (g.includes('weight_loss') || g.includes('emagrecimento')) return GRADIENTS[2];
    if (g.includes('performance')) return GRADIENTS[3];
    return GRADIENTS[4];
  };

  const handleClone = async (p: PremiumProtocol) => {
    try {
        const u = await authApi.getUser();
        if (!u) {
            console.error("User not logged in");
            return;
        }

        await premiumProtocolsApi.cloneToUser(u.id, p.id);
        console.log('Protocol cloned successfully:', p.name);
        setSelectedProtocol(null);
        onRefreshDashboard();
    } catch (e) {
        console.error(e);
    }
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
          const coverUrl = p.image_url;
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
                <button 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                  onClick={() => setSelectedProtocol(p)}
                >
                  Ver Protocolo
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto pb-24 mt-[17px]"
          >
            <h2 className="text-2xl font-bold">{selectedProtocol.name}</h2>
            <p className="text-slate-600 mt-2">{selectedProtocol.description}</p>
            
            <div className="mt-6 max-h-80 overflow-y-auto pr-2">
              {selectedProtocol.workouts.map(workout => (
                <div key={workout.id} className="mb-4">
                  <h4 className="font-semibold text-slate-800">{workout.name}</h4>
                  <ul className="text-sm text-slate-600 list-disc ml-4 mt-1">
                    {workout.exercises.map((exercise, idx) => (
                      <li key={idx}>{exercise.exercise_name} - {exercise.sets}x{exercise.reps}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
                <button className="flex-1 px-4 py-2 bg-slate-100 rounded-lg" onClick={() => setSelectedProtocol(null)}>Fechar</button>
                <button className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg" onClick={() => handleClone(selectedProtocol)}>Adicionar ao meu treino</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
