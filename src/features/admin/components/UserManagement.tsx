import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Globe,
  Inbox,
  Lock,
  MoreVertical,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { authApi } from '../../../lib/api/authApi';
import { profileApi } from '../../../lib/api/profileApi';
import { workoutApi } from '../../../lib/api/workoutApi';
import {
  adminSecurityApi,
  AdminProfile,
  SubscriptionStatus,
} from '../../../lib/api/adminSecurityApi';

type FilterType = 'all' | 'active' | 'suspended' | 'premium' | 'free' | 'admin';

const getDisplayName = (profile: AdminProfile) => profile.name || profile.full_name || 'Atleta Convidado';
const getEmail = (profile: AdminProfile) => profile.email || '';
const isAdminProfile = (profile: AdminProfile) => profile.role === 'admin' || profile.is_admin === true;
const isSuspended = (profile: AdminProfile) => profile.account_status === 'suspended';
const isDeleted = (profile: AdminProfile) => profile.account_status === 'deleted';
const isPremium = (profile: AdminProfile) =>
  profile.subscription_status === 'premium' ||
  profile.subscription_status === 'trial' ||
  profile.is_premium === true;

const getP0RequiredMessage = () =>
  'A migração P0 ainda não foi aplicada no Supabase. Ação administrativa bloqueada para evitar localStorage e mutações inseguras.';

