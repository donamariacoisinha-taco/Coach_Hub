
import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialSeconds: number;
  onComplete?: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onComplete }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Fix: Using any instead of NodeJS.Timeout to avoid namespace error in browser environment
    let interval: any;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      onComplete?.();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onComplete]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Descanso</span>
      <div className="text-3xl font-bold text-blue-600 tabular-nums">{formatTime(seconds)}</div>
      <div className="flex gap-4 mt-3">
        <button onClick={() => setIsActive(!isActive)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors border border-slate-100">
          <i className={`fas fa-${isActive ? 'pause' : 'play'} text-xs`}></i>
        </button>
        <button onClick={() => setSeconds(initialSeconds)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors border border-slate-100">
          <i className="fas fa-undo text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default Timer;
