import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Image, Sparkles, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export function ProgressPhotoSystem() {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Allow standard drag and slide movement
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleMove(e.clientX);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-violet-50 text-violet-500 p-2.5 rounded-xl">
            <Image size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Fotos de Evolução</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronização visual antes e depois</p>
          </div>
        </div>
        <span className="text-[8px] font-black bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
          Premium Fit
        </span>
      </div>

      {/* Before / After Slider Frame */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-64 rounded-3xl overflow-hidden select-none cursor-ew-resize border border-slate-50 bg-slate-900 group"
      >
        {/* 'After' Body Image (Always in Background) */}
        <img 
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop" 
          alt="After Workout Definition"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute right-4 bottom-4 bg-slate-950/40 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md">
          Depois
        </div>

        {/* 'Before' Body Image (Clipped dynamically based on slider position) */}
        <div 
          className="absolute inset-y-0 left-0 overflow-hidden" 
          style={{ width: `${sliderPos}%` }}
        >
          <img 
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop" 
            alt="Before Workout"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none max-w-none filter grayscale saturate-[0.8]"
            style={{ width: containerRef.current?.getBoundingClientRect().width || 400, height: '100%' }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute left-4 bottom-4 bg-slate-950/40 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md">
            Antes
          </div>
        </div>

        {/* Tactile Slider Handle */}
        <div 
          className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-25"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-lg active:scale-110 transition-transform">
            <Sliders size={12} className="text-slate-500" />
          </div>
        </div>
      </div>

      <div className="bg-violet-50/50 rounded-2xl p-4 border border-violet-100 flex items-start gap-3">
        <Sparkles size={16} className="text-violet-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[10px] font-bold text-violet-600 leading-relaxed">
          Arraste o botão central para comparar de forma tátil as melhorias estéticas de postura e composição muscular.
        </p>
      </div>
    </motion.div>
  );
}
