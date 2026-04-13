
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, BodyMeasurement } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdate: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdate }) => {
  const { theme, toggleTheme, navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<'profile' | 'measurements' | 'settings'>('profile');
  const [saving, setSaving] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [editingMeasureId, setEditingMeasureId] = useState<string | null>(null);
  
  const initialMeasureState: Partial<BodyMeasurement> = {
    measured_at: new Date().toISOString().split('T')[0],
    weight: profile.weight || 0,
    body_fat_pct: 0,
    body_fat_kg: 0,
    muscle_rate_pct: 0,
    muscle_mass_kg: 0,
    fat_free_mass_kg: 0,
    subcutaneous_fat_pct: 0,
    visceral_fat_index: 0,
    body_water_pct: 0,
    skeletal_muscle_pct: 0,
    bone_mass_kg: 0,
    protein_pct: 0,
    bmr_kcal: 0,
    metabolic_age: 0
  };

  const [newMeasure, setNewMeasure] = useState<Partial<BodyMeasurement>>(initialMeasureState);

  // Efeito para cálculos automáticos de composição corporal
  useEffect(() => {
    if (showMeasureForm) {
      const weight = newMeasure.weight || 0;
      const fatPct = newMeasure.body_fat_pct || 0;
      const muscleRatePct = newMeasure.muscle_rate_pct || 0;

      const calculatedFatKg = parseFloat(((weight * fatPct) / 100).toFixed(2));
      const calculatedMuscleKg = parseFloat(((weight * muscleRatePct) / 100).toFixed(2));

      // Só atualiza se houver mudança para evitar loops infinitos
      if (calculatedFatKg !== newMeasure.body_fat_kg || calculatedMuscleKg !== newMeasure.muscle_mass_kg) {
        setNewMeasure(prev => ({
          ...prev,
          body_fat_kg: calculatedFatKg,
          muscle_mass_kg: calculatedMuscleKg
        }));
      }
    }
  }, [newMeasure.weight, newMeasure.body_fat_pct, newMeasure.muscle_rate_pct, showMeasureForm]);

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .order('measured_at', { ascending: false });
    if (data) setMeasurements(data);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEdit = (m: BodyMeasurement) => {
    setEditingMeasureId(m.id);
    setNewMeasure({ ...m });
    setShowMeasureForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Deseja realmente excluir este registro de evolução?")) return;
    try {
      const { error } = await supabase.from('body_measurements').delete().eq('id', id);
      if (error) throw error;
      fetchMeasurements();
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveMeasurement = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const payload = {
        user_id: user.id,
        ...newMeasure,
      };

      let error;
      if (editingMeasureId) {
        const { error: err } = await supabase
          .from('body_measurements')
          .update(payload)
          .eq('id', editingMeasureId);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('body_measurements')
          .insert([payload]);
        error = err;
      }
      
      if (error) throw error;
      
      const latest = measurements[0];
      if (!latest || new Date(newMeasure.measured_at!) >= new Date(latest.measured_at)) {
        await supabase.from('profiles').update({ weight: newMeasure.weight }).eq('id', user.id);
      }
      
      if ('vibrate' in navigator) navigator.vibrate(50);
      setShowMeasureForm(false);
      setEditingMeasureId(null);
      fetchMeasurements();
      onUpdate();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const parseInput = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateBMI = (weight: number) => {
    if (!weight || !profile.height) return 0;
    const h = profile.height / 100;
    return parseFloat((weight / (h * h)).toFixed(1));
  };

  const getTrendIcon = (currentIndex: number) => {
    if (currentIndex >= measurements.length - 1) return null;
    const current = measurements[currentIndex].weight;
    const previous = measurements[currentIndex + 1].weight;
    if (current > previous) return <i className="fas fa-caret-up text-red-500 ml-1"></i>;
    if (current < previous) return <i className="fas fa-caret-down text-green-500 ml-1"></i>;
    return null;
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-8 pt-8 pb-32 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('dashboard')} className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm active:scale-90 transition-all">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bio Analytics</h2>
            <p className="text-xs font-medium text-slate-500">Gestão de Evolução Corporal</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
           {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover rounded-xl" /> : <i className="fas fa-user text-slate-300"></i>}
        </div>
      </header>

      <nav className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm mb-10">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Painel</button>
        <button onClick={() => setActiveTab('measurements')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'measurements' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Histórico</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Ajustes</button>
      </nav>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><i className="fas fa-calendar-check text-lg"></i></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{profile.full_name || 'Atleta'}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Última avaliação: {measurements[0] ? formatDisplayDate(measurements[0].measured_at) : 'Nenhuma'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xl font-bold text-slate-900">{profile.weight || 0}kg</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Peso</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xl font-bold text-slate-900">{calculateBMI(profile.weight || 0)}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">IMC</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-xl font-bold text-blue-600">{measurements[0]?.body_fat_pct || 0}%</p>
                <p className="text-[8px] font-bold text-blue-600 uppercase mt-1">Fat %</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { setEditingMeasureId(null); setNewMeasure(initialMeasureState); setShowMeasureForm(true); }}
            className="w-full py-6 bg-blue-600 rounded-[2rem] font-bold text-white uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus-circle"></i>
            Adicionar Medição
          </button>
        </div>
      ) : activeTab === 'measurements' ? (
        <div className="space-y-6 animate-in fade-in">
           {measurements.length === 0 ? (
             <div className="p-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-center bg-white/50">
                <i className="fas fa-chart-line text-slate-300 text-5xl mb-4"></i>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguardando medições</p>
             </div>
           ) : (
             measurements.map((m, idx) => (
               <div key={m.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                  <header className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{formatDisplayDate(m.measured_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(m)} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] border border-slate-100 active:scale-90"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(m.id)} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-[10px] border border-red-100 active:scale-90"><i className="fas fa-trash"></i></button>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Peso</span>
                       <span className="text-xl font-bold text-slate-900 flex items-center">{m.weight}kg {getTrendIcon(idx)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Gordura</span>
                       <span className="text-xl font-bold text-blue-600">{m.body_fat_pct}% ({m.body_fat_kg}kg)</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Massa Muscular</span>
                       <span className="text-xl font-bold text-slate-900">{m.muscle_mass_kg}kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Metabolismo</span>
                       <span className="text-xl font-bold text-slate-900">{m.bmr_kcal} kcal</span>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           {profile.is_admin && (
             <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100"><i className="fas fa-user-shield text-xl"></i></div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Comando Central</h3>
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Painel de Administração</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('admin')}
                  className="w-full py-5 bg-red-500 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all mt-2"
                >
                  ACESSAR COACH HUB
                </button>
             </section>
           )}

           <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Estilo Visual</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personalize sua experiência</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                  onClick={() => toggleTheme('light')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><i className="fas fa-sun"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900 block">Tema Claro</span>
                       <span className="text-[8px] text-slate-400 uppercase font-bold">Foco & Luminosidade</span>
                    </div>
                 </button>
                 <button 
                  onClick={() => toggleTheme('classic')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'classic' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-slate-400 shrink-0 shadow-sm"><i className="fas fa-moon"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900 block">Tema Escuro</span>
                       <span className="text-[8px] text-slate-400 uppercase font-bold">Original & Focado</span>
                    </div>
                 </button>
              </div>
           </section>

           <section className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Conta</h3>
              <button onClick={() => supabase.auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold uppercase border border-red-100 tracking-widest hover:bg-red-500 hover:text-white transition-all">Sair da Conta</button>
           </section>
        </div>
      )}

      {showMeasureForm && (
        <div className="fixed inset-0 z-[300] bg-[#F7F8FA] flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="p-8 flex justify-between items-center shrink-0 border-b border-slate-100 bg-white/80 backdrop-blur-md">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{editingMeasureId ? 'Editar' : 'Nova'} Medição</h3>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">Sincronização Fitdays Data</p>
              </div>
              <button onClick={() => setShowMeasureForm(false)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm active:scale-90"><i className="fas fa-times"></i></button>
           </header>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 bg-[#F7F8FA]">
              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block text-center">Data da Medição</label>
                <input 
                  type="date" 
                  value={newMeasure.measured_at} 
                  onChange={e => setNewMeasure({...newMeasure, measured_at: e.target.value})} 
                  className="w-full bg-white p-5 rounded-2xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 text-center uppercase tracking-widest shadow-sm" 
                />
              </div>

              <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-weight"></i> Composição Básica</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Peso (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.weight} onChange={e => setNewMeasure({...newMeasure, weight: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Gordura</label>
                    <input type="number" step="0.1" value={newMeasure.body_fat_pct} onChange={e => setNewMeasure({...newMeasure, body_fat_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Gordura Calculada (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.body_fat_kg} disabled className="w-full bg-slate-50 p-4 rounded-xl text-slate-400 font-bold border border-slate-100 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Taxa Muscular</label>
                    <input type="number" step="0.1" value={newMeasure.muscle_rate_pct} onChange={e => setNewMeasure({...newMeasure, muscle_rate_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Massa Muscular (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.muscle_mass_kg} disabled className="w-full bg-slate-50 p-4 rounded-xl text-slate-400 font-bold border border-slate-100 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Músc. Esquelético</label>
                    <input type="number" step="0.1" value={newMeasure.skeletal_muscle_pct} onChange={e => setNewMeasure({...newMeasure, skeletal_muscle_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-bolt"></i> Metabolismo</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Taxa Basal (kcal)</label>
                    <input type="number" value={newMeasure.bmr_kcal} onChange={e => setNewMeasure({...newMeasure, bmr_kcal: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Idade Metabólica</label>
                    <input type="number" value={newMeasure.metabolic_age} onChange={e => setNewMeasure({...newMeasure, metabolic_age: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Proteína</label>
                    <input type="number" step="0.1" value={newMeasure.protein_pct} onChange={e => setNewMeasure({...newMeasure, protein_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Água Corporal</label>
                    <input type="number" step="0.1" value={newMeasure.body_water_pct} onChange={e => setNewMeasure({...newMeasure, body_water_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-microscope"></i> Bio-Detalhes</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Gordura Visceral</label>
                    <input type="number" step="0.1" value={newMeasure.visceral_fat_index} onChange={e => setNewMeasure({...newMeasure, visceral_fat_index: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Massa Óssea (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.bone_mass_kg} onChange={e => setNewMeasure({...newMeasure, bone_mass_kg: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">% Gord. Subcutânea</label>
                    <input type="number" step="0.1" value={newMeasure.subcutaneous_fat_pct} onChange={e => setNewMeasure({...newMeasure, subcutaneous_fat_pct: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Massa Magra (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.fat_free_mass_kg} onChange={e => setNewMeasure({...newMeasure, fat_free_mass_kg: parseInput(e.target.value)})} className="w-full bg-white p-4 rounded-xl text-slate-900 font-bold border border-slate-100 outline-none focus:border-blue-600 shadow-sm" />
                  </div>
                </div>
              </div>
           </div>

           <footer className="p-8 border-t border-slate-100 bg-white shrink-0 flex gap-4 pb-12">
              <button onClick={() => setShowMeasureForm(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Descartar</button>
              <button 
                onClick={handleSaveMeasurement} 
                disabled={saving} 
                className="flex-[2] py-5 bg-blue-600 rounded-[1.5rem] font-bold text-white shadow-lg shadow-blue-600/20 uppercase tracking-[0.1em] active:scale-95 transition-all"
              >
                {saving ? 'PROCESSANDO...' : editingMeasureId ? 'Atualizar Dados' : 'Salvar Evolução'}
              </button>
           </footer>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
