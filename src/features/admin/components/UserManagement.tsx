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
  X,
} from 'lucide-react';
import { authApi } from '../../../lib/api/authApi';
import { profileApi } from '../../../lib/api/profileApi';
import { workoutApi } from '../../../lib/api/workoutApi';
import {
  adminSecurityApi,
  AdminProfile,
  SubscriptionStatus,
  UserAccessRecord,
} from '../../../lib/api/adminSecurityApi';

type FilterType = 'all' | 'active' | 'suspended' | 'premium' | 'free' | 'admin';

const getDisplayName = (profile: AdminProfile) => profile.name || profile.full_name || 'Atleta Convidado';
const getEmail = (profile: AdminProfile) => profile.email || '';
const isAdminProfile = (profile: AdminProfile) => profile.user_access.role === 'admin';
const isSuspended = (profile: AdminProfile) => profile.user_access.status === 'suspended';
const isPremium = (profile: AdminProfile) => profile.user_access.plan === 'premium';

const mergeAccess = (profile: AdminProfile, access: UserAccessRecord): AdminProfile => ({
  ...profile,
  user_access: access,
  role: access.role,
  plan: access.plan,
  account_status: access.status,
  is_admin: access.role === 'admin',
  is_premium: access.plan === 'premium',
});

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
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [foundationUnavailable, setFoundationUnavailable] = useState(false);

  useEffect(() => {
    authApi.getUser().then(user => setCurrentUserId(user?.id || null));
    void loadProfiles();
  }, []);

  useEffect(() => {
    if (!viewingWorkoutsUserId) {
      setUserWorkouts([]);
      return;
    }

    setLoadingWorkouts(true);
    workoutApi
      .getDashboardData(viewingWorkoutsUserId)
      .then(data => setUserWorkouts(data.workouts || []))
      .catch(error => {
        console.error('[UserManagement] Error loading user workouts:', error);
        setErrorNotice('Não foi possível carregar os treinos deste atleta.');
      })
      .finally(() => setLoadingWorkouts(false));
  }, [viewingWorkoutsUserId]);

  const showSuccess = (message: string) => {
    setSuccessNotice(message);
    window.setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleAdminError = (error: any) => {
    console.error('[UserManagement] Admin action failed:', error);
    if (adminSecurityApi.isP0MigrationRequiredError(error)) {
      setFoundationUnavailable(true);
      setErrorNotice('A fundação user_access não está disponível. Ações sensíveis permanecerão bloqueadas.');
      return;
    }
    setErrorNotice(error?.message || 'Erro administrativo inesperado.');
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await adminSecurityApi.listProfiles();
      setProfiles(data);
      setFoundationUnavailable(false);
    } catch (error) {
      handleAdminError(error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const isProtectedUser = (profile: AdminProfile) =>
    profile.id === currentUserId || isAdminProfile(profile);

  const applyAccessToProfile = (profileId: string, access: UserAccessRecord) => {
    setProfiles(previous => previous.map(profile =>
      profile.id === profileId ? mergeAccess(profile, access) : profile
    ));
  };

  const runAdminAction = async (action: () => Promise<void>) => {
    if (isPerformingAction || foundationUnavailable) return;
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
      setErrorNotice('Ação bloqueada: a própria conta e contas administrativas não podem ser suspensas por esta tela.');
      return;
    }

    void runAdminAction(async () => {
      const access = await adminSecurityApi.setAccountStatus(
        profile.id,
        'suspended',
        'Suspensão manual pelo painel administrativo'
      );
      applyAccessToProfile(profile.id, access);
      showSuccess(`Conta de ${getDisplayName(profile)} suspensa com auditoria no banco.`);
    });
  };

  const handleReactivateUser = (profile: AdminProfile) => {
    void runAdminAction(async () => {
      const access = await adminSecurityApi.setAccountStatus(
        profile.id,
        'active',
        'Reativação manual pelo painel administrativo'
      );
      applyAccessToProfile(profile.id, access);
      showSuccess(`Conta de ${getDisplayName(profile)} reativada.`);
    });
  };

  const handleSaveEdit = (updated: AdminProfile) => {
    void runAdminAction(async () => {
      const original = profiles.find(profile => profile.id === updated.id);
      if (!original) throw new Error('Perfil original não encontrado.');

      const profilePayload: Record<string, unknown> = {
        name: updated.name,
        full_name: updated.full_name,
      };

      if (!isProtectedUser(updated) && updated.email) {
        profilePayload.email = updated.email;
      }

      await profileApi.updateProfile(updated.id, profilePayload);

      let nextProfile: AdminProfile = { ...original, ...updated, ...profilePayload };
      const nextPlan: SubscriptionStatus = isPremium(updated) ? 'premium' : 'free';
      if (nextPlan !== original.user_access.plan) {
        const access = await adminSecurityApi.setSubscriptionStatus(
          updated.id,
          nextPlan,
          'Alteração de assinatura pelo painel administrativo'
        );
        nextProfile = mergeAccess(nextProfile, access);
      }

      setProfiles(previous => previous.map(profile =>
        profile.id === updated.id ? nextProfile : profile
      ));
      setEditingProfile(null);
      showSuccess(`Cadastro de ${getDisplayName(updated)} atualizado.`);
    });
  };

  const filtered = useMemo(() => profiles.filter(profile => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term ||
      getDisplayName(profile).toLowerCase().includes(term) ||
      getEmail(profile).toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filterType === 'active') return !isSuspended(profile);
    if (filterType === 'suspended') return isSuspended(profile);
    if (filterType === 'premium') return isPremium(profile);
    if (filterType === 'free') return !isPremium(profile) && !isAdminProfile(profile);
    if (filterType === 'admin') return isAdminProfile(profile);
    return true;
  }), [profiles, search, filterType]);

  const totalCount = profiles.length;
  const activeCount = profiles.filter(profile => !isSuspended(profile)).length;
  const suspendedCount = profiles.filter(isSuspended).length;
  const premiumCount = profiles.filter(isPremium).length;
  const freeCount = profiles.filter(profile => !isPremium(profile) && !isAdminProfile(profile)).length;
  const adminCount = profiles.filter(isAdminProfile).length;

  return (
    <div className="space-y-8 pb-32">
      {successNotice && (
        <Notice tone="success" onClose={() => setSuccessNotice(null)}>{successNotice}</Notice>
      )}
      {errorNotice && (
        <Notice tone="error" onClose={() => setErrorNotice(null)}>{errorNotice}</Notice>
      )}

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Atletas</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
            foundationUnavailable
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${foundationUnavailable ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            {foundationUnavailable ? 'Acesso indisponível' : 'user_access oficial'}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Função, assinatura e suspensão são validadas pela RPC administrativa do Supabase.
        </p>
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
        <div className="flex justify-center py-24 text-slate-400 text-xs">Sincronizando banco de dados Kyron OS...</div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/50">
                    <Th>Atleta</Th><Th>Acesso</Th><Th>Estado</Th><Th>Assinatura</Th><Th>Streak</Th><Th>Cadastro</Th><Th align="right">Menu</Th>
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
                      <td className="p-6"><StatusPill tone={isAdminProfile(profile) ? 'rose' : 'slate'} label={profile.user_access.role} /></td>
                      <td className="p-6"><StatusPill tone={isSuspended(profile) ? 'slate' : 'blue'} label={isSuspended(profile) ? 'Suspenso' : 'Ativo'} /></td>
                      <td className="p-6">
                        {isPremium(profile) ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase"><Lock size={11} /> Premium</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Globe size={11} /> Gratuito</span>
                        )}
                      </td>
                      <td className="p-6"><span className="flex items-center gap-1 font-black text-slate-800"><Flame size={14} className="text-amber-500" />{profile.workout_streak || 0}</span></td>
                      <td className="p-6 text-slate-400 font-semibold text-[11px]">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="p-6 text-right relative">
                        <button onClick={() => setActiveMenuUserId(activeMenuUserId === profile.id ? null : profile.id)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 border-none bg-transparent cursor-pointer">
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuUserId === profile.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuUserId(null)} />
                            <div className="absolute right-6 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-left divide-y divide-slate-100">
                              <div className="py-1">
                                <MenuButton label="Ver Perfil" onClick={() => { setSelectedProfile(profile); setActiveMenuUserId(null); }} />
                                <MenuButton label="Ver Treinos" onClick={() => { setViewingWorkoutsUserId(profile.id); setActiveMenuUserId(null); }} />
                                <MenuButton label="Editar Usuário" onClick={() => { setEditingProfile(profile); setActiveMenuUserId(null); }} />
                              </div>
                              <div className="py-1">
                                {isSuspended(profile) ? (
                                  <MenuButton label="Reativar Conta" disabled={isPerformingAction} onClick={() => handleReactivateUser(profile)} />
                                ) : (
                                  <MenuButton label="Suspender Conta" disabled={isProtectedUser(profile) || isPerformingAction} danger onClick={() => handleSuspendUser(profile)} />
                                )}
                                <MenuButton label="Exclusão indisponível" disabled onClick={() => undefined} />
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3"><Inbox size={32} /><p className="text-xs font-black uppercase tracking-widest text-slate-800">Nenhum atleta encontrado.</p></div>
          )}
        </div>
      )}

      {selectedProfile && (
        <Modal onClose={() => setSelectedProfile(null)} title="Ficha Cadastral do Atleta" subtitle="Identidade e acesso oficial">
          <ProfileSummary profile={selectedProfile} />
        </Modal>
      )}

      {editingProfile && (
        <Modal onClose={() => setEditingProfile(null)} title="Editar Atleta" subtitle="Dados cadastrais e assinatura">
          <form onSubmit={event => { event.preventDefault(); handleSaveEdit(editingProfile); }} className="space-y-5">
            <Field label="Nome Completo">
              <input type="text" value={editingProfile.name || ''} onChange={event => setEditingProfile({ ...editingProfile, name: event.target.value })} className="field-input" required />
            </Field>
            <Field label="E-mail">
              <input type="email" value={editingProfile.email || ''} disabled={isProtectedUser(editingProfile)} onChange={event => setEditingProfile({ ...editingProfile, email: event.target.value })} className="field-input disabled:bg-slate-100" required />
            </Field>
            <Field label="Plano de Assinatura">
              <select value={editingProfile.user_access.plan} onChange={event => {
                const plan = event.target.value as SubscriptionStatus;
                setEditingProfile(mergeAccess(editingProfile, { ...editingProfile.user_access, plan }));
              }} className="field-input">
                <option value="free">Gratuito</option><option value="premium">Premium</option>
              </select>
            </Field>
            <p className="text-[10px] text-slate-400 font-bold">Cargo administrativo não é editado nesta tela. Exclusão exige um fluxo server-side dedicado.</p>
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <button type="button" onClick={() => setEditingProfile(null)} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-xs">Cancelar</button>
              <button type="submit" disabled={isPerformingAction} className="px-6 py-3 bg-slate-950 disabled:bg-slate-300 text-white rounded-xl font-black text-xs">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {viewingWorkoutsUserId && (
        <Modal onClose={() => setViewingWorkoutsUserId(null)} title="Lista de Treinos" subtitle="Consulta individual">
          {loadingWorkouts ? <p className="text-center py-10 text-sm text-slate-500">Carregando treinos...</p> : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {userWorkouts.length ? userWorkouts.map(workout => (
                <div key={workout.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="font-bold text-sm text-slate-900">{workout.name}</p><p className="text-[10px] text-slate-500">{workout.description}</p></div>
              )) : <p className="text-center text-sm text-slate-500 py-10">Nenhum treino encontrado.</p>}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const Notice: React.FC<{ children: React.ReactNode; tone: 'success' | 'error'; onClose: () => void }> = ({ children, tone, onClose }) => (
  <div className={`fixed bottom-6 right-6 max-w-md px-6 py-4 rounded-2xl shadow-2xl z-[110] flex items-start gap-3 ${tone === 'success' ? 'bg-slate-900 text-white' : 'bg-rose-950 text-rose-100'}`}>
    {tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
    <div><span className="text-xs font-bold block">{children}</span><button onClick={onClose} className="text-[10px] font-black uppercase mt-1 border-none bg-transparent text-inherit cursor-pointer">Fechar</button></div>
  </div>
);

const Kpi: React.FC<{ title: string; value: string | number; tone?: 'default' | 'rose' }> = ({ title, value, tone = 'default' }) => (
  <div className="bg-white/70 border border-slate-200 p-6 rounded-3xl shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</p><p className={`text-3xl font-black mt-1 ${tone === 'rose' ? 'text-rose-500' : 'text-slate-950'}`}>{value}</p></div>
);

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap cursor-pointer ${active ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{label}</button>
);

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th className={`p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
);

const StatusPill: React.FC<{ label: string; tone: 'blue' | 'rose' | 'slate' }> = ({ label, tone }) => {
  const classes = { blue: 'text-blue-600 bg-blue-50 border-blue-100', rose: 'text-rose-600 bg-rose-50 border-rose-100', slate: 'text-slate-600 bg-slate-100 border-slate-200' }[tone];
  return <span className={`inline-flex text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${classes}`}>{label}</span>;
};

const MenuButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean; danger?: boolean }> = ({ label, onClick, disabled, danger }) => (
  <button disabled={disabled} onClick={onClick} className={`w-full text-left px-4 py-2.5 text-xs font-bold border-none bg-transparent ${disabled ? 'text-slate-300 cursor-not-allowed' : danger ? 'text-rose-600 hover:bg-rose-50 cursor-pointer' : 'text-slate-700 hover:bg-slate-50 cursor-pointer'}`}>{label}</button>
);

const Modal: React.FC<{ children: React.ReactNode; title: string; subtitle: string; onClose: () => void }> = ({ children, title, subtitle, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} /><div className="relative bg-white rounded-[2.5rem] border border-slate-200 max-w-lg w-full p-8 shadow-2xl z-50 text-left"><div className="flex justify-between items-start mb-6"><div><h3 className="text-lg font-black text-slate-900">{title}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p></div><button onClick={onClose} className="p-2 text-slate-400 border-none bg-transparent cursor-pointer"><X size={18} /></button></div>{children}</div></div>
);

const ProfileSummary: React.FC<{ profile: AdminProfile }> = ({ profile }) => (
  <div className="space-y-6"><div className="flex items-center gap-4 border-b border-slate-100 pb-5"><div className="w-16 h-16 rounded-2xl bg-slate-50 border flex items-center justify-center text-2xl font-bold">{getDisplayName(profile).charAt(0)}</div><div><h4 className="font-black">{getDisplayName(profile)}</h4><p className="text-xs text-slate-500">{getEmail(profile)}</p></div></div><div className="grid grid-cols-2 gap-5 text-xs font-bold"><InfoItem label="Status" value={isSuspended(profile) ? 'Suspenso' : 'Ativo'} /><InfoItem label="Assinatura" value={isPremium(profile) ? 'Premium' : 'Gratuito'} /><InfoItem label="Função" value={profile.user_access.role} /><InfoItem label="Cadastro" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'} /></div></div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <div><label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">{label}</label>{children}</div>;

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p>{value}</p></div>;
