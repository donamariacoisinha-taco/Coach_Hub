
import { Exercise, MuscleGroup, Goal, ExperienceLevel, WorkoutExercise, SetType, EKEConfig, UserEKEPreference } from '../../types';
import { adminApi } from '../../lib/api/adminApi';
import { ekeApi } from '../../lib/api/ekeApi';
import { authApi } from '../../lib/api/authApi';

export interface RecommendationContext {
  muscleGroup: string;
  goal: Goal;
  level: ExperienceLevel;
  recentHistory?: string[]; // IDs of physical exercise sessions
  excludedExerciseIds?: string[];
  equipmentPreference?: 'machine' | 'free_weight' | 'both';
  userId?: string;
  variantId?: 'A' | 'B';
}

export interface WorkoutTemplate {
  name: string;
  targetDuration: number; // minutes
  level: ExperienceLevel;
  goal: Goal;
}

export class EKEService {
  private static instance: EKEService;
  private config: EKEConfig | null = null;
  private recommendationCache: Map<string, { data: Exercise[], timestamp: number }> = new Map();
  private CACHE_TTL = 1000 * 60 * 10; // 10 minutes

  private constructor() {}

  static getInstance(): EKEService {
    if (!EKEService.instance) {
      EKEService.instance = new EKEService();
    }
    return EKEService.instance;
  }

  /**
   * Initializes config and A/B test variant.
   */
  async initialize() {
    try {
      this.config = await ekeApi.getConfig();
    } catch (e) {
      console.warn('[EKE] Using default config');
    }
  }

  /**
   * Calculates a quality score (0-100) based on metadata completeness.
   */
  calculateQualityScore(exercise: Exercise): number {
    let score = 0;
    const weights = {
      instructions: 15,
      description: 10,
      video: 15,
      image: 15,
      technicalTips: 15,
      secondaryMuscles: 10,
      movementPattern: 10,
      difficultyLevel: 10
    };

    if (exercise.instructions && exercise.instructions.length > 50) score += weights.instructions;
    if (exercise.description && exercise.description.length > 30) score += weights.description;
    if (exercise.video_url) score += weights.video;
    if (exercise.image_url) score += weights.image;
    if (exercise.technical_tips && exercise.technical_tips.length > 20) score += weights.technicalTips;
    if (exercise.secondary_muscles && exercise.secondary_muscles.length > 0) score += weights.secondaryMuscles;
    if (exercise.movement_pattern) score += weights.movementPattern;
    if (exercise.difficulty_level) score += weights.difficultyLevel;

    return Math.min(100, score);
  }

  /**
   * Calculates performance score (0-100) with temporal decay.
   */
  calculatePerformanceScore(exercise: Exercise): number {
    const stats = {
      usageCount: exercise.usage_count || 0,
      completionRate: 0.8, // Placeholder for real metrics
      progressionRate: 0.5  // Placeholder for real metrics
    };

    const usageWeight = 30;
    const completionWeight = 40;
    const progressionWeight = 30;

    const usageScore = Math.min(1, stats.usageCount / 20) * usageWeight;
    const completionScore = stats.completionRate * completionWeight;
    const progressionScore = stats.progressionRate * progressionWeight;
    
    let baseScore = usageScore + completionScore + progressionScore;

    // Temporal Decay: weighted towards recent usage
    if (exercise.last_used_at) {
        const lastUsed = new Date(exercise.last_used_at);
        const daysSince = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        const decayDays = 45; 
        const decayFactor = Math.exp(-daysSince / decayDays);
        baseScore = baseScore * decayFactor;
    }

    return Math.round(baseScore);
  }

  /**
   * Provides a human-readable explanation for a recommendation.
   */
  explainRecommendation(exercise: Exercise, context: RecommendationContext): string[] {
    const reasons: string[] = [];
    
    if (exercise.muscle_group.toLowerCase() === context.muscleGroup.toLowerCase()) {
      reasons.push("Foco primário no músculo alvo");
    }
    
    if ((exercise.quality_score || 0) > 80) {
      reasons.push("Metadados e instruções de alta qualidade");
    }

    if ((exercise.usage_count || 0) > 10) {
      reasons.push("Exercício popular com bom engajamento");
    }

    const goalMap: Record<string, string[]> = {
      [Goal.STRENGTH]: ['strength', 'power'],
      [Goal.HYPERTROPHY]: ['hypertrophy', 'strength'],
      [Goal.ENDURANCE]: ['endurance', 'hypertrophy'],
      [Goal.WEIGHT_LOSS]: ['endurance', 'hypertrophy', 'weight_loss']
    };

    if (exercise.training_goal && goalMap[context.goal]?.includes(exercise.training_goal)) {
      reasons.push(`Alinhado com seu objetivo de ${context.goal}`);
    }

    return reasons;
  }

