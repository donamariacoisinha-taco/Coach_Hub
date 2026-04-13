
import React, { useState, useEffect } from 'react';

const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Detecta se já está em modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (!isStandalone) {
      const ua = window.navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      
      if (isIOS) setPlatform('ios');
      else if (isAndroid) setPlatform('android');
      
      // Só mostra se for mobile e não estiver instalado
      if (isIOS || isAndroid) {
        // Delay para não atrapalhar o login imediato
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[2000] animate-in slide-in-from-bottom duration-700">
      <div className="bg-slate-900 border border-blue-500/30 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <i className="fas fa-mobile-screen-button text-white"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Instalar App Rubi</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
              Remova a barra de endereço e treine com experiência total de tela cheia.
            </p>
          </div>
          <button onClick={() => setShow(false)} className="text-slate-500 p-1"><i className="fas fa-times"></i></button>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
          {platform === 'ios' ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white uppercase">Passos:</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-300">
                <span>Clique em</span>
                <i className="fas fa-share-square text-blue-500 text-xs"></i>
                <span>depois em</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-white text-[8px]">Tela de Início</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white uppercase">Passos:</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-300">
                <span>Clique nos</span>
                <i className="fas fa-ellipsis-v text-blue-500 text-xs"></i>
                <span>depois em</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-white text-[8px]">Instalar Aplicativo</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
