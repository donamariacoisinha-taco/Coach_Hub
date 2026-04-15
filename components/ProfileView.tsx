
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, BodyMeasurement } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ScreenState } from './ui/ScreenState';
import { WorkoutSkeleton } from './ui/Skeleton';
import { useAsyncState } from '../hooks/useAsyncState';
import { TrendingUp, Plus, Edit2, Trash2, ChevronLeft, User, Sun, Moon, X, ChartLine } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdate: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdate }) => {
  const { theme, toggleTheme, navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<'profile' | 'measurements' | 'settings'>('profile');
  const [saving, setSaving] = useState(false);
  const measurementsState = useAsyncState<BodyMeasurement[]>([]);
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
    measurementsState.setLoading(true);
    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .order('measured_at', { ascending: false });
      
      if (error) throw error;
      if (data) measurementsState.setData(data);
    } catch (err) {
      measurementsState.setError(err);
    }
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
    } catch (err: any) { showError(err); }
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
      
      const latest = measurementsState.data?.[0];
      if (!latest || new Date(newMeasure.measured_at!) >= new Date(latest.measured_at)) {
        await supabase.from('profiles').update({ weight: newMeasure.weight }).eq('id', user.id);
      }
      
      if ('vibrate' in navigator) navigator.vibrate(50);
      setShowMeasureForm(false);
      setEditingMeasureId(null);
      fetchMeasurements();
      onUpdate();
      showSuccess('Registro salvo', 'Sua evolução foi atualizada com sucesso.');
    } catch (err: any) {
      showError(err);
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
    const measurements = measurementsState.data || [];
    if (currentIndex >= measurements.length - 1) return null;
    const current = measurements[currentIndex].weight;
    const previous = measurements[currentIndex + 1].weight;
    if (current > previous) return <TrendingUp className="w-3 h-3 text-red-500 ml-1 rotate-45" />;
    if (current < previous) return <TrendingUp className="w-3 h-3 text-green-500 ml-1 -rotate-45" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('dashboard')} 
            className="w-10 h-10 flex items-center justify-center text-slate-300 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Evolução</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Bio Analytics</h2>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
           {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User className="w-6 h-6 text-slate-200" />}
        </div>
      </header>

      <div className="px-6 space-y-10">
        {/* Tab Switcher Minimalista */}
        <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-slate-100">
          {(['profile', 'measurements', 'settings'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              {tab === 'profile' ? 'Painel' : tab === 'measurements' ? 'Histórico' : 'Ajustes'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-12">
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{profile.full_name || 'Atleta'}</h3>
                </div>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                  {measurementsState.data?.[0] ? formatDisplayDate(measurementsState.data[0].measured_at) : 'Sem registros'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Peso</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{profile.weight || 0}<span className="text-[10px] ml-0.5">kg</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">IMC</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{calculateBMI(profile.weight || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gordura</p>
                  <p className="text-2xl font-black text-blue-600 tracking-tighter">{measurementsState.data?.[0]?.body_fat_pct || 0}<span className="text-[10px] ml-0.5">%</span></p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setEditingMeasureId(null); setNewMeasure(initialMeasureState); setShowMeasureForm(true); }}
              className="w-full py-6 bg-blue-600 rounded-full font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-4 h-4" />
              Nova Medição
            </button>
          </div>
        ) : activeTab === 'measurements' ? (
          <div className="space-y-1">
             <ScreenState
               state={measurementsState.uiState}
               loadingComponent={<WorkoutSkeleton />}
               onRetry={fetchMeasurements}
               emptyTitle="Nenhum registro"
               emptyDescription="Acompanhe sua evolução registrando suas medidas regularmente."
               emptyIcon={<ChartLine className="w-12 h-12 text-slate-200" />}
             >
               {(measurementsState.data || []).map((m, idx) => (
                 <div 
                  key={m.id} 
                  className={`flex items-center justify-between py-6 active:bg-slate-50 transition-colors ${idx !== (measurementsState.data || []).length - 1 ? 'border-b border-slate-100' : ''}`}
                 >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{formatDisplayDate(m.measured_at)}</span>
                        {getTrendIcon(idx)}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-black text-slate-900 tracking-tighter">{m.weight}kg</p>
                        <p className="text-xs font-black text-blue-600 tracking-tighter">{m.body_fat_pct}% BF</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleEdit(m)} 
                        className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)} 
                        className="w-10 h-10 flex items-center justify-center text-slate-300 active:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
               ))}
             </ScreenState>
          </div>
        ) : (
          <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
             {profile.is_admin && (
               <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administração</p>
                  <button 
                    onClick={() => navigate('admin')}
                    className="w-full py-6 bg-red-500 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Coach Hub
                  </button>
               </div>
             )}

             <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preferências</p>
                <div className="space-y-4">
                   <button 
                    onClick={() => toggleTheme('light')}
                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between ${theme === 'light' ? 'border-blue-600 bg-white shadow-xl shadow-blue-600/5' : 'border-slate-100 bg-white'}`}
                   >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                          <Sun className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Tema Claro</span>
                      </div>
                      {theme === 'light' && <i className="fas fa-check text-blue-600"></i>}
                   </button>
                   <button 
                    onClick={() => toggleTheme('classic')}
                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between ${theme === 'classic' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-white'}`}
                   >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'classic' ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                          <Moon className="w-5 h-5" />
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${theme === 'classic' ? 'text-white' : 'text-slate-900'}`}>Tema Escuro</span>
                      </div>
                      {theme === 'classic' && <i className="fas fa-check text-white"></i>}
                   </button>
                </div>
             </div>

             <div className="pt-8">
                <button 
                  onClick={() => supabase.auth.signOut()} 
                  className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all"
                >
                  Encerrar Sessão
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Formulário de Medição - Modal Minimalista */}
      {showMeasureForm && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
              <button 
                onClick={() => setShowMeasureForm(false)} 
                className="w-10 h-10 flex items-center justify-center text-slate-900 active:scale-90 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-center flex-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{editingMeasureId ? 'Editar' : 'Nova'} Medição</h3>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Sincronização Fitdays</p>
              </div>
              <div className="w-10"></div>
           </header>

           <div className="flex-1 overflow-y-auto px-6 py-10 space-y-12 no-scrollbar">
              <div className="space-y-4">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Data do Registro</p>
                <input 
                  type="date" 
                  value={newMeasure.measured_at} 
                  onChange={e => setNewMeasure({...newMeasure, measured_at: e.target.value})} 
                  className="w-full bg-[#F7F8FA] p-6 rounded-3xl text-slate-900 font-black border-none outline-none focus:ring-2 focus:ring-blue-600 text-center uppercase tracking-widest" 
                />
              </div>

              <div className="space-y-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Composição Corporal</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Peso (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.weight} onChange={e => setNewMeasure({...newMeasure, weight: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">% Gordura</label>
                    <input type="number" step="0.1" value={newMeasure.body_fat_pct} onChange={e => setNewMeasure({...newMeasure, body_fat_pct: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-blue-600 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">% Taxa Muscular</label>
                    <input type="number" step="0.1" value={newMeasure.muscle_rate_pct} onChange={e => setNewMeasure({...newMeasure, muscle_rate_pct: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">% Músc. Esquelético</label>
                    <input type="number" step="0.1" value={newMeasure.skeletal_muscle_pct} onChange={e => setNewMeasure({...newMeasure, skeletal_muscle_pct: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metabolismo & Bio</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Basal (kcal)</label>
                    <input type="number" value={newMeasure.bmr_kcal} onChange={e => setNewMeasure({...newMeasure, bmr_kcal: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Idade Metab.</label>
                    <input type="number" value={newMeasure.metabolic_age} onChange={e => setNewMeasure({...newMeasure, metabolic_age: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gord. Visceral</label>
                    <input type="number" step="0.1" value={newMeasure.visceral_fat_index} onChange={e => setNewMeasure({...newMeasure, visceral_fat_index: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Massa Óssea (kg)</label>
                    <input type="number" step="0.1" value={newMeasure.bone_mass_kg} onChange={e => setNewMeasure({...newMeasure, bone_mass_kg: parseInput(e.target.value)})} className="w-full bg-transparent border-b border-slate-100 py-2 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
           </div>

           <footer className="px-6 py-10 border-t border-slate-50 bg-white flex flex-col gap-4">
              <button 
                onClick={handleSaveMeasurement} 
                disabled={saving} 
                className="w-full py-6 bg-blue-600 rounded-full font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                {saving ? 'Sincronizando...' : 'Salvar Registro'}
              </button>
              <button 
                onClick={() => setShowMeasureForm(false)} 
                className="w-full py-3 text-slate-300 font-black uppercase text-[9px] tracking-widest active:text-slate-900 transition-colors"
              >
                Descartar
              </button>
           </footer>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
