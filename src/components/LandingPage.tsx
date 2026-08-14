import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Fingerprint,
  Flame,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WifiOff,
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
    navProduct: 'Produto',
    navMethod: 'Como funciona',
    navDifference: 'Por que Kyron',
    eyebrow: 'Sistema adaptativo de treino',
    headlineTop: 'Seu treino não deveria',
    headlineAccent: 'começar do zero',
    headlineBottom: 'todos os dias.',
    subheadline:
      'O KYRON aprende com cada série, entende seu desempenho e mostra o próximo passo para você continuar evoluindo — sem planilhas e sem improviso.',
    primaryCta: 'Montar meu treino grátis',
    secondaryCta: 'Ver o treino em ação',
    reassurance: 'Grátis para começar · Sem cartão · Configuração em poucos minutos',
    heroNote: 'Cada treino prepara o próximo.',
    liveLabel: 'Sessão ao vivo',
    exercise: 'Supino inclinado',
    setLabel: 'Série',
    previousLabel: 'Anterior',
    suggestedLabel: 'Sugestão Kyron',
    repsLabel: 'Repetições',
    rpeLabel: 'RPE percebido',
    finishSet: 'Concluir série',
    reason: 'Carga mantida porque a última série terminou em RPE 8.',
    ticker: ['PLANO ADAPTATIVO', 'PROGRESSÃO POR RPE', 'RETOMADA OFFLINE', 'SUBSTITUIÇÃO INTELIGENTE', 'HISTÓRICO REAL'],
    cycleEyebrow: 'Ciclo adaptativo',
    cycleTitle: 'Cada treino deixa o próximo mais inteligente.',
    cycleSub:
      'O KYRON transforma registros isolados em uma sequência de decisões. Você executa; o sistema preserva contexto e ajusta a progressão.',
    cycleSteps: [
      {
        title: 'O Kyron planeja',
        text: 'Objetivo, nível, frequência, equipamentos e limitações entram no plano inicial.',
      },
      {
        title: 'Você executa',
        text: 'Séries, carga, descanso e esforço ficam no mesmo fluxo, pensado para uso com uma mão.',
      },
      {
        title: 'O sistema interpreta',
        text: 'Desempenho, RPE, consistência e histórico passam a formar memória de treino.',
      },
      {
        title: 'O próximo treino evolui',
        text: 'Carga, repetições e alternativas consideram o que realmente aconteceu na sessão.',
      },
    ],
    productEyebrow: 'Durante o treino',
    productTitle: 'Somente o que importa agora.',
    productSub:
      'A interface prioriza a próxima ação, mantém a sessão fluida e explica o motivo por trás de cada recomendação.',
    productReasons: [
      'Carga anterior e sugestão lado a lado',
      'RPE integrado à decisão de progressão',
      'Descanso acessível sem sair da série',
      'Continuidade mesmo com conexão instável',
    ],
    recommendation: 'Recomendação explicada',
    recommendationText: 'Mantenha 84 kg. Sua última série ficou dentro do esforço-alvo e a técnica permaneceu estável.',
    nextExercise: 'Próximo exercício',
    nextExerciseName: 'Crucifixo com halteres',
    adaptiveRest: 'Descanso adaptativo',
    differenceEyebrow: 'Mais que uma ficha digital',
    differenceTitle: 'Não é uma rotina pronta disfarçada de inteligência.',
    differenceSub:
      'O KYRON foi construído para manter o contexto entre sessões — não apenas armazenar números.',
    comparisonLeft: 'Aplicativo comum',
    comparisonRight: 'KYRON',
    comparisons: [
      ['Entrega uma sequência fixa', 'Aprende com as sessões'],
      ['Exibe apenas números', 'Explica a próxima decisão'],
      ['Perde contexto ao trocar exercício', 'Busca substitutos compatíveis'],
      ['Depende de conexão constante', 'Mantém continuidade offline'],
      ['Mostra histórico', 'Usa histórico para progredir'],
    ],
    progressEyebrow: 'Evolução visível',
    progressTitle: 'Menos memória solta. Mais trajetória.',
    progressSub:
      'Volume, carga, consistência e recuperação aparecem como sinais conectados — para você entender o que mudou e por quê.',
    metrics: [
      ['Volume semanal', '+8,4%'],
      ['Carga de trabalho', '+5 kg'],
      ['Consistência', '4 semanas'],
      ['Recuperação média', '82%'],
    ],
    chartLabel: 'Volume de treino · últimas 8 semanas',
    trustEyebrow: 'Privacidade e continuidade',
    trustTitle: 'Seus dados são seus. Seu treino não para.',
    trustItems: [
      ['Sessão protegida', 'Acesso autenticado e dados isolados por usuário.'],
      ['Continuidade offline', 'A sessão permanece utilizável durante falhas de conexão.'],
      ['Decisões transparentes', 'Recomendações mostram o sinal utilizado pelo sistema.'],
    ],
    finalEyebrow: 'Seu próximo treino começa aqui',
    finalTitleTop: 'Pare de repetir treinos.',
    finalTitleAccent: 'Comece a construir evolução.',
    finalSub: 'Crie seu perfil, faça o primeiro registro e deixe cada sessão melhorar a seguinte.',
    finalCta: 'Criar meu plano grátis',
    finalNote: 'Sem cartão · Leva poucos minutos · Funciona no celular',
  },
  EN: {
    login: 'Sign in',
    start: 'Start free',
    navProduct: 'Product',
    navMethod: 'How it works',
    navDifference: 'Why Kyron',
    eyebrow: 'Adaptive training system',
    headlineTop: 'Your training should not',
    headlineAccent: 'start from zero',
    headlineBottom: 'every single day.',
    subheadline:
      'KYRON learns from every set, understands your performance and shows the next step so you can keep progressing — without spreadsheets or guesswork.',
    primaryCta: 'Build my free workout',
    secondaryCta: 'See the workout in action',
    reassurance: 'Free to start · No card · Setup takes only a few minutes',
    heroNote: 'Every workout prepares the next one.',
    liveLabel: 'Live session',
    exercise: 'Incline bench press',
    setLabel: 'Set',
    previousLabel: 'Previous',
    suggestedLabel: 'Kyron suggestion',
    repsLabel: 'Repetitions',
    rpeLabel: 'Perceived RPE',
    finishSet: 'Complete set',
    reason: 'Load maintained because the previous set ended at RPE 8.',
    ticker: ['ADAPTIVE PLAN', 'RPE PROGRESSION', 'OFFLINE RESUME', 'SMART SUBSTITUTIONS', 'REAL HISTORY'],
    cycleEyebrow: 'Adaptive cycle',
    cycleTitle: 'Every workout makes the next one smarter.',
    cycleSub:
      'KYRON turns isolated logs into a sequence of decisions. You perform; the system preserves context and adjusts progression.',
    cycleSteps: [
      {
        title: 'Kyron plans',
        text: 'Goal, level, frequency, equipment and limitations shape the initial plan.',
      },
      {
        title: 'You perform',
        text: 'Sets, load, rest and effort stay in one flow designed for one-handed use.',
      },
      {
        title: 'The system interprets',
        text: 'Performance, RPE, consistency and history become training memory.',
      },
      {
        title: 'The next workout evolves',
        text: 'Load, repetitions and alternatives reflect what actually happened in the session.',
      },
    ],
    productEyebrow: 'During the workout',
    productTitle: 'Only what matters right now.',
    productSub:
      'The interface prioritizes the next action, keeps the session moving and explains the reason behind every recommendation.',
    productReasons: [
      'Previous load and suggestion side by side',
      'RPE connected to progression decisions',
      'Rest control available without leaving the set',
      'Continuity even with an unstable connection',
    ],
    recommendation: 'Explained recommendation',
    recommendationText: 'Keep 84 kg. Your previous set stayed within the target effort and technique remained stable.',
    nextExercise: 'Next exercise',
    nextExerciseName: 'Dumbbell fly',
    adaptiveRest: 'Adaptive rest',
    differenceEyebrow: 'More than a digital routine',
    differenceTitle: 'Not a fixed plan disguised as intelligence.',
    differenceSub:
      'KYRON is built to preserve context across sessions — not merely store numbers.',
    comparisonLeft: 'Common app',
    comparisonRight: 'KYRON',
    comparisons: [
      ['Delivers a fixed sequence', 'Learns from sessions'],
      ['Displays numbers only', 'Explains the next decision'],
      ['Loses context after substitutions', 'Finds compatible alternatives'],
      ['Depends on constant connection', 'Keeps working offline'],
      ['Shows history', 'Uses history to progress'],
    ],
    progressEyebrow: 'Visible progress',
    progressTitle: 'Less scattered memory. More trajectory.',
    progressSub:
      'Volume, load, consistency and recovery appear as connected signals — so you understand what changed and why.',
    metrics: [
      ['Weekly volume', '+8.4%'],
      ['Working load', '+5 kg'],
      ['Consistency', '4 weeks'],
      ['Average recovery', '82%'],
    ],
    chartLabel: 'Training volume · last 8 weeks',
    trustEyebrow: 'Privacy and continuity',
    trustTitle: 'Your data is yours. Your training keeps moving.',
    trustItems: [
      ['Protected session', 'Authenticated access and data isolated by user.'],
      ['Offline continuity', 'The session remains usable through connection failures.'],
      ['Transparent decisions', 'Recommendations show the signal used by the system.'],
    ],
    finalEyebrow: 'Your next workout starts here',
    finalTitleTop: 'Stop repeating workouts.',
    finalTitleAccent: 'Start building progress.',
    finalSub: 'Create your profile, log the first set and let every session improve the next one.',
    finalCta: 'Create my free plan',
    finalNote: 'No card · Takes only a few minutes · Works on mobile',
  },
};

