
import React, { useEffect, useState, useMemo } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';
import { MoreVertical, Plus, Shield, Flame, Play, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { DashboardSkeleton } from './Skeleton';
import { motion, AnimatePresence } from 'motion/react';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const [folders, setFolders] = useState<WorkoutFolder[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutCategory[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [stats, setStats] = useState({ sessions: 0 });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) throw new Error("Sessão expirada.");

      const userId = session.user.id;

      const [profileRes, foldersRes, workoutsRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
        supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('workout_history').select('*').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false })
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (foldersRes.data) setFolders(foldersRes.data);
      if (workoutsRes.data) setWorkouts(workoutsRes.data);
      if (historyRes.data) setStats({ sessions: historyRes.data.length });

    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = useMemo(() => {
    if (activeFolderId === null) return workouts;
    return workouts.filter(w => w.folder_id === activeFolderId || (!w.folder_id && activeFolderId === 'uncategorized'));
  }, [workouts, activeFolderId]);

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Deseja excluir este protocolo?")) return;
    try {
      await supabase.from('workout_categories').delete().eq('id', id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      setActiveMenuId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 pb-32">
      <div className="max-w-md mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Visão geral
            </p>
            {profile?.is_admin && (
              <button 
                onClick={() => navigate('admin')}
                className="flex items-center gap-2 text-blue-600 active:scale-95 transition"
              >
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {profile?.full_name?.split(' ')[0] || 'Atleta'}
            </h1>

            <button 
              onClick={() => navigate('profile')}
              className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-50 shadow-sm active:scale-95 transition"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-black text-slate-200">
                  {profile?.full_name?.charAt(0) || 'A'}
                </span>
              )}
            </button>
          </div>

          {/* Metrics Inline */}
          <div className="flex gap-10 mt-10">
            <div>
              <p className="text-2xl font-black tracking-tighter tabular-nums">{stats.sessions}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessões</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-black tracking-tighter tabular-nums">{profile?.workout_streak || 0}</p>
                <Flame size={16} className="text-orange-500 fill-orange-500" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequência</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter uppercase">{profile?.is_admin ? 'Elite' : 'Base'}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</p>
            </div>
          </div>
        </header>

        {/* PROTOCOLS */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Protocolos
            </h2>
            <button 
              onClick={() => navigate('editor')}
              className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-slate-900 active:scale-90 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Tabs Minimalistas */}
          <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-slate-100">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${
                activeFolderId === null ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
              }`}
            >
              Todos
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${
                  activeFolderId === folder.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400"
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>

          {/* List iOS Style */}
          <div className="space-y-1">
            {filteredWorkouts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Nenhum protocolo ativo</p>
              </div>
            ) : (
              filteredWorkouts.map((workout, idx) => (
                <div key={workout.id} className="relative">
                  <div 
                    onClick={() => navigate('workout', { id: workout.id })}
                    className={`flex items-center justify-between py-8 active:bg-slate-50 transition-colors cursor-pointer ${
                      idx !== filteredWorkouts.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase truncate pr-4">
                        {workout.name}
                      </h3>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">
                        {workout.description || 'Sessão de treinamento'}
                      </p>
                    </div>

                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveMenuId(activeMenuId === workout.id ? null : workout.id); 
                      }}
                      className="w-12 h-12 flex items-center justify-center text-slate-200 active:text-slate-900 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Bottom Sheet Menu (Simple inline for now or actual portal) */}
                  <AnimatePresence>
                    {activeMenuId === workout.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-16 z-50 bg-white rounded-2xl shadow-2xl border border-slate-50 p-4 min-w-[160px] space-y-2"
                      >
                        <button 
                          onClick={() => navigate('workout', { id: workout.id })}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Play size={14} /> Iniciar
                        </button>
                        <button 
                          onClick={() => navigate('editor', { id: workout.id })}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="w-full flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* FAB Discreto */}
      <button 
        onClick={() => navigate('editor')}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/40 active:scale-90 transition-all z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default Dashboard;
