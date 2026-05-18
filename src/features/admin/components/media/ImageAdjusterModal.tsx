
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCw, ZoomIn, Maximize } from 'lucide-react';
import getCroppedImg from '../../../../lib/imageUtils';

interface Props {
  image: string;
  onClose: () => void;
  onConfirm: (croppedImage: Blob) => void;
  aspect?: number;
}

export const ImageAdjusterModal: React.FC<Props> = ({ 
  image, 
  onClose, 
  onConfirm,
  aspect = 1
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onConfirm(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden flex flex-col h-[80vh] md:h-[700px] shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Ajustar Mídia</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defina o enquadramento perfeito para o exercício</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="flex-1 relative bg-slate-950">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            classes={{
                containerClassName: "bg-slate-950",
                mediaClassName: "max-h-full",
                cropAreaClassName: "border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-8 bg-white border-t border-slate-100 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Zoom Control */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                       <ZoomIn size={14} />
                       <span>Zoom</span>
                    </div>
                    <span>{Math.round(zoom * 100)}%</span>
                 </div>
                 <input 
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                 />
              </div>

              {/* Rotation Control */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                       <RotateCw size={14} />
                       <span>Rotação</span>
                    </div>
                    <span>{rotation}°</span>
                 </div>
                 <input 
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                 />
              </div>
           </div>

           {/* Actions */}
           <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                 <button 
                  onClick={() => { setZoom(1); setRotation(0); setCrop({x:0, y:0}); }}
                  className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center gap-2"
                 >
                    <Maximize size={14} />
                    Resetar
                 </button>
              </div>
              
              <button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-10 py-4 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <Check size={16} className="text-emerald-400" />
                )}
                Finalizar Ajuste
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
