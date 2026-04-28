import React from 'react';
import { Exercise } from '../../../../types';
import { MoveRight, Image as ImageIcon, Play, HelpCircle } from 'lucide-react';

interface Props {
  original: Exercise;
  suggested: Partial<Exercise>;
}

export const MediaReviewCompare: React.FC<Props> = ({ original, suggested }) => {
  return (
    <div className="grid grid-cols-2 gap-8 py-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">1</div>
           <h4 className="text-[10px] font-black uppercase tracking-widest">Estado Atual</h4>
        </div>
        <div className="aspect-video bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          {original.image_url ? (
            <img src={original.image_url} alt="" className="w-full h-full object-cover opacity-50 grayscale" referrerPolicy="no-referrer" />
          ) : (
            <div className="space-y-4">
              <ImageIcon className="mx-auto text-slate-200" size={32} />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sem Mídia</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-500">
           <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold">2</div>
           <h4 className="text-[10px] font-black uppercase tracking-widest">Nova Proposta IA</h4>
        </div>
        <div className="aspect-video bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-200 flex flex-col items-center justify-center overflow-hidden relative shadow-2xl shadow-indigo-200/50">
          {suggested.image_url ? (
            <img src={suggested.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="space-y-2">
              <Sparkles className="mx-auto text-indigo-300 animate-pulse" size={32} />
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Aguardando Seleção</p>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            {suggested.video_url && (
              <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                <Play size={10} fill="currentColor" /> Vídeo OK
              </div>
            )}
             {suggested.thumbnail_url && (
              <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                <ImageIcon size={10} /> Thumb OK
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sparkles: React.FC<any> = (props) => (
  <svg 
    {...props}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
  >
    <path d="m12 3 1.912 4.913L19 12l-5.088 4.087L12 21l-1.912-4.913L5 12l5.088-4.087L12 3Z"/>
    <path d="m19 6-3 3"/>
    <path d="m5 6 3 3"/>
    <path d="m5 18 3-3"/>
    <path d="m19 18-3-3"/>
  </svg>
);
