
import React, { useState } from 'react';

// URLs de Diagramas Anatômicos de Alta Disponibilidade (Wikimedia Commons / Públicos)
const CLOUDINARY_FRONT_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Human_body_front_view.svg/800px-Human_body_front_view.svg.png";
const CLOUDINARY_BACK_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Human_body_back_view.svg/800px-Human_body_back_view.svg.png";

interface BodyMapProps {
  selected: string[];
  onToggle: (muscle: string) => void;
  view: 'front' | 'back';
}

const BodyMap: React.FC<BodyMapProps> = ({ selected, onToggle, view }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isSelected = (m: string) => selected.includes(m);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    console.log(`Coordenada clicada -> anchorX: "${x}%", anchorY: "${y}%"`);
  };

  const muscleConfigs = view === 'front' ? [
    { id: 'Ombros', label: 'Ombros', top: '18%', left: '8%', side: 'left', anchorX: '32%', anchorY: '24%' },
    { id: 'Peito', label: 'Peitoral', top: '26%', right: '8%', side: 'right', anchorX: '42%', anchorY: '32%' },
    { id: 'Bíceps', label: 'Bíceps', top: '35%', left: '6%', side: 'left', anchorX: '28%', anchorY: '38%' },
    { id: 'Abdominais', label: 'Abdômen', top: '45%', right: '6%', side: 'right', anchorX: '50%', anchorY: '48%' },
    { id: 'Oblíquos', label: 'Oblíquos', top: '54%', left: '8%', side: 'left', anchorX: '43%', anchorY: '52%' },
    { id: 'Antebraço', label: 'Antebraços', top: '58%', right: '8%', side: 'right', anchorX: '72%', anchorY: '56%' },
    { id: 'Adutores', label: 'Adutores', top: '68%', left: '12%', side: 'left', anchorX: '48%', anchorY: '68%' },
    { id: 'Quadríceps', label: 'Quadríceps', top: '78%', right: '12%', side: 'right', anchorX: '42%', anchorY: '78%' },
    { id: 'Panturrilhas', label: 'Panturrilha', top: '92%', left: '14%', side: 'left', anchorX: '44%', anchorY: '93%' },
  ] : [
    { id: 'Trapézio', label: 'Trapézio', top: '14%', left: '12%', side: 'left', anchorX: '50%', anchorY: '20%' },
    { id: 'Costas', label: 'Dorsais', top: '32%', right: '12%', side: 'right', anchorX: '40%', anchorY: '35%' },
    { id: 'Tríceps', label: 'Tríceps', top: '42%', left: '10%', side: 'left', anchorX: '28%', anchorY: '38%' },
    { id: 'Glúteos', label: 'Glúteos', top: '58%', right: '10%', side: 'right', anchorX: '50%', anchorY: '60%' },
    { id: 'Posteriores', label: 'Posteriores', top: '78%', left: '12%', side: 'left', anchorX: '44%', anchorY: '79%' },
    { id: 'Panturrilhas', label: 'Panturrilhas', top: '92%', right: '12%', side: 'right', anchorX: '56%', anchorY: '93%' },
  ];

  return (
    <div 
      className="relative w-full h-full min-h-[600px] flex items-center justify-center bg-slate-50 rounded-t-[3.5rem] overflow-hidden shadow-inner select-none border-t border-slate-100"
      onClick={handleMapClick}
    >
      {!imageLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Carregando Anatomia...</p>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-50 p-10 text-center">
          <i className="fas fa-exclamation-triangle text-slate-300 text-4xl mb-4"></i>
          <p className="text-xs font-black text-slate-400 uppercase leading-relaxed">
            Erro ao carregar mapa anatômico. <br/> Verifique sua conexão.
          </p>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center p-12">
        <img 
          src={CLOUDINARY_FRONT_URL} 
          onLoad={() => setImageLoaded(true)}
          onError={() => { setHasError(true); setImageLoaded(true); }}
          className={`h-full w-auto object-contain transition-all duration-700 mix-blend-multiply opacity-40 ${view === 'front' ? 'block' : 'hidden'}`}
        />
        <img 
          src={CLOUDINARY_BACK_URL} 
          onLoad={() => setImageLoaded(true)}
          onError={() => { setHasError(true); setImageLoaded(true); }}
          className={`h-full w-auto object-contain transition-all duration-700 mix-blend-multiply opacity-40 ${view === 'back' ? 'block' : 'hidden'}`}
        />
      </div>

      <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {muscleConfigs.map((m) => (
            <path 
              key={`line-${m.label}`}
              d={`M ${m.side === 'left' ? m.left : (m.side === 'right' ? `calc(100% - ${m.right})` : m.left)} ${m.top} L ${m.anchorX} ${m.anchorY}`}
              stroke={isSelected(m.id) ? '#2563eb' : '#cbd5e1'}
              strokeWidth={isSelected(m.id) ? '2' : '1'}
              fill="none"
              strokeDasharray={isSelected(m.id) ? "0" : "4 4"}
              className="transition-all duration-500"
            />
          ))}
        </svg>

        {muscleConfigs.map((m) => (
          <React.Fragment key={m.label}>
            <div 
              className={`absolute w-5 h-5 transition-all duration-500 pointer-events-auto cursor-pointer flex items-center justify-center z-20 ${isSelected(m.id) ? 'scale-125' : 'scale-100 hover:scale-110'}`}
              style={{ top: m.anchorY, left: m.anchorX, transform: 'translate(-50%, -50%)' }}
              onClick={(e) => { e.stopPropagation(); onToggle(m.id); }}
            >
              <div className={`w-full h-full rounded-full border-2 transition-all duration-500 ${isSelected(m.id) ? 'bg-blue-600 border-white shadow-lg' : 'bg-white border-slate-300'}`} />
            </div>

            <div 
              className="absolute pointer-events-auto z-30"
              style={{ 
                top: m.top, 
                left: m.side === 'left' ? m.left : 'auto', 
                right: m.side === 'right' ? m.right : 'auto', 
                transform: 'translateY(-50%)' 
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle(m.id); }} 
                className={`px-4 py-2 rounded-full transition-all duration-300 border text-[9px] font-black uppercase tracking-widest ${isSelected(m.id) ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {m.label}
              </button>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BodyMap;
