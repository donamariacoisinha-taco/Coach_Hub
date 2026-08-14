
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const language = typeof window !== 'undefined' && window.localStorage.getItem('kyron_lang') === 'EN' ? 'EN' : 'PT';
  const text = language === 'EN' ? {
    welcome: 'Welcome', create: 'Create your free account', createHint: 'Start your high-performance journey.',
    loginHint: 'Sign in to keep progressing.', email: 'Email', password: 'Password', forgot: 'Forgot password',
    submitLogin: 'SIGN IN', submitSignup: 'CREATE FREE ACCOUNT', hasAccount: 'I already have an account',
    noAccount: 'Create free account', guest: 'Continue as guest (local mode)', back: 'Back',
    recoveryHint: 'Enter your email to receive recovery instructions.', recoverySubmit: 'SEND INSTRUCTIONS', backToLogin: 'Back to sign in', processing: 'Processing...',
  } : {
    welcome: 'Bem-vindo', create: 'Criar conta grátis', createHint: 'Inicie sua jornada de alta performance.',
    loginHint: 'Entre para continuar evoluindo.', email: 'E-mail', password: 'Senha', forgot: 'Recuperar senha',
    submitLogin: 'ENTRAR', submitSignup: 'CRIAR CONTA GRÁTIS', hasAccount: 'Já possuo uma conta',
    noAccount: 'Criar conta grátis', guest: 'Continuar como convidado (modo local)', back: 'Voltar',
    recoveryHint: 'Insira seu e-mail para receber as instruções de recuperação.', recoverySubmit: 'ENVIAR INSTRUÇÕES', backToLogin: 'Voltar para o login', processing: 'Processando...',
  };

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
        const signupData = await authApi.signUp(email, password);
        console.log('[AUTH][DEBUG] Cadastro bem-sucedido:', signupData);
        
        // Tenta realizar o login imediato para contornar qualquer barreira de verificação
        if (signupData?.session) {
          showSuccess('Cadastro realizado', 'Perfil criado e autenticado com sucesso!');
          navigate('dashboard');
        } else {
          try {
            const loginData = await authApi.signIn(email, password);
            console.log('[AUTH][DEBUG] Auto-login pós-cadastro bem-sucedido:', loginData.user?.email);
            showSuccess('Cadastro realizado', 'Perfil criado com sucesso!');
            navigate('dashboard');
          } catch (loginErr) {
            // Se o servidor do Supabase realmente forçar a verificação de e-mail (configuração no painel):
            showSuccess('Cadastro realizado', 'Sua conta foi criada! Caso necessário, confirme o e-mail enviado.');
            setIsSignUp(false);
          }
        }
      } else {
        const data = await authApi.signIn(email, password);
        console.log('[AUTH][DEBUG] Login bem-sucedido para:', data.user?.email);
        
        // Redirecionamento explícito para garantir transição imediata da UI
        navigate('dashboard');
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_credentials')) {
        setError('E-mail ou senha incorretos. Se ainda não possui uma conta, mude para "Criar Perfil" abaixo ou utilize o modo Convidado para testar instantaneamente!');
      } else if (errMsg.includes('Email not confirmed')) {
        setError('E-mail não confirmado. Por favor, confirme o e-mail enviado.');
      } else if (errMsg.includes('User already registered') || errMsg.toLowerCase().includes('already registered')) {
        setError('Este e-mail já possui um registro ativo no sistema de autenticação (mesmo se o perfil de treino foi excluído pelo administrador). Mudamos o formulário para a tela de Login acima: basta clicar em ENTRAR para reativar seu perfil e iniciar o onboarding do zero!');
        setIsSignUp(false);
      } else {
        setError(errMsg || 'Falha ao realizar autenticação.');
      }
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, digite seu e-mail.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(email);
      showSuccess('Recuperação enviada', 'Instruções para redefinir sua senha foram enviadas para o seu e-mail.');
      setIsForgotPassword(false);
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
      window.location.reload();
    } catch (err: any) {
      setError('Erro ao iniciar modo convidado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col justify-center max-w-md mx-auto relative select-none">
      {onBack && (
        <button type="button" onClick={onBack} className="absolute top-10 left-6 text-slate-400 hover:text-[#0F172A] transition-colors flex items-center gap-1 cursor-pointer">
          <span className="text-[10px] font-bold uppercase tracking-widest">{text.back}</span>
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
           {isForgotPassword ? text.forgot : isSignUp ? text.create : text.welcome}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
           {isForgotPassword 
             ? text.recoveryHint
             : isSignUp 
               ? text.createHint
               : text.loginHint}
        </p>
      </div>

      {isForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{text.email}</label>
            <input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-5 bg-white border border-slate-200/60 rounded-2xl focus:border-slate-400 outline-none transition-all text-slate-900 font-bold shadow-xs"
              placeholder="atleta@exemplo.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? text.processing : text.recoverySubmit}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{text.email}</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-5 bg-white border border-slate-200/60 rounded-2xl focus:border-slate-400 outline-none transition-all text-slate-900 font-bold shadow-xs"
              placeholder="atleta@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="auth-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{text.password}</label>
              {!isSignUp && <button
                type="button"
                onClick={() => { setIsForgotPassword(true); setError(null); }}
                className="text-[#7BA7FF] hover:text-blue-600 text-[10px] font-extrabold uppercase tracking-widest cursor-pointer border-none bg-transparent outline-none"
              >
                {text.forgot}
              </button>}
            </div>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
            {loading ? text.processing : isSignUp ? text.submitSignup : text.submitLogin}
          </button>
        </form>
      )}

      <div className="mt-10 flex flex-col gap-4 text-center">
        {isForgotPassword ? (
          <button
            type="button"
            onClick={() => { setIsForgotPassword(false); setError(null); }}
            className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#0F172A] transition-colors cursor-pointer border-none bg-transparent outline-none"
          >
            {text.backToLogin}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            {isSignUp ? text.hasAccount : text.noAccount}
          </button>
        )}

        <button
          onClick={handleGuestLogin}
          type="button"
          className="w-full py-4 bg-[#EAF2FF] hover:bg-[#D5E6FF] text-[#0F172A] font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xs transition-all cursor-pointer border border-blue-100/30"
        >
          {text.guest}
        </button>
      </div>
    </div>
  );
};

export default Auth;
