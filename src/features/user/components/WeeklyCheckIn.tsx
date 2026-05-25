import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { profileApi } from '../../../lib/api/profileApi';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, ChevronRight, Scale, Smile, Moon, Flame, Heart, Check, Droplet } from 'lucide-react';

interface CheckInLog {
  date: string;
  weight: number;
  energy: number; // 1-5
  recovery: number; // 1-5
  sleep: number; // 1-5
  hydration: boolean;
}

export function WeeklyCheckIn() {
  const { profile, updateProfile } = useUserStore();
  
  // Local active index for progressive step flow
  const [step, setStep] = useState<number>(0);
  const [weightInput, setWeightInput] = useState<string>('');
  const [energy, setEnergy] = useState<number>(3);
  const [recovery, setRecovery] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [hydrationChecked, setHydrationChecked] = useState<boolean>(true);
  
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load state and past history
  useEffect(() => {
    if (profile) {
      setWeightInput(profile.weight?.toString() || '');
      
      // Check if already checked in today (localStorage)
      const storedHistory = localStorage.getItem(`rubi_history_${profile.id}`);
      if (storedHistory) {
        const logs: CheckInLog[] = JSON.parse(storedHistory);
        const todayStr = new Date().toISOString().split('T')[0];
        const checkedToday = logs.some(log => log.date === todayStr);
        setHasCheckedInToday(checkedToday);
      }
    }
  }, [profile]);

  if (!profile) return null;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const submitCheckIn = async () => {
    setSaving(true);
    try {
      const numericWeight = parseFloat(weightInput) || profile.weight || 0;
      const todayStr = new Date().toISOString().split('T')[0];

      // Update core profile weight
      if (numericWeight > 0) {
        await profileApi.updateProfile(profile.id, { weight: numericWeight });
        updateProfile({ weight: numericWeight });
      }

      // Add to localStorage timeline
      const newLog: CheckInLog = {
        date: todayStr,
        weight: numericWeight,
        energy,
        recovery,
        sleep,
        hydration: hydrationChecked
      };

      const storedHistory = localStorage.getItem(`rubi_history_${profile.id}`);
      let currentLogs: CheckInLog[] = storedHistory ? JSON.parse(storedHistory) : [];
      
      // Filter out duplicate dates to allow correction
      currentLogs = currentLogs.filter(log => log.date !== todayStr);
      currentLogs.push(newLog);
      
      localStorage.setItem(`rubi_history_${profile.id}`, JSON.stringify(currentLogs));
      
      // Trigger update on readiness score (custom event or state sync)
      window.dispatchEvent(new Event('rubi_checkin_updated'));

      setSuccess(true);
      setHasCheckedInToday(true);
    } catch (err) {
      console.error('[WEEKLY_CHECKIN_ERROR]', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-[80px] opacity-10 pointer-events-none" />

      {hasCheckedInToday ? (
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="bg-emerald-50 text-emerald-500 p-4 rounded-3xl animate-pulse">
            <Check size={28} strokeWidth={3} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Check-in Concluído</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua evolução biológica foi atualizada!</p>
          </div>
          <p className="text-xs font-bold text-slate-500 max-w-[280px] leading-relaxed">
            Parabéns! Suas respostas alimentaram o algoritmo de prontidão de treino. Volte amanhã para reportar seu estado!
          </p>
          <button 
            onClick={() => setHasCheckedInToday(false)}
            className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition"
          >
            Refazer Check-in do Dia
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
                <Calendar size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Check-in de Evolução</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ritual semanal e diário</p>
              </div>
            </div>
            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Passo {step + 1}/5
            </span>
          </div>

          {/* Stepper Wizard Content with elegant transition */}
          <div className="min-h-[140px] flex flex-col justify-center py-2">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div 
                  key="step-weight"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 text-center"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Qual é o seu peso atual?</p>
                  <div className="flex items-center justify-center gap-2 max-w-[180px] mx-auto bg-slate-50 border border-slate-100 rounded-3xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <Scale size={16} className="text-slate-400" />
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full bg-transparent text-center text-lg font-black text-slate-800 placeholder:text-slate-300 focus:outline-none"
                      placeholder="Ex 74.3"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                    />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kg</span>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div 
                  key="step-energy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3 text-center"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Seu nível de energia hoje?</p>
                  <div className="flex justify-center gap-2.5 pt-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setEnergy(lvl)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                          energy === lvl 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-6 pt-1">
                    <span>Esgotado</span>
                    <span>Explosivo</span>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step-sleep"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3 text-center"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Qualidade do sono ontem?</p>
                  <div className="flex justify-center gap-2.5 pt-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSleep(lvl)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                          sleep === lvl 
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20 scale-105' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-6 pt-1">
                    <span>Mal</span>
                    <span>Excelente</span>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step-recovery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3 text-center"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Sua dor muscular / recuperação?</p>
                  <div className="flex justify-center gap-2.5 pt-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setRecovery(lvl)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                          recovery === lvl 
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between px-6 pt-1">
                    <span>Muito Dolorido</span>
                    <span>Novo em folha</span>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step-hydration"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 text-center"
                >
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Beteu a meta de água ontem?</p>
                  <div className="flex justify-center pt-1">
                    <button
                      onClick={() => setHydrationChecked(!hydrationChecked)}
                      className={`px-8 py-3.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${
                        hydrationChecked 
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/10' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Droplet size={18} />
                      <span>{hydrationChecked ? 'Bati a meta! 💧' : 'Não bebi o bastante'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stepper footer controls */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4">
            <button
              disabled={step === 0}
              onClick={handlePrev}
              className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                step === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Voltar
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-800 transition active:scale-95 flex items-center gap-1"
              >
                <span>Próximo</span>
                <ChevronRight size={12} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={submitCheckIn}
                disabled={saving}
                className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-600 transition active:scale-95 shadow-md shadow-emerald-500/10 flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={12} strokeWidth={3} />
                    <span>Concluir</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
