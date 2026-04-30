import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  Zap, 
  Calendar, 
  Clock, 
  Dumbbell, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Trophy,
  User
} from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useUserStore } from '../../store/userStore';
import { profileApi } from '../../lib/api/profileApi';
import { authApi } from '../../lib/api/authApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Goal, ExperienceLevel, EquipmentPreference, UserProfile } from '../../types';
import { useNavigation } from '../../App';

// Steps Constants
const TOTAL_STEPS = 7;

export default function SmartOnboarding() {
  const { step, data, next, back, setData, reset } = useOnboardingStore();
  const { setProfile } = useUserStore();
  const { navigate } = useNavigation();
  const { showSuccess, showError } = useErrorHandler();
  const [isFinishing, setIsFinishing] = useState(false);

  const progress = (step / (TOTAL_STEPS - 1)) * 100;

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const user = await authApi.getUser();
      if (!user) throw new Error('Sessão expirada');

      const finalProfileData = {
        id: user.id,
        name: data.name || user.user_metadata?.full_name || 'Atleta Rubi',
        goal: data.goal,
        experience_level: data.experience_level as any,
        preference: data.preference as any,
        days_per_week: data.days_per_week,
        time_available: data.time_available,
        onboarding_completed: true,
      };

      await profileApi.updateProfile(user.id, finalProfileData);
      
      const fullProfile = await profileApi.getProfile(user.id);
      if (fullProfile) {
        setProfile(fullProfile);
      }
      
      showSuccess('Perfil Configurado!', 'Bem-vindo ao Coach Rubi.');
      reset(); // Clear onboarding draft
      navigate('dashboard');
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar perfil');
      setIsFinishing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep onNext={next} />;
      case 1: return <NameStep value={data.name || ''} onChange={(v) => setData('name', v)} onNext={next} />;
      case 2: return <GoalStep value={data.goal} onChange={(v) => { setData('goal', v); next(); }} />;
      case 3: return <LevelStep value={data.experience_level} onChange={(v) => { setData('experience_level', v); next(); }} />;
      case 4: return <PreferenceStep value={data.preference} onChange={(v) => { setData('preference', v); next(); }} />;
      case 5: return <FrequencyStep value={data.days_per_week || 3} onChange={(v) => setData('days_per_week', v)} onNext={next} />;
      case 6: return <DurationStep value={data.time_available || 45} onChange={(v) => setData('time_available', v)} onNext={handleFinish} isFinishing={isFinishing} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md flex flex-col h-full z-10">
        {/* Top Progress Bar */}
        <div className="pt-2 pb-8">
          <div className="flex items-center justify-between mb-4">
             {step > 0 ? (
               <button onClick={back} className="text-slate-400 hover:text-slate-900 transition-colors p-2 -ml-2">
                 <ChevronLeft size={20} strokeWidth={3} />
               </button>
             ) : (
               <div className="w-8" />
             )}
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
               {step === 0 ? 'Início' : `Passo ${step} de ${TOTAL_STEPS - 1}`}
             </span>
             <div className="w-8" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-slate-900"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- Steps Components ---

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
      <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
        <Sparkles size={40} className="text-white" strokeWidth={2.5} />
      </div>
      
      <div className="space-y-3">
        <h1 className="text-4xl font-[1000] tracking-tighter text-slate-900 leading-none">
          Bem-vindo ao<br />Coach Rubi
        </h1>
        <p className="text-slate-500 text-lg font-medium">
          Vamos configurar sua jornada fitness inteligente em poucos segundos.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
      >
        Começar Agora
        <ChevronRight size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

function NameStep({ value, onChange, onNext }: { value: string, onChange: (v: string) => void, onNext: () => void }) {
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4">
        <div className="bg-blue-50 text-blue-600 p-4 rounded-3xl w-fit">
          <User size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Como podemos te chamar?</h2>
        <p className="text-slate-500">Queremos personalizar sua experiência.</p>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Seu nome"
        autoFocus
        className="w-full bg-white border-4 border-slate-50 rounded-3xl p-6 text-xl font-bold placeholder:text-slate-300 focus:border-blue-500 focus:ring-0 transition-all shadow-sm"
      />

      <button
        disabled={!value.trim()}
        onClick={onNext}
        className="w-full bg-slate-900 disabled:bg-slate-200 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
      >
        Continuar
      </button>
    </div>
  );
}

