
import React, { useState, useEffect, useMemo } from 'react';
import { BodyMeasurement, Goal } from '../types';
import { authApi } from '../lib/api/authApi';
import { profileApi } from '../lib/api/profileApi';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const getAI = () => {
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
  if (!apiKey) throw new Error("Gemini API Key not found");
  return new GoogleGenerativeAI(apiKey);
};

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
      const data = await profileApi.getBodyMeasurements();
      if (data) {
        setMeasurements(data.reverse()); // Reverse because API returns descending
        if (data.length >= 2) generateInsight(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateInsight = async (data: BodyMeasurement[]) => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const genAI = getAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analise os dados de bioimpedância deste atleta e forneça um insight curto e técnico (máx 120 caracteres). 
      Período: ${selectedPeriod}. Dados recentes: ${data.slice(-3).map(m => `${m.weight}kg, ${m.body_fat_pct}%, ${m.muscle_mass_kg}kg`).join(' | ')}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setInsight(response.text() || "Consistência gera resultados duradouros.");
    } catch (err) { console.error(err); }
    finally { setAnalyzing(false); }
  };

  const generateDietStrategy = async () => {
    if (generatingDiet || measurements.length === 0) return;
    setGeneratingDiet(true);
    try {
      const user = await authApi.getUser();
      if (!user) return;
      const profile = await profileApi.getProfile(user.id);
      
      const last = measurements[measurements.length - 1];
      const genAI = getAI();
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              calories: { type: SchemaType.NUMBER },
              macros: {
                type: SchemaType.OBJECT,
                properties: {
                  p: { type: SchemaType.NUMBER, description: "Proteína em g" },
                  c: { type: SchemaType.NUMBER, description: "Carbo em g" },
                  g: { type: SchemaType.NUMBER, description: "Gordura em g" }
                },
                required: ["p", "c", "g"]
              },
              foods: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              hydration: { type: SchemaType.STRING },
              insight: { type: SchemaType.STRING }
            },
            required: ["calories", "macros", "foods", "hydration", "insight"]
          }
        }
      });
      
      const prompt = `Como Rubi, Especialista em Nutrição Esportiva, analise:
      Dados: Peso ${last.weight}kg, Gordura ${last.body_fat_pct}%, Massa Muscular ${last.muscle_mass_kg}kg.
      Objetivo: ${profile?.goal || 'Hipertrofia'}.
      
      Crie uma estratégia nutricional precisa. Retorne um JSON.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const dietData = JSON.parse(response.text() || "{}");
      setNutritionPlan(dietData);
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

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando Bio-Dados...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Tab Switcher Minimalista */}
      <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-slate-100">
        {(['trends', 'nutrition'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveSubTab(tab)} 
            className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${activeSubTab === tab ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            {tab === 'trends' ? 'Tendências' : 'Nutrição'}
          </button>
        ))}
      </div>

      {activeSubTab === 'trends' ? (
        <div className="space-y-12">
          {/* Período */}
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {(['7d', '30d', '90d', 'all'] as TimePeriod[]).map(p => (
              <button 
                key={p} 
                onClick={() => setSelectedPeriod(p)} 
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${selectedPeriod === p ? 'text-blue-600' : 'text-slate-300'}`}
              >
                {p === '7d' ? '7D' : p === '30d' ? '30D' : p === '90d' ? '90D' : 'TUDO'}
              </button>
            ))}
          </div>

          {/* Métricas Horizontal */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {Object.entries(metricsConfig).map(([key, cfg]) => (
              <button 
                key={key} 
                onClick={() => setSelectedMetric(key as BioMetric)} 
                className={`px-8 py-5 rounded-full flex items-center gap-3 transition-all whitespace-nowrap border ${selectedMetric === key ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <i className={`fas ${cfg.icon} text-xs`} style={{ color: selectedMetric === key ? cfg.color : undefined }}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
              </button>
            ))}
          </div>

          {/* Gráfico Minimalista */}
          <div className="space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bio-Status</p>
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{metricsConfig[selectedMetric].label}</h4>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black tracking-tighter" style={{ color: metricsConfig[selectedMetric].color }}>
                  {chartPoints[chartPoints.length - 1]?.val || '0'}<span className="text-xs ml-1 opacity-40">{metricsConfig[selectedMetric].unit}</span>
                </p>
              </div>
            </div>

            <div className="relative h-64 w-full">
               {chartPoints.length >= 2 ? (
                 <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                       <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={metricsConfig[selectedMetric].color} stopOpacity="0.1" />
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
                      <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="white" stroke={metricsConfig[selectedMetric].color} strokeWidth="2" />
                    ))}
                 </svg>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full">
                    <i className="fas fa-chart-line text-slate-100 text-4xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Aguardando dados</p>
                 </div>
               )}
            </div>
          </div>

          {/* Insight Rubi */}
          <div className="pt-12 border-t border-slate-100">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/20 shrink-0">
                 <i className="fas fa-brain text-lg"></i>
              </div>
              <div>
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Análise Neural Rubi</p>
                 <h5 className="text-slate-900 text-lg font-black leading-tight italic tracking-tight">
                    {analyzing ? "Processando padrões..." : `"${insight || "Seu corpo se adapta ao estresse que você impõe a ele. Continue consistente."}"`}
                 </h5>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* NUTRITION TAB */
        <div className="space-y-12 animate-in zoom-in duration-500">
           {!nutritionPlan ? (
             <div className="py-20 text-center space-y-10">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] mx-auto flex items-center justify-center text-white shadow-2xl">
                   <i className="fas fa-apple-whole text-4xl"></i>
                </div>
                <div className="space-y-4">
                   <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Síntese Rubi</h4>
                   <p className="text-xs text-slate-400 leading-relaxed max-w-[240px] mx-auto font-medium">Protocolo nutricional gerado por IA baseado em sua bioimpedância real.</p>
                </div>
                <button 
                  onClick={generateDietStrategy}
                  disabled={generatingDiet || measurements.length === 0}
                  className="w-full py-6 bg-blue-600 rounded-full font-black text-white uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                   {generatingDiet ? "Sincronizando..." : "Gerar Protocolo"}
                </button>
                {measurements.length === 0 && <p className="text-[9px] text-red-500 uppercase font-black tracking-widest">Requer medição corporal</p>}
             </div>
           ) : (
             <div className="space-y-12 animate-in fade-in">
                {/* Macros */}
                <div className="space-y-10">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Alvo Diário</p>
                         <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{nutritionPlan.calories}<span className="text-sm ml-1 opacity-30">KCAL</span></h4>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><i className="fas fa-bolt"></i></div>
                   </div>

                   <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-2">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Prot</p>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter">{nutritionPlan.macros.p}<span className="text-[10px] ml-0.5">g</span></p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Carb</p>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter">{nutritionPlan.macros.c}<span className="text-[10px] ml-0.5">g</span></p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Gord</p>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter">{nutritionPlan.macros.g}<span className="text-[10px] ml-0.5">g</span></p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioridades</p>
                      <div className="flex flex-wrap gap-3">
                         {nutritionPlan.foods.map((food, i) => (
                           <span key={i} className="px-5 py-2.5 bg-white rounded-full text-[10px] font-black text-slate-900 border border-slate-100 uppercase tracking-tight shadow-sm">{food}</span>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Veredito */}
                <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-600/20 space-y-6">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Veredito Rubi</p>
                   <p className="text-lg font-black italic leading-tight tracking-tight">"{nutritionPlan.insight}"</p>
                   <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      <i className="fas fa-glass-water opacity-60"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{nutritionPlan.hydration}</p>
                   </div>
                </div>

                <button 
                  onClick={() => setNutritionPlan(null)}
                  className="w-full text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] py-8 active:text-blue-600 transition-colors"
                >
                   Recalcular Protocolo
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default BioReport;
