import React, { useRef, useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { Camera, Check, Edit2, Zap, Award, Sparkles, Heart } from 'lucide-react';
import { cloudinaryService } from '../../../services/cloudinaryService';
import { profileApi } from '../../../lib/api/profileApi';
import { motion, AnimatePresence } from 'motion/react';

export function ProfileHeader() {
  const { profile, updateProfile } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLocalName(profile.name || profile.full_name || '');
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      console.log('[PROFILE][AVATAR_UPLOAD_START]');
      const url = await cloudinaryService.uploadImage(file, 'avatars');
      
      // Update DB
      await profileApi.updateProfile(profile.id, { avatar_url: url });
      
      // Update Store
      updateProfile({ avatar_url: url });
      console.log('[PROFILE][AVATAR_UPLOAD_SUCCESS]', url);
    } catch (err) {
      console.error('[PROFILE][AVATAR_UPLOAD_ERROR]', err);
    }
  };

  const handleSaveName = async () => {
    if (!profile || !localName.trim()) return;
    setSaving(true);
    try {
      await profileApi.updateProfile(profile.id, { 
        name: localName.trim(), 
        full_name: localName.trim() 
      });
      updateProfile({ 
        name: localName.trim(), 
        full_name: localName.trim() 
      });
      setIsEditing(false);
    } catch (err) {
      console.error('[PROFILE][NAME_SAVE_ERROR]', err);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  // Compute Adaptive Athlete Title
  const getAthleteTitle = (): string => {
    const workouts = profile.workouts_completed || 0;
    const streak = profile.workout_streak || 0;
    const goalStr = (profile.goal || '').toLowerCase();

    if (streak >= 5) return 'Disciplina Elevada';
    if (workouts > 12) return 'Volume Estratégico';
    if (streak >= 3) return 'Consistente';
    if (goalStr.includes('hipertrofia')) return 'Construção de Massa';
    if (goalStr.includes('força') || goalStr.includes('intensidade')) return 'Alta Intensidade';
    return 'Recuperação Eficiente';
  };

  const title = getAthleteTitle();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="bg-slate-900 rounded-[2.5rem] p-8 text-center space-y-6 border border-slate-800 shadow-2xl relative overflow-hidden"
    >
      {/* Background soft glowing accent lines/spheres inspired by Oura */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-36 h-36 bg-emerald-500 rounded-full blur-[80px] opacity-15 pointer-events-none" />

      {/* Avatar Container with glowing border */}
      <div className="relative mx-auto w-28 h-28 group">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-emerald-500 opacity-60 blur-[3px] scale-105 group-hover:opacity-100 transition duration-500" />
        <img
          src={profile?.avatar_url || (profile?.gender?.toLowerCase() === 'feminino'
            ? 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=300&h=300'
            : 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=300&h=300')}
          className="w-full h-full rounded-full object-cover border-4 border-slate-900 relative z-10 transition-transform duration-500 group-hover:scale-102"
          alt="Avatar"
          referrerPolicy="no-referrer"
        />

        <button 
          onClick={handleAvatarClick}
          className="absolute bottom-0 right-0 bg-white text-slate-900 p-2.5 rounded-full shadow-lg hover:scale-115 active:scale-90 transition-all z-20 border border-slate-100"
          title="Alterar Foto"
        >
          <Camera size={14} className="stroke-[2.5]" />
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      {/* Text Info */}
      <div className="space-y-3 pt-1 flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit-input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-2 w-full max-w-xs transition-all focus-within:border-blue-500"
            >
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                }}
                className="bg-transparent border-none text-center text-lg font-black text-white focus:outline-none w-full"
                placeholder="Seu nome"
                autoFocus
              />
              <button 
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  handleSaveName();
                }}
                disabled={saving}
                className="p-1 text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="display-name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(true)}
              className="group/name flex items-center justify-center gap-2 cursor-pointer py-1"
            >
              <h1 className="text-2xl font-black tracking-tight text-white group-hover/name:text-blue-400 transition-colors">
                {profile?.name || profile?.full_name || 'Corredor Rubi'}
              </h1>
              <Edit2 size={12} className="text-slate-500 group-hover/name:text-blue-400 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Athlete Characteristics badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-3.5 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/10 flex items-center gap-1">
            <Award size={10} strokeWidth={3} />
            {title}
          </span>
          <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
            {profile?.goal || 'Sem Objetivo'}
          </span>
        </div>

        {/* Real-time Status banner */}
        <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/[0.04] mt-2">
          <Sparkles size={11} className="text-amber-400 animate-pulse fill-amber-400" />
          <span className="text-[10px] text-slate-300 font-bold leading-none">
            Seu ritmo semanal está ativo e focado.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
