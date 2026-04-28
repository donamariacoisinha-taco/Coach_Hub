import React from 'react';
import { motion } from 'motion/react';
import { MediaSuggestion } from '../../store/mediaFinderStore';
import { VisualScoreBadge } from './VisualScoreBadge';
import { Check, Plus, ExternalLink, Play } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Props {
  title: string;
  suggestions: MediaSuggestion[];
  selectedUrl?: string;
  onSelect: (url: string) => void;
  type: 'image' | 'video';
}

export const MediaSuggestionsGrid: React.FC<Props> = ({ title, suggestions, selectedUrl, onSelect, type }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title} ({suggestions.length})</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {suggestions.map((item, idx) => {
          const isSelected = selectedUrl === item.url;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "group relative aspect-video rounded-2xl overflow-hidden cursor-pointer transition-all border-2",
                isSelected ? "border-slate-900 ring-4 ring-slate-900/10 shadow-xl" : "border-transparent hover:border-slate-200"
              )}
              onClick={() => onSelect(item.url)}
            >
              {type === 'image' ? (
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                   <Play className="text-slate-900" size={32} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute top-2 left-2">
                <VisualScoreBadge score={item.quality_score} />
              </div>

              <div className="absolute bottom-2 right-2 flex gap-2">
                 <button className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-900 hover:bg-white transition-all shadow-xl">
                    <ExternalLink size={14} />
                 </button>
                 {isSelected ? (
                   <div className="p-2 bg-slate-900 text-white rounded-lg shadow-xl">
                      <Check size={14} />
                   </div>
                 ) : (
                   <div className="p-2 bg-white/90 backdrop-blur-md text-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                      <Plus size={14} />
                   </div>
                 )}
              </div>

              {item.source && (
                <div className="absolute bottom-2 left-2">
                   <span className="text-[8px] font-bold text-white uppercase tracking-widest opacity-80">{item.source}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