  /**
   * Calculates relevance for a specific context.
   */
  calculateContextScore(context: RecommendationContext, exercise: Exercise, userPrefs?: UserEKEPreference | null): number {
    let score = 0;

    // Muscle Group Match (CRITICAL)
    if (exercise.muscle_group.toLowerCase() === context.muscleGroup.toLowerCase()) {
      score += 50;
    } else if (exercise.secondary_muscles?.some(m => m.toLowerCase() === context.muscleGroup.toLowerCase())) {
      score += 20;
    }

    // Goal Alignment
    const goalMap: Record<string, string[]> = {
      [Goal.STRENGTH]: ['strength', 'power'],
      [Goal.HYPERTROPHY]: ['hypertrophy', 'strength'],
      [Goal.ENDURANCE]: ['endurance', 'hypertrophy'],
      [Goal.WEIGHT_LOSS]: ['endurance', 'hypertrophy', 'weight_loss']
    };
    
    if (exercise.training_goal && goalMap[context.goal]?.includes(exercise.training_goal)) {
      score += 20;
    }

    // Level Alignment
    const levels = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
    const exLevel = levels[exercise.difficulty_level || 'beginner'];
    const userLevel = context.level === ExperienceLevel.ADVANCED ? 2 : (context.level === ExperienceLevel.INTERMEDIATE ? 1 : 0);
    
    if (exLevel === userLevel) score += 20;
    else if (exLevel < userLevel) score += 10;
    else score -= 30; // Heavy penalty for too difficult

    // Variety / Recent History (Anti-Spam)
    if (context.recentHistory?.includes(exercise.id)) {
      score -= 60;
    }

    // User Memory / Personalization
    if (userPrefs) {
        if (userPrefs.favorite_exercises.includes(exercise.id)) score += 30;
        if (userPrefs.avoided_exercises.includes(exercise.id)) score -= 100;
        if (userPrefs.best_performing_exercises.includes(exercise.id)) score += 20;
    }

    return score;
  }

  /**
   * Computes the final relevance ranking.
   */
  calculateFinalScore(exercise: Exercise, context: RecommendationContext, userPrefs?: UserEKEPreference | null): number {
    const qWeight = this.config?.quality_weight || 0.6;
    const pWeight = this.config?.performance_weight || 0.4;
    
    // Group B in A/B testing might have 50/50 weights
    const effectiveQWeight = context.variantId === 'B' ? 0.5 : qWeight;
    const effectivePWeight = context.variantId === 'B' ? 0.5 : pWeight;

    const qScore = exercise.quality_score || this.calculateQualityScore(exercise);
    const pScore = exercise.performance_score || this.calculatePerformanceScore(exercise);
    const cScore = this.calculateContextScore(context, exercise, userPrefs);

    return (qScore * effectiveQWeight) + (pScore * effectivePWeight) + cScore;
  }

  /**
   * Core intelligence: Ranks exercises based on a multi-factor scoring system.
   * Includes Caching, A/B Testing, and Governance Logging.
   */
  async getRecommendedExercises(context: RecommendationContext): Promise<Exercise[]> {
    const cacheKey = JSON.stringify(context);
    const cached = this.recommendationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        return cached.data;
    }

