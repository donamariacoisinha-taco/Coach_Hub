import { UserProfile, Goal } from '../types';
import { basalRate, dailyExpenditure, weightLossPlan } from '../domain/identity/metabolism';

export interface NutritionPlan {
  bmr: number | null;
  tdee: number | null;
  caloriesTarget: number | null;
  proteinGrams: number | null;
  proteinCalories: number | null;
  fatGrams: number | null;
  fatCalories: number | null;
  carbGrams: number | null;
  carbCalories: number | null;
  hydrationGoalMl: number | null;
  limit: 'ok' | 'capped-20' | 'basal-floor' | null;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  waterConsumedMl: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  weightLog?: number;
}

export const nutritionEngine = {
  // 1. Calculate Basal Metabolic Rate using requested formulas
  calculateBMR(weight: number, height: number, age: number, gender: string, bodyFatPct?: number | null): number | null {
    return basalRate({
      weightKg: weight,
      heightCm: height,
      ageYears: age,
      sex: gender,
      bodyFatPct,
    }).kcal;
  },

  getActivityFactor(level: string): number | null {
    const raw = String(level || '').toLowerCase();
    if (raw.includes('sedent')) return 1.2;
    if (raw.includes('leve') || raw.includes('light')) return 1.3;
    if (raw.includes('moder')) return 1.45;
    if (raw.includes('alto') || raw.includes('alta') || raw.includes('high')) return 1.6;
    return null;
  },

  calculatePlan(
    profile: Partial<UserProfile>,
    activityLevelText = '',
    options?: { bodyFatPct?: number | null; sessionsPerWeek?: number | null; typicalMinutes?: number | null },
  ): NutritionPlan {
    const weight = Number(profile.weight) || 0;
    const height = Number(profile.height) || 0;
    const age = Number(profile.age) || 0;
    const gender = profile.gender || '';
    const goal = profile.goal || '';
    const basal = basalRate({
      weightKg: weight,
      heightCm: height,
      ageYears: age,
      sex: gender,
      bodyFatPct: options?.bodyFatPct,
    });
    const spent = dailyExpenditure({
      basal: basal.kcal,
      activityLevel: activityLevelText,
      sessionsPerWeek: options?.sessionsPerWeek,
      typicalMinutes: options?.typicalMinutes,
    });
    const goalLower = String(goal).toLowerCase();
    let caloriesTarget = spent.total == null ? null : Math.round(spent.total);
    let limit: NutritionPlan['limit'] = null;
    if (spent.total != null && basal.kcal != null && weight > 0 && (goalLower.includes('emagrec') || goalLower.includes('perda') || goalLower.includes('loss'))) {
      const loss = weightLossPlan({ weightKg: weight, expenditure: spent.total, basal: basal.kcal });
      caloriesTarget = Math.round(loss.eatKcal);
      limit = loss.floorHit ? 'basal-floor' : loss.capped ? 'capped-20' : 'ok';
    }

    const empty = {
      bmr: basal.kcal == null ? null : Math.round(basal.kcal),
      tdee: spent.total == null ? null : Math.round(spent.total),
      caloriesTarget,
      proteinGrams: null,
      proteinCalories: null,
      fatGrams: null,
      fatCalories: null,
      carbGrams: null,
      carbCalories: null,
      hydrationGoalMl: weight > 0 ? Math.round(weight * 35) : null,
      limit,
    };
    if (!(weight > 0) || caloriesTarget == null) return empty;

    let proteinMultiplier = 2;
    if (goalLower.includes('emagrec') || goalLower.includes('loss')) proteinMultiplier = 2.2;
    else if (goalLower.includes('hipertrof') || goalLower.includes('ganho')) proteinMultiplier = 1.8;
    const proteinGrams = Math.round(weight * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;
    let fatMultiplier = 0.9;
    if (goalLower.includes('emagrec') || goalLower.includes('loss')) fatMultiplier = 0.8;
    else if (goalLower.includes('hipertrof') || goalLower.includes('ganho')) fatMultiplier = 1;
    const fatGrams = Math.round(weight * fatMultiplier);
    const fatCalories = fatGrams * 9;
    const carbCalories = Math.max(0, caloriesTarget - proteinCalories - fatCalories);
    return {
      ...empty,
      proteinGrams,
      proteinCalories,
      fatGrams,
      fatCalories,
      carbGrams: Math.round(carbCalories / 4),
      carbCalories,
    };
  },

  // 4. Generate highly emotional, biological KYRON OS Insights
  generateNutritionInsight(plan: NutritionPlan, profile: Partial<UserProfile>, performanceTrend: 'up' | 'stable' | 'down' = 'stable'): { title: string; text: string; tag: string } {
    const goalLower = String(profile.goal || '').toLowerCase();
    const streak = profile.workout_streak || 0;

    if (goalLower.includes('emagrecimento') || goalLower.includes('loss')) {
      if (streak > 5) {
        return {
          tag: "Metabolismo Otimizado",
          title: "Aceleração Mitocondrial",
          text: "O déficit fica dentro do gasto calculado e não desce da taxa basal. A proteína prevista é de " + (plan.proteinGrams ?? "—") + " g."
        };
      }
      return {
        tag: "Recomposição Ativa",
        title: "Adaptação ao Déficit",
        text: "Calculamos um déficit moderado e confortável para preservar sua energia. Lembre-se, treinar com RPE alto no cutting é de suma importância para sinalizar síntese de força."
      };
    }

    if (goalLower.includes('hipertrofia') || goalLower.includes('hypertrophy') || goalLower.includes('ganho')) {
      if (performanceTrend === 'up') {
        return {
          tag: "Hipertrofia Ativa",
          title: "Superávit Energético Adensado",
          text: "Seu rendimento nos treinos disparou! O feedback do sistema aumentou sua meta carboidratos para " + plan.carbGrams + "g. Excelente resposta celular ao superávit biológico."
        };
      }
      return {
        tag: "Construção de Força",
        title: "Anabolismo Natural",
        text: "Sua ingestão de proteínas está calibrada em " + plan.proteinGrams + "g para potencializar a recuperação pós-microlesão. Os carboidratos excedentes servirão de substrato para a ressíntese de glicogênio na sua próxima sessão."
      };
    }

    return {
      tag: "Equilíbrio Metabólico",
      title: "Sustentabilidade",
      text: "Seu balanço energético está otimizado para manutenção ativa e recomposição das fibras musculares. Sentir-se com vigor físico e sono reparador sinaliza homeostase ideal."
    };
  },

  // 5. Local Storage persistent logging for interactive usage
  getLocalLogs(): DayLog[] {
    try {
      const logs = localStorage.getItem('coach_rubi_nutrition_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  },

  saveLocalLogs(logs: DayLog[]) {
    try {
      localStorage.setItem('coach_rubi_nutrition_logs', JSON.stringify(logs));
    } catch (err) {
      console.error(err);
    }
  },

  getLogForDate(dateStr: string, defaultWeight?: number): DayLog {
    const logs = this.getLocalLogs();
    const existing = logs.find(l => l.date === dateStr);
    if (existing) return existing;

    // Create single empty log
    const newLog: DayLog = {
      date: dateStr,
      waterConsumedMl: 0,
      caloriesConsumed: 0,
      proteinConsumed: 0,
      carbsConsumed: 0,
      fatConsumed: 0,
      weightLog: defaultWeight
    };
    return newLog;
  },

  saveLog(log: DayLog) {
    const logs = this.getLocalLogs();
    const index = logs.findIndex(l => l.date === log.date);
    if (index >= 0) {
      logs[index] = log;
    } else {
      logs.push(log);
    }
    this.saveLocalLogs(logs);
  },

  clearAllLogs() {
    try {
      localStorage.removeItem('coach_rubi_nutrition_logs');
    } catch {}
  }
};
