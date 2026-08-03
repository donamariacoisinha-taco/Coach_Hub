import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../lib/api/authApi';
import { useNavigation } from '../App';
import { useErrorHandler } from '../hooks/useErrorHandler';
import kyronLogo from '../assets/images/kyron_official_logo_1781087891387.png';

interface AuthProps {
  onBack?: () => void;
}

type AuthMode = 'signup' | 'login';

const getInitialMode = (): AuthMode => {
  if (typeof window === 'undefined') return 'signup';
  const requestedMode = window.history.state?.params?.mode;
  return requestedMode === 'login' ? 'login' : 'signup';
};

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const { navigate } = useNavigation();
  const { showError, showSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';
  const passwordIsValid = password.length >= 6;

  const heading = useMemo(() => {
    if (isForgotPassword) return 'Recuperar senha';
    return isSignUp ? 'Crie sua conta grátis' : 'Continue sua evolução';
  }, [isForgotPassword, isSignUp]);

  const subheading = useMemo(() => {
    if (isForgotPassword) return 'Enviaremos as instruções de recuperação para o seu e-mail.';
    return isSignUp
      ? 'Depois do cadastro, o Kyron monta seu primeiro plano adaptativo em poucos minutos.'
      : 'Entre para acessar seu plano, histórico e próxima sessão.';
  }, [isForgotPassword, isSignUp]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setIsForgotPassword(false);
    setError(null);
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }

    if (isSignUp && !passwordIsValid) {
      setError('Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const signupData = await authApi.signUp(email.trim(), password);

        if (signupData?.session) {
          showSuccess('Conta criada', 'Agora vamos personalizar seu primeiro treino.');
          navigate('onboarding');
          return;
        }

        try {
          await authApi.signIn(email.trim(), password);
          showSuccess('Conta criada', 'Agora vamos personalizar seu primeiro treino.');
          navigate('onboarding');
        } catch {
          showSuccess(
            'Conta criada',
            'Confirme o e-mail enviado e depois entre para concluir seu perfil.'
          );
          changeMode('login');
        }
      } else {
        await authApi.signIn(email.trim(), password);
        navigate('dashboard');
      }
    } catch (err: any) {
      const errMsg = err?.message || '';

      if (errMsg.includes('Invalid login credentials') || errMsg.includes('invalid_credentials')) {
        setError('E-mail ou senha incorretos. Confira os dados ou crie uma conta.');
      } else if (errMsg.includes('Email not confirmed')) {
        setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
      } else if (
        errMsg.includes('User already registered') ||
        errMsg.toLowerCase().includes('already registered')
      ) {
        setError('Este e-mail já possui conta. Selecione “Entrar” para continuar.');
        setMode('login');
      } else {
        setError(errMsg || 'Não foi possível concluir a autenticação.');
      }

      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Digite seu e-mail para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(email.trim());
      showSuccess('Recuperação enviada', 'Confira seu e-mail para redefinir a senha.');
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar a recuperação.');
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await authApi.signInAsGuest();
      showSuccess('Modo convidado ativado', 'Abrindo uma demonstração offline do Kyron.');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError('Não foi possível iniciar o modo convidado.');
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-5 py-8 text-slate-900 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#7BA7FF]/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-[#818CF8]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
        )}

        <div className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-tr from-[#7BA7FF]/15 via-white to-[#818CF8]/15 shadow-sm">
                <img
                  src={kyronLogo}
                  alt="KYRON OS"
                  className="h-full w-full scale-[1.75] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.24em] text-slate-900">KYRON OS</span>
            </div>

            {!isForgotPassword && (
              <div className="mb-6 grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100/70 p-1">
                <button
                  type="button"
                  onClick={() => changeMode('signup')}
                  className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    isSignUp
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('login')}
                  className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    !isSignUp
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Entrar
                </button>
              </div>
            )}

            <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950">{heading}</h1>
            <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-500">{subheading}</p>
          </div>

          {isSignUp && !isForgotPassword && (
            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-[#F3F7FF] p-3">
              {[
                ['1', 'Criar conta'],
                ['2', 'Personalizar'],
                ['3', 'Treinar'],
              ].map(([number, label]) => (
                <div key={number} className="text-center">
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-black text-blue-600 shadow-sm">
                    {number}
                  </span>
                  <span className="mt-1.5 block text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div
              className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-xs font-bold leading-5 text-red-600"
              role="alert"
            >
              {error}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Seu e-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#7BA7FF] focus:ring-4 focus:ring-[#7BA7FF]/10"
                    placeholder="atleta@exemplo.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-[11px] font-black uppercase tracking-[0.17em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
                {!loading && <ArrowRight size={15} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="w-full text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition hover:text-slate-800"
              >
                Voltar para entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Seu e-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#7BA7FF] focus:ring-4 focus:ring-[#7BA7FF]/10"
                    placeholder="atleta@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between gap-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Senha
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                      className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-500 transition hover:text-blue-700"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={isSignUp ? 6 : undefined}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition focus:border-[#7BA7FF] focus:ring-4 focus:ring-[#7BA7FF]/10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-slate-600"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {isSignUp && (
                  <p className={`ml-1 text-[10px] font-bold ${password && !passwordIsValid ? 'text-amber-600' : 'text-slate-400'}`}>
                    Use pelo menos 6 caracteres.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 text-[11px] font-black uppercase tracking-[0.17em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processando...' : isSignUp ? 'Criar conta grátis' : 'Entrar no Kyron'}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              {isSignUp ? (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-left">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} />
                  <p className="text-xs font-semibold leading-5 text-emerald-800">
                    Sem cartão. Seu primeiro plano é criado após o onboarding.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-left">
                  <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={17} />
                  <p className="text-xs font-semibold leading-5 text-blue-800">
                    Sua sessão e seus dados permanecem vinculados ao seu perfil.
                  </p>
                </div>
              )}

              <button
                onClick={handleGuestLogin}
                type="button"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-[#EAF2FF] py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-800 transition hover:bg-[#DCEAFF] disabled:opacity-50"
              >
                <Sparkles size={14} />
                Explorar como convidado
              </button>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
          Performance segura · Kyron OS
        </p>
      </div>
    </div>
  );
};

export default Auth;
