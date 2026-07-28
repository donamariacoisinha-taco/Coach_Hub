import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  LineChart,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Zap,
} from 'lucide-react';
import kyronLogo from '../assets/images/kyron_official_logo_1781087891387.png';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

type Lang = 'PT' | 'EN';

const copy = {
  PT: {
    login: 'Entrar',
    start: 'Começar grátis',
    navMethod: 'Como funciona',
    navBenefits: 'Benefícios',
    navProof: 'Prova',
    badge: 'Sistema adaptativo de treino, nutrição e evolução',
    eyebrow: 'Menos tentativa. Mais direção.',
    headline: 'Treine com um sistema que entende seu progresso real.',
    subheadline:
      'O KYRON organiza treino, carga, descanso, nutrição e evolução em uma experiência simples, guiada e feita para uso no celular.',
    primaryCta: 'Criar conta gratuita',
    secondaryCta: 'Ver como funciona',
    reassurance: 'Sem cartão. Sem planilha. Sem configurar tudo sozinho.',
    socialProof: 'Construído para quem quer constância, progressão e clareza no treino.',
    simulatorTitle: 'Sessão guiada em andamento',
    simulatorSub: 'A próxima ação fica sempre clara.',
    setLabel: 'Série atual',
    loadLabel: 'Carga sugerida',
    restLabel: 'Descanso',
    confirmSet: 'Confirmar série',
    nextAction: 'Próxima ação: manter técnica e registrar sensação da série.',
    whyTitle: 'A landing foi pensada para reduzir esforço mental.',
    whySub:
      'O usuário precisa entender rápido o valor, confiar no fluxo e saber exatamente o que fazer em seguida.',
    methodBadge: 'Fluxo de decisão',
    methodTitle: 'Do primeiro acesso ao primeiro treino, sem confusão.',
    benefitsTitle: 'O que o usuário sente na prática',
    proofTitle: 'Por que isso aumenta conversão',
    finalTitle: 'Comece simples. Evolua com dados.',
    finalSub: 'Entre no KYRON, faça seu primeiro registro e deixe o sistema construir clareza sobre seu treino.',
    finalCta: 'Acessar KYRON agora',
  },
  EN: {
    login: 'Sign in',
    start: 'Start free',
    navMethod: 'How it works',
    navBenefits: 'Benefits',
    navProof: 'Proof',
    badge: 'Adaptive system for training, nutrition and progress',
    eyebrow: 'Less guessing. More direction.',
    headline: 'Train with a system that understands your real progress.',
    subheadline:
      'KYRON organizes training, load, rest, nutrition and progress in a simple mobile-first experience.',
    primaryCta: 'Create free account',
    secondaryCta: 'See how it works',
    reassurance: 'No card. No spreadsheets. No setup chaos.',
    socialProof: 'Built for consistency, progression and clarity in training.',
    simulatorTitle: 'Guided session in progress',
    simulatorSub: 'The next action is always clear.',
    setLabel: 'Current set',
    loadLabel: 'Suggested load',
    restLabel: 'Rest',
    confirmSet: 'Confirm set',
    nextAction: 'Next action: keep technique and log how the set felt.',
    whyTitle: 'This landing reduces mental effort.',
    whySub:
      'Users need to understand value fast, trust the flow and know exactly what to do next.',
    methodBadge: 'Decision flow',
    methodTitle: 'From first visit to first workout, without confusion.',
    benefitsTitle: 'What the user feels in practice',
    proofTitle: 'Why this improves conversion',
    finalTitle: 'Start simple. Evolve with data.',
    finalSub: 'Enter KYRON, log your first set and let the system build clarity around your training.',
    finalCta: 'Access KYRON now',
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('kyron_lang') : null;
    return saved === 'EN' ? 'EN' : 'PT';
  });

  const t = copy[lang];

  const setLanguage = (value: Lang) => {
    setLang(value);
    window.localStorage.setItem('kyron_lang', value);
  };

  const psychologyCards = [
    {
      icon: Brain,
      title: lang === 'PT' ? 'Clareza cognitiva' : 'Cognitive clarity',
      text:
        lang === 'PT'
          ? 'A promessa aparece em linguagem direta antes de qualquer termo técnico.'
          : 'The core promise appears in plain language before technical detail.',
    },
    {
      icon: Target,
      title: lang === 'PT' ? 'Ação única principal' : 'Single primary action',
      text:
        lang === 'PT'
          ? 'O CTA principal é consistente: criar conta e iniciar o primeiro uso.'
          : 'The main CTA is consistent: create an account and start using the product.',
    },
    {
      icon: ShieldCheck,
      title: lang === 'PT' ? 'Redução de ansiedade' : 'Anxiety reduction',
      text:
        lang === 'PT'
          ? 'A página remove objeções iniciais: sem cartão, sem planilha e sem setup pesado.'
          : 'The page removes early objections: no card, no spreadsheets and no heavy setup.',
    },
  ];

  const methodSteps = [
    {
      step: '01',
      title: lang === 'PT' ? 'Crie seu perfil' : 'Create your profile',
      text:
        lang === 'PT'
          ? 'Comece com dados simples. O sistema não exige que você monte tudo sozinho.'
          : 'Start with simple data. The system does not ask you to build everything alone.',
    },
    {
      step: '02',
      title: lang === 'PT' ? 'Abra um treino guiado' : 'Open a guided workout',
      text:
        lang === 'PT'
          ? 'Cada tela mostra o que fazer agora, o que registrar e qual é a próxima ação.'
          : 'Each screen shows what to do now, what to log and what comes next.',
    },
    {
      step: '03',
      title: lang === 'PT' ? 'Evolua com memória' : 'Evolve with memory',
      text:
        lang === 'PT'
          ? 'O histórico deixa de ser anotação solta e vira base para progressão.'
          : 'Your history stops being loose notes and becomes the base for progression.',
    },
  ];

  const benefits = [
    {
      icon: Dumbbell,
      title: lang === 'PT' ? 'Treino mais claro' : 'Clearer training',
      text:
        lang === 'PT'
          ? 'Menos dúvida entre exercícios, séries e cargas.'
          : 'Less doubt between exercises, sets and loads.',
    },
    {
      icon: Clock3,
      title: lang === 'PT' ? 'Menos fricção' : 'Less friction',
      text:
        lang === 'PT'
          ? 'Fluxo mobile pensado para registrar rápido durante o treino.'
          : 'A mobile-first flow designed for fast logging during workouts.',
    },
    {
      icon: LineChart,
      title: lang === 'PT' ? 'Progresso visível' : 'Visible progress',
      text:
        lang === 'PT'
          ? 'A evolução fica mais fácil de entender e repetir.'
          : 'Progress becomes easier to understand and repeat.',
    },
    {
      icon: UserCheck,
      title: lang === 'PT' ? 'Uso pessoal' : 'Personal use',
      text:
        lang === 'PT'
          ? 'O sistema acompanha seu comportamento, não uma rotina genérica.'
          : 'The system follows your behavior, not a generic routine.',
    },
  ];

  const proofPoints = [
    lang === 'PT' ? 'Reduz carga cognitiva logo no primeiro bloco.' : 'Reduces cognitive load in the first block.',
    lang === 'PT' ? 'Usa prova funcional em vez de promessa abstrata.' : 'Uses functional proof instead of abstract claims.',
    lang === 'PT' ? 'Transforma complexidade técnica em sequência visual.' : 'Turns technical complexity into a visual sequence.',
    lang === 'PT' ? 'Mantém uma decisão principal por seção.' : 'Keeps one main decision per section.',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 overflow-x-hidden selection:bg-[#7BA7FF]/20 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7BA7FF]/12 blur-[120px]" />
        <div className="absolute top-[38rem] -right-40 h-[440px] w-[440px] rounded-full bg-violet-400/10 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/78 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button onClick={onStart} className="flex items-center gap-3 text-left" aria-label="KYRON OS">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={kyronLogo} alt="KYRON OS" className="h-11 w-11 scale-150 object-contain" />
            </span>
            <span>
              <span className="block font-mono text-sm font-black tracking-tight">KYRON<span className="text-[#7BA7FF]">.</span></span>
              <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">OS</span>
            </span>
          </button>

          <div className="hidden items-center gap-7 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 md:flex">
            <a href="#method" className="transition hover:text-slate-900">{t.navMethod}</a>
            <a href="#benefits" className="transition hover:text-slate-900">{t.navBenefits}</a>
            <a href="#proof" className="transition hover:text-slate-900">{t.navProof}</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {(['PT', 'EN'] as Lang[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition ${
                    lang === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <button onClick={onLogin} className="hidden text-[11px] font-black uppercase tracking-widest text-slate-500 sm:block">
              {t.login}
            </button>
            <button
              onClick={onStart}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/12 transition active:scale-95"
            >
              {t.start}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-68px)] max-w-7xl grid-cols-1 items-center gap-12 px-5 py-12 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7BA7FF]/30 bg-[#7BA7FF]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#3566B8]"
            >
              <Sparkles size={13} />
              {t.badge}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-slate-400"
            >
              {t.eyebrow}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl"
            >
              {t.headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg"
            >
              {t.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <button
                onClick={onStart}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.35rem] bg-[#0F172A] px-7 text-xs font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-slate-950/15 transition active:scale-[0.98]"
              >
                {t.primaryCta}
                <ArrowRight size={16} />
              </button>
              <a
                href="#method"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.35rem] border border-slate-200 bg-white px-7 text-xs font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:border-slate-300 active:scale-[0.98]"
              >
                <Play size={15} />
                {t.secondaryCta}
              </a>
            </motion.div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>{t.reassurance}</span>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
              <p className="text-sm font-bold leading-7 text-slate-600">{t.socialProof}</p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 22, stiffness: 140 }}
              className="relative mx-auto max-w-[520px] rounded-[2.25rem] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)]"
            >
              <div className="absolute -left-5 top-10 hidden rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl md:block">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  <Flame size={14} /> +7 dias
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">streak ativo</p>
              </div>

              <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7BA7FF]">KYRON WORKOUT</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">{t.simulatorTitle}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-400">{t.simulatorSub}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Zap size={22} className="text-[#7BA7FF]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.setLabel}</p>
                    <p className="mt-2 text-2xl font-black">3/4</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.loadLabel}</p>
                    <p className="mt-2 text-2xl font-black">84kg</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.restLabel}</p>
                    <p className="mt-2 text-2xl font-black">0:48</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white">Supino inclinado</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">RPE alvo 8 · descanso adaptativo</p>
                    </div>
                    <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      Sync OK
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-[#7BA7FF]" />
                  </div>
                </div>

                <button className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xs font-black uppercase tracking-[0.18em] text-slate-950">
                  {t.confirmSet}
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold leading-6 text-slate-600">{t.nextAction}</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8" id="proof">
          <div className="grid gap-4 md:grid-cols-3">
            {psychologyCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7BA7FF]/12 text-[#3566B8]">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{card.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8" id="method">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3566B8]">{t.methodBadge}</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">{t.methodTitle}</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">{t.whySub}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {methodSteps.map((item) => (
              <div key={item.step} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                <span className="text-5xl font-black tracking-[-0.08em] text-slate-200">{item.step}</span>
                <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8" id="benefits">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3566B8]">UX + PERFORMANCE</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">{t.benefitsTitle}</h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-base font-semibold leading-8 text-slate-600">{t.whyTitle}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-black tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="rounded-[2.25rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/12 sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#7BA7FF]">{t.proofTitle}</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{t.finalTitle}</h2>
                <p className="mt-5 text-base font-semibold leading-8 text-slate-300">{t.finalSub}</p>
                <button
                  onClick={onStart}
                  className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-[1.35rem] bg-white px-7 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition active:scale-[0.98]"
                >
                  {t.finalCta}
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="lg:col-span-6">
                <div className="grid gap-3">
                  {proofPoints.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                      <p className="text-sm font-bold leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4 text-xs font-bold text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>KYRON OS · Human Performance System</span>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="transition hover:text-slate-700">{t.login}</button>
            <button onClick={onStart} className="transition hover:text-slate-700">{t.start}</button>
          </div>
        </footer>
      </main>
    </div>
  );
};
