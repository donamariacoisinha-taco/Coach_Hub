
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
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in pb-32">
      <header className="flex justify-between items-start">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900">Biblioteca de Elite</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Navegação Anatômica Multi-Nível</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('admin', { initialTab: 'anatomy' })} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm active:scale-90 transition-all">
            <i className="fas fa-cog"></i>
          </button>
        )}
      </header>

      <div className="space-y-6">
        <div className="flex gap-3 items-center">
          <input 
            type="text" placeholder="Pesquisar exercício..." value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="flex-1 p-5 bg-white border border-slate-200 rounded-[2rem] text-slate-900 font-bold text-sm outline-none focus:border-blue-600 shadow-sm transition-all" 
          />
          {isAdmin && (
            <button onClick={() => navigate('admin', { initialTab: 'exercises' })} className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-blue-600/20 active:scale-90 transition-all shrink-0">
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 max-w-sm mx-auto shadow-sm">
            {(['active', 'inactive', 'all'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setAdminActiveFilter(f)} 
                className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${adminActiveFilter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}
              >
                {f === 'active' ? 'Ativos' : f === 'inactive' ? 'Inativos' : 'Todos'}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 overflow-hidden">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {['all', 'front', 'back'].map(side => (
              <button key={side} onClick={() => { setSelectedSide(side as any); setSelectedMuscle('Todos'); }} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${selectedSide === side ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'text-slate-400'}`}>
                {side === 'all' ? 'Tudo' : side === 'front' ? 'Anterior' : 'Posterior'}
              </button>
            ))}
          </div>

          <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar -mx-2 px-2 items-center">
            <button onClick={() => setSelectedMuscle('Todos')} className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${selectedMuscle === 'Todos' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>Todos Grupos</button>
            
            {parentMuscleGroups.map(mg => (
              <div key={mg.id} className="relative group/chip flex-shrink-0">
                <button 
                  onClick={() => setSelectedMuscle(mg.name)} 
                  className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-3 ${selectedMuscle === mg.name ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}
                >
                  {mg.name}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 ml-1 border-l border-slate-200 pl-2">
                       <i onClick={(e) => { e.stopPropagation(); navigate('admin', { initialTab: 'anatomy', editGroupId: mg.id }); }} className="fas fa-pencil-alt hover:text-blue-600 transition-colors text-[8px] opacity-40"></i>
                       <i onClick={(e) => handleDeleteGroup(e, mg)} className={`fas ${isDeletingGroup === mg.id ? 'fa-spinner animate-spin' : 'fa-trash-alt'} hover:text-red-500 transition-colors text-[8px] opacity-40`}></i>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          {subMuscleGroups.length > 0 && (
             <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar -mx-2 px-2 pt-2 border-t border-slate-100 items-center">
                {subMuscleGroups.map(smg => (
                   <button 
                    key={smg.id} 
                    onClick={() => { setSearchQuery(smg.name); }} 
                    className="px-4 py-2 bg-slate-50 rounded-xl text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-slate-100 flex items-center gap-3 whitespace-nowrap shrink-0 transition-all"
                   >
                      {smg.name}
                      {isAdmin && (
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                           <i onClick={(e) => { e.stopPropagation(); navigate('admin', { initialTab: 'anatomy', editGroupId: smg.id }); }} className="fas fa-pencil-alt text-[7px] opacity-30 hover:opacity-100"></i>
                           <i onClick={(e) => handleDeleteGroup(e, smg)} className="fas fa-trash-alt text-[7px] opacity-30 hover:text-red-500 hover:opacity-100"></i>
                        </div>
                      )}
                   </button>
                ))}
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(ex => (
          <div key={ex.id} onClick={() => handleOpenDetail(ex)} className={`bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5 group transition-all cursor-pointer relative hover:border-blue-200 ${!ex.is_active ? 'grayscale opacity-60' : ''}`}>
             <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center p-2">
                {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-contain" /> : <i className="fas fa-dumbbell text-slate-200"></i>}
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 uppercase truncate leading-none mb-1">{ex.name}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold uppercase text-blue-600">{ex.muscle_group}</span>
                   <span className="text-[7px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">{ex.type}</span>
                   {!ex.is_active && <span className="text-[6px] font-bold text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded">Inativo</span>}
                </div>
             </div>
             <div className="flex flex-col gap-2">
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); navigate('admin', { id: ex.id }); }} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 active:scale-90 border border-slate-100">
                    <i className="fas fa-pencil-alt text-[8px]"></i>
                  </button>
                )}
                <button onClick={(e) => toggleFavorite(e, ex.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${favoriteExerciseIds.has(ex.id) ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'text-slate-300'}`}>
                   <i className={`${favoriteExerciseIds.has(ex.id) ? 'fas' : 'far'} fa-heart`}></i>
                </button>
             </div>
          </div>
        ))}
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 z-[1000] bg-theme-bg flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="p-8 pt-12 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                 <button onClick={() => setSelectedExercise(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 active:scale-90 shadow-sm"><i className="fas fa-chevron-left text-xs"></i></button>
                 <div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase">{selectedExercise.name}</h3>
                  <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1">Protocolo Biomecânico {!selectedExercise.is_active && <span className="text-red-500">(INATIVO)</span>}</p>
                 </div>
              </div>
           </header>
           <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40">
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className="aspect-video bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm relative flex items-center justify-center">
                    {selectedExercise.image_url ? <img src={selectedExercise.image_url} className="w-full h-full object-contain p-8" /> : <i className="fas fa-dumbbell text-6xl opacity-20"></i>}
                 </div>
                 <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 italic text-slate-900 text-lg font-bold shadow-sm">
                    {loadingAi ? "Sincronizando dicas..." : `"${aiTip || "Foque na técnica e amplitude."}"`}
                 </div>
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 text-slate-600 text-sm leading-relaxed shadow-sm">
                    <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-4 tracking-widest">Protocolo de Execução</h4>
                    {selectedExercise.instructions || "Em catalogação biomecânica."}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
