
import React, { useState, useRef } from 'react';
import { UserProfile, ExperienceLevel, Goal, EquipmentPreference } from '../types';
import { authApi } from '../lib/api/authApi';
import { profileApi } from '../lib/api/profileApi';
import { systemApi } from '../lib/api/systemApi';
import BodyMap from './BodyMap';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useErrorHandler } from '../hooks/useErrorHandler';

interface OnboardingProps {
  onComplete: (data: Partial<UserProfile>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { showError, showSuccess } = useErrorHandler();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: '',
    avatar_url: '',
    focus_muscles: [],
    experience_level: ExperienceLevel.BEGINNER,
    goal: Goal.HYPERTROPHY,
    preference: EquipmentPreference.BOTH,
    days_per_week: 3,
    weight: 75,
    height: 175,
    gender: 'Masculino',
    target_weight: 80
  });
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [uploading, setUploading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = localStorage.getItem('coach_cloud_name');
  const uploadPreset = localStorage.getItem('coach_upload_preset');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cloudName || !uploadPreset) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data
      });
      const json = await res.json();
      if (json.secure_url) {
        setFormData({ ...formData, avatar_url: json.secure_url });
        showSuccess('Foto enviada', 'Seu perfil está quase pronto.');
      }
    } catch (err) {
      showError(err);
    } finally {
      setUploading(false);
    }
  };

  const updateFocus = (muscle: string) => {
    const current = formData.focus_muscles || [];
    const next = current.includes(muscle) 
      ? current.filter(m => m !== muscle) 
      : [...current, muscle];
    setFormData({ ...formData, focus_muscles: next });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const notifyAdminOfNewUser = async (userProfile: Partial<UserProfile>, userEmail: string) => {
    const ADMIN_EMAIL = 'marivaldotorres@gmail.com';
    try {
      const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
      if (!apiKey) throw new Error("API Key not found");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              technical_summary: { type: SchemaType.STRING },
              suggested_strategy: { type: SchemaType.STRING },
              email_html: { type: SchemaType.STRING }
            },
            required: ["technical_summary", "suggested_strategy", "email_html"]
          }
        }
      });

      const prompt = `Você é a Rubi, assistente de IA do Coach. Gere um "Dossiê de Ingresso" para o administrador.
      Destinatário: ${ADMIN_EMAIL}
      Atleta: ${userProfile.full_name} (${userEmail})
      Meta: ${userProfile.goal}
      Nível: ${userProfile.experience_level}
      Dados Físicos: ${userProfile.weight}kg, ${userProfile.height}cm.
      Foco Muscular: ${userProfile.focus_muscles?.join(', ')}.
      
      Retorne um JSON com os campos:
      - "technical_summary": (Breve análise técnica do perfil)
      - "suggested_strategy": (Fase de treino inicial recomendada)
      - "email_html": (Corpo de email HTML luxuoso e profissional com os dados acima para o administrador)`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const dossier = JSON.parse(response.text() || '{}');

      // Salvar na fila de notificações para processamento via Webhook
      await systemApi.notifyAdmin({
        user_id: userProfile.id!,
        user_name: userProfile.full_name!,
        user_email: userEmail,
        admin_recipient: ADMIN_EMAIL,
        dossier_content: {
          summary: dossier.technical_summary,
          strategy: dossier.suggested_strategy
        },
        email_body: dossier.email_html,
        status: 'pending_email'
      });

    } catch (err) {
      console.error("Erro ao notificar admin:", err);
    }
  };

  const finish = async () => {
    setIsFinishing(true);
    try {
      const user = await authApi.getUser();
      if (!user) return;

      const finalData = { ...formData, id: user.id, onboarding_completed: true };
      await profileApi.updateProfile(user.id, finalData);

      // Inicia a geração do dossiê e notificação em background (não bloqueia o progresso do usuário)
      notifyAdminOfNewUser(finalData, user.email || 'atleta@email.com').catch(err => {
        console.warn("[Onboarding] Falha silenciosa na notificação administrativa:", err);
      });

      showSuccess('Bem-vindo!', 'Seu perfil foi configurado com sucesso.');
      onComplete(finalData);
    } catch (err: any) {
      showError(err);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6 flex flex-col max-w-md mx-auto">
      <div className="flex gap-2 mb-10">
        {[0, 1, 2, 3, 4, 5, 6].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {step === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Quem é você?</h2>
              <p className="text-slate-400 text-sm">Sua identidade visual no programa.</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-32 h-32 rounded-full bg-white border-4 border-slate-100 overflow-hidden cursor-pointer active:scale-95 transition-all shadow-xl"
              >
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <i className="fas fa-camera text-2xl mb-1"></i>
                    <span className="text-[8px] font-black uppercase">Adicionar</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <i className="fas fa-spinner animate-spin text-blue-600"></i>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />

              <div className="w-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Como devemos te chamar?</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Seu nome ou apelido"
                  className="w-full bg-white p-5 rounded-2xl text-slate-900 font-bold outline-none border border-slate-200 focus:border-blue-600 transition-all text-center shadow-sm"
                />
              </div>
            </div>

            <button 
              onClick={nextStep} 
              disabled={!formData.full_name?.trim()}
              className="w-full py-5 bg-blue-600 rounded-[2rem] font-black text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest disabled:opacity-50 disabled:grayscale transition-all"
            >
              Começar Jornada
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Seus Dados</h2>
              <p className="text-slate-400 text-sm">Precisamos disso para calcular seu progresso.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-2xl mb-4 border border-slate-200 shadow-sm">
              <button onClick={() => setFormData({...formData, gender: 'Masculino'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.gender === 'Masculino' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Masculino</button>
              <button onClick={() => setFormData({...formData, gender: 'Feminino'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.gender === 'Feminino' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Feminino</button>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso Atual (kg)</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFormData({...formData, weight: Math.max(30, (formData.weight || 75) - 1)})} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200">-</button>
                  <div className="flex-1 text-center text-2xl font-black text-slate-900">{formData.weight}</div>
                  <button onClick={() => setFormData({...formData, weight: (formData.weight || 75) + 1})} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200">+</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso Meta (kg)</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFormData({...formData, target_weight: Math.max(30, (formData.target_weight || 80) - 1)})} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200">-</button>
                  <div className="flex-1 text-center text-2xl font-black text-slate-900">{formData.target_weight}</div>
                  <button onClick={() => setFormData({...formData, target_weight: (formData.target_weight || 80) + 1})} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200">+</button>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-5 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-[10px] shadow-sm">Voltar</button>
              <button onClick={nextStep} className="flex-[2] py-5 bg-blue-600 rounded-[2rem] font-black text-white shadow-xl shadow-blue-600/20 uppercase tracking-widest">Próximo</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Qual seu nível?</h2>
              <div className="grid gap-4 mt-8">
                {Object.values(ExperienceLevel).map(level => (
                  <button key={level} onClick={() => { setFormData({...formData, experience_level: level}); nextStep(); }} className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.experience_level === level ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400 shadow-sm'}`}>
                    <span className={`block text-lg font-black uppercase ${formData.experience_level === level ? 'text-blue-600' : 'text-slate-900'}`}>{level}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={prevStep} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">Voltar</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Qual seu objetivo?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.values(Goal).map(goal => (
                <button key={goal} onClick={() => { setFormData({...formData, goal}); nextStep(); }} className={`p-6 rounded-3xl border-2 text-center transition-all ${formData.goal === goal ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400 shadow-sm'}`}>
                  <i className={`fas ${goal === Goal.HYPERTROPHY ? 'fa-dumbbell' : goal === Goal.WEIGHT_LOSS ? 'fa-fire' : 'fa-bolt'} text-2xl mb-3 block text-blue-600`}></i>
                  <span className="block text-[10px] font-black uppercase tracking-widest">{goal}</span>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">Voltar</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">Mapa de Foco</h2>
            </div>
            <div className="flex bg-white p-1 rounded-2xl mb-4 border border-slate-200 shadow-sm">
              <button onClick={() => setBodyView('front')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bodyView === 'front' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Visão Frontal</button>
              <button onClick={() => setBodyView('back')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bodyView === 'back' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Visão Traseira</button>
            </div>
            <BodyMap view={bodyView} selected={formData.focus_muscles || []} onToggle={updateFocus} />
            <div className="flex gap-4">
              <button onClick={prevStep} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase shadow-sm">Voltar</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20">Confirmar</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Quase lá!</h2>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 text-center">
               <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-blue-600 overflow-hidden">
                     {formData.avatar_url ? <img src={formData.avatar_url} className="w-full h-full object-cover" /> : <i className="fas fa-user text-slate-200 mt-6 text-2xl"></i>}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase">{formData.full_name}</h4>
               </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Atual</span>
                <span className="text-xs font-black text-slate-900 uppercase">{formData.weight}kg</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Meta</span>
                <span className="text-xs font-black text-blue-600 uppercase">{formData.target_weight}kg</span>
              </div>
            </div>
            <button 
              onClick={finish} 
              disabled={isFinishing}
              className="w-full py-5 bg-blue-600 rounded-3xl font-black text-white shadow-2xl shadow-blue-600/40 active:scale-95 transition-all uppercase tracking-[0.2em]"
            >
              {isFinishing ? 'GERANDO DOSSIÊ...' : 'MONTAR MEU TREINO'}
            </button>
            <button onClick={prevStep} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">Corrigir Dados</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
