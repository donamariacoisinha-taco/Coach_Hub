import React, { useRef, useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { Camera, Check, Edit2 } from 'lucide-react';
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center space-y-4 border border-slate-50 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20" />
      
      <div className="relative mx-auto w-28 h-28 group">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 animate-pulse opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        <img
          src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (profile?.name || 'User')}
          className="w-full h-full rounded-full object-cover border-4 border-white shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105"
          alt="Avatar"
          referrerPolicy="no-referrer"
        />

        <button 
          onClick={handleAvatarClick}
          className="absolute bottom-0 right-0 bg-black text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-20 border-2 border-white"
        >
          <Camera size={14} className="font-bold" />
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-2 pt-2 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit-input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full max-w-xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10"
            >
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                }}
                className="bg-transparent border-none text-center text-lg font-black text-slate-900 focus:outline-none w-full"
                placeholder="Seu nome"
                autoFocus
              />
              <button 
                onMouseDown={(e) => {
                  e.preventDefault(); // prevents blur from closing it before save
                  handleSaveName();
                }}
                disabled={saving}
                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Salvar Nome"
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900 group-hover/name:text-blue-600 transition-colors">
                {profile?.name || profile?.full_name || 'Corredor Rubi'}
              </h1>
              <Edit2 size={12} className="text-slate-300 group-hover/name:text-blue-500 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2">
           <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
             {profile?.goal || 'Foco em Hipertrofia'}
           </span>
        </div>
      </div>
    </motion.div>
  );
}
