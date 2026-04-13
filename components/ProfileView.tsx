
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
    <div className="p-4 md:p-8 space-y-10 animate-in fade-in pb-32">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black uppercase text-[var(--theme-text)] tracking-tighter">Bio <span className="text-[var(--theme-primary)]">Analytics</span></h2>
          <p className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest mt-1">Gestão de Evolução Corporal</p>
        </div>
        <div className="w-12 h-12 bg-theme-surface rounded-2xl flex items-center justify-center border border-[var(--theme-surface)]">
           {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : <i className="fas fa-user text-[var(--theme-text-muted)]"></i>}
        </div>
      </header>

      <nav className="flex bg-theme-surface/40 p-1 rounded-2xl border border-[var(--theme-surface)] shadow-inner">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'text-[var(--theme-text-muted)]'}`}>Painel</button>
        <button onClick={() => setActiveTab('measurements')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'measurements' ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'text-[var(--theme-text-muted)]'}`}>Histórico</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[var(--theme-primary)] text-white shadow-lg' : 'text-[var(--theme-text-muted)]'}`}>Ajustes</button>
      </nav>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <div className="bg-theme-card p-8 rounded-[2.5rem] border border-[var(--theme-surface)] shadow-2xl space-y-8">
            <div className="flex justify-between items-center border-b border-[var(--theme-surface)] pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)]"><i className="fas fa-calendar-check"></i></div>
                <div>
                  <h4 className="font-black text-[var(--theme-text)] uppercase text-sm">{profile.full_name || 'Atleta'}</h4>
                  <p className="text-[9px] text-[var(--theme-text-muted)] font-bold uppercase">Última avaliação: {measurements[0] ? formatDisplayDate(measurements[0].measured_at) : 'Nenhuma'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-theme-bg/40 rounded-3xl border border-[var(--theme-surface)]">
                <p className="text-xl font-black text-[var(--theme-text)]">{profile.weight || 0}kg</p>
                <p className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase mt-1">Peso</p>
              </div>
              <div className="p-4 bg-theme-bg/40 rounded-3xl border border-[var(--theme-surface)]">
                <p className="text-xl font-black text-[var(--theme-text)]">{calculateBMI(profile.weight || 0)}</p>
                <p className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase mt-1">IMC</p>
              </div>
              <div className="p-4 bg-[var(--theme-primary)]/10 rounded-3xl border border-[var(--theme-primary)]/20">
                <p className="text-xl font-black text-[var(--theme-primary)]">{measurements[0]?.body_fat_pct || 0}%</p>
                <p className="text-[8px] font-black text-[var(--theme-primary)] uppercase mt-1">Fat %</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { setEditingMeasureId(null); setNewMeasure(initialMeasureState); setShowMeasureForm(true); }}
            className="w-full py-6 bg-[var(--theme-primary)] rounded-[2rem] font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-[var(--theme-primary-glow)] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus-circle"></i>
            Adicionar Medição
          </button>
        </div>
      ) : activeTab === 'measurements' ? (
        <div className="space-y-6 animate-in fade-in">
           {measurements.length === 0 ? (
             <div className="p-20 border-2 border-dashed border-[var(--theme-surface)] rounded-[3rem] text-center bg-theme-bg/20">
                <i className="fas fa-chart-line text-[var(--theme-text-muted)] text-5xl mb-4"></i>
                <p className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase">Aguardando medições</p>
             </div>
           ) : (
             measurements.map((m, idx) => (
               <div key={m.id} className="bg-theme-card p-6 rounded-[2.5rem] border border-[var(--theme-surface)] space-y-4">
                  <header className="flex justify-between items-center border-b border-[var(--theme-surface)] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)]"></span>
                      <span className="text-[10px] font-black text-[var(--theme-text)] uppercase tracking-widest">{formatDisplayDate(m.measured_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(m)} className="w-9 h-9 rounded-xl bg-theme-surface flex items-center justify-center text-[var(--theme-text-muted)] text-[10px] border border-[var(--theme-surface)] active:scale-90"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(m.id)} className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-[10px] border border-red-500/20 active:scale-90"><i className="fas fa-trash"></i></button>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase">Peso</span>
                       <span className="text-xl font-black text-[var(--theme-text)] flex items-center">{m.weight}kg {getTrendIcon(idx)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase">Gordura</span>
                       <span className="text-xl font-black text-[var(--theme-primary)]">{m.body_fat_pct}% ({m.body_fat_kg}kg)</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase">Massa Muscular</span>
                       <span className="text-xl font-black text-white">{m.muscle_mass_kg}kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase">Metabolismo</span>
                       <span className="text-xl font-black text-white">{m.bmr_kcal} kcal</span>
                    </div>
                  </div>
               </div>
             ))
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           {profile.is_admin && (
             <section className="bg-slate-900 p-8 rounded-[3rem] border-2 border-red-600/30 space-y-4 shadow-[0_0_40px_rgba(220,38,38,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-user-shield text-xl"></i></div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Comando Central</h3>
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Painel de Administração Rubi</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('admin')}
                  className="w-full py-5 bg-red-600 rounded-2xl font-black text-white uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mt-2"
                >
                  ACESSAR COACH HUB
                </button>
             </section>
           )}

           <section className="bg-theme-card p-8 rounded-[3rem] border border-[var(--theme-surface)] space-y-6">
              <div>
                <h3 className="text-lg font-black text-[var(--theme-text)] uppercase tracking-tighter">Estilo Visual</h3>
                <p className="text-[9px] font-black text-[var(--theme-text-muted)] uppercase tracking-widest mt-1">Personalize sua experiência</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                  onClick={() => toggleTheme('light')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'light' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'border-[var(--theme-surface)] bg-theme-bg/50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-[#f8fafc] border-2 border-[#2563eb] flex items-center justify-center text-[#2563eb] shrink-0"><i className="fas fa-sun"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] block">Tema Claro</span>
                       <span className="text-[8px] text-[var(--theme-text-muted)] uppercase font-bold">Foco & Luminosidade</span>
                    </div>
                 </button>
                 <button 
                  onClick={() => toggleTheme('classic')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'classic' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'border-[var(--theme-surface)] bg-theme-bg/50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-[#0f172a] border-2 border-[#3b82f6] flex items-center justify-center text-[#3b82f6] shrink-0"><i className="fas fa-moon"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] block">Tema Escuro</span>
                       <span className="text-[8px] text-[var(--theme-text-muted)] uppercase font-bold">Original & Focado</span>
                    </div>
                 </button>
                 <button 
                  onClick={() => toggleTheme('aggressive')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'aggressive' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'border-[var(--theme-surface)] bg-theme-bg/50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-[#044040] border-2 border-[#D92525] flex items-center justify-center text-[#D92525] shrink-0"><i className="fas fa-fire"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] block">Aggressive Power</span>
                       <span className="text-[8px] text-[var(--theme-text-muted)] uppercase font-bold">Máxima Intensidade</span>
                    </div>
                 </button>
                 <button 
                  onClick={() => toggleTheme('bloom')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'bloom' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'border-[var(--theme-surface)] bg-theme-bg/50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-[#1A0B1A] border-2 border-[#F569DE] flex items-center justify-center text-[#F569DE] shrink-0"><i className="fas fa-spa"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] block">Vibrant Bloom</span>
                       <span className="text-[8px] text-[#A669F5] uppercase font-bold">Energia & Estilo</span>
                    </div>
                 </button>
                 <button 
                  onClick={() => toggleTheme('neon-strike')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${theme === 'neon-strike' ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'border-[var(--theme-surface)] bg-theme-bg/50'}`}
                 >
                    <div className="w-14 h-14 rounded-full bg-[#044040] border-2 border-[#F569DE] flex items-center justify-center text-[#F569DE] shrink-0"><i className="fas fa-bolt"></i></div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] block">Neon Strike</span>
                       <span className="text-[8px] text-[var(--theme-text-muted)] uppercase font-bold">Exotic Edition</span>
                    </div>
                 </button>
              </div>
           </section>

           <section className="bg-theme-card p-8 rounded-[3rem] border border-[var(--theme-surface)] space-y-4">
              <h3 className="text-sm font-black text-[var(--theme-text)] uppercase">Conta</h3>
              <button onClick={() => supabase.auth.signOut()} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase border border-red-500/20 tracking-widest hover:bg-red-500 hover:text-white transition-all">Sair da Conta</button>
           </section>
        </div>
      )}

      {showMeasureForm && (
        <div className="fixed inset-0 z-[300] bg-theme-bg flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="p-8 flex justify-between items-center shrink-0 border-b border-[var(--theme-surface)] bg-theme-surface/80 backdrop-blur-md">
              <div>
                <h3 className="text-2xl font-black text-[var(--theme-text)] uppercase tracking-tighter">{editingMeasureId ? 'Editar' : 'Nova'} Medição</h3>
                <p className="text-[9px] font-black text-[var(--theme-primary)] uppercase tracking-widest mt-1">Sincronização Fitdays Data</p>
              </div>
              <button onClick={() => setShowMeasureForm(false)} className="w-12 h-12 bg-theme-surface rounded-2xl flex items-center justify-center text-[var(--theme-text-muted)] active:scale-90"><i className="fas fa-times"></i></button>
           </header>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40 bg-theme-bg">
              {/* Data da Medição */}
              <div className="bg-[var(--theme-primary)]/10 p-6 rounded-[2rem] border border-[var(--theme-primary)]/20 space-y-4">
                <label className="text-[10px] font-black text-[var(--theme-primary)] uppercase tracking-widest block text-center">Data da Medição</label>
                <input 
                  type="date" 
                  value={newMeasure.measured_at} 
                  onChange={e => setNewMeasure({...newMeasure, measured_at: e.target.value})} 
                  className="w-full bg-theme-surface p-5 rounded-2xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)] text-center uppercase tracking-widest" 
                />
              </div>

              {/* Seção 1: Composição Corporal Básica */}
              <div className="space-y-4">
                <h5 className="text-[11px] font-black text-[var(--theme-primary)] uppercase tracking-widest flex items-center gap-2"><i className="fas fa-weight"></i> Composição Básica</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Peso (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.weight} onChange={e => setNewMeasure({...newMeasure, weight: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Gordura</label>
                    <input type="number" step="0.1" value={newMeasure.body_fat_pct} onChange={e => setNewMeasure({...newMeasure, body_fat_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Gordura Calculada (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.body_fat_kg} disabled className="w-full bg-theme-bg p-4 rounded-xl text-[var(--theme-text-muted)] font-black border border-[var(--theme-surface)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Taxa Muscular</label>
                    <input type="number" step="0.1" value={newMeasure.muscle_rate_pct} onChange={e => setNewMeasure({...newMeasure, muscle_rate_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Massa Muscular (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.muscle_mass_kg} disabled className="w-full bg-theme-bg p-4 rounded-xl text-[var(--theme-text-muted)] font-black border border-[var(--theme-surface)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Músc. Esquelético</label>
                    <input type="number" step="0.1" value={newMeasure.skeletal_muscle_pct} onChange={e => setNewMeasure({...newMeasure, skeletal_muscle_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                </div>
              </div>

              {/* Seção 2: Metabolismo e Vitalidade */}
              <div className="space-y-4">
                <h5 className="text-[11px] font-black text-[var(--theme-primary)] uppercase tracking-widest flex items-center gap-2"><i className="fas fa-bolt"></i> Metabolismo</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Taxa Basal (kcal)</label>
                    <input type="number" value={newMeasure.bmr_kcal} onChange={e => setNewMeasure({...newMeasure, bmr_kcal: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Idade Metabólica</label>
                    <input type="number" value={newMeasure.metabolic_age} onChange={e => setNewMeasure({...newMeasure, metabolic_age: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Proteína</label>
                    <input type="number" step="0.1" value={newMeasure.protein_pct} onChange={e => setNewMeasure({...newMeasure, protein_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Água Corporal</label>
                    <input type="number" step="0.1" value={newMeasure.body_water_pct} onChange={e => setNewMeasure({...newMeasure, body_water_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                </div>
              </div>

              {/* Seção 3: Detalhes Adicionais */}
              <div className="space-y-4">
                <h5 className="text-[11px] font-black text-[var(--theme-primary)] uppercase tracking-widest flex items-center gap-2"><i className="fas fa-microscope"></i> Bio-Detalhes</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Gordura Visceral</label>
                    <input type="number" step="0.1" value={newMeasure.visceral_fat_index} onChange={e => setNewMeasure({...newMeasure, visceral_fat_index: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Massa Óssea (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.bone_mass_kg} onChange={e => setNewMeasure({...newMeasure, bone_mass_kg: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">% Gord. Subcutânea</label>
                    <input type="number" step="0.1" value={newMeasure.subcutaneous_fat_pct} onChange={e => setNewMeasure({...newMeasure, subcutaneous_fat_pct: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-[var(--theme-text-muted)] uppercase ml-1">Massa Magra (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.fat_free_mass_kg} onChange={e => setNewMeasure({...newMeasure, fat_free_mass_kg: parseInput(e.target.value)})} className="w-full bg-theme-surface p-4 rounded-xl text-[var(--theme-text)] font-black border border-[var(--theme-surface)] outline-none focus:border-[var(--theme-primary)]" />
                  </div>
                </div>
              </div>
           </div>

           <footer className="p-8 border-t border-[var(--theme-surface)] bg-theme-surface shrink-0 flex gap-4 pb-12">
              <button onClick={() => setShowMeasureForm(false)} className="flex-1 py-4 text-[var(--theme-text-muted)] font-black uppercase text-[10px] tracking-widest">Descartar</button>
              <button 
                onClick={handleSaveMeasurement} 
                disabled={saving} 
                className="flex-[2] py-5 bg-[var(--theme-primary)] rounded-[1.5rem] font-black text-white shadow-xl shadow-[var(--theme-primary-glow)] uppercase tracking-[0.1em] active:scale-95 transition-all"
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
