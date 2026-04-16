
import React, { ReactNode } from "react";
import { AlertCircle, Search, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type UIStatus = "loading" | "error" | "empty" | "success";

interface ScreenStateProps {
  status: UIStatus;
  error?: string | null;
  isFetching?: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
}

export const ScreenState: React.FC<ScreenStateProps> = ({
  status,
  error,
  isFetching,
  onRetry,
  skeleton,
  emptyState,
  children,
}) => {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {status === "loading" && !isFetching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {skeleton || (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
                  </div>
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-slate-300 animate-pulse">
                  Carregando...
                </p>
              </div>
            )}
          </motion.div>
        ) : status === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Ops! Algo deu errado
            </h3>
            <p className="mt-2 text-sm text-slate-400 font-medium max-w-[240px]">
              {error || "Não foi possível carregar os dados. Tente novamente."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
              >
                <RefreshCw size={14} />
                Tentar Novamente
              </button>
            )}
          </motion.div>
        ) : status === "empty" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            {emptyState || (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Nenhum resultado
                </h3>
                <p className="mt-2 text-sm text-slate-400 font-medium max-w-[240px]">
                  Não encontramos o que você está procurando.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de Revalidação (Smart Cache) - Non-intrusive badge */}
      <AnimatePresence>
        {isFetching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <Loader2 size={12} className="animate-spin text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
              Sincronizando...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
