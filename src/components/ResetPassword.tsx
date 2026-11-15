import React, { useState } from 'react';
import { authApi } from '../lib/api/authApi';

const ResetPassword: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As duas senhas precisam ser iguais.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.updatePassword(password);
      await authApi.signOut();
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar a nova senha. Peça um novo e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-12 flex items-center justify-center">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0066FF] mb-3">KYRON OS</p>
        <h1 className="text-3xl font-black text-slate-900 leading-tight">Nova senha</h1>
        {done ? (
          <>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Senha atualizada. Volte ao aplicativo e entre com a nova senha.
            </p>
            <button
              type="button"
              onClick={onFinished}
              className="mt-8 w-full rounded-2xl bg-[#0066FF] text-white text-lg font-bold py-4"
            >
              Continuar
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-lg text-slate-600 leading-relaxed">
              Escolha uma senha nova. O link do e-mail vale só para esta troca.
            </p>
            <label className="block text-sm font-bold text-slate-700" htmlFor="new-password">
              Nova senha
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700" htmlFor="confirm-password">
              Repetir a senha
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg"
              />
            </label>
            {error && <p className="text-base font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#0066FF] text-white text-lg font-bold py-4 disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ResetPassword;
