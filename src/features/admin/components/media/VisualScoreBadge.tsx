import React from 'react';
import { visionScorer } from '../../services/visionScorer';
import { cn } from '../../../../lib/utils';
import { ShieldCheck } from 'lucide-react';

interface Props {
  score: number;
}

export const VisualScoreBadge: React.FC<Props> = ({ score }) => {
  const badge = visionScorer.getBadge(score);
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
      badge.color
    )}>
      <ShieldCheck size={12} />
      <span>{badge.label} {score}%</span>
    </div>
  );
};
