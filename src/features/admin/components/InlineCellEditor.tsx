import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check,
  X,
  ChevronDown
} from 'lucide-react';

interface InlineCellEditorProps {
  value: any;
  onSave: (value: any) => void;
  onCancel: () => void;
  type?: 'text' | 'select' | 'number';
  options?: string[];
}

const InlineCellEditor: React.FC<InlineCellEditorProps> = ({ 
  value: initialValue, 
  onSave, 
  onCancel, 
  type = 'text',
  options = []
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave(value);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex items-center px-4" onClick={(e) => e.stopPropagation()}>
      {type === 'select' ? (
        <select
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onSave(value)}
          className="w-full h-full bg-transparent font-black text-[11px] uppercase tracking-tight outline-none appearance-none"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onSave(value)}
          className="w-full h-full bg-transparent font-black text-[11px] uppercase tracking-tight outline-none"
        />
      )}
      
      <div className="flex items-center gap-1 ml-2">
         <button className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" onClick={() => onSave(value)}>
            <Check size={14} />
         </button>
      </div>
    </div>
  );
};

export default InlineCellEditor;
