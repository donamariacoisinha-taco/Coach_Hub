
import React, { useState, useEffect, useMemo } from 'react';
import { BodyMeasurement, Goal } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";

type BioMetric = 'weight' | 'body_fat_pct' | 'muscle_mass_kg' | 'visceral_fat_index' | 'skeletal_muscle_pct' | 'protein_pct' | 'body_water_pct' | 'metabolic_age';
type TimePeriod = '7d' | '30d' | '90d' | 'all';

interface NutritionStrategy {
  calories: number;
  macros: { p: number; c: number; g: number };
  foods: string[];
  hydration: string;
  insight: string;
}

const BioReport: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'nutrition'>('trends');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<BioMetric>('body_fat_pct');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  
  const [nutritionPlan, setNutritionPlan] = useState<NutritionStrategy | null>(null);
  const [generatingDiet, setGeneratingDiet] = useState(false);

  useEffect(() => {
    fetchBioData();
  }, []);

  const fetchBioData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_at', { ascending: true });
      if (data) {
        setMeasurements(data);
        if (data.length >= 2) generateInsight(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateInsight = async (data: BodyMeasurement[]) => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise os dados de bioimpedância deste atleta e forneça um insight curto e técnico (máx 120 caracteres). 
      Período: ${selectedPeriod}. Dados recentes: ${data.slice(-3).map(m => `${m.weight}kg, ${m.body_fat_pct}%, ${m.muscle_mass_kg}kg`).join(' | ')}`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setInsight(response.text || "Consistência gera resultados duradouros.");
    } catch (err) { console.error(err); }
    finally { setAnalyzing(false); }
  };

  const generateDietStrategy = async () => {
    if (generatingDiet || measurements.length === 0) return;
    setGeneratingDiet(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      
      const last = measurements[measurements.length - 1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Como Rubi, Especialista em Nutrição Esportiva, analise:
      Dados: Peso ${last.weight}kg, Gordura ${last.body_fat_pct}%, Massa Muscular ${last.muscle_mass_kg}kg.
      Objetivo: ${profile?.goal || 'Hipertrofia'}.
      
      Crie uma estratégia nutricional precisa. Retorne um JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  p: { type: Type.NUMBER, description: "Proteína em g" },
                  c: { type: Type.NUMBER, description: "Carbo em g" },
                  g: { type: Type.NUMBER, description: "Gordura em g" }
                },
                required: ["p", "c", "g"]
              },
              foods: { type: Type.ARRAY, items: { type: Type.STRING } },
              hydration: { type: Type.STRING },
              insight: { type: Type.STRING }
            },
            required: ["calories", "macros", "foods", "hydration", "insight"]
          }
        }
      });
      
      const result = JSON.parse(response.text || "{}");
      setNutritionPlan(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDiet(false);
    }
  };

  const metricsConfig = {
    weight: { label: 'Peso', unit: 'kg', color: '#3b82f6', icon: 'fa-weight' },
    body_fat_pct: { label: 'Gordura %', unit: '%', color: '#f97316', icon: 'fa-fire' },
    muscle_mass_kg: { label: 'Massa Muscular', unit: 'kg', color: '#22c55e', icon: 'fa-dumbbell' },
    visceral_fat_index: { label: 'Gord. Visceral', unit: '', color: '#ef4444', icon: 'fa-biohazard' },
    skeletal_muscle_pct: { label: 'Músc. Esquelético', unit: '%', color: '#8b5cf6', icon: 'fa-person-running' },
    protein_pct: { label: 'Proteína', unit: '%', color: '#ec4899', icon: 'fa-vial' },
    body_water_pct: { label: 'Água Corporal', unit: '%', color: '#06b6d4', icon: 'fa-droplet' },
    metabolic_age: { label: 'Idade Metab.', unit: ' anos', color: '#10b981', icon: 'fa-hourglass-half' }
  };

  const filteredMeasurements = useMemo(() => {
    const now = new Date();
    const periods = { '7d': 7, '30d': 30, '90d': 90, 'all': 9999 };
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - periods[selectedPeriod]);
    return measurements.filter(m => new Date(m.measured_at) >= cutoff);
  }, [measurements, selectedPeriod]);

  const chartPoints = useMemo(() => {
    if (filteredMeasurements.length < 2) return [];
    const values = filteredMeasurements.map(m => (m as any)[selectedMetric] || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = (max - min) || (max * 0.1) || 1;

    return filteredMeasurements.map((m, i) => ({
      x: (i / (filteredMeasurements.length - 1)) * 100,
      y: 100 - (((m as any)[selectedMetric] - min) / range) * 70 - 15,
      val: (m as any)[selectedMetric],
      date: m.measured_at
    }));
  }, [filteredMeasurements, selectedMetric]);

  const bezierPath = useMemo(() => {
    if (chartPoints.length < 2) return "";
    return chartPoints.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = a[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      return `${acc} C ${cp1x},${prev.y} ${cp1x},${p.y} ${p.x},${p.y}`;
    }, "");
  }, [chartPoints]);

  if (loading) return <div className="py-20 flex flex-col items-center justify-center space-y-4"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Tab Switcher */}
      <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 mx-auto max-w-xs shadow-inner">
        <button onClick={() => setActiveSubTab('trends')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'trends' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Tendências</button>
        <button onClick={() => setActiveSubTab('nutrition')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'nutrition' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Nutrição</button>
      </div>

      {activeSubTab === 'trends' ? (
        <>
          <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 max-w-sm mx-auto shadow-inner">
            {(['7d', '30d', '90d', 'all'] as TimePeriod[]).map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
                {p === '7d' ? '7D' : p === '30d' ? '30D' : p === '90d' ? '90D' : 'TUDO'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {Object.entries(metricsConfig).map(([key, cfg]) => (
              <button key={key} onClick={() => setSelectedMetric(key as BioMetric)} className={`px-6 py-4 rounded-[2rem] flex items-center gap-3 border transition-all whitespace-nowrap ${selectedMetric === key ? 'bg-slate-900 border-blue-500 text-white shadow-xl' : 'bg-slate-900/30 border-white/5 text-slate-500'}`}>
                <i className={`fas ${cfg.icon}`} style={{ color: selectedMetric === key ? cfg.color : undefined }}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/60 p-8 lg:p-12 rounded-[4rem] border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Status de Bioimpedância</p>
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter">{metricsConfig[selectedMetric].label}</h4>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black" style={{ color: metricsConfig[selectedMetric].color }}>
                  {chartPoints[chartPoints.length - 1]?.val || '0'} <span className="text-sm font-bold opacity-30">{metricsConfig[selectedMetric].unit}</span>
                </p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Leitura Atual</p>
              </div>
            </div>

            <div className="relative h-64 lg:h-80 w-full">
               {chartPoints.length >= 2 ? (
                 <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                       <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={metricsConfig[selectedMetric].color} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={metricsConfig[selectedMetric].color} stopOpacity="0" />
                       </linearGradient>
                    </defs>
                    <path 
                      d={`${bezierPath} L ${chartPoints[chartPoints.length-1].x} 100 L ${chartPoints[0].x} 100 Z`}
                      fill={`url(#grad-${selectedMetric})`}
                      className="animate-in fade-in duration-1000"
                    />
                    <path 
                      d={bezierPath}
                      fill="none"
                      stroke={metricsConfig[selectedMetric].color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-in slide-in-from-left-4 duration-1000"
                    />
                    {chartPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="2" fill="#0f172a" stroke={metricsConfig[selectedMetric].color} strokeWidth="2" />
                    ))}
                 </svg>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <i className="fas fa-chart-line text-5xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Aguardando mais medições</p>
                 </div>
               )}
            </div>
          </div>
        </>
      ) : (
        /* NUTRITION TAB */
        <div className="space-y-6 animate-in zoom-in duration-500">
           {!nutritionPlan ? (
             <div className="bg-slate-900/60 p-12 rounded-[4rem] border border-indigo-500/20 text-center space-y-8 shadow-2xl">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)]">
                   <i className="fas fa-apple-whole text-3xl"></i>
                </div>
                <div>
                   <h4 className="text-xl font-black text-white uppercase tracking-tight">Síntese Metabólica Rubi</h4>
                   <p className="text-xs text-slate-500 mt-2 leading-relaxed">Clique para cruzar seus dados de bioimpedância com sua meta e gerar um protocolo nutricional personalizado.</p>
                </div>
                <button 
                  onClick={generateDietStrategy}
                  disabled={generatingDiet || measurements.length === 0}
                  className="w-full py-6 bg-indigo-600 rounded-[2.5rem] font-black text-white uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                >
                   {generatingDiet ? "Sincronizando Macros..." : "Gerar Protocolo Neural"}
                </button>
                {measurements.length === 0 && <p className="text-[9px] text-red-500 uppercase font-black">Requer ao menos 1 medição corporal</p>}
             </div>
           ) : (
             <div className="space-y-8 animate-in fade-in">
                {/* Macros Card */}
                <div className="bg-slate-900/60 p-10 rounded-[4rem] border border-indigo-500/20 shadow-2xl space-y-8">
                   <div className="flex justify-between items-center">
                      <div>
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Alvo Calórico</p>
                         <h4 className="text-3xl font-black text-white">{nutritionPlan.calories} <span className="text-sm font-bold opacity-30">KCAL</span></h4>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-500"><i className="fas fa-bolt"></i></div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="bg-indigo-600/10 p-5 rounded-[2.5rem] text-center border border-indigo-500/10">
                         <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">Prot</p>
                         <p className="text-xl font-black text-white">{nutritionPlan.macros.p}g</p>
                      </div>
                      <div className="bg-indigo-600/10 p-5 rounded-[2.5rem] text-center border border-indigo-500/10">
                         <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">Carb</p>
                         <p className="text-xl font-black text-white">{nutritionPlan.macros.c}g</p>
                      </div>
                      <div className="bg-indigo-600/10 p-5 rounded-[2.5rem] text-center border border-indigo-500/10">
                         <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">Gord</p>
                         <p className="text-xl font-black text-white">{nutritionPlan.macros.g}g</p>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Alimentos Prioritários</p>
                      <div className="flex flex-wrap gap-2">
                         {nutritionPlan.foods.map((food, i) => (
                           <span key={i} className="px-5 py-2.5 bg-indigo-600/5 rounded-full text-[10px] font-bold text-indigo-300 border border-indigo-500/10 uppercase tracking-tight">{food}</span>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Insight Card */}
                <div className="bg-indigo-600/10 p-8 rounded-[3rem] border border-indigo-500/20">
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Veredito da Rubi</p>
                   <p className="text-sm font-bold text-white italic leading-relaxed">"{nutritionPlan.insight}"</p>
                   <div className="mt-6 flex items-center gap-3">
                      <i className="fas fa-glass-water text-indigo-500"></i>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nutritionPlan.hydration}</p>
                   </div>
                </div>

                <button 
                  onClick={() => setNutritionPlan(null)}
                  className="w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] py-4"
                >
                   Atualizar Estratégia
                </button>
             </div>
           )}
        </div>
      )}

      {/* Insight Geral inferior */}
      {activeSubTab === 'trends' && (
        <div className="bg-blue-600/10 p-8 rounded-[3rem] border border-blue-500/20 relative overflow-hidden group">
           <div className="relative z-10 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shrink-0">
                 <i className="fas fa-brain"></i>
              </div>
              <div>
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Análise Neural (Rubi)</p>
                 <h5 className="text-white text-lg font-bold leading-tight italic">
                    {analyzing ? "Analisando padrões biométricos..." : `"${insight || "Seu corpo se adapta ao estresse que você impõe a ele. Continue consistente."}"`}
                 </h5>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BioReport;