export const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [viewingWorkoutsUserId, setViewingWorkoutsUserId] = useState<string | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<any[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<AdminProfile | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [p0MigrationRequired, setP0MigrationRequired] = useState(false);

  useEffect(() => {
    authApi.getUser().then(user => {
      setCurrentUserId(user?.id || null);
      setCurrentUserEmail(user?.email || '');
    });
    loadProfiles();
  }, []);

  useEffect(() => {
    if (viewingWorkoutsUserId) {
      setLoadingWorkouts(true);
      workoutApi
        .getDashboardData(viewingWorkoutsUserId)
        .then(data => setUserWorkouts(data.workouts || []))
        .catch(error => {
          console.error('[UserManagement] Error loading user workouts:', error);
          setErrorNotice('Não foi possível carregar os treinos deste atleta.');
        })
        .finally(() => setLoadingWorkouts(false));
    } else {
      setUserWorkouts([]);
    }
  }, [viewingWorkoutsUserId]);

  const showSuccess = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleAdminError = (error: any) => {
    console.error('[UserManagement] Admin action failed:', error);
    if (adminSecurityApi.isP0MigrationRequiredError(error)) {
      setP0MigrationRequired(true);
      setErrorNotice(getP0RequiredMessage());
      return;
    }
    setErrorNotice(error?.message || 'Erro administrativo inesperado.');
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await adminSecurityApi.listProfiles();
      setProfiles(data.filter(profile => !isDeleted(profile)));
    } catch (error) {
      handleAdminError(error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const isProtectedUser = (profile: AdminProfile) => {
    const email = getEmail(profile).toLowerCase();
    if (profile.id === currentUserId) return true;
    if (email && currentUserEmail && email === currentUserEmail.toLowerCase()) return true;
    if (isAdminProfile(profile)) return true;
    return false;
  };

  const updateProfileInState = (updated: AdminProfile) => {
    setProfiles(prev => prev.map(profile => (profile.id === updated.id ? { ...profile, ...updated } : profile)));
  };

  const runAdminAction = async (action: () => Promise<void>) => {
    if (isPerformingAction) return;
    setIsPerformingAction(true);
    setErrorNotice(null);
    try {
      await action();
    } catch (error) {
      handleAdminError(error);
    } finally {
      setIsPerformingAction(false);
      setActiveMenuUserId(null);
    }
  };

  const handleSuspendUser = (profile: AdminProfile) => {
    if (isProtectedUser(profile)) {
      setErrorNotice('Ação bloqueada: contas administrativas ou a própria conta logada não podem ser suspensas por aqui.');
      return;
    }

    runAdminAction(async () => {
      const updated = await adminSecurityApi.setAccountStatus(profile.id, 'suspended', 'Suspensão manual pelo painel administrativo');
      updateProfileInState(updated);
      showSuccess(`Conta de ${getDisplayName(profile)} suspensa com auditoria server-side.`);
    });
  };

  const handleReactivateUser = (profile: AdminProfile) => {
    runAdminAction(async () => {
      const updated = await adminSecurityApi.setAccountStatus(profile.id, 'active', 'Reativação manual pelo painel administrativo');
      updateProfileInState(updated);
      showSuccess(`Conta de ${getDisplayName(profile)} reativada com auditoria server-side.`);
    });
  };

  const handleDeleteUser = (profile: AdminProfile) => {
    if (isProtectedUser(profile)) {
      setErrorNotice('Ação bloqueada: contas administrativas ou a própria conta logada não podem ser removidas por aqui.');
      return;
    }

    runAdminAction(async () => {
      await adminSecurityApi.softDeleteUser(profile.id, 'Soft delete manual pelo painel administrativo');
      setProfiles(prev => prev.filter(item => item.id !== profile.id));
      setDeletingProfile(null);
      setDeleteConfirmInput('');
      showSuccess(`Conta de ${getDisplayName(profile)} marcada como excluída sem apagar histórico físico.`);
    });
  };

  const handleSaveEdit = async (updated: AdminProfile) => {
    await runAdminAction(async () => {
      const original = profiles.find(profile => profile.id === updated.id);
      if (!original) throw new Error('Perfil original não encontrado.');

      const nextSubscription: SubscriptionStatus = isPremium(updated) ? 'premium' : 'free';
      const originalSubscription: SubscriptionStatus = isPremium(original) ? 'premium' : 'free';

      const payload: any = {
        name: updated.name,
        full_name: updated.full_name,
      };

      if (!isProtectedUser(updated) && updated.email) {
        payload.email = updated.email;
      }

      await profileApi.updateProfile(updated.id, payload);

      let finalProfile: AdminProfile = { ...original, ...updated, ...payload };
      if (nextSubscription !== originalSubscription) {
        finalProfile = await adminSecurityApi.setSubscriptionStatus(
          updated.id,
          nextSubscription,
          'Alteração de assinatura pelo painel administrativo'
        );
      }

      updateProfileInState(finalProfile);
      setEditingProfile(null);
      showSuccess(`Cadastro de ${getDisplayName(updated)} atualizado.`);
    });
  };

  const filtered = useMemo(() => {
    return profiles.filter(profile => {
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        !searchTerm ||
        getDisplayName(profile).toLowerCase().includes(searchTerm) ||
        getEmail(profile).toLowerCase().includes(searchTerm);

      if (!matchesSearch) return false;
      if (filterType === 'active') return !isSuspended(profile) && !isDeleted(profile);
      if (filterType === 'suspended') return isSuspended(profile);
      if (filterType === 'premium') return isPremium(profile);
      if (filterType === 'free') return !isPremium(profile) && !isAdminProfile(profile);
      if (filterType === 'admin') return isAdminProfile(profile);
      return true;
    });
  }, [profiles, search, filterType]);

  const totalCount = profiles.length;
  const suspendedCount = profiles.filter(isSuspended).length;
  const activeCount = profiles.filter(profile => !isSuspended(profile) && !isDeleted(profile)).length;
  const premiumCount = profiles.filter(isPremium).length;
  const freeCount = profiles.filter(profile => !isPremium(profile) && !isAdminProfile(profile)).length;
  const adminCount = profiles.filter(isAdminProfile).length;
  const isFallbackMode = p0MigrationRequired;

  return (
    <div className="space-y-8 pb-32">
      {successNotice && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-center gap-3">
          <CheckCircle2 className="text-[#7BA7FF]" size={18} />
          <span className="text-xs font-bold font-sans">{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="fixed bottom-6 right-6 max-w-md bg-rose-950 border border-rose-800 text-rose-100 px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="font-sans">
            <span className="text-xs font-bold block">{errorNotice}</span>
            <button onClick={() => setErrorNotice(null)} className="text-[10px] font-black uppercase text-rose-300 mt-1 cursor-pointer hover:underline border-none bg-transparent">
              Ok, fechar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Atletas</h2>
            {isFallbackMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-600 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> P0 pendente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Banco oficial
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {isFallbackMode
              ? 'Ações sensíveis bloqueadas até aplicar a migração P0. Nada será simulado em localStorage.'
              : 'Ações sensíveis preparadas para RPCs server-side e auditoria administrativa.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <Kpi title="Total Atletas" value={totalCount} />
        <Kpi title="Ativos / Suspensos" value={`${activeCount}/${suspendedCount}`} />
        <Kpi title="Plano Premium" value={premiumCount} />
        <Kpi title="Admins & Staff" value={adminCount} tone="rose" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-slate-200 p-4 rounded-[2rem] shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar atleta por nome/e-mail..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
          <FilterButton label={`Todos (${totalCount})`} active={filterType === 'all'} onClick={() => setFilterType('all')} />
          <FilterButton label={`Ativos (${activeCount})`} active={filterType === 'active'} onClick={() => setFilterType('active')} />
          <FilterButton label={`Suspensos (${suspendedCount})`} active={filterType === 'suspended'} onClick={() => setFilterType('suspended')} />
          <FilterButton label={`Premium (${premiumCount})`} active={filterType === 'premium'} onClick={() => setFilterType('premium')} />
          <FilterButton label={`Free (${freeCount})`} active={filterType === 'free'} onClick={() => setFilterType('free')} />
          <FilterButton label={`Admins (${adminCount})`} active={filterType === 'admin'} onClick={() => setFilterType('admin')} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-400 font-sans text-xs">Sincronizando banco de dados Kyron OS...</div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <Th>Atleta</Th>
                    <Th>Acesso</Th>
                    <Th>Estado</Th>
                    <Th>Assinatura</Th>
                    <Th>Streak</Th>
                    <Th>Cadastro</Th>
                    <Th align="right">Menu</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-700">
                  {filtered.map(profile => (
                    <tr key={profile.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase shrink-0">
                            {getDisplayName(profile).charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{getDisplayName(profile)}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5 truncate">{getEmail(profile)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <StatusPill tone={isAdminProfile(profile) ? 'rose' : 'slate'} label={isAdminProfile(profile) ? 'Admin' : 'Atleta'} />
                      </td>
                      <td className="p-6">
                        <StatusPill tone={isSuspended(profile) ? 'slate' : 'blue'} label={isSuspended(profile) ? 'Suspenso' : 'Ativo'} />
                      </td>
                      <td className="p-6">
                        {isAdminProfile(profile) ? (
                          <span className="text-slate-400 text-[10px] font-semibold">Ilimitado</span>
                        ) : isPremium(profile) ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase">
                            <Lock size={11} className="text-blue-400" /> Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                            <Globe size={11} /> Gratuito
                          </span>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-1 font-black text-slate-800">
                          <Flame size={14} className="text-amber-500 fill-amber-50" />
                          <span>{profile.workout_streak || 0}</span>
                        </div>
                      </td>
                      <td className="p-6 text-slate-400 font-semibold text-[11px]">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="p-6 text-right relative font-sans">
                        <div className="flex items-center justify-end gap-3">
                          {isProtectedUser(profile) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 rounded-md border border-slate-200/60 select-none">
                              Protegido
                            </span>
                          )}
                          <button
                            onClick={() => setActiveMenuUserId(activeMenuUserId === profile.id ? null : profile.id)}
                            className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-900 border-none bg-transparent"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuUserId === profile.id && (
                            <>
                              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveMenuUserId(null)} />
                              <div className="absolute right-6 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-left divide-y divide-slate-100 font-sans">
                                <div className="py-1">
                                  <MenuButton label="Ver Perfil" onClick={() => { setSelectedProfile(profile); setActiveMenuUserId(null); }} />
                                  <MenuButton label="Ver Treinos" onClick={() => { setViewingWorkoutsUserId(profile.id); setActiveMenuUserId(null); }} />
                                  <MenuButton label="Editar Usuário" onClick={() => { setEditingProfile(profile); setActiveMenuUserId(null); }} />
                                </div>
                                <div className="py-1">
                                  {!isSuspended(profile) ? (
                                    <MenuButton label="Suspender Conta" disabled={isProtectedUser(profile) || isPerformingAction} danger onClick={() => handleSuspendUser(profile)} />
                                  ) : (
                                    <MenuButton label="Reativar Conta" disabled={isPerformingAction} onClick={() => handleReactivateUser(profile)} />
                                  )}
                                  <MenuButton label="Soft delete" disabled={isProtectedUser(profile) || isPerformingAction} danger onClick={() => { setDeletingProfile(profile); setDeleteConfirmInput(''); setActiveMenuUserId(null); }} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
              <Inbox size={32} className="text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-800">Nenhum atleta mapeado com este filtro.</p>
            </div>
          )}
        </div>
      )}

      {selectedProfile && (
        <Modal onClose={() => setSelectedProfile(null)} title="Ficha Cadastral do Atleta" subtitle="Identidade & Status Kyron OS">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold uppercase text-2xl shrink-0">
                {getDisplayName(selectedProfile).charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{getDisplayName(selectedProfile)}</h4>
                <p className="text-xs text-slate-500 mt-1">{getEmail(selectedProfile)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-xs font-bold text-slate-800">
              <InfoItem label="Status da Conta" value={isSuspended(selectedProfile) ? 'Suspenso' : 'Ativo'} />
              <InfoItem label="Assinatura" value={isPremium(selectedProfile) ? 'Premium' : 'Gratuito'} />
              <InfoItem label="Função" value={isAdminProfile(selectedProfile) ? 'Admin' : 'Atleta'} />
              <InfoItem label="Cadastro" value={selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'} />
            </div>
          </div>
        </Modal>
      )}

      {editingProfile && (
        <Modal onClose={() => setEditingProfile(null)} title="Editar Atleta" subtitle="Dados cadastrais e assinatura server-side">
          <form onSubmit={event => { event.preventDefault(); handleSaveEdit(editingProfile); }} className="space-y-5">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">Nome Completo</label>
              <input
                type="text"
                value={editingProfile.name || ''}
                onChange={event => setEditingProfile({ ...editingProfile, name: event.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-sans"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">E-mail</label>
              <input
                type="email"
                value={editingProfile.email || ''}
                disabled={isProtectedUser(editingProfile)}
                onChange={event => setEditingProfile({ ...editingProfile, email: event.target.value })}
                className="w-full bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-sans"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">Plano de Assinatura</label>
              <select
                value={isPremium(editingProfile) ? 'premium' : 'free'}
                onChange={event => setEditingProfile({
                  ...editingProfile,
                  subscription_status: event.target.value as SubscriptionStatus,
                  is_premium: event.target.value === 'premium',
                })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-sans"
              >
                <option value="free">Gratuito</option>
                <option value="premium">Premium</option>
              </select>
              <p className="text-[10px] text-slate-400 font-bold mt-2">Cargo administrativo não é editado nesta tela. Essa permissão deve ser tratada por fluxo separado.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 font-sans">
              <button type="button" onClick={() => setEditingProfile(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-none cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={isPerformingAction} className="px-6 py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all border-none cursor-pointer">
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingProfile && (() => {
        const email = getEmail(deletingProfile);
        const canDelete = !isProtectedUser(deletingProfile) && deleteConfirmInput.trim().toLowerCase() === email.trim().toLowerCase();

        return (
          <Modal onClose={() => setDeletingProfile(null)} title="Marcar atleta como excluído?" subtitle="Soft delete com auditoria server-side" danger>
            <div className="space-y-5 text-slate-700">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atleta Selecionado</p>
                <p className="text-sm font-black text-slate-900 mt-1">{getDisplayName(deletingProfile)}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{email}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-800 font-bold">
                  Esta ação não apaga histórico físico. Ela marca a conta como deleted via RPC e remove sessão parcial ativa para permitir recuperação futura.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                  Digite o e-mail do atleta para confirmar:
                </label>
                <input
                  type="text"
                  placeholder={email}
                  value={deleteConfirmInput}
                  onChange={event => setDeleteConfirmInput(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-rose-100 transition-all"
                />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setDeletingProfile(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-none cursor-pointer">
                Cancelar
              </button>
              <button
                disabled={!canDelete || isPerformingAction}
                onClick={() => handleDeleteUser(deletingProfile)}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-none cursor-pointer ${
                  canDelete && !isPerformingAction
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/15'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                Aplicar soft delete
              </button>
            </div>
          </Modal>
        );
      })()}

      {viewingWorkoutsUserId && (
        <Modal onClose={() => setViewingWorkoutsUserId(null)} title="Lista de Treinos" subtitle="Gerenciamento individual">
          {loadingWorkouts ? (
            <div className="text-center py-10 text-sm text-slate-500">Carregando treinos...</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {userWorkouts.length > 0 ? userWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{workout.name}</p>
                    <p className="text-[10px] text-slate-500">{workout.description}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-sm text-slate-500 py-10">Nenhum treino encontrado.</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const Kpi: React.FC<{ title: string; value: string | number; tone?: 'default' | 'rose' }> = ({ title, value, tone = 'default' }) => (
  <div className="bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</p>
    <p className={`text-3xl font-black mt-1 ${tone === 'rose' ? 'text-rose-500' : 'text-slate-950'}`}>{value}</p>
  </div>
);

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer ${
      active ? 'bg-slate-950 border-slate-950 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-950'
    }`}
  >
    {label}
  </button>
);

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th className={`p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
);

const StatusPill: React.FC<{ label: string; tone: 'blue' | 'rose' | 'slate' }> = ({ label, tone }) => {
  const classes = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  }[tone];

  return <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${classes}`}>{label}</span>;
};

const MenuButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean; danger?: boolean }> = ({ label, onClick, disabled, danger }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer ${
      disabled
        ? 'text-slate-300 cursor-not-allowed'
        : danger
          ? 'text-rose-600 hover:bg-rose-50/50'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {label}
  </button>
);

const Modal: React.FC<{ children: React.ReactNode; title: string; subtitle: string; onClose: () => void; danger?: boolean }> = ({ children, title, subtitle, onClose, danger }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
    <div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl overflow-hidden z-50 text-left animate-scale-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-lg font-black tracking-tight ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{title}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer transition-all">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
    <p>{value}</p>
  </div>
);
