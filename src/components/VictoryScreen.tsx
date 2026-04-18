
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, ArrowRight, Share2, CheckCircle2, Flame, Star } from "lucide-react";
import { useNavigation } from "../App";
import { authApi } from "../lib/api/authApi";
import { workoutApi } from "../lib/api/workoutApi";
import { profileApi } from "../lib/api/profileApi";
import { calculateStreak } from "../domain/streak/streakEngine";
import { checkAchievements, Achievement } from "../domain/achievementEngine";
import { getAdvancedEmotionalFeedback } from "../domain/feedback/feedbackEngine";
import { getNextGoal } from "../domain/goalEngine";
import { exerciseApi } from "../lib/api/exerciseApi";
import { calculatePR } from "../domain/progression/progressionEngine";
import { getProgressInsights } from "../domain/progression/progressInsights";

interface VictoryScreenProps {
  historyId: string;
  duration: number;
  exercisesCount: number;
  onDone?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ historyId, duration, exercisesCount, onDone }) => {
  const { navigate } = useNavigation();
  const [totalVolume, setTotalVolume] = useState(0);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [feedback, setFeedback] = useState("");
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const user = await authApi.getUser();
        if (!user) return;

        // 1. Volume e Histórico
        const [logs, history] = await Promise.all([
          workoutApi.getWorkoutLogs(historyId),
          workoutApi.getWorkoutHistory(user.id)
        ]);
        
        const volume = logs.reduce((acc: any, curr: any) => acc + (curr.weight_achieved * curr.reps_achieved), 0);
        setTotalVolume(volume);

        // 2. Streak
        const currentStreak = calculateStreak(history.map((h: any) => h.completed_at));
        setStreak(currentStreak);

        // 3. PR Check (simplificado para o último exercício do treino)
        let isPR = false;
        let volumeTrend = 0;
        if (logs.length > 0) {
          const lastExId = logs[logs.length - 1].exercise_id;
          const progress = await exerciseApi.getExerciseProgress(lastExId);
          const pr = calculatePR(progress);
          const lastSetWeight = logs[logs.length - 1].weight_achieved;
          isPR = lastSetWeight >= pr;
          
          const insights = getProgressInsights(progress);
          volumeTrend = insights?.volumeTrend || 0;
        }

        // 4. Achievements (Fetch from DB + Local for immediate PR)
        const earnedBadges = await workoutApi.getAchievements(user.id);
        const mappedAchievements = earnedBadges
          .filter((b: any) => {
            // Só mostramos as conquistas obtidas nos últimos minutos (ou seja, nesta sessão)
            const achievedAt = new Date(b.achieved_at).getTime();
            return (Date.now() - achievedAt) < 60000; 
          })
          .map((b: any) => ({
            id: b.badge_id,
            title: b.badges.name,
            icon: b.badges.icon,
            description: b.badges.description
          }));

        setAchievements(mappedAchievements);

        // 5. Feedback & Goals
        setFeedback(getAdvancedEmotionalFeedback({ streak: currentStreak, pr: isPR, volumeTrend }));
        setGoal(getNextGoal({ streak: currentStreak }));

        // 6. Update Profile Streak
        await profileApi.updateStreak(user.id, currentStreak);

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
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">{feedback || "Você está mais perto do seu objetivo"}</p>
      </motion.div>

      {streak > 0 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center gap-3 px-6 py-3 bg-orange-50 rounded-full border border-orange-100"
        >
          <Flame size={18} className="text-orange-500 fill-orange-500" />
          <span className="text-sm font-black text-orange-600 tabular-nums">{streak} dias seguidos</span>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-12">
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

      <AnimatePresence>
        {achievements.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-10 space-y-4 w-full max-w-xs"
          >
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Conquistas Desbloqueadas</p>
            {achievements.map((ach) => (
              <div key={ach.id} className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="text-2xl">{ach.icon}</div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-tight text-amber-900">{ach.title}</p>
                  <p className="text-[8px] font-bold text-amber-700/60 uppercase tracking-widest">{ach.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {goal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 px-8 py-4 bg-gray-50 rounded-3xl border border-gray-100"
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">
            {goal.message}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-16 w-full max-w-xs space-y-4"
      >
        <button 
          onClick={() => {
            if (onDone) onDone();
            navigate('dashboard');
          }}
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
