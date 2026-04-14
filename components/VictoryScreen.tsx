
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import { useNavigation } from "../App";
import { supabase } from "../lib/supabase";

interface VictoryScreenProps {
  historyId: string;
  duration: number;
  exercisesCount: number;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ historyId, duration, exercisesCount }) => {
  const { navigate } = useNavigation();
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await supabase
          .from('workout_sets_log')
          .select('weight_achieved, reps_achieved')
          .eq('history_id', historyId);
        
        if (data) {
          const volume = data.reduce((acc, curr) => acc + (curr.weight_achieved * curr.reps_achieved), 0);
          setTotalVolume(volume);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [historyId]);

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-10"
      >
        <Trophy size={40} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-black tracking-tighter uppercase">Treino Concluído</h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Você está mais perto do seu objetivo</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-16">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-gray-50 rounded-[2rem] text-left"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">Duração</p>
          <p className="text-xl font-black tabular-nums">{duration} min</p>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-gray-50 rounded-[2rem] text-left"
        >
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">Volume</p>
          <p className="text-xl font-black tabular-nums">{(totalVolume / 1000).toFixed(1)}t</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-16 w-full max-w-xs space-y-4"
      >
        <button 
          onClick={() => navigate('dashboard')}
          className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          Ir para Dashboard <ArrowRight size={16} />
        </button>
        <button 
          className="w-full h-16 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          Compartilhar <Share2 size={16} />
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-green-500"
      >
        <CheckCircle2 size={12} />
        Sessão salva com sucesso
      </motion.div>
    </div>
  );
};
