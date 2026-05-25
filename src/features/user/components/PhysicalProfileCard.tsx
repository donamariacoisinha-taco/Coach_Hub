import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { profileApi } from '../../../lib/api/profileApi';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Ruler, User, Dumbbell, Droplet, Flame, Sparkles, Heart } from 'lucide-react';

export function PhysicalProfileCard() {
  const { profile, updateProfile } = useUserStore();

  // Local state for forms to handle smooth input typing
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [age, setAge] = useState<number | ''>('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');
  const [isFocused, setIsFocused] = useState<string | null>(null);

  // Sync state with profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setGender(profile.gender || '');
      setWeight(profile.weight || '');
      setHeight(profile.height || '');
      setAge(profile.age || '');
      setTargetWeight(profile.target_weight || '');
    }
  }, [profile]);

  const handlePersist = async (field: string, value: any) => {
    if (!profile) return;
    try {
      // Handle empty values
      const parsedValue = value === '' ? null : value;
      await profileApi.updateProfile(profile.id, { [field]: parsedValue });
      updateProfile({ [field]: parsedValue });
    } catch (err) {
      console.error(`[PHYSICAL_PROFILE_PERSIST_ERROR][${field}]`, err);
    }
  };

  // Safe numeric conversion for calculation
  const numWeight = Number(weight) || 0;
  const numHeight = Number(height) || 0;
  const numAge = Number(age) || 0;

  // Calculators
  const calculateIMC = () => {
    if (!numWeight || !numHeight) return null;
    const heightM = numHeight / 100;
    const imc = numWeight / (heightM * heightM);
    return parseFloat(imc.toFixed(1));
  };

  const getIMCInfo = (imc: number | null) => {
    if (imc === null) return null;
    if (imc < 18.5) return { label: 'Abaixo do Peso', color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-200', advice: 'Sua massa corporal está abaixo do recomendado. Foque em superávit calórico leve e ganho de massa magra.' };
    if (imc < 25) return { label: 'Peso Ideal', color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-200', advice: 'Excelente! Seu peso está numa faixa saudável. Mantenha os treinos para ótima composição corporal.' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', advice: 'Fase de transição. Atividades de força e dieta controlada ajudarão na queima de gordura preservando músculos.' };
    if (imc < 35) return { label: 'Obesidade I', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-200', advice: 'Atenção. Exercícios frequentes e reeducação alimentar serão fundamentais para reduzir riscos metabólicos.' };
    return { label: 'Obesidade Grave', color: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', advice: 'Risco de saúde elevado. Recomendamos acompanhamento médico e foco em consistência cardio, mobilidade e força.' };
  };

  // Harris-Benedict BMR Estimation
  const calculateTMB = () => {
    if (!numWeight || !numHeight || !numAge) return null;
    
    // Male: BMR = 88.362 + (13.397 x weight) + (4.799 x height_cm) - (5.677 x age)
    // Female: BMR = 447.593 + (9.247 x weight) + (3.098 x height_cm) - (4.330 x age)
    const isFemale = gender?.toLowerCase() === 'feminino';
    
    if (isFemale) {
      return Math.round(447.593 + (9.247 * numWeight) + (3.098 * numHeight) - (4.330 * numAge));
    } else {
      return Math.round(88.362 + (13.397 * numWeight) + (4.799 * numHeight) - (5.677 * numAge));
    }
  };

  // Caloric Recommendation based on goals and training profile
  const getCaloricRecommendation = (tmb: number | null) => {
    if (!tmb) return null;
    // Estimate baseline daily expenditure with low to moderate activity (e.g. multiplier 1.375)
    const dailyExpenditure = Math.round(tmb * 1.375);
    const userGoal = profile?.goal || '';

    if (userGoal.includes('Hipertrofia') || userGoal.includes('Força')) {
      return {
        target: dailyExpenditure + 300,
        desc: 'Superávit Calórico',
        action: 'Para construir novos tecidos e aumentar força de forma sólida.',
        color: 'text-orange-500'
      };
    } else if (userGoal.includes('Emagrecimento')) {
      return {
        target: dailyExpenditure - 400,
        desc: 'Déficit Calórico',
        action: 'Foco na redução gradual de gordura sem sacrificar massa muscular.',
        color: 'text-sky-500'
      };
    } else {
      return {
        target: dailyExpenditure,
        desc: 'Manutenção Saudável',
        action: 'Equilíbrio ideal para recomposição corporal e melhora de condicionamento.',
        color: 'text-emerald-500'
      };
    }
  };

  // Daily water recommendation (35ml per kg)
  const calculateWater = () => {
    if (!numWeight) return null;
    return parseFloat(((numWeight * 35) / 1000).toFixed(1));
  };

  const imc = calculateIMC();
  const imcInfo = getIMCInfo(imc);
  const tmb = calculateTMB();
  const cals = getCaloricRecommendation(tmb);
  const water = calculateWater();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="space-y-6"
    >
      {/* 1. PHYSICAL PROFILE INPUTS CARD */}
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6 border border-slate-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl">
            <User size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-[1000] uppercase tracking-widest text-slate-900 leading-tight">Dados Corporais</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ajuste suas características físicas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Nome */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
            <div className={`relative flex items-center bg-slate-50 border-2 rounded-2xl transition-all ${isFocused === 'name' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-transparent'}`}>
              <input
                type="text"
                value={name}
                onFocus={() => setIsFocused('name')}
                onBlur={() => { setIsFocused(null); handlePersist('name', name); }}
                onChange={(e) => { setName(e.target.value); updateProfile({ name: e.target.value }); }}
                placeholder="Ex Carlos Roberto"
                className="w-full bg-transparent border-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
              <User size={14} className="absolute right-4 text-slate-300" />
            </div>
          </div>

          {/* Sexo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 font-sans">Sexo Biológico</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); handlePersist('gender', e.target.value); }}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <Heart size={14} />
              </div>
            </div>
          </div>

          {/* Idade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Idade (Anos)</label>
            <div className={`relative flex items-center bg-slate-50 border-2 rounded-2xl transition-all ${isFocused === 'age' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-transparent'}`}>
              <input
                type="number"
                value={age}
                onFocus={() => setIsFocused('age')}
                onBlur={() => { setIsFocused(null); handlePersist('age', age !== '' ? parseInt(age.toString()) : null); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setAge(val === '' ? '' : Number(val));
                  if (val !== '') updateProfile({ age: Number(val) });
                }}
                placeholder="Idade"
                className="w-full bg-transparent border-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Peso */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Peso (kg)</label>
            <div className={`relative flex items-center bg-slate-50 border-2 rounded-2xl transition-all ${isFocused === 'weight' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-transparent'}`}>
              <input
                type="number"
                step="0.1"
                value={weight}
                onFocus={() => setIsFocused('weight')}
                onBlur={() => { setIsFocused(null); handlePersist('weight', weight !== '' ? parseFloat(weight.toString()) : null); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setWeight(val === '' ? '' : Number(val));
                  if (val !== '') updateProfile({ weight: Number(val) });
                }}
                placeholder="Ex 75.5"
                className="w-full bg-transparent border-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0"
              />
              <Scale size={14} className="absolute right-4 text-slate-300" />
            </div>
          </div>

          {/* Altura */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Altura (cm)</label>
            <div className={`relative flex items-center bg-slate-50 border-2 rounded-2xl transition-all ${isFocused === 'height' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-transparent'}`}>
              <input
                type="number"
                value={height}
                onFocus={() => setIsFocused('height')}
                onBlur={() => { setIsFocused(null); handlePersist('height', height !== '' ? parseInt(height.toString()) : null); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setHeight(val === '' ? '' : Number(val));
                  if (val !== '') updateProfile({ height: Number(val) });
                }}
                placeholder="Ex 175"
                className="w-full bg-transparent border-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0"
              />
              <Ruler size={14} className="absolute right-4 text-slate-300" />
            </div>
          </div>

          {/* Meta de Peso */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta de Peso (kg)</label>
            <div className={`relative flex items-center bg-slate-50 border-2 rounded-2xl transition-all ${isFocused === 'targetWeight' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-transparent'}`}>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onFocus={() => setIsFocused('targetWeight')}
                onBlur={() => { setIsFocused(null); handlePersist('target_weight', targetWeight !== '' ? parseFloat(targetWeight.toString()) : null); }}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetWeight(val === '' ? '' : Number(val));
                  if (val !== '') updateProfile({ target_weight: Number(val) });
                }}
                placeholder="Ex: 70.0"
                className="w-full bg-transparent border-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0"
              />
              <Dumbbell size={14} className="absolute right-4 text-slate-300" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC HEALTH INSIGHTS AND IMC DASHBOARD */}
      <AnimatePresence mode="wait">
        {imc !== null ? (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* IMC & Diagnostics Card */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-[80px] opacity-30" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500 rounded-full blur-[80px] opacity-20" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Avaliação de Saúde</h3>
                  <h2 className="text-xl font-bold tracking-tight text-white font-sans">Seus Índices do Coach</h2>
                </div>
                {imcInfo && (
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white decoration-none ${imcInfo.color} shadow-lg shadow-black/10`}>
                    {imcInfo.label}
                  </span>
                )}
              </div>

              {/* Big Stat Box */}
              <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-3xl border border-white/[0.04]">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Seu IMC</p>
                  <p className="text-3xl font-[1000] text-blue-400 tracking-tighter leading-none">{imc}</p>
                </div>
                <div className="space-y-1 border-l border-white/10 pl-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Meta de Peso</p>
                  <p className="text-3xl font-[1000] text-slate-100 tracking-tighter leading-none">
                    {targetWeight ? `${targetWeight} kg` : '--'}
                  </p>
                </div>
              </div>

              {/* Advice */}
              {imcInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Dica Personalizada</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed">
                    {imcInfo.advice}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* TMB Meta Resting */}
              {tmb && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="bg-amber-50 text-amber-500 p-2 rounded-2xl">
                      <Flame size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Gasto Basal (TMB)</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{tmb} <span className="text-xs font-bold text-slate-400">kcal/dia</span></h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Mínimo para seu corpo funcionar em repouso absoluto.</p>
                  </div>
                </div>
              )}

              {/* Calories recommendation */}
              {cals && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="bg-emerald-50 text-emerald-500 p-2 rounded-2xl">
                      <Sparkles size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Meta Calórica</span>
                  </div>
                  <div>
                    <h4 className={`text-xl font-black ${cals.color} tracking-tighter leading-none`}>{cals.target} <span className="text-xs font-bold text-slate-400">kcal/dia</span></h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase font-semibold text-slate-900">{cals.desc}</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 tracking-tight leading-relaxed">{cals.action}</p>
                  </div>
                </div>
              )}

              {/* Hydration card */}
              {water && (
                <div className="col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[2rem] p-6 shadow-md shadow-blue-500/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-100">Meta de Hidratação Diária</span>
                    <h3 className="text-2xl font-[1000] tracking-tighter leading-none">
                      {water} L <span className="text-xs font-bold text-blue-100">/ Dia</span>
                    </h3>
                    <p className="text-[8.5px] font-semibold text-blue-100 tracking-tight leading-none mt-1">Estimativa de 35ml por quilo com base no seu peso de {numWeight} kg.</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-white">
                    <Droplet size={24} className="animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-100 text-slate-500 rounded-3xl p-6 text-center text-xs font-bold border border-slate-200 border-dashed justify-center items-center py-8">
            💡 Adicione seu <strong className="text-slate-900">peso e altura</strong> acima para calcular seu IMC, Metabolismo Basal, recomendações calóricas e hídricas automáticas.
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
