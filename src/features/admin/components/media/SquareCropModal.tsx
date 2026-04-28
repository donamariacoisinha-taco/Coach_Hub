
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, Maximize2 } from 'lucide-react';

interface Props {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

export const SquareCropModal: React.FC<Props> = ({ image, isOpen, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: any) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/webp', 0.9);
    });
  };

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 sm:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Enquadramento Rubi</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ajuste o frame para o padrão 1:1 Premium</p>
             </div>
             <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-950 transition-all">
                <X size={20} />
             </button>
          </div>

          {/* Area de Crop */}
          <div className="relative flex-1 min-h-[400px] bg-slate-900">
             <Cropper
               image={image}
               crop={crop}
               zoom={zoom}
               aspect={1}
               onCropChange={onCropChange}
               onCropComplete={onCropCompleteInternal}
               onZoomChange={onZoomChange}
               classes={{
                 containerClassName: 'bg-slate-900',
                 mediaClassName: 'object-contain',
               }}
             />
          </div>

          {/* Rodapé de Controles */}
          <div className="p-8 bg-white border-t border-slate-100 space-y-8">
             <div className="flex items-center gap-6">
                <button onClick={() => setZoom(1)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                   <RotateCcw size={18} />
                </button>
                <div className="flex-1 flex items-center gap-4">
                   <Maximize2 size={16} className="text-slate-300" />
                   <input 
                     type="range"
                     min={1}
                     max={3}
                     step={0.1}
                     value={zoom}
                     onChange={(e) => setZoom(Number(e.target.value))}
                     className="flex-1 h-1.5 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer"
                   />
                </div>
             </div>

             <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                   Cancelar
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-[2] h-16 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-slate-950/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                   <Check size={18} />
                   Confirmar Enquadramento
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
