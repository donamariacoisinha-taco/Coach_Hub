
import { describe, it, expect, vi } from 'vitest';
import { EKEService, RecommendationContext } from './ekeService';
import { Goal, ExperienceLevel, Exercise } from '../../types';

describe('EKEService', () => {
  const eke = EKEService.getInstance();

  const mockExercise: Exercise = {
    id: 'ex1',
    name: 'Push Up',
    muscle_group: 'Chest',
    muscle_group_id: 'mg1',
    instructions: 'Lower your body and push back up.',
    description: 'A classic compound movement.',
    is_active: true,
    quality_score: 80,
    performance_score: 70,
    type: 'bodyweight',
    difficulty_level: 'beginner',
    created_at: '',
    updated_at: ''
  } as Exercise;

  describe('calculateQualityScore', () => {
    it('should calculate score based on metadata', () => {
      const score = eke.calculateQualityScore(mockExercise);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return low score for empty exercise', () => {
      const empty: Exercise = { id: '2' } as Exercise;
      expect(eke.calculateQualityScore(empty)).toBe(0);
    });
  });

  describe('calculateContextScore', () => {
    const context: RecommendationContext = {
      muscleGroup: 'Chest',
      goal: Goal.HYPERTROPHY,
      level: ExperienceLevel.INTERMEDIATE
    };

    it('should give high score for matching muscle group', () => {
      const score = eke.calculateContextScore(context, mockExercise);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('should penalize for incorrect level', () => {
       const advExercise = { ...mockExercise, difficulty_level: 'advanced' } as Exercise;
       Object.defineProperty(advExercise, 'muscle_group', { value: 'None' }); // Reset muscle match for this test case
       const beginnerContext = { ...context, level: ExperienceLevel.BEGINNER };
       const score = eke.calculateContextScore(beginnerContext, advExercise);
       expect(score).toBeLessThan(0);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should apply temporal decay for stale exercises', () => {
      const freshExercise = { ...mockExercise, last_used_at: new Date().toISOString(), usage_count: 10 };
      const staleExercise = { ...mockExercise, last_used_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), usage_count: 10 };
      
      const freshScore = eke.calculatePerformanceScore(freshExercise);
      const staleScore = eke.calculatePerformanceScore(staleExercise);
      
      expect(staleScore).toBeLessThan(freshScore);
    });
  });

  describe('explainRecommendation', () => {
    it('should return reasons for recommendation', () => {
      const context: RecommendationContext = {
        muscleGroup: 'Chest',
        goal: Goal.HYPERTROPHY,
        level: ExperienceLevel.BEGINNER
      };
      const reasons = eke.explainRecommendation(mockExercise, context);
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons).toContain("Foco primário no músculo alvo");
    });
  });

  describe('calculateFinalScore', () => {
    it('should combine factors into a final weighted score', () => {
      const context: RecommendationContext = {
        muscleGroup: 'Chest',
        goal: Goal.HYPERTROPHY,
        level: ExperienceLevel.INTERMEDIATE
      };
      const finalScore = eke.calculateFinalScore(mockExercise, context);
      expect(finalScore).toBeGreaterThan(0);
    });
  });
});
