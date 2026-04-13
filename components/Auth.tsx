
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../App';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const { navigate } = useNavigation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateError = (err: string) => {
    if (err.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (err.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail antes de entrar.';
    if (err.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (err.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    return 'Ocorreu um erro técnico. Tente novamente.';
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
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        console.log('[AUTH][DEBUG] Cadastro realizado com sucesso.');
        alert('Cadastro realizado! Verifique seu e-mail para ativar a conta.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        console.log('[AUTH][DEBUG] Login bem-sucedido para:', data.user?.email);
        
        // Redirecionamento explícito para garantir transição imediata da UI
        navigate('dashboard');
      }
    } catch (err: any) {
      console.error('[AUTH][ERROR] Falha na autenticação:', err.message);
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6 flex flex-col justify-center max-w-md mx-auto relative">
      {onBack && (
        <button onClick={onBack} className="absolute top-10 left-6 text-slate-400 hover:text-blue-600 transition-colors">
          <i className="fas fa-chevron-left mr-2"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
      )}

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-600/20">
           <i className="fas fa-gem text-2xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
           {isSignUp ? 'Criar Perfil' : 'Bem-vindo'}
        </h2>
        <p className="text-slate-400 text-sm">
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
            className="w-full p-5 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 font-bold shadow-sm"
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
            className="w-full p-5 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 font-bold shadow-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-blue-600 rounded-3xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <i className="fas fa-spinner animate-spin"></i> : isSignUp ? 'FORJAR MEU ACESSO' : 'ENTRAR NO DASHBOARD'}
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-4 text-center">
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
        >
          {isSignUp ? 'Já possuo uma conta' : 'Não possuo cadastro'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
