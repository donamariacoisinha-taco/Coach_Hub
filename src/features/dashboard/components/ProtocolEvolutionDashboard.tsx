import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitMerge, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  HelpCircle, 
  Info, 
  Clock, 
  Zap, 
  CornerDownRight, 
  History,
  TrendingUp,
  Brain,
  ChevronRight
} from 'lucide-react';
import { systemTemplatesApi, SystemTemplate } from '../../../lib/api/systemTemplatesApi';
import { WorkoutFolder } from '../../../types';
import { authApi } from '../../../lib/api/authApi';

interface ProtocolEvolutionDashboardProps {
  folders: WorkoutFolder[];
  onRefresh: () => void;
}

export const ProtocolEvolutionDashboard: React.FC<ProtocolEvolutionDashboardProps> = ({ 
  folders, 
  onRefresh 
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [trackedFolders, setTrackedFolders] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mergingFolderId, setMergingFolderId] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<any | null>(null);
  const [mergeMode, setMergeMode] = useState<'safe' | 'overwrite' | 'keep'>('safe');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load tracking information
  useEffect(() => {
    loadTracking();
  }, [folders]);

  const loadTracking = async () => {
    setLoading(true);
    try {
      const u = await authApi.getUser();
      if (!u) return;
      setUserId(u.id);

      // Get current local tracking registry
      const tracking = systemTemplatesApi.getUserTemplateTracking(u.id);
      const globalTemplates = await systemTemplatesApi.getTemplates();
      
      const computedTracked: any[] = [];
      
      folders.forEach(f => {
        const trackedInfo = tracking[f.id];
        if (trackedInfo) {
          const matchingTemplate = globalTemplates.find(t => t.id === trackedInfo.templateId);
          computedTracked.push({
            folderId: f.id,
            folderName: f.name,
            templateId: trackedInfo.templateId,
            currentVersion: trackedInfo.version,
            latestTemplate: matchingTemplate,
            origin: matchingTemplate?.created_by || 'system',
            updatedAt: matchingTemplate?.updated_at || new Date().toISOString()
          });
        }
      });

      setTrackedFolders(computedTracked);

      // Detect pending updates
      const detectedUpdates = await systemTemplatesApi.detectUpdates(u.id, folders);
      setUpdates(detectedUpdates);

    } catch (e) {
      console.error('Error loading template evolution tracking:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerUpdate = (update: any) => {
    setSelectedUpdate(update);
    setMergeMode('safe');
  };

  const executeMerge = async () => {
    if (!userId || !selectedUpdate) return;
    setMergingFolderId(selectedUpdate.folderId);
    try {
      const success = await systemTemplatesApi.mergeTemplate(
        userId,
        selectedUpdate.folderId,
        selectedUpdate.templateId,
        selectedUpdate.latestVersion,
        mergeMode
      );

      if (success) {
        setSuccessMsg(
          mergeMode === 'safe' 
            ? 'Sincronização concluída com sucesso! Parâmetros médicos atualizados sem alterar suas anotações customizadas.'
            : mergeMode === 'overwrite'
              ? 'Protocolo redefinido para o novo padrão original com sucesso!'
              : 'Protocolo marcado como atualizado sem realizar modificações.'
        );
        setSelectedUpdate(null);
        await loadTracking();
        onRefresh(); // Trigger parent dashboard re-revalidation
      }
    } catch (e) {
      console.error('Error executing merge:', e);
      alert('Erro ao tentar sincronizar o treino. Por favor, tente novamente.');
    } finally {
      setMergingFolderId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 text-center flex flex-col items-center justify-center space-y-3">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Acessando Registro de Versões...</span>
      </div>
    );
  }

  // Generate dynamic Kyron insights based on available updates
  const hasUpdates = updates.length > 0;
  
  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SYSTEM TEMPLATES EVOLUTION SUMMARY PANEL */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden">
        {/* Subtle glowing ambient circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] rounded-full blur-xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7BA7FF]/10 text-[#7BA7FF] rounded-2xl flex items-center justify-center shrink-0">
              <GitMerge size={20} className={hasUpdates ? "animate-pulse" : ""} />
            </div>
            <div>
              <h4 className="text-[11px] font-[1000] text-slate-800 uppercase tracking-[0.15em] leading-none">
                Evolução Científica dos Protocolos
              </h4>
              <p className="text-[9px] font-black text-[#5C8CFF] uppercase tracking-widest block mt-1.5 leading-none">
                Versionamento & Biometria Inteligente
              </p>
            </div>
          </div>
          
          {hasUpdates && (
            <motion.div 
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-indigo-50 border border-indigo-100 rounded-xl py-2 px-3 flex items-center gap-2 shrink-0 select-none text-[9.5px]"
            >
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shrink-0" />
              <span className="text-indigo-600 font-black uppercase tracking-wider">
                {updates.length} Ajuste Clínico Disponível
              </span>
            </motion.div>
          )}
        </div>

        {/* Checked folders grid catalog */}
        {trackedFolders.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-400 font-medium">
            Seu treino atual não está vinculado a nenhum modelo do sistema (protocolos criados vazios).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trackedFolders.map(tf => {
              const matchingUpdate = updates.find(u => u.folderId === tf.folderId);
              
              return (
                <div 
                  key={tf.folderId}
                  className={`p-5 rounded-2xl border transition duration-300 relative flex flex-col justify-between ${matchingUpdate ? 'border-indigo-100 bg-indigo-500/[0.012]' : 'border-slate-50 bg-[#FBFBFC]/40'}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-widest">
                        Pasta: {tf.folderName}
                      </span>
                      {tf.origin === 'rubi_ai' ? (
                        <span className="text-[7.5px] font-[1000] text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          Rubi AI Target
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-[1000] text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          Equipe Médica
                        </span>
                      )}
                    </div>

                    <h5 className="text-[14px] font-black leading-none text-slate-800 uppercase tracking-tight">
                      {tf.latestTemplate?.name || tf.folderName}
                    </h5>

                    {/* Meta Info values */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-white border border-slate-100 rounded-xl p-2.5">
                      <div className="flex flex-col">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Versão Atual</span>
                        <span className="text-xs font-black text-slate-700 leading-none mt-1">v{tf.currentVersion}</span>
                      </div>
                      <div className="flex flex-col border-x border-slate-100">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Mais Recente</span>
                        <span className={`text-xs font-black leading-none mt-1 ${matchingUpdate ? 'text-[#5C8CFF]' : 'text-slate-700'}`}>
                          v{tf.latestTemplate?.version || tf.currentVersion}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Melhorias</span>
                        <span className="text-xs font-black text-emerald-600 leading-none mt-1">
                          +{tf.latestTemplate?.version_history?.reduce((acc: number, curr: any) => acc + (curr.changes?.length || 0), 0) || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-50/70 flex items-center justify-between gap-4">
                    <span className="text-[7px] font-bold text-slate-350 uppercase flex items-center gap-1 shrink-0">
                      <Clock size={9} /> Sincronizado: {new Date(tf.updatedAt).toLocaleDateString()}
                    </span>
                    
                    {matchingUpdate ? (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTriggerUpdate(matchingUpdate)}
                        className="px-3.5 py-2 bg-indigo-600 text-white font-black text-[8.5px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1 shrink-0"
                      >
                        <Zap size={10} className="fill-white" /> Atualizar
                      </motion.button>
                    ) : (
                      <span className="text-[7.5px] font-[1000] text-emerald-500 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={10} /> vPristine Original
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: KYRON OS DYNAMIC INTELLIGENCE INSIGHTS */}
      <div className="bg-gradient-to-br from-[#121926] to-[#0A0F19] text-white rounded-[2.2rem] p-7 shadow-xl shadow-slate-900/10 relative overflow-hidden">
        {/* Abstract cyber grid decorative accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#7BA7FF]/10 rounded-full blur-[40px] pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#7BA7FF]">
              <Brain size={16} className="animate-pulse" />
            </div>
            <span className="uppercase tracking-[0.25em] text-[10px] font-black text-[#7BA7FF] block">
              Kyron Intelligence Insights
            </span>
          </div>

          <div className="space-y-3 pl-2 border-l-2 border-blue-500/35">
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              {hasUpdates ? (
                <>
                  "Olá, Atleta! Identificamos que seu protocolo <strong className="text-white uppercase">{updates[0].templateName}</strong> recebeu refinamentos biomecânicos e científicos (<strong className="text-[#7BA7FF]">v{updates[0].latestVersion}</strong>). A equipe médica do Kyron ajustou cadências e atualizou baselines para otimizar os seus ganhos de força e proteger sua articulação."
                </>
              ) : (
                <>
                  "Sua consistência destravou o fluxo pristine do <strong className="text-white uppercase">KYRON OS</strong>. Seu protocolo está rodando na versão ideal e os vetores de fadiga indicam que você está pronto para absorver novas cargas progressivas."
                </>
              )}
            </p>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-400 tracking-wider">
              <span>● BIOMETRIC MATRIX ACTIVE</span>
              <span>● ALIGN WITH MEDICAL BLUEPRINTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION WORKFLOW MODAL FOR SAFE MERGE & CONFLICT RESOLUTION */}
      <AnimatePresence>
        {selectedUpdate && (
          <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedUpdate(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" 
            />

            <motion.div 
              initial={{ y: "100%", scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: "100%", scale: 0.95 }} 
              className="w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-3xl p-8 space-y-6 shadow-2xl relative z-10 border border-slate-100 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex gap-4 items-start border-b border-slate-50 pb-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <RefreshCw size={24} className="animate-spin text-indigo-600" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronização Adaptativa</span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mt-1">Sincronizar Protocolo {selectedUpdate.templateName}</h3>
                  <p className="text-slate-450 text-[10px] font-bold mt-1.5 leading-none">Melhoria de v{selectedUpdate.currentVersion} para v{selectedUpdate.latestVersion}</p>
                </div>
              </div>

              {/* Smart Update Preview: What changed list */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block pl-1">Métricas de Sincronização / O Que Mudou?</span>
                <div className="bg-slate-50 rounded-2xl p-4.5 space-y-2.5 border border-slate-100">
                  {selectedUpdate.changes && selectedUpdate.changes.length > 0 ? (
                    selectedUpdate.changes.map((ch: string, cIdx: number) => (
                      <div key={cIdx} className="flex gap-2 text-xs text-slate-600 font-semibold leading-relaxed">
                        <CornerDownRight size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                        <span>{ch}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">Reestruturação clínica e biomecânica do treino geral.</p>
                  )}
                </div>
              </div>

              {/* Personalization Protection conflict choices */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block pl-1 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-500" /> Escolha como Resolver Conflitos
                </span>
                
                <div className="space-y-2.5">
                  {/* Option 1: Safe Merge */}
                  <div 
                    onClick={() => setMergeMode('safe')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex gap-3.5 ${mergeMode === 'safe' ? 'border-indigo-600 bg-indigo-500/[0.015]' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      {mergeMode === 'safe' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-none">Keep Personalization (Safe Merge)</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1.5">
                        Preserva suas anotações, cargas customizadas e novos exercícios adicionados. Apenas insere novos exercícios e aplica otimizações biomecânicas da equipe médica.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Overwrite Reset to default */}
                  <div 
                    onClick={() => setMergeMode('overwrite')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex gap-3.5 ${mergeMode === 'overwrite' ? 'border-indigo-600 bg-indigo-500/[0.015]' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      {mergeMode === 'overwrite' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-none">Reset to Default (Pristine Wipe)</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1.5">
                        Zera todas as suas customizações nesta pasta e formata as fichas exatamente conforme o padrão original v{selectedUpdate.latestVersion}. Ideal se mudou de academia ou cometeu erros de treino.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Decline / Keep */}
                  <div 
                    onClick={() => setMergeMode('keep')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex gap-3.5 ${mergeMode === 'keep' ? 'border-indigo-600 bg-indigo-500/[0.015]' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      {mergeMode === 'keep' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-none">Decline Update (Keep Custom)</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1.5">
                        Garante o congelamento do seu treino atual sem qualquer alteração. O sistema apenas deixará de alertar atualizações futuras deste modelo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm submit values */}
              <div className="flex flex-col gap-3.5 pt-3">
                <button
                  type="button"
                  disabled={mergingFolderId !== null}
                  onClick={executeMerge}
                  className="w-full py-4.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {mergingFolderId !== null ? <RefreshCw size={14} className="animate-spin" /> : 'Confirmar Atualização'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUpdate(null)}
                  className="w-full py-2 text-slate-350 hover:text-slate-700 font-extrabold text-[10px] uppercase tracking-widest text-center"
                >
                  Continuar com o Treino Atual
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS ALERTS DECORATION */}
      <AnimatePresence>
        {successMsg && (
          <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[1800]">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex gap-3.5 text-left text-white"
            >
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sucesso</span>
                <p className="text-xs font-bold leading-normal text-slate-200 mt-1">{successMsg}</p>
                <button 
                  onClick={() => setSuccessMsg(null)}
                  className="text-[9px] font-black text-slate-400 hover:text-white uppercase mt-2.5 underline block"
                >
                  Ok, entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
