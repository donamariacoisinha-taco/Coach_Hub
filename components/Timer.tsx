
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
    <div className="flex flex-col items-center bg-slate-800 p-4 rounded-xl border border-blue-500/30">
      <span className="text-xs text-slate-400 font-bold uppercase mb-1">Descanso</span>
      <div className="text-3xl font-black text-blue-400 font-mono">{formatTime(seconds)}</div>
      <div className="flex gap-4 mt-2">
        <button onClick={() => setIsActive(!isActive)} className="text-slate-400 hover:text-white">
          <i className={`fas fa-${isActive ? 'pause' : 'play'} text-sm`}></i>
        </button>
        <button onClick={() => setSeconds(initialSeconds)} className="text-slate-400 hover:text-white">
          <i className="fas fa-undo text-sm"></i>
        </button>
      </div>
    </div>
  );
};

export default Timer;
