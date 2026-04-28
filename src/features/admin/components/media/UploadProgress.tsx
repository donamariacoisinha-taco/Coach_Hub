
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { UploadProgress as UploadProgressType } from '../../hooks/useMediaUpload';

interface Props {
  uploads: Record<string, UploadProgressType>;
}

export const UploadProgress: React.FC<Props> = ({ uploads }) => {
  const activeUploads = (Object.values(uploads) as UploadProgressType[]).filter(u => u.status !== 'idle');

  if (activeUploads.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-8 z-[100] w-72 space-y-3">
      <AnimatePresence>
        {activeUploads.map((upload) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4"
          >
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              upload.status === 'failed' ? 'bg-red-50 text-red-500' :
              upload.status === 'completed' ? 'bg-green-50 text-green-500' :
              'bg-blue-50 text-blue-500'
            }`}>
              {upload.status === 'compressing' && <Cpu size={18} className="animate-pulse" />}
              {(upload.status === 'uploading') && <Loader2 size={18} className="animate-spin" />}
              {upload.status === 'completed' && <CheckCircle2 size={18} />}
              {upload.status === 'failed' && <AlertCircle size={18} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate">
                {upload.status === 'compressing' ? 'Otimizando...' : 
                 upload.status === 'uploading' ? 'Transmitindo...' : 
                 upload.status === 'completed' ? 'Sucesso ✓' : 'Falha'}
              </p>
              <div className="mt-1.5 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${upload.progress}%` }}
                  className={`h-full ${
                    upload.status === 'failed' ? 'bg-red-500' :
                    upload.status === 'completed' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
