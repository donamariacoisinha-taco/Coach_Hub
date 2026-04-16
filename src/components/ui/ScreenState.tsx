
import React from "react";
import { Loader2, AlertCircle, Search, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type UIState = "loading" | "error" | "empty" | "success";

interface ScreenStateProps {
  state: UIState;
  isRefreshing?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  children: React.ReactNode;
}

export const ScreenState: React.FC<ScreenStateProps> = ({
  state,
  isRefreshing,
  onRetry,
  emptyTitle = "Nenhum resultado",
  emptyMessage = "Não encontramos o que você está procurando.",
  errorTitle = "Ops! Algo deu errado",
  errorMessage = "Não foi possível carregar os dados. Tente novamente.",
  children,
}) => {
  return (
    <div className="relative w-full h-full flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {state === "loading" && !isRefreshing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-slate-300 animate-pulse">
              Carregando...
            </p>
          </motion.div>
        ) : state === "error" ? (
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
              {errorTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-400 font-medium max-w-[240px]">
              {errorMessage}
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
        ) : state === "empty" ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {emptyTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-400 font-medium max-w-[240px]">
              {emptyMessage}
            </p>
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

      {/* Overlay de Refreshing */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-50 flex items-center gap-3"
          >
            <Loader2 size={14} className="animate-spin text-slate-900" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Atualizando...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
