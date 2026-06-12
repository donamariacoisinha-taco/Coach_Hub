
import React, { useState } from 'react';
import { authApi } from '../lib/api/authApi';
import { useNavigation } from '../App';
import { useErrorHandler } from '../hooks/useErrorHandler';
import kyronLogo from '../assets/images/kyron_official_logo_1781087891387.png';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[AUTH][DEBUG] Iniciando tentativa de ${isSignUp ? 'cadastro' : 'login'} para: ${email}`);
    
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await authApi.signUp(email, password);
        showSuccess('Cadastro realizado', 'Verifique seu e-mail para ativar a conta.');
      } else {
        const data = await authApi.signIn(email, password);
        
        console.log('[AUTH][DEBUG] Login bem-sucedido para:', data.user?.email);
        
        // Redirecionamento explícito para garantir transição imediata da UI
        navigate('dashboard');
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await authApi.signInAsGuest();
      showSuccess('Modo Convidado Ativado', 'Carregando interface de alta performance offline...');
      // Force instant navigation to ensure UI handles state refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError('Erro ao iniciar modo convidado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col justify-center max-w-md mx-auto relative select-none">
      {onBack && (
        <button onClick={onBack} className="absolute top-10 left-6 text-slate-400 hover:text-[#0F172A] transition-colors flex items-center gap-1 cursor-pointer">
          <span className="text-[10px] font-bold uppercase tracking-widest">Voltar</span>
        </button>
      )}

      <div className="text-center mb-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#7BA7FF]/15 via-white/85 to-[#818CF8]/15 backdrop-blur-md border border-white/40 rounded-xl flex items-center justify-center overflow-hidden shadow-xs p-0 shrink-0">
            <img src={kyronLogo} alt="KYRON OS" className="w-[100%] h-[100%] object-contain scale-[1.75] transform" referrerPolicy="no-referrer" />
          </div>
          <span className="text-base font-black uppercase tracking-[0.25em] text-slate-900 pt-0.5">KYRON OS</span>
        </div>
        <h2 className="text-3xl font-[1000] tracking-tight text-slate-900 mb-2 uppercase">
           {isSignUp ? 'Criar Perfil' : 'Bem-vindo'}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
           {isSignUp ? 'Inicie sua jornada de alta performance.' : 'Entre para continuar evoluindo.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-5 bg-white border border-slate-200/60 rounded-2xl focus:border-slate-400 outline-none transition-all text-slate-900 font-bold shadow-xs"
            placeholder="atleta@exemplo.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 bg-white border border-slate-200/60 rounded-2xl focus:border-slate-400 outline-none transition-all text-slate-900 font-bold shadow-xs"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-center"
        >
          {loading ? 'Processando...' : isSignUp ? 'FORJAR MEU ACESSO' : 'ENTRAR NO DASHBOARD'}
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-4 text-center">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          {isSignUp ? 'Já possuo uma conta' : 'Não possuo cadastro'}
        </button>

        <button
          onClick={handleGuestLogin}
          type="button"
          className="w-full py-4 bg-[#EAF2FF] hover:bg-[#D5E6FF] text-[#0F172A] font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xs transition-all cursor-pointer border border-blue-100/30"
        >
          Entrar como Convidado (Modo Offline)
        </button>
      </div>
    </div>
  );
};

export default Auth;
