
import React, { useEffect, useState, useMemo } from "react";
import { exerciseApi } from "../lib/api/exerciseApi";
import { getProgressInsights } from "../domain/progression/progressInsights";
import { calculatePR } from "../domain/progression/progressionEngine";
import { ProgressChart } from "./ProgressChart";
import { motion, AnimatePresence } from "motion/react";

interface ExerciseProgressProps {
  exerciseId: string;
  name: string;
}

export const ExerciseProgress: React.FC<ExerciseProgressProps> = ({ exerciseId, name }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await exerciseApi.getExerciseProgress(exerciseId);
        setData(result || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [exerciseId]);

  const insight = useMemo(() => getProgressInsights(data), [data]);
  const pr = useMemo(() => calculatePR(data), [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Recorde Pessoal
        </h2>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
          {name}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-6xl font-black tracking-tighter tabular-nums">
          {pr}
        </p>
        <span className="text-lg font-black uppercase text-gray-300">kg</span>
      </div>

      <AnimatePresence mode="wait">
        {insight && (
          <motion.p 
            key={insight.message}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mt-2"
          >
            {insight.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8">
        {loading ? (
          <div className="w-full h-40 bg-gray-50 rounded-3xl animate-pulse flex items-center justify-center">
             <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ProgressChart data={data} />
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Volume Total</p>
          <p className="text-sm font-black tabular-nums">
            {data.length > 0 ? (data[data.length - 1].volume / 1000).toFixed(1) : 0}t
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Treinos</p>
          <p className="text-sm font-black tabular-nums">{data.length}</p>
        </div>
      </div>
    </motion.div>
  );
};
