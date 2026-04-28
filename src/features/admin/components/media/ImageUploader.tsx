
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  RotateCcw, 
  Trash2, 
  Link as LinkIcon, 
  Camera, 
  Plus,
  Maximize2,
  X,
  Loader2
} from 'lucide-react';
import { SquareCropModal } from './SquareCropModal';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  label: string;
  className?: string;
  aspect?: 'square' | 'video' | 'portrait';
}

export const ImageUploader: React.FC<Props> = ({ 
  value, 
  onChange, 
  onUpload, 
  label,
  className = '',
  aspect = 'square'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[FILE_SELECTED]', file.name, file.size, file.type);

    if (aspect === 'square') {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      performUpload(file);
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const performUpload = async (file: File | Blob) => {
    console.log('[UPLOAD_START]', label);
    setIsUploading(true);
    try {
      const uploadFile = file instanceof File ? file : new File([file], 'cropped-image.webp', { type: 'image/webp' });
      const url = await onUpload(uploadFile);
      console.log('[UPLOAD_SUCCESS]', url);
      onChange(url);
    } catch (err) {
      console.error('[UPLOAD_ERROR]', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = (blob: Blob) => {
    console.log('[CROP_DONE]');
    setCropImage(null);
    performUpload(blob);
  };

  const handleUrlSubmit = () => {
    if (tempUrl) {
      onChange(tempUrl);
      setIsUrlMode(false);
      setTempUrl('');
    }
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>

      <div 
        className={`relative group rounded-3xl overflow-hidden border-2 border-dashed transition-all duration-500 overflow-hidden ${
          value ? 'border-transparent shadow-xl' : 'border-slate-200 bg-slate-50'
        } ${aspectClasses[aspect]}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {value ? (
          <>
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay Actions */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center gap-3"
            >
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="p-4 bg-white/20 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all backdrop-blur-md"
                title="Visualizar"
              >
                <Maximize2 size={20} />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Substituir"
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={() => onChange('')}
                className="p-4 bg-red-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Remover"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>

            {/* Fullscreen Preview */}
            <AnimatePresence>
              {isPreviewOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 cursor-zoom-out"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                  >
                    <X size={24} />
                  </motion.button>
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={value} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            {isUrlMode ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-4"
              >
                <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl shadow-inner border border-white">
                  <input 
                    type="text" 
                    value={tempUrl}
                    onChange={e => setTempUrl(e.target.value)}
                    placeholder="Cole a URL da imagem..."
                    className="flex-1 bg-transparent px-4 py-3 outline-none text-xs font-bold"
                    onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUrlSubmit}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => setIsUrlMode(false)}
                    className="p-3 bg-slate-200 text-slate-600 rounded-xl"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center mx-auto text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500">
                  <Plus size={32} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Arraste ou Clique</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Formatos: WebP, PNG, JPG (Max 5MB)</p>
                </div>

                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                  </button>
                  <button 
                    onClick={() => setIsUrlMode(true)}
                    disabled={isUploading}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <LinkIcon size={14} /> Externo
                  </button>
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                    className="md:hidden px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    <Camera size={14} /> Câmera
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SquareCropModal 
        image={cropImage || ''}
        isOpen={!!cropImage}
        onClose={() => setCropImage(null)}
        onCropComplete={handleCropComplete}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
        capture="environment"
      />
    </div>
  );
};
