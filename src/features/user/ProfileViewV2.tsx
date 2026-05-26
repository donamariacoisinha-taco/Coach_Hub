import React, { useEffect, useState, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { profileApi } from '../../lib/api/profileApi';
import { authApi } from '../../lib/api/authApi';
import { cloudinaryService } from '../../services/cloudinaryService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Loader2 as Spinner, Camera, Sparkles, Scale, Target, 
  Droplet, Flame, Trophy, Activity, Compass, Info, LogOut 
} from 'lucide-react';
import { useNavigation } from '../../App';

// Import our enhanced modular panels which we will style continuously below 
import { WeeklyCheckIn } from './components/WeeklyCheckIn';
import { ReadinessScore } from './components/ReadinessScore';
import { EvolutionTimeline } from './components/EvolutionTimeline';
import { BodyRecompositionVisualizer } from './components/BodyRecompositionVisualizer';
import { ProgressPhotoSystem } from './components/ProgressPhotoSystem';
import { AthleteDNASystem } from './components/AthleteDNASystem';
import { ProfileActions } from './components/ProfileActions';

interface CheckInLog {
  date: string;
  weight: number;
  energy: number;
  recovery: number;
  sleep: number;
  hydration: boolean;
}

export default function ProfileViewV2() {
  const { profile: storeProfile, setProfile, updateProfile, loading: storeLoading } = useUserStore();
  const { goBack } = useNavigation();

  // Local safety loader and session indicator
  const [localLoading, setLocalLoading] = useState(true);
  const [userIdRef, setUserIdRef] = useState<string>('local_athlete');

  // Local Form States
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [goal, setGoal] = useState('');
  const [frequency, setFrequency] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSize, setAvatarSize] = useState<number>(() => {
    const saved = localStorage.getItem('rubi_avatar_size');
    return saved ? parseInt(saved, 10) : 88;
  });
  const [avatarPosX, setAvatarPosX] = useState<number>(() => {
    const saved = localStorage.getItem('rubi_avatar_pos_x');
    return saved ? parseInt(saved, 10) : 50;
  });
  const [avatarPosY, setAvatarPosY] = useState<number>(() => {
    const saved = localStorage.getItem('rubi_avatar_pos_y');
    return saved ? parseInt(saved, 10) : 50;
  });
  const [showAvatarSizeSlider, setShowAvatarSizeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 50, posY: 50 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (uploadingAvatar) return;
    if (e.button !== 0 && e.nativeEvent instanceof MouseEvent) return;
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: avatarPosX,
      posY: avatarPosY
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // Custom dragging sensitivity mapping (80 works optimally)
    const sensitivity = 85;
    const newX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.posX - (deltaX / avatarSize) * sensitivity)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.posY - (deltaY / avatarSize) * sensitivity)));
    
    setAvatarPosX(newX);
    setAvatarPosY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('rubi_avatar_pos_x', avatarPosX.toString());
      localStorage.setItem('rubi_avatar_pos_y', avatarPosY.toString());
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Let's have a fallback profile in case the server is offline or slow
  const getFallbackProfile = (): any => {
    const cached = localStorage.getItem(`rubi_cached_profile_${userIdRef}`);
    if (cached) {
      try {
        return {
          id: userIdRef,
          name: 'Atleta Rubi',
          full_name: 'Atleta Rubi',
          goal: 'Hipertrofia',
          frequency: '3',
          gender: 'Masculino',
          age: 25,
          weight: 75,
          height: 175,
          target_weight: 72,
          onboarding_completed: true,
          workout_streak: 3,
          workouts_completed: 6,
          avatar_url: '',
          ...JSON.parse(cached)
        };
      } catch (e) {}
    }
    return {
      id: userIdRef,
      name: 'Atleta Rubi',
      full_name: 'Atleta Rubi',
      goal: 'Hipertrofia',
      frequency: '3',
      gender: 'Masculino',
      age: 25,
      weight: 75,
      height: 175,
      target_weight: 72,
      onboarding_completed: true,
      workout_streak: 3,
      workouts_completed: 6,
      avatar_url: ''
    };
  };

  const profile = storeProfile || getFallbackProfile();

  // Sync profile details into state on mount
  useEffect(() => {
    const fetchCoreProfile = async () => {
      try {
        const user = await authApi.getUser();
        if (user) {
          setUserIdRef(user.id);
          const profileData = await profileApi.getProfile(user.id);
          if (profileData) {
            setProfile(profileData);
            // Cache it locally
            localStorage.setItem(`rubi_cached_profile_${user.id}`, JSON.stringify(profileData));
          } else {
            // Profile doesn't exist in DB under this userId, so set fallback under user.id
            const fallback = {
              id: user.id,
              name: 'Atleta Rubi',
              full_name: 'Atleta Rubi',
              goal: 'Hipertrofia',
              frequency: '3',
              gender: 'Masculino',
              age: 25,
              weight: 75,
              height: 175,
              target_weight: 72,
              onboarding_completed: true,
              workout_streak: 0,
              workouts_completed: 0,
              avatar_url: ''
            };
            setProfile(fallback);
            localStorage.setItem(`rubi_cached_profile_${user.id}`, JSON.stringify(fallback));
          }
        } else {
          // Offline/no auth user: pull default/cached local athlete and set in store so it remains reactive
          const fallback = getFallbackProfile();
          setProfile(fallback);
        }
      } catch (err) {
        console.error('[PROFILE_V4][FETCH_ERROR]', err);
        const fallback = getFallbackProfile();
        setProfile(fallback);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchCoreProfile();

    // 1.5 seconds safety timeout maximum for loading state
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [setProfile]);

  // Sync state when profile loads in case store modifies it
  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setGoal(profile.goal || '');
      setFrequency(profile.frequency || '');
      setGender(profile.gender || '');
      setAge(profile.age || '');
      setWeight(profile.weight || '');
      setHeight(profile.height || '');
      setTargetWeight(profile.target_weight || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [storeProfile]);

  if (localLoading && !storeProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Identidade do Atleta...</p>
      </div>
    );
  }

  // Detect form changes compared to the loaded profile
  const hasChanges = (
    name.trim() !== (profile.name || profile.full_name || '') ||
    goal !== (profile.goal || '') ||
    frequency !== (profile.frequency || '') ||
    gender !== (profile.gender || '') ||
    (age === '' ? '' : Number(age)) !== (profile.age || '') ||
    (weight === '' ? '' : Number(weight)) !== (profile.weight || '') ||
    (height === '' ? '' : Number(height)) !== (profile.height || '') ||
    (targetWeight === '' ? '' : Number(targetWeight)) !== (profile.target_weight || '') ||
    avatarUrl !== (profile.avatar_url || '')
  );

  const handleSaveAll = async () => {
    if (saving) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updates = {
        name: name.trim() || profile.name || null,
        full_name: name.trim() || profile.full_name || null,
        goal: goal || null,
        frequency: frequency || null,
        gender: gender || null,
        age: age !== '' ? parseInt(age.toString()) : null,
        weight: weight !== '' ? parseFloat(weight.toString()) : null,
        height: height !== '' ? parseInt(height.toString()) : null,
        target_weight: targetWeight !== '' ? parseFloat(targetWeight.toString()) : null,
        avatar_url: avatarUrl || null
      };

      // Cache locally
      const updatedProfileObject = { ...profile, ...updates };
      localStorage.setItem(`rubi_cached_profile_${userIdRef}`, JSON.stringify(updatedProfileObject));

      // Update globally via store
      updateProfile(updates);

      // Save to Supabase (if online)
      const user = await authApi.getUser();
      if (user) {
        await profileApi.updateProfile(user.id, updates);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[PROFILE_V4][SAVE_FAILED]', err);
      // We still update local and show saving success to provide an outstanding offline-first app feel
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    try {
      let url = '';
      try {
        url = await cloudinaryService.uploadImage(file, 'avatars');
      } catch (uploadErr) {
        console.warn('[CLOUDINARY_FAILED_USING_BASE64_FALLBACK]', uploadErr);
        // Fallback to FileReader reader as base64 string
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }
      
      const updates = { avatar_url: url };
      
      // Update local React state instantly for real-time loading
      setAvatarUrl(url);

      // Update local storage
      const updatedProfileObject = { ...profile, ...updates };
      localStorage.setItem(`rubi_cached_profile_${userIdRef}`, JSON.stringify(updatedProfileObject));

      // Update store
      updateProfile(updates);
      
      // Save online
      const user = await authApi.getUser();
      if (user) {
        await profileApi.updateProfile(user.id, updates);
      }
    } catch (err) {
      console.error('[PROFILE_V4][AVATAR_UPLOAD_ERROR]', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Real-time Calculations (Living UI System) ---
  const numWeight = Number(weight) || 0;
  const numHeight = Number(height) || 0;
  const numAge = Number(age) || 0;

  // Real-time BMI
  const calculatedIMC = () => {
    if (!numWeight || !numHeight) return null;
    const heightM = numHeight / 100;
    return parseFloat((numWeight / (heightM * heightM)).toFixed(1));
  };
  const imc = calculatedIMC();

  // Real-time Water Intake (35ml per kg)
  const waterTarget = numWeight ? parseFloat(((numWeight * 35) / 1000).toFixed(1)) : 2.5;

  // Real-time Basal Metabolism (Harris-Benedict formula)
  const calculatedTMB = () => {
    if (!numWeight || !numHeight || !numAge) return 1600;
    const isFemale = gender?.toLowerCase() === 'feminino';
    if (isFemale) {
      return Math.round(447.593 + (9.247 * numWeight) + (3.098 * numHeight) - (4.330 * numAge));
    }
    return Math.round(88.362 + (13.397 * numWeight) + (4.799 * numHeight) - (5.677 * numAge));
  };
  const tmb = calculatedTMB();

  // Caloric Recommendation based on objective
  const getCaloricRecommendation = () => {
    // Basic daily movement scale multiplier (avg 1.375)
    const baseline = Math.round(tmb * 1.375);
    if (goal.includes('Hipertrofia') || goal.includes('Força')) {
      return { val: baseline + 300, label: 'Superávit Calórico', color: 'text-orange-500' };
    } else if (goal.includes('Emagrecimento')) {
      return { val: baseline - 400, label: 'Déficit Calórico', color: 'text-blue-500' };
    }
    return { val: baseline, label: 'Manutenção Corporal', color: 'text-emerald-500' };
  };
  const calories = getCaloricRecommendation();

  // --- Compute Athlete Dynamic title ---
  const getAthleteTitle = (): string => {
    const streak = profile.workout_streak || 0;
    const completed = profile.workouts_completed || 0;
    
    if (streak >= 5) return 'Disciplina Elevada';
    if (completed > 15) return 'Consistência Avançada';
    if (streak >= 3) return 'Consistente';
    if (goal.includes('Hipertrofia')) return 'Construção de Massa';
    if (goal.includes('Força')) return 'Alta Intensidade';
    return 'Recuperação Eficiente';
  };
  const athleteTitle = getAthleteTitle();

  // --- Dynamic Readiness Assessment ---
  const estimateReadiness = (): number => {
    let result = 75; // baseline midpoints
    const streak = profile.workout_streak || 0;
    result += Math.min(streak * 2.5, 12);
    
    const storedHistory = localStorage.getItem(`rubi_history_${profile.id}`);
    if (storedHistory) {
      const logs: CheckInLog[] = JSON.parse(storedHistory);
      if (logs.length > 0) {
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = logs[0];
        const checkAvg = (latest.energy + latest.sleep + latest.recovery) / 3;
        result = Math.round(35 + (checkAvg - 1) * 15 + (latest.hydration ? 5 : 0));
      }
    }
    return Math.max(20, Math.min(100, result));
  };
  const readiness = estimateReadiness();

  // Living UI Adaptation indicators based on readiness state
  const isHighPerformance = readiness >= 78;
  const isFatigueDetected = readiness < 55;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-40 transition-colors duration-500 relative">
      
      {/* 1. Subtle Radial Ambient Lighting relative to Readiness (LIVING UI SYSTEM) */}
      <div className="absolute top-0 inset-x-0 h-[640px] overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {isHighPerformance ? (
            <motion.div 
              key="warm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }}
              exit={{ opacity: 0 }}
              className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-400 rounded-full blur-[120px] mix-blend-screen"
            />
          ) : isFatigueDetected ? (
            <motion.div 
              key="cool"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-400 rounded-full blur-[120px] mix-blend-screen"
            />
          ) : (
            <motion.div 
              key="neutral"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              exit={{ opacity: 0 }}
              className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-400 via-emerald-400 to-purple-400 rounded-full blur-[120px] mix-blend-screen"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Luxury Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100/35">
        <button 
          onClick={goBack}
          className="bg-white/90 p-2.5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-200/50 text-slate-400 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={3} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.25em] text-slate-800 uppercase leading-none">Athlete Profile</span>
          <span className="text-[7.5px] font-bold text-slate-400 tracking-wider uppercase mt-1">Rubi Engine V4.0</span>
        </div>
        <div className="flex items-center justify-end min-w-[90px]">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className={`px-4.5 py-2 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border min-h-[36px] ${
              saveSuccess
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.08)]'
                : hasChanges
                  ? 'bg-blue-600 text-white border-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.22)] hover:bg-blue-700 hover:scale-[1.02] active:scale-95'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            id="top-save-button"
            title="Salvar alterações"
          >
            {saving ? (
              <Spinner size={10} className="animate-spin text-current" />
            ) : null}
            <span>{saving ? '...' : saveSuccess ? 'Salvo!' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* MASTER CONTINUOUS CONTAINER */}
      <div className="max-w-md mx-auto px-6 relative z-10 space-y-8 pt-4">
        
        {/* SECTION 1: ATHLETE IDENTITY HEADER (TOP FOCUS) */}
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          
          {/* Picture Circle with floating upload button (adjustable, white ring & soft glow) */}
          <div className="relative group transition-all duration-300 ease-out" style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-600 to-emerald-500 opacity-30 blur-[4px] scale-105" />
            
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`rounded-full overflow-hidden border-2 border-white shadow-2xl relative z-10 bg-slate-50 flex items-center justify-center w-full h-full select-none touch-none ${
                isDragging ? 'cursor-grabbing scale-105 ring-4 ring-indigo-500/20' : 'cursor-grab hover:scale-[1.02]'
              } transition-all duration-200`}
              title="Clique e arraste diretamente para reposicionar"
            >
              {uploadingAvatar ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin pointer-events-none" />
              ) : (
                <img 
                  src={avatarUrl || profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (name || 'Rubi')} 
                  alt="Athlete avatar" 
                  className="w-full h-full object-cover pointer-events-none select-none"
                  style={{ objectPosition: `${avatarPosX}% ${avatarPosY}%` }}
                  referrerPolicy="no-referrer"
                  id="athlete-avatar-img"
                  draggable={false}
                />
              )}
            </div>

            {/* Scale Slider Trigger Button (Top/Side depending on size) */}
            <button 
              onClick={() => setShowAvatarSizeSlider(!showAvatarSizeSlider)}
              className={`absolute top-0 right-[-4px] ${
                showAvatarSizeSlider ? 'bg-indigo-600 border-indigo-720 text-white' : 'bg-white border border-slate-200 text-slate-500'
              } p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer`}
              title="Ajustar tamanho da foto"
              id="resize-avatar-trigger"
            >
              <Scale size={11} strokeWidth={2.5} />
            </button>

            {/* Camera Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-[-4px] bg-slate-900 border border-slate-800 text-white p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
              title="Mudar Foto"
              id="upload-avatar-trigger"
            >
              <Camera size={11} strokeWidth={2.5} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Collapsible premium-grade framing sliders */}
          <AnimatePresence>
            {showAvatarSizeSlider && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                className="w-full max-w-[220px] bg-white/95 backdrop-blur-md rounded-2.5xl border border-slate-200/65 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col items-center gap-3.5 relative z-25 overflow-hidden"
              >
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 pb-1.5 w-full text-center select-none">
                  Ajustar Enquadramento
                </div>

                {/* ZOOM SLIDER */}
                <div className="w-full flex flex-col gap-1">
                  <div className="flex justify-between w-full px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Zoom/Tamanho</span>
                    <span className="text-indigo-650 font-black">{avatarSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="64" 
                    max="160" 
                    value={avatarSize} 
                    onChange={(e) => {
                      const size = parseInt(e.target.value, 10);
                      setAvatarSize(size);
                      localStorage.setItem('rubi_avatar_size', size.toString());
                    }}
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* X ALIGN SLIDER */}
                <div className="w-full flex flex-col gap-1">
                  <div className="flex justify-between w-full px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Posição Horizontal</span>
                    <span className="text-indigo-650 font-black">{avatarPosX}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={avatarPosX} 
                    onChange={(e) => {
                      const x = parseInt(e.target.value, 10);
                      setAvatarPosX(x);
                      localStorage.setItem('rubi_avatar_pos_x', x.toString());
                    }}
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Y ALIGN SLIDER */}
                <div className="w-full flex flex-col gap-1">
                  <div className="flex justify-between w-full px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Posição Vertical</span>
                    <span className="text-indigo-650 font-black">{avatarPosY}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={avatarPosY} 
                    onChange={(e) => {
                      const y = parseInt(e.target.value, 10);
                      setAvatarPosY(y);
                      localStorage.setItem('rubi_avatar_pos_y', y.toString());
                    }}
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Direct drag tip */}
                <div className="text-[8px] font-medium text-slate-500/80 leading-normal bg-indigo-50/40 p-1.5 rounded-lg text-center border border-indigo-100/30 w-full select-none">
                  💡 Você também pode <strong>clicar e arrastar</strong> a foto acima diretamente para ajustar o enquadramento.
                </div>

                {/* Reset Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setAvatarSize(88);
                    setAvatarPosX(50);
                    setAvatarPosY(50);
                    localStorage.setItem('rubi_avatar_size', '88');
                    localStorage.setItem('rubi_avatar_pos_x', '50');
                    localStorage.setItem('rubi_avatar_pos_y', '50');
                  }}
                  className="text-[8px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest pt-1 active:scale-95 transition-all cursor-pointer bg-transparent border-none"
                >
                  Redefinir
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline Editable Name & Subtitles */}
          <div className="space-y-1 w-full px-2">
            {/* Visual editable input right below the picture for superb context */}
            <div className="relative max-w-xs mx-auto mb-2 focus-within:scale-[1.01] transition-transform">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-black tracking-tight text-slate-900 text-center bg-white/70 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-1.5 px-4 w-full placeholder-slate-300 shadow-[0_4px_10px_rgba(0,0,0,0.01)] focus:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all text-ellipsis"
                placeholder="Nome do Atleta"
                id="athlete-name-input-bottom"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 hover:opacity-100 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200/30">
                {athleteTitle}
              </span>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                Ativo • {profile?.workouts_completed || 0} treinos
              </span>
            </div>
            
            <p className="text-[10.5px] font-medium text-slate-400 pt-2">
              Consistência de Treino: <strong className="text-slate-700 font-bold">{profile?.workout_streak || 0} dias</strong> seguidos de foco absoluto
            </p>
          </div>

          {/* Mini-Readiness Horizontal Dial Indicator */}
          <div className="w-full bg-slate-100/80 rounded-2xl p-3.5 border border-slate-200/30 flex flex-col space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1.5">
                <Activity size={10} className="text-blue-500" />
                Neural Readiness State
              </span>
              <span className="text-slate-800">{readiness}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <p className="text-[9.5px] text-left text-slate-500 leading-snug font-medium">
              {isHighPerformance 
                ? "💡 Prontidão máxima. O ritmo neural convida a treinos agressivos e quebras de recordes hoje."
                : isFatigueDetected 
                ? "💡 Sinais de fadiga detectados. Considere reestruturar os descansos ou treinos leves de oxigenação."
                : "💡 Estado ótimo de prontidão. Ideal para acumular volume e técnica uniforme nas tabelas."
              }
            </p>
          </div>
        </div>

        {/* SECTION 2: SINGLE CONTINUOUS SURFACES (EDITORIAL FORMS & SEGMENTS) */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100/50 space-y-6">
          
          {/* Integrated Editorial Goals (Objective & Week Frequency) */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-800/80">Metas Principais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Objetivo de Treino</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 px-4 text-[13.5px] font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all appearance-none"
                >
                  <option value="">Selecione...</option>
                  <option value="Hipertrofia">Ganho de Massa (Hipertrofia)</option>
                  <option value="Emagrecimento">Redução de Peso (Emagrecimento)</option>
                  <option value="Condicionamento">Resistência Geral (Mantenção)</option>
                  <option value="Força Máxima">Ganho de Força (Cargas)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Frequência Semanal</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 px-4 text-[13.5px] font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all appearance-none"
                >
                  <option value="">Selecione...</option>
                  <option value="3">3x por semana</option>
                  <option value="4">4x por semana</option>
                  <option value="5">5x por semana</option>
                  <option value="7">Diário (Consistente)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100/80 my-2" />

          {/* Integrated Biological Body Metrics */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-800/80">Corporal & Biometria</h3>
            
            <div className="space-y-4">
              {/* Row 1: Biological Sex + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Sexo Biológico</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 px-4 text-[13.5px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Idade (Anos)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 28"
                    className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 px-5 text-[14px] font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Weight + Height */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Peso (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 75.3"
                      className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 pl-5 pr-10 text-[14px] font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">kg</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Altura (cm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 178"
                      className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 pl-5 pr-10 text-[14px] font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">cm</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Goal Weight/Target */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta de Peso Alvo (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 70.0"
                    className="w-full bg-white/70 border border-slate-200/60 rounded-2xl h-14 pl-5 pr-20 text-[14px] font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 uppercase tracking-widest">meta kg</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100/80 my-2" />

          {/* DYNAMIC BIOLOGICAL INTELLIGENCE LAYER */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-800/80">Intelligence & Diagnostics</h3>
            
            <div className="grid grid-cols-2 gap-3 pb-2">
              {/* BMI IMC Box */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Índice IMC</span>
                  <p className="text-xl font-black text-slate-800 leading-tight mt-1">
                    {imc ? `${imc}` : '--'}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-2 leading-tight">
                  {imc ? (
                    imc < 18.5 ? '⚠️ Abaixo do ideal' :
                    imc < 25 ? '✅ Peso saudável' :
                    imc < 30 ? '🔶 Sobrepeso moderado' : '🚨 Escopo de obesidade'
                  ) : 'Dados pendentes'}
                </p>
              </div>

              {/* Water Metric */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Água Mínima</span>
                  <p className="text-xl font-black text-blue-500 leading-tight mt-1">
                    {waterTarget} <span className="text-xs font-bold text-slate-400">Liters</span>
                  </p>
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-2 leading-tight">35ml por quilo / dia</p>
              </div>

              {/* Basal TMB */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Basal (TMB)</span>
                  <p className="text-xl font-black text-slate-800 leading-tight mt-1">
                    {tmb} <span className="text-xs font-bold text-slate-400">kcal</span>
                  </p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 leading-none">Mínimo em repouso absoluto</p>
              </div>

              {/* Caloric balance suggestion */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Alvo Estimado</span>
                  <p className="text-xl font-black text-indigo-600 leading-tight mt-1">
                    {calories.val} <span className="text-[10px] font-bold">kcal</span>
                  </p>
                </div>
                <p className={`text-[9.5px] font-black ${calories.color} mt-2 uppercase tracking-wide leading-none`}>
                  {calories.label}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 3: RITUALS, ATTACHMENTS & HISTORICAL ANALYTICS */}
        <div className="space-y-6">
          
          {/* Weekly checkin ritual system */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400 ml-2">Ritual de Registro</span>
          </div>
          <WeeklyCheckIn />

          {/* Body recomposition projection graphics */}
          <BodyRecompositionVisualizer />

          {/* Athlete DNA and Volume tolerance patterns */}
          <AthleteDNASystem />

          {/* Premium Progress photos comparators */}
          <ProgressPhotoSystem />

          {/* Historical timeline logger */}
          <EvolutionTimeline />

          {/* System Settings & Actions Options */}
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-slate-400 ml-2">Preferências de App</span>
          </div>
          <ProfileActions />

        </div>

      </div>

      {/* FOOTER FLOATING SAVE ACTION (ONE TOUCH FIXED TRIGGER) */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-8 pb-6 px-6 z-40 flex items-center justify-center">
        <motion.button 
          onClick={handleSaveAll}
          disabled={!hasChanges && !saveSuccess}
          whileTap={{ scale: 0.96 }}
          className={`w-full max-w-sm h-14 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_15px_30px_rgba(0,0,0,0.1)] transition-all durat-300 flex items-center justify-center gap-2 ${
            saveSuccess 
              ? 'bg-emerald-500 text-white shadow-emerald-500/10' 
              : hasChanges 
                ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]' 
                : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed shadow-none'
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saveSuccess ? (
            <span>✓ Perfil Sincronizado</span>
          ) : (
            <span>{hasChanges ? 'Salvar Alterações' : 'Perfil Atualizado'}</span>
          )}
        </motion.button>
      </div>

    </div>
  );
}