    try {
        const userId = context.userId || (await authApi.getSession())?.user?.id;
        const userPrefs = userId ? await ekeApi.getUserPreferences(userId) : null;
        
        // A/B Variant Assignment
        const variantId = userPrefs?.variant_id || (Math.random() > 0.5 ? 'B' : 'A');
        const effectiveContext = { ...context, userId, variantId };

        const exercises = await ekeApi.getExercisesForEke();
        
        if (!exercises || exercises.length === 0) {
            return this.getFallbackExercises(context.muscleGroup);
        }

        let filtered = exercises.filter(ex => {
            if (context.excludedExerciseIds?.includes(ex.id)) return false;
            
            // Muscle validation
            const isPrimary = ex.muscle_group.toLowerCase() === context.muscleGroup.toLowerCase();
            const isSecondary = ex.secondary_muscles?.some(m => m.toLowerCase() === context.muscleGroup.toLowerCase());
            if (!isPrimary && !isSecondary) return false;

            // Equipment
            if (context.equipmentPreference === 'machine' && ex.type !== 'machine') return false;
            if (context.equipmentPreference === 'free_weight' && ex.type === 'machine') return false;

            return true;
        });

        const scored = filtered.map(ex => ({
            ...ex,
            _score: this.calculateFinalScore(ex, effectiveContext, userPrefs)
        }));

        const ranked = scored.sort((a, b) => b._score - a._score);
        
        // Log Decision (Observability)
        if (Math.random() < 0.2) { // Sample 20% of requests to avoid log bloat
            ekeApi.logDecision({
                user_id: userId,
                context: effectiveContext,
                variant_id: variantId,
                selected_exercises: ranked.slice(0, 3).map(ex => ({ id: ex.id, name: ex.name })),
                scores_breakdown: ranked.slice(0, 5).map(ex => ({ name: ex.name, score: ex._score })),
                final_decision: ranked[0]?.id
            });
        }

        this.recommendationCache.set(cacheKey, { data: ranked, timestamp: Date.now() });
        return ranked;

    } catch (e) {
        console.error('[EKE] Engine failure, using safe mode:', e);
        return this.getFallbackExercises(context.muscleGroup);
    }
  }

  /**
   * Safe Mode: Hardcoded fallback exercises.
   */
  private getFallbackExercises(muscleGroup: string): Exercise[] {
    // Highly simplified list to ensure continuity
    return [
        { id: 'fb1', name: 'Exercício Padrão', muscle_group: muscleGroup }
    ] as any[];
  }

  /**
   * Magic Builder: Generates a complete workout plan based on intelligence parameters.
   */
  async generateWorkoutPlan(params: {
    goal: Goal;
    duration: number;
    level: ExperienceLevel;
    focusMuscles: string[];
    userId?: string;
  }): Promise<Partial<WorkoutExercise>[]> {
    const userId = params.userId || (await authApi.getSession())?.user?.id;
    const workout: Partial<WorkoutExercise>[] = [];
    const usedIds = new Set<string>();
    const movementPatterns = new Set<string>();

    const exerciseCount = Math.max(3, Math.floor(params.duration / 8));

    for (let i = 0; i < exerciseCount; i++) {
        const targetMuscle = params.focusMuscles[i % params.focusMuscles.length];
        
        const recs = await this.getRecommendedExercises({
            muscleGroup: targetMuscle,
            goal: params.goal,
            level: params.level,
            excludedExerciseIds: Array.from(usedIds),
            userId
        });

        let selected = recs.find(ex => !movementPatterns.has(ex.movement_pattern || ''));
        if (!selected && recs.length > 0) selected = recs[0];

        if (selected) {
            usedIds.add(selected.id);
            if (selected.movement_pattern) movementPatterns.add(selected.movement_pattern);

            workout.push({
                exercise_id: selected.id,
                exercise_name: selected.name,
                muscle_group: selected.muscle_group,
                exercise_image: selected.image_url,
                sets: params.goal === Goal.STRENGTH ? 5 : 3,
                reps: params.goal === Goal.STRENGTH ? '5' : '10-12',
                weight: 0,
                rest_time: params.goal === Goal.STRENGTH ? 180 : 60,
                order: i + 1,
                sets_json: this.generateSets(params.goal, params.level)
            });
        }
    }

    return workout;
  }

  private generateSets(goal: Goal, level: ExperienceLevel): any[] {
    const count = goal === Goal.STRENGTH ? 5 : 3;
    const reps = goal === Goal.STRENGTH ? '5' : '12';
    return Array.from({ length: count }, (_, i) => ({
        reps,
        weight: 0,
        rest_time: goal === Goal.STRENGTH ? 180 : 60,
        type: i === 0 && level === ExperienceLevel.BEGINNER ? SetType.WARMUP : SetType.NORMAL
    }));
  }

  async processWorkoutFeedback(historyId: string, sessionData: { isAbandonment?: boolean } = {}): Promise<void> {
    if (sessionData.isAbandonment) return;
    // Clear cache after new feedback to reflect refreshed scores
    this.recommendationCache.clear();
    
    try {
      // Logic for actual feedback processing...
      // await ekeApi.updateExercisePerformance(...)
    } catch (e) {
      console.error("[EKE] Feedback processing error:", e);
    }
  }
}

export const ekeService = EKEService.getInstance();
