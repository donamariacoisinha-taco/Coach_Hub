
import React, { useEffect, useState, useMemo } from 'react';
import { WorkoutCategory, UserProfile, WorkoutFolder, UserBadge } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';
import { MoreHorizontal, Plus, Shield } from 'lucide-react';

const Dashboard: React.FC<{ initialFolderId?: string | null }> = ({ initialFolderId }) => {
  const { navigate } = useNavigation();
  const [folders, setFolders] = useState<WorkoutFolder[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutCategory[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId || null);
  const [stats, setStats] = useState({ sessions: 0 });

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

      // Parallel data fetching
      const [profileRes, foldersRes, workoutsRes, historyRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('workout_folders').select('id, name').eq('user_id', userId).order('name'),
        supabase.from('workout_categories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('workout_history').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (foldersRes.data) setFolders(foldersRes.data);
      if (workoutsRes.data) setWorkouts(workoutsRes.data);
      if (historyRes) setStats({ sessions: historyRes.count || 0 });

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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Container */}
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">
        
        {/* HEADER */}
        <header className="mb-10">
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
            Visão geral
          </p>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile?.full_name?.split(' ')[0] || 'Atleta'}
            </h1>

            {/* Avatar */}
            <button 
              onClick={() => navigate('profile')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 active:scale-95 transition"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-lg">🧍</span>
              )}
            </button>
          </div>

          {/* Metrics */}
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-xl font-semibold">{stats.sessions}</p>
              <p className="text-xs text-gray-500">Sessões</p>
            </div>
            <div>
              <p className="text-xl font-semibold">3</p>
              <p className="text-xs text-gray-500">Sequência</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{profile?.is_admin ? 'Admin' : 'Free'}</p>
              <p className="text-xs text-gray-500">Plano</p>
            </div>
            {profile?.is_admin && (
              <button 
                onClick={() => navigate('admin')}
                className="ml-auto flex items-center gap-2 text-blue-600 active:opacity-60 transition"
              >
                <Shield size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* PROTOCOLS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
              Meus protocolos
            </h2>

            {/* Add icon */}
            <button 
              onClick={() => navigate('editor')}
              className="p-2 rounded-full active:scale-95 transition text-gray-900"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 mb-6">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`text-sm font-medium whitespace-nowrap pb-1 transition ${
                activeFolderId === null
                  ? "text-black border-b-2 border-black"
                  : "text-gray-400"
              }`}
            >
              Todos
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`text-sm font-medium whitespace-nowrap pb-1 transition ${
                  activeFolderId === folder.id
                    ? "text-black border-b-2 border-black"
                    : "text-gray-400"
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-8">
            {filteredWorkouts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Nenhum protocolo ativo</p>
              </div>
            ) : (
              filteredWorkouts.map((workout) => (
                <WorkoutItem 
                  key={workout.id} 
                  workout={workout} 
                  onSelect={() => navigate('workout', { id: workout.id })}
                  onEdit={() => navigate('editor', { id: workout.id })}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <button 
        onClick={() => navigate('editor')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-95 transition"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

function WorkoutItem({ workout, onSelect, onEdit }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onSelect}>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 group-active:text-blue-600 transition truncate pr-4">
          {workout.name}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          8 exercícios • 45 min
        </p>
      </div>

      {/* Menu */}
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="p-2 rounded-full active:scale-95 transition text-gray-400 hover:text-gray-900"
      >
        <MoreHorizontal size={20} />
      </button>
    </div>
  );
}

export default Dashboard;
