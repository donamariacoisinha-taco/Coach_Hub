
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Video, 
  Trash2, 
  Globe, 
  MonitorPlay,
  RotateCcw,
  Loader2
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export const VideoManager: React.FC<Props> = ({ value, onChange, onUpload }) => {
  const [urlInput, setUrlInput] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Direct MP4
    if (url.endsWith('.mp4') || url.includes('supabase.co')) return url;

    return null;
  };

  const embedUrl = getEmbedUrl(value);
  const isDirect = value.endsWith('.mp4') || value.includes('supabase.co');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
        setUrlInput(url);
      } catch (err) {
        console.error('Video upload failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Fonte do Vídeo
            </label>
            <div className="flex bg-slate-50 p-1.5 rounded-[2rem] gap-1.5 border border-slate-100">
               <button className="flex-1 py-4 bg-white rounded-2xl flex items-center justify-center gap-3 shadow-sm">
                  <Globe size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Link Externo</span>
               </button>
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-4 bg-transparent rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:bg-slate-100 transition-all"
               >
                  <Video size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nativo (MP4)</span>
               </button>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
               URL do Vídeo
             </label>
             <div className="relative group">
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={e => {
                    setUrlInput(e.target.value);
                    onChange(e.target.value);
                  }}
                  placeholder="Cole o link do YouTube, Vimeo ou CDN..."
                  className="w-full p-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xs ring-4 ring-slate-950/5 outline-none placeholder:text-slate-500"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-800 rounded-2xl text-blue-400">
                   {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight px-4 leading-relaxed">
               Suporta YouTube Shorts, Vídeos convencionais, Vimeo e links diretos MP4 de alta performance.
             </p>
          </div>

          {value && (
            <button 
              onClick={() => {
                onChange('');
                setUrlInput('');
              }}
              className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all group"
            >
              <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
              Remover Mídia Atual
            </button>
          )}
        </div>

        <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-2xl relative">
          {embedUrl ? (
            isDirect ? (
              <video 
                src={embedUrl} 
                controls 
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe 
                src={embedUrl} 
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-4">
               <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-700">
                  <MonitorPlay size={32} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aguardando vídeo para preview</p>
            </div>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
        accept="video/mp4"
      />
    </div>
  );
};
