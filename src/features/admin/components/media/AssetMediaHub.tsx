
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ImageIcon, 
  Play, 
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Exercise } from '../../../../types';
import { mediaApi } from '../../api/mediaApi';
import { useErrorHandler } from '../../../../hooks/useErrorHandler';
import { cn } from '../../../../lib/utils';
import { supabase } from '../../../../lib/api/supabase';

interface Props {
  exercise: Exercise;
  onUpdate: (updatedExercise: Exercise) => void;
}

export const AssetMediaHub: React.FC<Props> = ({ exercise, onUpdate }) => {
  const { showError, showSuccess } = useErrorHandler();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localData, setLocalData] = useState<Exercise>(exercise);
  const [hasChanges, setHasChanges] = useState(false);
  const isLegacy = !!(exercise.static_frame_url && !exercise.image_url);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'video_url' | 'thumbnail_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${exercise.id}-${field}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(filePath);

      const updates = { [field]: publicUrl };
      if (field === 'image_url') {
        // @ts-ignore - potentially missing statically but we handle it
        updates.static_frame_url = publicUrl;
      }
      setLocalData(prev => ({ 
        ...prev, 
        ...updates,
        // Ao subir imagem principal, espelhamos no legado para garantir que a UI se atualize localmente
        ...(field === 'image_url' ? { static_frame_url: publicUrl } : {})
      }));
      setHasChanges(true);
      showSuccess('Upload concluído', 'A mídia foi carregada. Clique em salvar para confirmar.');
    } catch (err: any) {
      showError("Erro ao subir imagem: " + err.message);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (saving || uploading) return;
    setSaving(true);
    try {
      // Ao clicar em confirmar, marcamos como salvando
      const updatePayload: any = {
        image_url: localData.image_url || null,
        video_url: localData.video_url || null,
        thumbnail_url: localData.thumbnail_url || null,
        updated_at: new Date().toISOString()
      };

      // REGRA DE MIGRAÇÃO: Se estamos salvando algo que tinha static_frame_url, 
      // garantimos que o novo image_url seja enviado para ambos os campos (se existirem)
      // O mediaApi já tenta remover colunas que falham, mas aqui somos explícitos.
      if (exercise.static_frame_url) {
        updatePayload.static_frame_url = updatePayload.image_url;
      }

      console.log('[ASSET_MEDIA_HUB] Initing save operation...', updatePayload);
      await mediaApi.updateExerciseMedia(exercise.id, updatePayload);
      
      // Criamos o objeto atualizado garantindo que refletimos as mudanças para o componente pai
      const updatedExercise = { ...exercise, ...updatePayload };
      if (onUpdate) {
        onUpdate(updatedExercise as Exercise);
      }
      
      setHasChanges(false);
      showSuccess('Mídias Salvas', 'O exercício foi atualizado com as novas mídias.');
    } catch (err: any) {
      showError(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Main Image */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagem Principal (1:1)</h4>
            {localData.image_url && (
              <button 
                onClick={() => { setLocalData({...localData, image_url: '', static_frame_url: ''}); setHasChanges(true); }}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
            {localData.image_url ? (
              <img 
                src={localData.image_url} 
                alt="Preview" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                <ImageIcon size={48} strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Nenhuma imagem</p>
              </div>
            )}
            
            <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest">
                Alterar Imagem
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image_url')} />
            </label>
          </div>
        </div>

        {/* Thumbnail & Meta */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thumbnail (App Cache)</h4>
            <div className="flex items-center gap-6">
               <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 flex-shrink-0 overflow-hidden">
                 {localData.thumbnail_url ? (
                   <img 
                    src={localData.thumbnail_url} 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-300">
                     <ImageIcon size={24} />
                   </div>
                 )}
               </div>
               <div className="flex-1 space-y-3">
                 <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Imagem menor usada em listagens para carregamento instantâneo.</p>
                 <label className="inline-block px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer transition-colors">
                   Upload Thumb
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail_url')} />
                 </label>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vídeo Demonstrativo</h4>
            <div className="flex items-center gap-4">
               <div className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center",
                 localData.video_url ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-300"
               )}>
                 <Play size={20} fill={localData.video_url ? "currentColor" : "none"} />
               </div>
               <input 
                 type="text" 
                 placeholder="Cole a URL do vídeo ou suba um arquivo..."
                 value={localData.video_url || ''}
                 onChange={(e) => { setLocalData({...localData, video_url: e.target.value}); setHasChanges(true); }}
                 className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-xs"
               />
               <label className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">
                  <Save size={16} className="text-slate-500" />
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video_url')} />
               </label>
            </div>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="p-6 bg-blue-600 rounded-3xl text-white flex items-center justify-between shadow-xl animate-pulse">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             <span className="font-black text-[10px] uppercase tracking-[0.2em]">Enviando mídia para o armazenamento seguro...</span>
          </div>
        </div>
      )}

      {/* Legacy Media Warning - matches user report and provides clear instruction */}
      {exercise.static_frame_url && !exercise.image_url && !hasChanges && (
        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Legacy Media Detected</p>
            <p className="text-[10px] font-bold text-amber-800/60 uppercase tracking-tight mt-1 leading-relaxed">
              Este exercício ainda utiliza o campo legado 'static_frame_url'. 
              Para migrar para o novo sistema, altere a imagem acima ou apenas clique em "Confirmar e Salvar Alterações" abaixo.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-10">
        <button
          onClick={handleSave}
          disabled={saving || uploading || (!hasChanges && !isLegacy)}
          className={cn(
            "h-16 px-16 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-3",
            (saving || uploading)
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : (!hasChanges && !isLegacy) 
                ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                : "bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-slate-900/30"
          )}
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (!hasChanges && !isLegacy) ? (
            <CheckCircle2 size={18} />
          ) : (
            <Save size={18} />
          )}
          {saving ? 'Gravando...' : (!hasChanges && !isLegacy) ? 'Mídias up-to-date' : 'Confirmar e Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};
