import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Dumbbell, ShieldCheck, Heart, Sparkles, Sliders, Calendar } from 'lucide-react';
import { useNutritionStore, EditableNutritionProfile } from '../../../store/nutritionStore';
import { useUserStore } from '../../../store/userStore';
import { profileApi } from '../../../lib/api/profileApi';
import { WeightStepper } from './WeightStepper';
import { GoalSelector } from './GoalSelector';
import { ActivitySelector } from './ActivitySelector';
import { LiveMetabolicPreview } from './LiveMetabolicPreview';

export const MetabolicSettingsSheet: React.FC = () => {
  const { profile: userProfile, updateProfile } = useUserStore();
  const { 
    profile, 
    metabolicState, 
    showMetabolicSettings, 
    setShowSettings, 
    setProfileField, 
    updateFullProfile,
    syncFromUserProfile 
  } = useNutritionStore();

  const [isSaving, setIsSaving] = useState(false);

  // Sync state from core user profile once opened
  useEffect(() => {
    if (showMetabolicSettings && userProfile) {
      syncFromUserProfile(userProfile);
    }
  }, [showMetabolicSettings, userProfile]);

  if (!showMetabolicSettings) return null;

  const handleClose = () => {
    setShowSettings(false);
    if ('vibrate' in navigator) navigator.vibrate(3);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
    try {
      // Sync to local and global Zustand profile
      const dataToSync = {
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        goal: profile.goal,
        target_weight: profile.target_weight,
        days_per_week: profile.training_frequency,
        experience_level: profile.athletic_level as any,
      };

      updateProfile(dataToSync);
      
      // Attempt safe offline sync to Supabase database via standard profileApi if logged in User exists
      if (userProfile?.id) {
        await profileApi.updateProfile(userProfile.id, {
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
          gender: profile.gender,
          goal: profile.goal,
          target_weight: profile.target_weight,
          days_per_week: profile.training_frequency,
          experience_level: profile.athletic_level as any,
        });
      }

      setShowSettings(false);
    } catch (err) {
      console.error("Failed to sync metabolic settings back to central store", err);
      setShowSettings(false);
    } finally {
      setIsSaving(false);
    }
  };

  const springTransition = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 0.8
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center select-none overflow-hidden">
      
      {/* 1. SOLID BLUR TRANSPARENT OVERLAY */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer"
      />

      {/* 2. THE BOTTOM PANEL (Apple Health / Oura overlay) */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={springTransition}
        className="relative w-full max-w-2xl bg-white/75 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-x border-white/40 shadow-[0_-10px_40px_rgba(15,23,42,0.08)] max-h-[92vh] flex flex-col z-10"
      >
        {/* Soft Drag handle */}
        <div className="mx-auto w-12 h-1.5 bg-slate-200/60 rounded-full mt-3.5" />

        {/* Editorial Sheet Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <span className="uppercase tracking-[0.22em] text-[9.5px] font-bold text-slate-400 block leading-none">
              METABOLIC CONFIGURATOR
            </span>
            <h3 className="text-xl font-light text-slate-800 tracking-tight block">
              Configurações Metabólicas
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/50 flex items-center justify-center text-slate-500 active:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Container ( Momentum scrollable safe space ) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar pb-32">
          
          {/* LIVE METABOLIC REAL-TIME CALCULATOR ENGINE UNIT */}
          <LiveMetabolicPreview state={metabolicState} />

          {/* SECTION 1 — BIOLOGICAL PROFILE */}
          <div className="space-y-5">
            <span className="uppercase tracking-[0.22em] text-[11px] font-bold text-slate-400 block">
              1. Identidade Biológica & Corpo
            </span>

            {/* Biological Sex soft selectors */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sexo Biológico</label>
              <div className="grid grid-cols-2 gap-3.5">
                {['masculino', 'feminino'].map((g) => {
                  const isActive = profile.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setProfileField('gender', g as any);
                        if ('vibrate' in navigator) navigator.vibrate(5);
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-semibold tracking-tight border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7BA7FF]/10 border-[#7BA7FF] text-[#7BA7FF] font-bold'
                          : 'bg-slate-50 border-slate-205 text-slate-450 hover:bg-slate-100/50'
                      }`}
                    >
                      {g === 'masculino' ? 'Masculino (Harris-Benedict x Masculino)' : 'Feminino (Harris-Benedict x Feminino)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weight and Age & Height Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              
              {/* Age select stepper */}
              <WeightStepper
                label="Idade do Atleta"
                value={profile.age}
                onChange={(v) => setProfileField('age', v)}
                min={12}
                max={99}
                step={1}
                unit="anos"
              />

              {/* Height select stepper */}
              <WeightStepper
                label="Estatura do Atleta"
                value={profile.height}
                onChange={(v) => setProfileField('height', v)}
                min={100}
                max={230}
                step={1}
                unit="cm"
              />

              {/* Weight stepper */}
              <WeightStepper
                label="Peso Corporal Atual"
                value={profile.weight}
                onChange={(v) => setProfileField('weight', v)}
                min={30}
                max={250}
                step={0.1}
                unit="kg"
              />

              {/* Goal Weight stepper */}
              <WeightStepper
                label="Peso Meta Almejado"
                value={profile.target_weight}
                onChange={(v) => setProfileField('target_weight', v)}
                min={30}
                max={250}
                step={0.1}
                unit="kg"
              />

            </div>
          </div>

          {/* SECTION 2 — TRAINING, LIFESTYLE & ATHLETIC FOCUS */}
          <div className="space-y-6 pt-2 border-t border-slate-100">
            <span className="uppercase tracking-[0.22em] text-[11px] font-bold text-slate-400 block">
              2. Ritmo, Estilo de Vida & Objetivos
            </span>

            {/* Goal selector editorial */}
            <GoalSelector 
              selected={profile.goal}
              onChange={(g) => setProfileField('goal', g as any)}
            />

            {/* Activity pill dynamic */}
            <ActivitySelector 
              selected={profile.activityLevel}
              onChange={(a) => setProfileField('activityLevel', a)}
            />

            {/* Training Frequency selection (pills 1 to 7 days) */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400">
                  FREQUÊNCIA DE TREINOS SEMANAL
                </span>
                <span className="text-[10px] text-slate-450 font-medium font-mono">
                  Sessões dedicadas ao estímulo
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 p-1 bg-slate-100/60 rounded-2xl border border-slate-205">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const isActive = profile.training_frequency === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setProfileField('training_frequency', num);
                        if ('vibrate' in navigator) navigator.vibrate(3);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7BA7FF] text-white shadow-sm'
                          : 'text-slate-450 hover:text-slate-750'
                      }`}
                    >
                      {num} {num === 1 ? 'dia' : 'dias'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience or athletic level pills */}
            <div className="space-y-3 pt-1">
              <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400 px-1">
                CLASSIFICAÇÃO DE EXPERIÊNCIA ATALHO
              </span>
              <div className="grid grid-cols-3 gap-3">
                {['Iniciante', 'Intermediário', 'Avançado'].map((lvl) => {
                  const isActive = profile.athletic_level === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setProfileField('athletic_level', lvl as any);
                        if ('vibrate' in navigator) navigator.vibrate(4);
                      }}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold tracking-tight border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 border-slate-800 text-white font-bold'
                          : 'bg-slate-50 border-slate-205 text-slate-450 hover:bg-slate-105'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weekly Intensity Selection */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="uppercase tracking-[0.18em] text-[10px] font-bold text-slate-400">
                  FOCO DE INTENSIDADE DA SEMANA
                </span>
                <span className="text-[10px] text-slate-450 font-medium font-mono">
                  Sensibilidade neuromuscular
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Resistência', 'Hipertrofia', 'Força', 'Recuperação'].map((int) => {
                  const isActive = profile.weekly_intensity === int;
                  return (
                    <button
                      key={int}
                      type="button"
                      onClick={() => {
                        setProfileField('weekly_intensity', int as any);
                        if ('vibrate' in navigator) navigator.vibrate(3);
                      }}
                      className={`py-2.5 rounded-xl text-[10.5px] font-semibold tracking-tight border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#818CF8]/10 border-[#818CF8] text-[#818CF8] font-bold'
                          : 'bg-slate-50 border-slate-205 text-slate-450 hover:bg-slate-105'
                      }`}
                    >
                      {int}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Glassmorphic Floating Button Bar */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-12 flex space-x-4 pointer-events-auto">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 border border-slate-200 text-slate-505 py-4 rounded-2xl font-bold text-xs transition-colors hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            Sair Sem Salvar
          </button>
          
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 bg-slate-900 border border-slate-950 text-white py-4 rounded-2xl font-bold text-xs transition-colors hover:bg-slate-800 shadow-xl active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSaving ? (
              <span className="text-white/60">Sincronizando...</span>
            ) : (
              <>
                <Check size={14} />
                <span>Aplicar Configuração</span>
              </>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
export default MetabolicSettingsSheet;
