
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exercise, MuscleGroup } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";
import { useNavigation } from '../App';

const ExerciseLibrary: React.FC = () => {
  const { navigate } = useNavigation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [selectedSide, setSelectedSide] = useState<'all' | 'front' | 'back'>('all');
  const [adminActiveFilter, setAdminActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [isDeletingGroup, setIsDeletingGroup] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkAdmin();
      await fetchData();
    };
    init();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setIsAdmin(!!data?.is_admin);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const exQuery = supabase.from('exercises').select('*').order('name');
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile?.is_admin) {
        exQuery.eq('is_active', true);
      }

      const [exRes, mgRes, favRes] = await Promise.all([
        exQuery,
        supabase.from('muscle_groups').select('*').order('sort_order', { ascending: true }),
        supabase.from('user_favorite_exercises').select('exercise_id').eq('user_id', user.id)
      ]);

      if (exRes.data) setExercises(exRes.data);
      if (mgRes.data) setMuscleGroups(mgRes.data);
      if (favRes.data) setFavoriteExerciseIds(new Set(favRes.data.map(f => f.exercise_id)));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, mg: MuscleGroup) => {
    e.stopPropagation();
    if (!confirm(`Deseja excluir o grupo "${mg.name}"? Isso pode afetar exercícios vinculados.`)) return;
    
    setIsDeletingGroup(mg.id);
    try {
      const { error } = await supabase.from('muscle_groups').delete().eq('id', mg.id);
      if (error) throw new Error("Não é possível excluir: existem subgrupos ou exercícios vinculados.");
      setMuscleGroups(prev => prev.filter(m => m.id !== mg.id));
      if (selectedMuscle === mg.name) setSelectedMuscle('Todos');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeletingGroup(null);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isFav = favoriteExerciseIds.has(exerciseId);
    try {
      if (isFav) {
        await supabase.from('user_favorite_exercises').delete().eq('user_id', user.id).eq('exercise_id', exerciseId);
        setFavoriteExerciseIds(prev => { const next = new Set(prev); next.delete(exerciseId); return next; });
      } else {
        await supabase.from('user_favorite_exercises').insert([{ user_id: user.id, exercise_id: exerciseId }]);
        setFavoriteExerciseIds(prev => new Set(prev).add(exerciseId));
      }
    } catch (err) { console.error(err); }
  };

  const fetchAiTip = async (exName: string) => {
    setLoadingAi(true);
    setAiTip(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Dê uma dica biomecânica avançada (curta) para o exercício: ${exName}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiTip(response.text || "Foque na técnica.");
    } catch (err) { setAiTip("Conexão mente-músculo."); }
    finally { setLoadingAi(false); }
  };

  const handleOpenDetail = (ex: Exercise) => {
    setSelectedExercise(ex);
    fetchAiTip(ex.name);
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const mg = muscleGroups.find(m => m.name === ex.muscle_group);
      const isParentMatch = selectedMuscle === 'Todos' || ex.muscle_group === selectedMuscle || (mg?.parent_id && muscleGroups.find(p => p.id === mg.parent_id)?.name === selectedMuscle);
      const matchesSide = selectedSide === 'all' || mg?.body_side === selectedSide;
      
      let matchesStatus = true;
      if (isAdmin) {
        if (adminActiveFilter === 'active') matchesStatus = ex.is_active;
        else if (adminActiveFilter === 'inactive') matchesStatus = !ex.is_active;
      } else {
        matchesStatus = ex.is_active;
      }

      return matchesSearch && matchesSide && isParentMatch && matchesStatus;
    }).sort((a, b) => favoriteExerciseIds.has(b.id) ? -1 : 1);
  }, [exercises, searchQuery, selectedMuscle, selectedSide, muscleGroups, favoriteExerciseIds, isAdmin, adminActiveFilter]);

  const parentMuscleGroups = useMemo(() => {
    return muscleGroups.filter(mg => !mg.parent_id && (selectedSide === 'all' || !mg.body_side || mg.body_side === selectedSide));
  }, [muscleGroups, selectedSide]);

  const subMuscleGroups = useMemo(() => {
    if (selectedMuscle === 'Todos') return [];
    const parent = muscleGroups.find(m => m.name === selectedMuscle && !m.parent_id);
    if (!parent) return [];
    return muscleGroups.filter(m => m.parent_id === parent.id);
  }, [muscleGroups, selectedMuscle]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando Biblioteca...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Biblioteca</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Exercícios</h2>
        </div>
        {isAdmin && (
          <button 
            onClick={() => navigate('admin', { initialTab: 'anatomy' })} 
            className="w-12 h-12 flex items-center justify-center text-slate-300 active:text-slate-900 active:scale-90 transition-all"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
        )}
      </header>

      <div className="px-6 space-y-12">
        {/* Busca Minimalista */}
        <div className="relative">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-50 rounded-[2rem] text-slate-900 font-black text-sm outline-none focus:border-blue-600 shadow-2xl shadow-slate-200/50 transition-all" 
          />
        </div>

        {/* Filtros de Lado e Grupos - Estilo Horizontal Minimalista */}
        <div className="space-y-10">
          <div className="flex gap-10 overflow-x-auto no-scrollbar border-b border-slate-100">
            {['all', 'front', 'back'].map(side => (
              <button 
                key={side} 
                onClick={() => { setSelectedSide(side as any); setSelectedMuscle('Todos'); }} 
                className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${selectedSide === side ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
              >
                {side === 'all' ? 'Tudo' : side === 'front' ? 'Anterior' : 'Posterior'}
              </button>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            <button 
              onClick={() => setSelectedMuscle('Todos')} 
              className={`px-8 py-5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedMuscle === 'Todos' ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-400'}`}
            >
              Todos
            </button>
            {parentMuscleGroups.map(mg => (
              <button 
                key={mg.id} 
                onClick={() => setSelectedMuscle(mg.name)} 
                className={`px-8 py-5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedMuscle === mg.name ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                {mg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Exercícios - iOS Style */}
        <div className="space-y-1">
          {filteredExercises.length === 0 ? (
            <div className="py-20 text-center">
              <i className="fas fa-search text-slate-100 text-4xl mb-4"></i>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nenhum resultado</p>
            </div>
          ) : (
            filteredExercises.map((ex, idx) => (
              <div 
                key={ex.id} 
                onClick={() => handleOpenDetail(ex)}
                className={`flex items-center justify-between py-8 active:bg-slate-50 transition-colors cursor-pointer ${idx !== filteredExercises.length - 1 ? 'border-b border-slate-100' : ''} ${!ex.is_active ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-white border border-slate-50 rounded-[1.5rem] overflow-hidden flex items-center justify-center p-3 shrink-0 shadow-sm">
                    {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-contain" /> : <i className="fas fa-dumbbell text-slate-100 text-xl"></i>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate pr-4">{ex.name}</h4>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{ex.muscle_group}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => toggleFavorite(e, ex.id)} 
                    className={`w-12 h-12 flex items-center justify-center transition-all ${favoriteExerciseIds.has(ex.id) ? 'text-amber-500' : 'text-slate-200'}`}
                  >
                    <i className={`${favoriteExerciseIds.has(ex.id) ? 'fas' : 'far'} fa-heart text-lg`}></i>
                  </button>
                  <i className="fas fa-chevron-right text-[10px] text-slate-200 ml-2"></i>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detalhe do Exercício - Modal Minimalista */}
      {selectedExercise && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
            <button 
              onClick={() => setSelectedExercise(null)} 
              className="w-12 h-12 flex items-center justify-center text-slate-900 active:scale-90 transition-all"
            >
              <i className="fas fa-chevron-left text-lg"></i>
            </button>
            <div className="text-center flex-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{selectedExercise.name}</h3>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{selectedExercise.muscle_group}</p>
            </div>
            <div className="w-12"></div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-12 space-y-16">
            <div className="aspect-square bg-[#F7F8FA] rounded-[4rem] overflow-hidden flex items-center justify-center p-16 shadow-inner">
              {selectedExercise.image_url ? (
                <img src={selectedExercise.image_url} className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <i className="fas fa-dumbbell text-7xl text-slate-100"></i>
              )}
            </div>

            <div className="space-y-12">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6">Dica de Execução</p>
                <div className="bg-[#F7F8FA] p-10 rounded-[3rem] italic text-slate-900 text-xl font-black leading-relaxed tracking-tight">
                  {loadingAi ? (
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 text-sm not-italic uppercase tracking-widest">Sincronizando...</span>
                    </div>
                  ) : `"${aiTip || "Foque na técnica."}"`}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Instruções</p>
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  {selectedExercise.instructions || "Protocolo em catalogação."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
