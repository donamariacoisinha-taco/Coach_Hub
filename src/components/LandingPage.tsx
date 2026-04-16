
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <i className="fas fa-gem"></i>
          </div>
          <span className="text-xl font-black uppercase tracking-tighter text-slate-900">Coach Rubi</span>
        </div>
        <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Acessar Conta</button>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6">
        {/* Background visual element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="reveal inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Novo: IA Biomecânica Ativa</span>
          </div>
          
          <h1 className="reveal delay-1 text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900">
            Sua evolução não cabe em um <span className="text-blue-600">papel.</span>
          </h1>
          
          <p className="reveal delay-2 text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Monte sua ficha personalizada em segundos e deixe que a Rubi monitore sua força e progressão de carga direto no celular.
          </p>
          
          <div className="reveal delay-3 flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={onStart}
              className="w-full md:w-auto px-12 py-6 bg-blue-600 rounded-3xl font-black text-white uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              Criar meu treino agora
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grátis para Atletas de Elite</p>
          </div>
        </div>

        {/* Mockup Preview */}
        <div className="reveal delay-3 mt-20 max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-[5rem] group-hover:bg-blue-600/15 transition-all"></div>
          <div className="relative bg-white border border-slate-200 rounded-[3rem] aspect-video overflow-hidden shadow-2xl">
             <img 
               src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200" 
               className="w-full h-full object-cover opacity-20 mix-blend-luminosity" 
               alt="Gym Atmosphere" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent flex items-end p-12">
                <div className="flex gap-10">
                   <div className="text-left">
                      <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Performance</p>
                      <p className="text-3xl font-black text-slate-900">Curva de 1RM</p>
                   </div>
                   <div className="text-left">
                      <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Sessão</p>
                      <p className="text-3xl font-black text-slate-900">Timer Adaptativo</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM + SOLUTION */}
      <section className="py-24 px-6 bg-white/50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight text-slate-900">
                A ficha da academia parou no <span className="text-slate-300">século passado.</span>
              </h2>
              <div className="space-y-6">
                 {[
                   { icon: 'fa-file-lines', title: 'Chega de papéis perdidos', text: 'Sua ficha não amassa, não molha e não fica em casa.' },
                   { icon: 'fa-brain', title: 'IA que aprende com você', text: 'Rubi analisa seu RPE e sugere quando é hora de subir a carga.' },
                   { icon: 'fa-chart-line', title: 'Visão real do progresso', text: 'Gráficos de tonelagem e estimativa de 1RM automáticos.' }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm shrink-0">
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div>
                         <h4 className="font-black text-slate-900 uppercase text-sm">{item.title}</h4>
                         <p className="text-slate-500 text-sm mt-1">{item.text}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-10">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <i className="fas fa-bolt text-3xl text-orange-500 mb-4"></i>
                    <p className="text-2xl font-black text-slate-900">94%</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Mais consistência</p>
                 </div>
                 <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl">
                    <i className="fas fa-heart-pulse text-3xl text-white mb-4"></i>
                    <p className="text-2xl font-black text-white">Zero</p>
                    <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest mt-1">Treinos esquecidos</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <i className="fas fa-dumbbell text-3xl text-blue-600 mb-4"></i>
                    <p className="text-2xl font-black text-slate-900">Elite</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Nível de atleta</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <i className="fas fa-mobile-screen text-3xl text-slate-400 mb-4"></i>
                    <p className="text-2xl font-black text-slate-900">PWA</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Instalação Direta</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 4. STEPS */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">O Caminho para a <span className="text-blue-600">Força</span></h2>
          <p className="text-slate-400 text-sm mt-4 uppercase font-bold tracking-widest">Simplificado ao extremo</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { step: '01', title: 'Dossiê Inicial', text: 'Conte para a Rubi suas metas, peso e pontos de foco no corpo.' },
             { step: '02', title: 'Forje sua Ficha', text: 'Crie treinos personalizados ou peça uma sugestão baseada em ciência.' },
             { step: '03', title: 'Esmague e Registre', text: 'Treine com o player ativo e veja sua evolução ser documentada em tempo real.' }
           ].map((item, i) => (
             <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 relative group hover:border-blue-200 transition-all shadow-sm">
                <span className="text-6xl font-black text-slate-50 absolute top-8 right-8 group-hover:text-blue-50 transition-colors">{item.step}</span>
                <h4 className="text-xl font-black text-slate-900 uppercase mb-4 relative z-10">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed relative z-10">{item.text}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 5. FINAL CTA (Social Proof Simulation) */}
      <section className="py-32 px-6 relative">
         <div className="max-w-3xl mx-auto bg-blue-600 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/40">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
               Pronto para treinar como um <span className="text-blue-900/40">profissional?</span>
            </h2>
            <p className="text-blue-100 text-sm md:text-lg mb-12 font-medium opacity-80">Junte-se aos milhares de atletas que abandonaram o papel e escolheram a inteligência Rubi.</p>
            <button 
              onClick={onStart}
              className="w-full md:w-auto px-16 py-7 bg-white text-blue-600 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
               Começar Jornada Grátis
            </button>
         </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><i className="fas fa-gem text-xs"></i></div>
               <span className="text-sm font-black uppercase tracking-tighter text-slate-400">Rubi Digital © 2025</span>
            </div>
            <div className="flex gap-8">
               <a href="#" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600">Instagram</a>
               <a href="#" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600">Suporte</a>
               <a href="#" className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600">Termos</a>
            </div>
         </div>
      </footer>

    </div>
  );
};

export default LandingPage;