function GoalStep({ value, onChange }: { value: string | null, onChange: (v: string) => void }) {
  const options = [
    { id: Goal.HYPERTROPHY, label: 'Ganhar Músculos', desc: 'Foco em hipertrofia e volume', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: Goal.WEIGHT_LOSS, label: 'Emagrecer', desc: 'Queima calórica e definição', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: Goal.STRENGTH, label: 'Ficar Forte', desc: 'Powerlifting e força máxima', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: Goal.ENDURANCE, label: 'Resistência', desc: 'Condicionamento físico geral', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Qual seu objetivo?</h2>
        <p className="text-slate-500">Isso ajuda a I.A. a moldar seus treinos.</p>
      </div>

      <div className="grid gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-full flex items-center p-5 rounded-3xl border-4 transition-all text-left ${
              value === opt.id ? 'border-slate-900 bg-white scale-[1.02] shadow-lg' : 'border-slate-50 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`${opt.bg} ${opt.color} p-3 rounded-2xl mr-4`}>
              <opt.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-900">{opt.label}</p>
              <p className="text-xs font-medium text-slate-400">{opt.desc}</p>
            </div>
            {value === opt.id && <CheckCircle2 className="text-slate-900 ml-4" size={24} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function LevelStep({ value, onChange }: { value: string | null, onChange: (v: string) => void }) {
  const options = [
    { id: ExperienceLevel.BEGINNER, label: 'Iniciante', desc: 'Novo na jornada (0-1 ano)', icon: Sparkles, color: 'text-sky-500' },
    { id: ExperienceLevel.INTERMEDIATE, label: 'Intermediário', desc: 'Já treino há algum tempo (1-3 anos)', icon: Zap, color: 'text-amber-500' },
    { id: ExperienceLevel.ADVANCED, label: 'Avançado', desc: 'Nível avançado (+3 anos)', icon: Trophy, color: 'text-slate-900' }
  ];

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Seu nível de experiência</h2>
        <p className="text-slate-500">Para calibrar a complexidade dos exercícios.</p>
      </div>

      <div className="grid gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-full flex flex-col p-6 rounded-[2.5rem] border-4 transition-all text-center space-y-3 ${
              value === opt.id ? 'border-slate-900 bg-white scale-[1.02] shadow-lg' : 'border-slate-50 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`${opt.color} flex justify-center`}>
              <opt.icon size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{opt.label}</p>
              <p className="text-xs font-semibold text-slate-400">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PreferenceStep({ value, onChange }: { value: string | null, onChange: (v: string) => void }) {
  const options = [
    { id: EquipmentPreference.MACHINES, label: 'Máquinas', desc: 'Segurança e isolamento', icon: Dumbbell },
    { id: EquipmentPreference.FREE_WEIGHTS, label: 'Pesos Livres', desc: 'Estímulo e liberdade', icon: Zap },
    { id: EquipmentPreference.BOTH, label: 'Misto / Ambos', desc: 'O melhor dos dois mundos', icon: Sparkles }
  ];

  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Onde você prefere treinar?</h2>
        <p className="text-slate-500">Isso influencia a seleção de exercícios.</p>
      </div>

      <div className="grid gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-full flex items-center p-6 rounded-[2.5rem] border-4 transition-all text-left ${
              value === opt.id ? 'border-slate-900 bg-white scale-[1.02] shadow-lg' : 'border-slate-50 bg-white hover:border-slate-200'
            }`}
          >
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mr-4">
               <opt.icon size={24} strokeWidth={2.5} />
             </div>
             <div className="flex-1">
               <p className="font-black text-slate-900">{opt.label}</p>
               <p className="text-xs font-medium text-slate-400">{opt.desc}</p>
             </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FrequencyStep({ value, onChange, onNext }: { value: number, onChange: (v: number) => void, onNext: () => void }) {
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4 text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-3xl w-fit mx-auto mb-4">
           <Calendar size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Quantos dias por semana?</h2>
        <p className="text-slate-500">Consistência é a chave para o sucesso.</p>
      </div>

      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-slate-50">
        {[2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-full font-black text-lg transition-all ${
              value === num ? 'bg-slate-900 text-white scale-125 shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <p className="text-center font-bold text-slate-400 text-sm">Praticar {value}x por semana</p>

      <button
        onClick={onNext}
        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
      >
        Próximo
      </button>
    </div>
  );
}

function DurationStep({ value, onChange, onNext, isFinishing }: { value: number, onChange: (v: number) => void, onNext: () => void, isFinishing: boolean }) {
  return (
    <div className="space-y-8 py-8">
      <div className="space-y-4 text-center">
        <div className="bg-purple-50 text-purple-600 p-4 rounded-3xl w-fit mx-auto mb-4">
           <Clock size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900">Quanto tempo por treino?</h2>
        <p className="text-slate-500">Adaptamos o volume para o seu tempo.</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between px-2 font-black text-[10px] text-slate-300 uppercase tracking-widest">
          <span>Rápido</span>
          <span>Equilibrado</span>
          <span>Completo</span>
        </div>
        <input
          type="range"
          min="20"
          max="90"
          step="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
        />
        <div className="text-center">
           <span className="text-5xl font-[1000] text-slate-900">{value}</span>
           <span className="text-xl font-bold text-slate-400 ml-2">min</span>
        </div>
      </div>

      <button
        disabled={isFinishing}
        onClick={onNext}
        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 overflow-hidden relative"
      >
        {isFinishing ? (
          <motion.div 
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Processando...
          </motion.div>
        ) : (
          <>
            Montar Meu Plano
            <ArrowRight size={18} strokeWidth={3} />
          </>
        )}
      </button>
    </div>
  );
}
