import { UserProfile, Goal } from '../types';

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  caloriesTarget: number;
  proteinGrams: number;
  proteinCalories: number;
  fatGrams: number;
  fatCalories: number;
  carbGrams: number;
  carbCalories: number;
  hydrationGoalMl: number;
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
  calculateBMR(weight: number, height: number, age: number, gender: 'masculino' | 'feminino' | 'outro' | string): number {
    const wt = weight || 70;
    const ht = height || 170;
    const ag = age || 28;
    const isFemale = String(gender).toLowerCase() === 'feminino' || String(gender).toLowerCase() === 'female' || String(gender).toLowerCase() === 'f';

    if (isFemale) {
      // Prompt specification: (9.56 * weight) + (1.85 * height) - (4.68 * age) + 665
      return (9.56 * wt) + (1.85 * ht) - (4.68 * ag) + 665;
    } else {
      // Prompt specification: (13.75 * weight) + (5 * height) - (6.76 * age) + 66.5
      return (13.75 * wt) + (5 * ht) - (6.76 * ag) + 66.5;
    }
  },

  // 2. Map activity level to activity factor
  getActivityFactor(level: string): number {
    const raw = String(level).toLowerCase();
    if (raw.includes('sedentário') || raw.includes('sedentary')) return 1.2;
    if (raw.includes('leve') || raw.includes('light')) return 1.375;
    if (raw.includes('moderado') || raw.includes('moderate')) return 1.55;
    if (raw.includes('alto') || raw.includes('high') || raw.includes('alta') || raw.includes('ativo')) return 1.725;
    if (raw.includes('extremo') || raw.includes('extreme')) return 1.9;
    
    // Balanced moderate default
    return 1.45;
  },

  // 3. Main Calculator matching premium adaptation
  calculatePlan(profile: Partial<UserProfile>, activityLevelText: string = 'moderado'): NutritionPlan {
    const weight = profile.weight || 75;
    const height = profile.height || 175;
    const age = profile.age || 28;
    const gender = profile.gender || 'masculino';
    const goal = profile.goal || Goal.HYPERTROPHY;

    const bmr = Math.round(this.calculateBMR(weight, height, age, gender));
    const factor = this.getActivityFactor(activityLevelText);
    const tdee = Math.round(bmr * factor);

    // Goal Calorie Adaptation
    let caloriesTarget = tdee;
    const goalLower = String(goal).toLowerCase();
    
    // Hypertrophy: +250 ~ +400 kcal
    if (goalLower.includes('hipertrofia') || goalLower.includes('hypertrophy') || goalLower.includes('ganho')) {
      caloriesTarget = tdee + 350;
    }
    // Fat Loss: -300 ~ -500 kcal
    else if (goalLower.includes('emagrecimento') || goalLower.includes('loss') || goalLower.includes('corte') || goalLower.includes('perda')) {
      caloriesTarget = tdee - 400;
    }
    // Recomposition or Endurance
    else if (goalLower.includes('resistência') || goalLower.includes('recomp') || goalLower.includes('força')) {
      caloriesTarget = tdee - 150; // slight deficit / recomp
    }

    // Ensure safe calorie basement
    if (caloriesTarget < 1200) caloriesTarget = 1200;

    // Macro protein multipliers
    let proteinMultiplier = 2.0; // g/kg default performance
    if (goalLower.includes('emagrecimento') || goalLower.includes('loss')) {
      proteinMultiplier = 2.2; // 2.0 - 2.4 fat loss
    } else if (goalLower.includes('hipertrofia') || goalLower.includes('hypertrophy')) {
      proteinMultiplier = 1.8; // 1.6 - 2.2 hypertrophy
    }

    const proteinGrams = Math.round(weight * proteinMultiplier);
    const proteinCalories = proteinGrams * 4;

    // Fat System: 0.8g - 1g / kg
    let fatMultiplier = 0.9;
    if (goalLower.includes('emagrecimento') || goalLower.includes('loss')) {
      fatMultiplier = 0.8;
    } else if (goalLower.includes('hipertrofia') || goalLower.includes('hypertrophy')) {
      fatMultiplier = 1.0;
    }
    const fatGrams = Math.round(weight * fatMultiplier);
    const fatCalories = fatGrams * 9;

    // Carbohydrates: Remaining Calories
    let carbCalories = caloriesTarget - (proteinCalories + fatCalories);
    if (carbCalories < 400) {
      // Safe boundary
      carbCalories = 400;
    }
    const carbGrams = Math.round(carbCalories / 4);

    // Hydration Goal: 35ml x body weight (ml)
    const hydrationGoalMl = Math.round(weight * 35);

    return {
      bmr,
      tdee,
      caloriesTarget,
      proteinGrams,
      proteinCalories,
      fatGrams,
      fatCalories,
      carbGrams,
      carbCalories,
      hydrationGoalMl
    };
  },

  // 4. Generate highly emotional, biological Coach Rubi Insights
  generateNutritionInsight(plan: NutritionPlan, profile: Partial<UserProfile>, performanceTrend: 'up' | 'stable' | 'down' = 'stable'): { title: string; text: string; tag: string } {
    const goalLower = String(profile.goal || '').toLowerCase();
    const streak = profile.workout_streak || 0;

    if (goalLower.includes('emagrecimento') || goalLower.includes('loss')) {
      if (streak > 5) {
        return {
          tag: "Metabolismo Otimizado",
          title: "Aceleração Mitocondrial",
          text: "Sua sequência de treinos ativa elevou seu gasto diário basal. O déficit calórico de 400 kcal está protegendo sua massa muscular com a ingestão adaptada de proteínas de " + plan.proteinGrams + "g. Seu corpo está biologicamente inclinado a priorizar lipólise hoje."
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
