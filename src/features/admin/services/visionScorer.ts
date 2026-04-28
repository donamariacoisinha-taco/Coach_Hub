import { Exercise } from "../../../types";

export const visionScorer = {
  scoreMedia(url: string | undefined): number {
    if (!url) return 0;
    
    // Simulate complex vision analysis
    let score = 50;
    
    if (url.includes('unsplash.com')) score += 30;
    if (url.includes('images.')) score += 5;
    if (url.includes('.webp') || url.includes('.jpg')) score += 5;
    
    // Random jitter for simulation
    score += Math.floor(Math.random() * 10);
    
    return Math.min(100, score);
  },

  getBadge(score: number): { label: string, color: string } {
    if (score >= 90) return { label: 'Elite', color: 'bg-indigo-500' };
    if (score >= 80) return { label: 'Premium', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Bom', color: 'bg-amber-500' };
    return { label: 'Ruim', color: 'bg-rose-500' };
  }
};