const chartHeights = [28, 36, 33, 48, 52, 63, 68, 82];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('kyron_lang') : null;
    return saved === 'EN' ? 'EN' : 'PT';
  });

  const t = copy[lang];

  const setLanguage = (value: Lang) => {
    setLang(value);
    if (typeof window !== 'undefined') window.localStorage.setItem('kyron_lang', value);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-950 selection:bg-[#7BA7FF]/30 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-48 top-10 h-[520px] w-[520px] rounded-full bg-[#7BA7FF]/12 blur-[150px]" />
        <div className="absolute -right-44 top-[48rem] h-[500px] w-[500px] rounded-full bg-violet-300/10 blur-[150px]" />
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button type="button" onClick={onStart} className="flex items-center gap-3 text-left" aria-label="KYRON OS">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
              <img src={kyronLogo} alt="KYRON OS" className="h-11 w-11 scale-150 object-contain" />
            </span>
            <span>
              <span className="block font-mono text-sm font-black tracking-[-0.03em] text-slate-950">
                KYRON<span className="text-[#7BA7FF]">.</span>
              </span>
              <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">OS</span>
            </span>
          </button>

          <div className="hidden items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 lg:flex">
            <a href="#product" className="transition hover:text-slate-950">{t.navProduct}</a>
            <a href="#method" className="transition hover:text-slate-950">{t.navMethod}</a>
            <a href="#difference" className="transition hover:text-slate-950">{t.navDifference}</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1">
              {(['PT', 'EN'] as Lang[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={`rounded-full px-2.5 py-1 text-[9px] font-black transition ${
                    lang === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-pressed={lang === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <button type="button" onClick={onLogin} className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-950 sm:block">
              {t.login}
            </button>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#7BA7FF] to-[#818CF8] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-[#7BA7FF]/25 transition hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.start}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-68px)] max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-16 pt-12 lg:grid-cols-12 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#7BA7FF]/25 bg-[#7BA7FF]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#3566B8]"
            >
              <Sparkles size={13} />
              {t.eyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="max-w-5xl text-[3rem] font-black leading-[0.91] tracking-[-0.065em] text-slate-950 sm:text-7xl lg:text-[5.85rem]"
            >
              <span className="block">{t.headlineTop}</span>
              <span className="block font-serif font-semibold italic tracking-[-0.04em] text-[#6C8FE8]">{t.headlineAccent}</span>
              <span className="block">{t.headlineBottom}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg"
            >
              {t.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-br from-[#7BA7FF] to-[#818CF8] px-7 text-[11px] font-black uppercase tracking-[0.17em] text-white shadow-[0_18px_50px_rgba(123,167,255,0.28)] transition hover:-translate-y-1 active:translate-y-0"
              >
                {t.primaryCta}
                <ArrowRight size={16} />
              </button>
              <a
                href="#product"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white/80 px-7 text-[11px] font-black uppercase tracking-[0.17em] text-slate-700 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:bg-white"
              >
                <Play size={15} />
                {t.secondaryCta}
              </a>
            </motion.div>

            <div className="mt-5 flex items-start gap-2 text-xs font-semibold leading-6 text-slate-500">
              <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#6C8FE8]" />
              <span>{t.reassurance}</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12, type: 'spring', damping: 24, stiffness: 120 }}
            className="relative lg:col-span-5"
          >
            <div className="absolute -inset-8 rounded-[3rem] bg-[#7BA7FF]/14 blur-3xl" />
            <div className="relative mx-auto max-w-[490px] rounded-[2.25rem] border border-slate-200 bg-white p-3 shadow-[0_35px_90px_rgba(15,23,42,0.12)] sm:p-4">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-3 pt-1">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#3566B8]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#7BA7FF]" />
                  {t.liveLabel}
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-300">KYRON / 04</span>
              </div>

              <div className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t.setLabel} 3 / 4</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">{t.exercise}</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7BA7FF]/25 bg-[#7BA7FF]/10 text-[#5578D2]">
                    <Dumbbell size={21} />
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.previousLabel}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-slate-500">82 kg</p>
                  </div>
                  <div className="rounded-2xl border border-[#7BA7FF]/25 bg-[#EEF4FF] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5578D2]">{t.suggestedLabel}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-slate-950">84 kg</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.repsLabel}</p>
                    <p className="mt-3 font-mono text-3xl font-bold text-slate-950">8</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.rpeLabel}</p>
                    <p className="mt-3 font-mono text-3xl font-bold text-slate-950">8</p>
                  </div>
                </div>

                <button className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#7BA7FF] to-[#818CF8] text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#7BA7FF]/20 transition hover:-translate-y-0.5">
                  {t.finishSet}
                  <ArrowRight size={16} />
                </button>

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#7BA7FF]/20 bg-[#F2F6FF] p-4">
                  <Zap size={16} className="mt-0.5 shrink-0 text-[#5578D2]" />
                  <p className="text-xs font-semibold leading-6 text-slate-600">{t.reason}</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-6 hidden w-44 rounded-3xl border border-slate-200 bg-white p-4 text-slate-950 shadow-xl md:block">
              <div className="flex items-center justify-between">
                <Flame size={17} className="text-[#5578D2]" />
                <span className="font-mono text-[9px] font-bold text-slate-300">STREAK</span>
              </div>
              <p className="mt-5 text-3xl font-black tracking-[-0.05em]">7 dias</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{t.heroNote}</p>
            </div>

            <div className="absolute -right-5 top-14 hidden w-40 rounded-3xl border border-[#7BA7FF]/20 bg-white p-4 shadow-xl md:block">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#5578D2]">
                <TrendingUp size={14} />
                +8,4%
              </div>
              <div className="mt-4 flex h-16 items-end gap-1">
                {[18, 29, 24, 38, 42, 52, 58].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t-sm bg-[#7BA7FF]/70" style={{ height: `${height}px` }} />
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-slate-200/70 bg-white/65 py-4 backdrop-blur-xl" aria-label="KYRON capabilities">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-3 px-5 lg:px-8">
            {t.ticker.map((item, index) => (
              <React.Fragment key={item}>
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">{item}</span>
                {index < t.ticker.length - 1 && <span className="hidden h-1 w-1 rounded-full bg-[#7BA7FF] sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section id="method" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.cycleEyebrow}</p>
              <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-6xl">
                {t.cycleTitle}
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-xl text-base font-medium leading-8 text-slate-600">{t.cycleSub}</p>
            </div>
          </div>

          <div className="relative mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-8 right-8 top-8 hidden h-px bg-gradient-to-r from-transparent via-[#7BA7FF]/60 to-transparent lg:block" />
            {t.cycleSteps.map((step, index) => {
              const icons = [Target, Dumbbell, Activity, RefreshCcw];
              const Icon = icons[index];
              return (
                <div key={step.title} className="group relative rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[#7BA7FF]/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:min-h-[300px] lg:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-300">0{index + 1}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7BA7FF]/10 text-[#5578D2]">
                      <Icon size={19} />
                    </div>
                  </div>
                  <div className="mt-16 lg:mt-24">
                    <h3 className="text-xl font-black tracking-[-0.035em] text-slate-950">{step.title}</h3>
                    <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{step.text}</p>
                  </div>
                  <ChevronRight className="absolute bottom-7 right-7 text-slate-200 transition group-hover:translate-x-1 group-hover:text-[#7BA7FF]" size={18} />
                </div>
              );
            })}
          </div>
        </section>

        <section id="product" className="border-y border-[#E9E4D8] bg-[#F7F4EA] text-slate-950">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-32">
            <div className="lg:col-span-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.productEyebrow}</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl">{t.productTitle}</h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600">{t.productSub}</p>

              <div className="mt-9 space-y-4">
                {t.productReasons.map((item) => (
                  <div key={item} className="flex items-start gap-3 border-b border-slate-900/10 pb-4">
                    <Check size={17} className="mt-0.5 shrink-0 text-[#5578D2]" />
                    <span className="text-sm font-bold leading-6 text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative rounded-[2.25rem] border border-slate-200 bg-white p-3 shadow-[0_35px_90px_rgba(15,23,42,0.11)] sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#7BA7FF]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">KYRON WORKOUT PLAYER</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-300">SYNC / READY</span>
                </div>

                <div className="grid gap-3 py-3 lg:grid-cols-12">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:col-span-8 sm:p-7">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#5578D2]">{t.setLabel} 3 / 4</p>
                        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{t.exercise}</h3>
                      </div>
                      <div className="font-mono text-4xl font-bold text-slate-200 sm:text-6xl">03</div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.previousLabel}</p>
                        <p className="mt-3 font-mono text-3xl font-bold text-slate-500">82 kg</p>
                      </div>
                      <div className="rounded-2xl border border-[#7BA7FF]/25 bg-[#EEF4FF] p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5578D2]">{t.suggestedLabel}</p>
                        <p className="mt-3 font-mono text-3xl font-bold text-slate-950">84 kg</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.repsLabel}</p>
                        <p className="mt-3 font-mono text-3xl font-bold text-slate-950">8</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.rpeLabel}</p>
                        <p className="mt-3 font-mono text-3xl font-bold text-slate-950">8</p>
                      </div>
                    </div>

                    <button className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#7BA7FF] to-[#818CF8] text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#7BA7FF]/20 transition hover:-translate-y-0.5">
                      {t.finishSet}
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="grid gap-3 lg:col-span-4">
                    <div className="rounded-3xl border border-[#7BA7FF]/25 bg-[#F1F5FF] p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7BA7FF]/15 text-[#5578D2]">
                          <Zap size={17} />
                        </div>
                        <span className="font-mono text-[8px] text-slate-300">WHY</span>
                      </div>
                      <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#5578D2]">{t.recommendation}</p>
                      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{t.recommendationText}</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t.nextExercise}</p>
                      <p className="mt-3 text-base font-black tracking-[-0.02em] text-slate-950">{t.nextExerciseName}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.adaptiveRest}</span>
                        <span className="font-mono text-sm font-bold text-[#5578D2]">01:30</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <WifiOff size={17} className="shrink-0 text-[#5578D2]" />
                      <p className="text-xs font-semibold leading-5 text-slate-500">Offline queue ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="difference" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.differenceEyebrow}</p>
              <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-6xl">{t.differenceTitle}</h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-base font-medium leading-8 text-slate-600">{t.differenceSub}</p>
            </div>
          </div>

          <div className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <div className="grid grid-cols-2 bg-slate-50 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
              <div className="border-r border-slate-200 p-4 sm:p-5">{t.comparisonLeft}</div>
              <div className="p-4 text-[#5578D2] sm:p-5">{t.comparisonRight}</div>
            </div>
            {t.comparisons.map(([common, kyron], index) => (
              <div key={common} className={`grid grid-cols-2 ${index !== t.comparisons.length - 1 ? 'border-b border-slate-200' : ''}`}>
                <div className="border-r border-slate-200 p-4 text-sm font-semibold leading-6 text-slate-400 sm:p-6">{common}</div>
                <div className="flex items-start gap-3 bg-[#7BA7FF]/[0.045] p-4 text-sm font-bold leading-6 text-slate-700 sm:p-6">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#6C8FE8]" />
                  {kyron}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-[#DDE7FB] bg-[#F1F5FF]">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-32">
            <div className="lg:col-span-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.progressEyebrow}</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-6xl">{t.progressTitle}</h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600">{t.progressSub}</p>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {t.metrics.map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur-xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-3 font-mono text-2xl font-bold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[2rem] border border-white bg-white p-5 shadow-[0_25px_70px_rgba(73,101,160,0.12)] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t.chartLabel}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-slate-950">32.480 kg</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#7BA7FF]/25 bg-[#7BA7FF]/10 text-[#5578D2]">
                    <BarChart3 size={19} />
                  </div>
                </div>

                <div className="relative mt-10 h-64 border-b border-l border-slate-200 px-3 pb-3">
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-3">
                    {[0, 1, 2, 3].map((line) => <span key={line} className="block border-t border-dashed border-slate-200" />)}
                  </div>
                  <div className="relative z-10 flex h-full items-end gap-2 sm:gap-4">
                    {chartHeights.map((height, index) => (
                      <div key={index} className="group flex h-full flex-1 items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          viewport={{ once: true, amount: 0.35 }}
                          transition={{ duration: 0.65, delay: index * 0.06 }}
                          className={`w-full rounded-t-md ${index === chartHeights.length - 1 ? 'bg-[#7BA7FF]' : 'bg-slate-200'} transition group-hover:bg-[#8EAEF6]`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.17em] text-slate-300">
                  <span>W01</span><span>W02</span><span>W03</span><span>W04</span><span>W05</span><span>W06</span><span>W07</span><span>W08</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.trustEyebrow}</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-6xl">{t.trustTitle}</h2>
            </div>
            <div className="grid gap-4 lg:col-span-7">
              {t.trustItems.map(([title, text], index) => {
                const icons = [Fingerprint, WifiOff, ShieldCheck];
                const Icon = icons[index];
                return (
                  <div key={title} className="flex items-start gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#7BA7FF]/25 bg-[#7BA7FF]/10 text-[#5578D2]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-black tracking-[-0.02em] text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2.5rem] border border-[#7BA7FF]/20 bg-gradient-to-br from-[#EAF1FF] via-white to-[#F7F4EA] px-5 py-20 text-slate-950 shadow-[0_25px_80px_rgba(73,101,160,0.11)] sm:px-10 lg:px-16 lg:py-24">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5578D2]">{t.finalEyebrow}</p>
                <h2 className="mt-5 text-4xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                  <span className="block">{t.finalTitleTop}</span>
                  <span className="block font-serif font-semibold italic text-[#6C8FE8]">{t.finalTitleAccent}</span>
                </h2>
                <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600">{t.finalSub}</p>
              </div>
              <div className="lg:col-span-4 lg:text-right">
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-br from-[#7BA7FF] to-[#818CF8] px-7 text-[11px] font-black uppercase tracking-[0.17em] text-white shadow-lg shadow-[#7BA7FF]/25 transition hover:-translate-y-1 active:translate-y-0 sm:w-auto"
                >
                  {t.finalCta}
                  <ArrowRight size={16} />
                </button>
                <p className="mt-4 text-xs font-bold leading-6 text-slate-400">{t.finalNote}</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
              <img src={kyronLogo} alt="KYRON OS" className="h-9 w-9 scale-150 object-contain" />
            </span>
            <span>KYRON OS · Human Performance System</span>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={onLogin} className="transition hover:text-slate-950">{t.login}</button>
            <button type="button" onClick={onStart} className="transition hover:text-slate-950">{t.start}</button>
          </div>
        </footer>
      </main>
    </div>
  );
};
