
import React, { useState } from 'react';
import { X, Loader2, ListChecks, Zap } from 'lucide-react';
import { adminApi } from '../lib/api/adminApi';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { MuscleGroup } from '../types';

interface BulkCreateModalProps {
  muscleGroups: MuscleGroup[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkCreateModal({ muscleGroups, onClose, onSuccess }: BulkCreateModalProps) {
  const { showError, showSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(muscleGroups[0]?.name || '');

  const handleCreate = async () => {
    const rawNames = text.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (rawNames.length === 0) return;

    setLoading(true);
    try {
      const selectedMg = muscleGroups.find(m => m.name === selectedMuscle);
      
      const results = {
        created: 0,
        skipped: 0,
        errors: 0
      };

      // Processar em sequência para verificar duplicatas individualmente de forma segura
      // Ou buscar todos os nomes de uma vez para otimizar
      const { data: existingData } = await adminApi.getAdminData();
      const existingNames = new Set(existingData.exercises.map(e => e.name.toLowerCase().trim()));

      const toCreate = [];
      for (const name of rawNames) {
        const cleanName = name.replace(/\s+/g, ' ');
        if (existingNames.has(cleanName.toLowerCase())) {
          results.skipped++;
          continue;
        }
        
        toCreate.push({
          name: cleanName,
          muscle_group: selectedMuscle,
          muscle_group_id: selectedMg?.id || '',
          type: 'free_weight',
          difficulty_level: 'beginner' as const,
          is_active: true
        });
        existingNames.add(cleanName.toLowerCase()); // Evitar duplicatas dentro do próprio lote
      }

      if (toCreate.length > 0) {
        await adminApi.bulkCreateExercises(toCreate);
        results.created = toCreate.length;
      }

      showSuccess(
        'Processamento Concluído', 
        `${results.created} criados, ${results.skipped} duplicados ignorados.`
      );
      
      if (results.created > 0) onSuccess();
      else onClose();
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Criação em Lote</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <Zap size={10} className="text-yellow-500" /> Multiplique seu acervo instantaneamente
            </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Grupo Muscular Comum</label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.filter(m => !m.parent_id).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuscle(m.name)}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    selectedMuscle === m.name
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                      : "bg-[#F7F8FA] text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lista de Nomes (um por linha)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex:\nSupino Reto\nSupino Inclinado\nCrucifixo"
              className="w-full h-48 p-6 bg-[#F7F8FA] border border-transparent rounded-[2rem] text-slate-900 font-medium outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !text.trim()}
          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <ListChecks size={20} />}
          CRIAR TODOS AGORA
        </button>
      </div>
    </div>
  );
}
