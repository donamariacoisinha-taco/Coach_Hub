import React, { useEffect } from 'react';
import { ProfileHeader } from './components/ProfileHeader';
import { ProgressStats } from './components/ProgressStats';
import { GoalsCard } from './components/GoalsCard';
import { ProfileActions } from './components/ProfileActions';
import { useUserStore } from '../../store/userStore';
import { profileApi } from '../../lib/api/profileApi';
import { authApi } from '../../lib/api/authApi';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../App';

export default function ProfileViewV2() {
  const { setProfile, loading } = useUserStore();
  const { goBack } = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authApi.getUser();
        if (user) {
          const profileData = await profileApi.getProfile(user.id);
          setProfile(profileData);
        }
      } catch (err) {
        console.error('[PROFILE_V2][FETCH_ERROR]', err);
      }
    };
    fetchProfile();
  }, [setProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.3em]">Sincronizando Perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Dynamic Header / Toolbar */}
      <div className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <button 
          onClick={goBack}
          className="bg-white p-2.5 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-colors border border-slate-100 active:scale-95"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Meu Perfil</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-md mx-auto px-6 space-y-6 pt-4">
        <ProfileHeader />
        <ProgressStats />
        <GoalsCard />
        <ProfileActions />
      </div>
    </div>
  );
}
