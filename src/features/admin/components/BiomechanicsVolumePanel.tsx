import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, 
  Scale, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Layers, 
  Calendar, 
  TrendingUp,
  Flame,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { PremiumProtocolExercise } from '../../../types/protocol_4_0';
import { Exercise } from '../../../types';
import { getExerciseBiomechanics } from '../../../lib/exercises/exerciseTaxonomy';
import { motion, AnimatePresence } from 'motion/react';

interface BiomechanicsVolumePanelProps {
  exercises: Record<string, PremiumProtocolExercise[]>;
  exerciseLibrary: Exercise[];
  selectedDayId: string | null;
  days: { id: string; title: string; order_index: number }[];
}

type ScopeType = 'day' | 'all' | 'compare';

interface ListStats {
  totalSets: number;
  unclassifiedCount: number;
  unclassifiedNames: string[];
  mainGroups: Record<string, number>;
  subGroups: Record<string, number>;
  synergists: Record<string, number>;
  stabilizers: Record<string, number>;
  patterns: Record<string, number>;
  patternAgonistCount: Record<string, { count: number; names: string[] }>;
}

export const BiomechanicsVolumePanel: React.FC<BiomechanicsVolumePanelProps> = ({
  exercises,
  exerciseLibrary,
  selectedDayId,
  days
}) => {
  const [scope, setScope] = useState<ScopeType>('day');
  const [expandedSection, setExpandedSection] = useState<string | null>('volume');

  // Exercise ID to Full Details mapping for rapid O(1) lookups
  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    if (exerciseLibrary) {
      exerciseLibrary.forEach(ex => map.set(ex.id, ex));
    }
    return map;
  }, [exerciseLibrary]);

  // Helper to retrieve biomechanics safely
  const getBiomechanics = (exercise: Exercise) => {
    if (exercise.biomechanics) {
      return exercise.biomechanics;
    }
    return getExerciseBiomechanics(exercise);
  };

  // Perform calculations for a specific list of protocol exercises
  const calculateListStats = (pExList: PremiumProtocolExercise[]): ListStats => {
    let totalSets = 0;
    let unclassifiedCount = 0;
    const unclassifiedNames: string[] = [];
    const setsEstimatedCount = 0; // tracking if sets fallback was used

    const mainGroups: Record<string, number> = {};
    const subGroups: Record<string, number> = {};
    const synergists: Record<string, number> = {};
    const stabilizers: Record<string, number> = {};
    const patterns: Record<string, number> = {};

    // For redundancy check
    const patternAgonistCount: Record<string, { count: number; names: string[] }> = {};

    pExList.forEach(pEx => {
      const ex = exerciseMap.get(pEx.exercise_id);
      let sets = Number(pEx.sets);
      if (isNaN(sets) || sets <= 0) {
        sets = 3; // fallback estimated sets
      }
      totalSets += sets;

      if (!ex) {
        unclassifiedCount++;
        unclassifiedNames.push(`ID Desconhecido (${pEx.exercise_id})`);
        return;
      }

      const bio = getBiomechanics(ex);
      if (!bio) {
        unclassifiedCount++;
        unclassifiedNames.push(ex.name);
        return;
      }

      // 1. Main Group
      const primary = bio.primary_group || ex.muscle_group || 'Não classificado';
      mainGroups[primary] = (mainGroups[primary] || 0) + sets * 1.0;

      // 2. Agonists / Subgroups
      const agonists = bio.agonist_muscles || [];
      if (agonists.length > 0) {
        agonists.forEach(ag => {
          subGroups[ag] = (subGroups[ag] || 0) + sets * 1.0;
        });
      } else {
        // Fallback to legacy muscle_group
        const legacyMg = ex.muscle_group || 'Não classificado';
        subGroups[legacyMg] = (subGroups[legacyMg] || 0) + sets * 1.0;
      }

      // 3. Synergists
      const syns = bio.synergist_muscles || [];
      syns.forEach(sy => {
        synergists[sy] = (synergists[sy] || 0) + sets * 0.5;
      });

      // 4. Stabilizers
      const stabs = bio.stabilizer_muscles || [];
      stabs.forEach(st => {
        stabilizers[st] = (stabilizers[st] || 0) + sets * 0.25;
      });

      // 5. Movement Patterns
      const pat = bio.movement_pattern || 'Não classificado';
      patterns[pat] = (patterns[pat] || 0) + sets;

      // Group for redundancy check: unique combo of pattern + first agonist muscle
      const mainAgonist = agonists[0] || ex.muscle_group || 'Outro';
      const comboKey = `${pat} | ${mainAgonist}`;
      if (!patternAgonistCount[comboKey]) {
        patternAgonistCount[comboKey] = { count: 0, names: [] };
      }
      patternAgonistCount[comboKey].count += 1;
      patternAgonistCount[comboKey].names.push(ex.name);
    });

    return {
      totalSets,
      unclassifiedCount,
      unclassifiedNames,
      mainGroups,
      subGroups,
      synergists,
      stabilizers,
      patterns,
      patternAgonistCount
    };
  };

  // Computes active scope statistics
  const stats = useMemo<ListStats>(() => {
    if (scope === 'day') {
      const list = selectedDayId ? (exercises[selectedDayId] || []) : [];
      return calculateListStats(list);
    } else {
      // Scope complete: combine all exercises across all days
      const allList: PremiumProtocolExercise[] = [];
      Object.values(exercises).forEach(list => {
        if (Array.isArray(list)) {
          allList.push(...list);
        }
      });
      return calculateListStats(allList);
    }
  }, [exercises, exerciseMap, selectedDayId, scope]);

  // Compute compare stats day-by-day
  const compareStats = useMemo(() => {
    if (scope !== 'compare') return [];
    return days.map(day => {
      const list = exercises[day.id] || [];
      const calculated = calculateListStats(list);
      
      // Get top 3 muscles by volume
      const topMuscles = Object.keys(calculated.mainGroups)
        .sort((a, b) => calculated.mainGroups[b] - calculated.mainGroups[a])
        .slice(0, 3)
        .map((name) => ({ name, sets: calculated.mainGroups[name] }));

      return {
        dayId: day.id,
        title: day.title,
        totalSets: calculated.totalSets,
        topMuscles
      };
    });
  }, [exercises, days, scope, exerciseMap]);

  // Generate deterministic alerts/insights (does NOT use AI, respects Phase 5 guidelines)
  const alerts = useMemo(() => {
    const list: { type: 'info' | 'attention' | 'warning'; text: string; details?: string }[] = [];
    if (stats.totalSets === 0) {
      return [{ type: 'info' as const, text: 'Nenhum exercício ativo no escopo selecionado.' }];
    }

    // Helper variables for clean checks
    const pushVolume = stats.patterns['push'] || 0;
    const pullVolume = stats.patterns['pull'] || 0;

    const peitoral = stats.mainGroups['Peitoral'] || stats.mainGroups['Peito'] || 0;
    const costas = stats.mainGroups['Costas'] || stats.mainGroups['Dorsais'] || 0;
    const quadriceps = stats.subGroups['Quadríceps'] || stats.subGroups['quadríceps'] || 0;
    const posterior = stats.subGroups['Posterior de coxa'] || stats.subGroups['Isquiotibiais'] || stats.subGroups['isquiotibiais'] || 0;
    const gluteos = stats.mainGroups['Glúteos'] || stats.mainGroups['glúteos'] || stats.subGroups['Glúteo máximo'] || 0;

    const biceps = stats.subGroups['Bíceps braquial'] || stats.subGroups['Bíceps'] || 0;
    const triceps = stats.subGroups['Tríceps braquial'] || stats.subGroups['Tríceps'] || 0;

    const deltAnterior = stats.subGroups['Deltoide anterior'] || 0;
    const deltLateral = stats.subGroups['Deltoide lateral'] || 0;
    const deltPosterior = stats.subGroups['Deltoide posterior'] || 0;

    // 1. Push vs Pull Balance Check
    if (pushVolume > pullVolume * 1.5 && pushVolume > 6) {
      list.push({
        type: 'warning',
        text: 'Desequilíbrio: Empurrar muito acima de Puxar',
        details: `Volume de empurrar (${pushVolume} s.) está significativamente maior que puxar (${pullVolume} s.). Considere acrescentar remadas ou puxadas para equilibrar a articulação do ombro.`
      });
    }

    // 2. Quadríceps vs Posterior de Coxa Balance Check
    if (quadriceps > posterior * 1.8 && quadriceps > 6) {
      list.push({
        type: 'warning',
        text: 'Posterior de coxa está pouco representado',
        details: `O volume de Quadríceps (${quadriceps} s.) supera bastante o de Isquiotibiais (${posterior} s.). Considere adicionar mesa ou cadeira flexora para equilibrar a coxa.`
      });
    }

    // 3. Excess Deltoide Anterior Synergy
    if (deltAnterior > 15) {
      list.push({
        type: 'attention',
        text: 'Muito volume indireto em Deltoide Anterior',
        details: `O deltoide anterior recebe ${deltAnterior} séries efetivas de estímulo acumulado (direto + sinergia). Monitore o desgaste articular nos exercícios de empurrar.`
      });
    }

    // 4. Sub-represented Deltoide Posterior
    if (deltPosterior < (deltAnterior + deltLateral) * 0.25 && (deltAnterior + deltLateral) > 8) {
      list.push({
        type: 'attention',
        text: 'Deltoide posterior parece sub-representado',
        details: `O volume de deltoide posterior (${deltPosterior} s.) está muito menor que as porções anterior/lateral (${(deltAnterior + deltLateral).toFixed(1)} s.). Considere acrescentar crucifixo inverso ou face pull.`
      });
    }

    // 5. Redundancy detection (same pattern + same first agonist in same day/scope)
    Object.keys(stats.patternAgonistCount).forEach((key) => {
      const value = stats.patternAgonistCount[key];
      if (value.count >= 3) {
        const [patName, agName] = key.split(' | ');
        list.push({
          type: 'info',
          text: `Possível redundância: ${agName}`,
          details: `Há ${value.count} exercícios com padrão "${patName}" focados em ${agName} no mesmo bloco (${value.names.join(', ')}). Considere alternar o padrão de movimento ou plano de execução.`
        });
      }
    });

    // 6. General high weekly volume warning
    if (scope === 'all' && stats.totalSets > 65) {
      list.push({
        type: 'attention',
        text: 'Volume geral elevado',
        details: `Este protocolo acumula ${stats.totalSets} séries semanais. Certifique-se de que o aluno possui nível de adaptabilidade compatível.`
      });
    }

    // If perfectly balanced
    if (list.length === 0) {
      list.push({
        type: 'info',
        text: 'Excelente equilíbrio biomecânico estruturado',
        details: 'As relações de volume direto/indireto e simetria de padrões de movimento estão perfeitamente ajustadas.'
      });
    }

    return list;
  }, [stats, scope]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-800" id="biomechanics-volume-panel">
      {/* Scope Selector Tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-150 shrink-0">
        <button
          type="button"
          onClick={() => setScope('day')}
          className={`flex-1 py-1.5 px-2 text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none cursor-pointer ${
            scope === 'day' 
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
              : 'bg-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar size={10} />
          Dia Ativo
        </button>
        <button
          type="button"
          onClick={() => setScope('all')}
          className={`flex-1 py-1.5 px-2 text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none cursor-pointer ${
            scope === 'all' 
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
              : 'bg-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers size={10} />
          Completo
        </button>
        <button
          type="button"
          onClick={() => setScope('compare')}
          className={`flex-1 py-1.5 px-2 text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center justify-center gap-1 border-none cursor-pointer ${
            scope === 'compare' 
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
              : 'bg-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Scale size={10} />
          Comparar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-slate-100">
        {scope === 'compare' ? (
          /* COMPARATIVE VIEW BETWEEN DAYS */
          <div className="p-4 space-y-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Resumo de Estímulo por Dia</span>
            {compareStats.length === 0 ? (
              <p className="text-[9px] text-slate-400 font-medium italic text-center py-6">Nenhum treino cadastrado.</p>
            ) : (
              <div className="space-y-2.5">
                {compareStats.map((dayStat) => (
                  <div key={dayStat.dayId} className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{dayStat.title}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {dayStat.totalSets} séries
                      </span>
                    </div>

                    {dayStat.totalSets === 0 ? (
                      <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider italic">Sem exercícios adicionados</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dayStat.topMuscles.map((m, i) => (
                          <div key={i} className="flex items-center gap-1 bg-white border border-slate-200/60 rounded-lg px-2 py-1 text-[8px] font-extrabold text-slate-600 uppercase tracking-wide shadow-sm">
                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                            <span>{m.name}</span>
                            <span className="text-slate-400 font-mono font-medium ml-0.5">{m.sets}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE / COMPLETE SCOPE ANALYTICS */
          <>
            {/* Header / Meta statistics */}
            <div className="p-4 bg-slate-50/25 grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Volume Analisado</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-17px font-black text-slate-800 leading-none">{stats.totalSets}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-normal">Séries</span>
                </div>
              </div>
              <div className="bg-white border border-slate-150 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Erros / Incompletos</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-17px font-black leading-none ${stats.unclassifiedCount > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {stats.unclassifiedCount}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-normal">itens</span>
                </div>
              </div>

              {stats.unclassifiedCount > 0 && (
                <div className="col-span-2 bg-amber-50/40 border border-amber-100 p-2 rounded-xl text-[8px] font-semibold text-amber-700 leading-relaxed uppercase tracking-wider flex items-start gap-1.5">
                  <Info size={9} className="shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span>{stats.unclassifiedCount} exercício(s) sem classificação completa ({stats.unclassifiedNames.slice(0, 3).join(', ')}{stats.unclassifiedNames.length > 3 ? '...' : ''}). Fallback visual aplicado.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 1: Major muscle groups volume distribution */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Distribuição por Grupo Muscular</span>
                <span className="text-[7px] font-bold text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">Peso: Agonista (100%)</span>
              </div>
              
              {Object.keys(stats.mainGroups).length === 0 ? (
                <p className="text-[9px] text-slate-400 font-medium italic text-center py-4">Prescreva exercícios para calcular.</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.keys(stats.mainGroups)
                    .sort((a, b) => stats.mainGroups[b] - stats.mainGroups[a])
                    .map((group) => {
                      const val = stats.mainGroups[group];
                      const percentage = Math.min(100, stats.totalSets > 0 ? (val / stats.totalSets) * 100 : 0);
                      return (
                        <div key={group} className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 font-black">
                              <Dumbbell size={9} className="text-slate-400" />
                              {group}
                            </span>
                            <span className="text-slate-400 font-mono font-extrabold">{val.toFixed(1)} séries</span>
                          </div>
                          <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-slate-800 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 2: Detailed agonist subgroups */}
            <div className="p-4 space-y-3 bg-slate-50/15">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Subgrupos Agonistas Detalhados</span>
              {Object.keys(stats.subGroups).length === 0 ? (
                <p className="text-[9px] text-slate-400 font-medium italic text-center py-4">Sem dados de subgrupos agonistas.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(stats.subGroups)
                    .sort((a, b) => stats.subGroups[b] - stats.subGroups[a])
                    .map((sub) => {
                      const val = stats.subGroups[sub];
                      return (
                        <div key={sub} className="bg-white border border-slate-150 p-2 rounded-xl flex flex-col justify-between shadow-xs">
                          <span className="text-[8px] font-extrabold text-slate-600 uppercase tracking-wide truncate">{sub}</span>
                          <span className="text-[11px] font-mono font-black text-slate-800 mt-0.5">{val.toFixed(1)} s.</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 3: Synergist recruiting */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sinergistas mais Recrutados</span>
                <span className="text-[7px] font-bold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">Série Ponderada (50%)</span>
              </div>
              {Object.keys(stats.synergists).length === 0 ? (
                <p className="text-[9px] text-slate-400 font-medium italic text-center py-4">Nenhum estímulo sinergista detectado.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(stats.synergists)
                    .sort((a, b) => stats.synergists[b] - stats.synergists[a])
                    .slice(0, 8)
                    .map((syn) => {
                      const val = stats.synergists[syn];
                      return (
                        <div key={syn} className="flex items-center gap-1 bg-amber-50/35 border border-amber-100/60 rounded-xl px-2 py-1 text-[8px] font-extrabold text-amber-800 uppercase tracking-wide">
                          <Flame size={8} className="text-amber-500" />
                          <span>{syn}</span>
                          <span className="font-mono text-amber-500 font-black ml-0.5">{val.toFixed(1)}s</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 4: Stabilizers recruiting */}
            <div className="p-4 space-y-3 bg-slate-50/15">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estabilizadores mais Exigidos</span>
                <span className="text-[7px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">Estabilização (25%)</span>
              </div>
              {Object.keys(stats.stabilizers).length === 0 ? (
                <p className="text-[9px] text-slate-400 font-medium italic text-center py-4">Nenhuma exigência estabilizadora detectada.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(stats.stabilizers)
                    .sort((a, b) => stats.stabilizers[b] - stats.stabilizers[a])
                    .slice(0, 8)
                    .map((stab) => {
                      const val = stats.stabilizers[stab];
                      return (
                        <div key={stab} className="flex items-center gap-1 bg-emerald-50/35 border border-emerald-100/60 rounded-xl px-2 py-1 text-[8px] font-extrabold text-emerald-800 uppercase tracking-wide">
                          <CheckCircle2 size={8} className="text-emerald-500" />
                          <span>{stab}</span>
                          <span className="font-mono text-emerald-500 font-black ml-0.5">{val.toFixed(1)}s</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 5: Movement Patterns */}
            <div className="p-4 space-y-3">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Distribuição por Padrão de Movimento</span>
              {Object.keys(stats.patterns).length === 0 ? (
                <p className="text-[9px] text-slate-400 font-medium italic text-center py-4">Nenhum padrão detectado.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.keys(stats.patterns)
                    .sort((a, b) => stats.patterns[b] - stats.patterns[a])
                    .map((pat) => {
                      const val = stats.patterns[pat];
                      return (
                        <div key={pat} className="flex items-center justify-between text-[8.5px] font-extrabold uppercase tracking-wider bg-slate-50 border border-slate-150 p-2 rounded-xl">
                          <span className="text-slate-600 font-black">{pat}</span>
                          <span className="text-slate-800 font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-200">{val} séries</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Section 6: Biomechanical Equilibrium Alerts */}
            <div className="p-4 space-y-2.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Diagnósticos de Equilíbrio</span>
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border flex flex-col gap-1 text-[9px] leading-relaxed tracking-normal ${
                      alert.type === 'warning'
                        ? 'bg-rose-50/45 border-rose-100 text-rose-800'
                        : alert.type === 'attention'
                          ? 'bg-amber-50/45 border-amber-100 text-amber-800'
                          : 'bg-emerald-50/45 border-emerald-100 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider">
                      {alert.type === 'warning' ? (
                        <ShieldAlert size={11} className="text-rose-500 animate-pulse" />
                      ) : alert.type === 'attention' ? (
                        <AlertTriangle size={11} className="text-amber-500" />
                      ) : (
                        <CheckCircle2 size={11} className="text-emerald-500" />
                      )}
                      <span>{alert.text}</span>
                    </div>
                    {alert.details && (
                      <p className="text-[8.5px] font-bold text-slate-500 mt-1 uppercase tracking-wide leading-normal">
                        {alert.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
