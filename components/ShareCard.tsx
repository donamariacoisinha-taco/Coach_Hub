
import React from 'react';
import { WorkoutHistory } from '../types';

interface ShareCardProps {
  workout: Partial<WorkoutHistory> & { totalTonnage?: number, topExercise?: string };
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ workout, onClose }) => {
  const dateStr = new Date(workout.completed_at || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const tonnageStr = workout.totalTonnage ? (workout.totalTonnage >= 1000 ? `${(workout.totalTonnage / 1000).toFixed(1)}T` : `${workout.totalTonnage}KG`) : '--';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Treino Rubi: ${workout.category_name}`,
          text: `Finalizei o treino "${workout.category_name}" com Rubi AI! Movimentei ${tonnageStr} de carga total hoje. 🚀 #RubiAI #FitnessElite`,
          url: window.location.href
        });
      } catch (err) { console.log('Share cancelado'); }
    } else {
      alert("Tire um print da tela para compartilhar sua evolução!");
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="absolute top-6 right-6 z-[5001]">
         <button onClick={onClose} className="w-12 h-12 bg-slate-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
            <i className="fas fa-times"></i>
         </button>
      </div>

      {/* CARD 9:16 AREA */}
      <div id="capture-area" className="relative w-full max-w-[360px] aspect-[9/16] bg-slate-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col p-10">
         {/* Background Visual Elements */}
         <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl opacity-50"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[50%] bg-gradient-to-tl from-indigo-900/40 to-transparent blur-3xl opacity-50"></div>
         
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

         {/* Header */}
         <header className="relative z-10 mb-auto">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <i className="fas fa-gem"></i>
               </div>
               <div>
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] leading-none mb-1">Rubi Neural Coach</p>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Status da Sessão</h4>
               </div>
            </div>

            <div className="space-y-2">
               <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.85]">{workout.category_name}</h2>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dateStr}</p>
            </div>
         </header>

         {/* Stats Grid */}
         <div className="relative z-10 space-y-12 mb-16">
            <div>
               <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3">Volume de Trabalho</p>
               <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-white tracking-tighter leading-none">{tonnageStr}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Duração</p>
                  <p className="text-2xl font-black text-white">{workout.duration_minutes || '--'}m</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Exercícios</p>
                  <p className="text-2xl font-black text-white">{workout.exercises_count || '--'}</p>
               </div>
            </div>

            {workout.topExercise && (
               <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Destaque de Performance</p>
                  <p className="text-sm font-bold text-white uppercase">{workout.topExercise}</p>
               </div>
            )}
         </div>

         {/* Footer */}
         <footer className="relative z-10 pt-8 border-t border-white/10 flex justify-between items-end">
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Membro Elite</p>
               <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocolo de Força</p>
            </div>
            <div className="w-12 h-12 border-2 border-white/10 rounded-xl flex items-center justify-center text-slate-700">
               <i className="fas fa-qrcode text-xl opacity-20"></i>
            </div>
         </footer>

         {/* Scan Line Effect */}
         <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-scan"></div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[360px] mt-10 space-y-4">
         <button 
           onClick={handleShare}
           className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-white uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
         >
            <i className="fas fa-share-alt"></i> Compartilhar Evolução
         </button>
         <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Tire um print para postar no Instagram</p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShareCard;
