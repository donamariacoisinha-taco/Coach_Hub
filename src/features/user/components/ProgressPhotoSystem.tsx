import React from 'react';
import { motion } from 'motion/react';
import { Camera, Image } from 'lucide-react';

export function ProgressPhotoSystem() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="bg-violet-50 text-violet-500 p-2.5 rounded-xl">
          <Image size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Fotos de Evolução</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comparação antes e depois</p>
        </div>
      </div>

      <div className="py-10 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed flex flex-col items-center gap-3">
        <Camera size={22} className="text-slate-300" />
        <p className="max-w-[220px] leading-relaxed">
          <strong className="text-slate-700 font-bold">Nenhuma foto ainda.</strong> Quando o registro de fotos de progresso estiver disponível, sua comparação real de antes e depois aparecerá aqui.
        </p>
      </div>
    </motion.div>
  );
}
