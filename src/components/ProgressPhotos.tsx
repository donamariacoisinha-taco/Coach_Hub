
import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../lib/api/authApi';
import { mediaApi } from '../lib/api/mediaApi';
import { ProgressPhoto } from '../types';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Trash2, Check, X, Image, Sliders, Sparkles, RefreshCw, ZoomIn, FileImage } from 'lucide-react';

const ProgressPhotos: React.FC = () => {
  const { showError, showSuccess } = useErrorHandler();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<'frente' | 'lado' | 'costas'>('frente');
  const [sliderPos, setSliderPos] = useState(50);
  
  // File Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadFilePreviewUrl, setUploadFilePreviewUrl] = useState<string | null>(null);
  const [uploadModalTag, setUploadModalTag] = useState<'frente' | 'lado' | 'costas'>('frente');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudName = localStorage.getItem('coach_cloud_name');
  const uploadPreset = localStorage.getItem('coach_upload_preset');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const user = await authApi.getUser();
      if (user) {
        const data = await mediaApi.getPhotos(user.id);
        if (data) setPhotos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          aspectRatio: 9/16,
          width: { ideal: 1085 } 
        } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showError(err);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const captureAndUpload = async () => {
    if (!canvasRef.current || !videoRef.current) {
      return;
    }
    setUploading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) { setUploading(false); return; }

    try {
      let secureUrl = '';
      if (cloudName && uploadPreset) {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        secureUrl = json.secure_url || '';
      }

      // Base64 Fallback as zero-config assurance
      if (!secureUrl) {
        secureUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(blob);
        });
      }

      if (secureUrl) {
        const user = await authApi.getUser();
        if (user) {
          const newPhoto = await mediaApi.uploadPhoto(user.id, secureUrl, activeTag);
          setPhotos(prev => [newPhoto, ...prev]);
          stopCamera();
          showSuccess('Foto salva', 'Sua evolução foi registrada.');
        }
      }
    } catch (err: any) { showError(err); }
    finally { setUploading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedUploadFile(file);
      const url = URL.createObjectURL(file);
      setUploadFilePreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedUploadFile(file);
      const url = URL.createObjectURL(file);
      setUploadFilePreviewUrl(url);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedUploadFile) return;
    setUploading(true);
    try {
      let secureUrl = '';
      if (cloudName && uploadPreset) {
        const formData = new FormData();
        formData.append('file', selectedUploadFile);
        formData.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        secureUrl = json.secure_url || '';
      }

      // Fallback base64
      if (!secureUrl) {
        secureUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(selectedUploadFile);
        });
      }

      if (secureUrl) {
        const user = await authApi.getUser();
        if (user) {
          const newPhoto = await mediaApi.uploadPhoto(user.id, secureUrl, uploadModalTag);
          setPhotos(prev => [newPhoto, ...prev]);
          showSuccess('Foto salva', 'Sua evolução foi registrada com sucesso.');
          setShowUploadModal(false);
          setSelectedUploadFile(null);
          setUploadFilePreviewUrl(null);
        }
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelectForCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== id));
    } else {
      if (selectedForCompare.length >= 2) setSelectedForCompare([selectedForCompare[1], id]);
      else setSelectedForCompare([...selectedForCompare, id]);
    }
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const deletePhoto = async (id: string) => {
    if (!confirm("Deseja excluir esta foto?")) return;
    try {
      await mediaApi.deletePhoto(id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (err) {
      showError(err);
    }
  };

  const sortedSelection = photos
    .filter(p => selectedForCompare.includes(p.id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-[40vh]">
      <div className="w-8 h-8 border-4 border-[#7BA7FF] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* SEÇÃO PRINCIPAL DE COMANDO DE ADIÇÃO (ALTA VISIBILIDADE - MÁXIMO CONTRASTE) */}
      <div className="bg-gradient-to-br from-[#7BA7FF]/10 via-[#818CF8]/5 to-white rounded-[2rem] border-2 border-[#7BA7FF]/30 p-8 shadow-[0_20px_50px_rgba(123,167,255,0.08)] flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden">
        {/* Decorative background glow for attention */}
        <div className="absolute top-[-50%] right-[-10%] w-[250px] h-[250px] bg-gradient-to-tr from-[#7BA7FF]/20 to-[#A5C8FF]/10 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="space-y-3 text-center md:text-left relative z-10 flex-1">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="flex h-3 w-3 rounded-full bg-[#7BA7FF] animate-ping" />
            <h3 className="text-xs font-black text-[#7BA7FF] uppercase tracking-[0.25em]">Área de Sincronização Corporal</h3>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
            Upload das Fotos do Antes & Depois
          </h2>
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-md">
            Envie as imagens de sua evolução (Frente, Lado ou Costas) para usar no comparador interativo. O KYRON OS calcula sua evolução de definição neuromuscular automaticamente.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 relative z-10">
          {/* CAMERA ACTUATOR */}
          <button 
            onClick={startCamera} 
            className="flex-1 md:flex-none flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95 border-none h-[52px]"
          >
            <Camera size={16} className="stroke-[2.5]" />
            <span>Tirar Foto Agora</span>
          </button>
          
          {/* FILE UPLOAD ACTUATOR */}
          <button 
            onClick={() => {
              setSelectedUploadFile(null);
              setUploadFilePreviewUrl(null);
              setShowUploadModal(true);
              if ('vibrate' in navigator) navigator.vibrate(5);
            }} 
            className="flex-1 md:flex-none flex items-center justify-center gap-3 py-4 px-6 bg-[#7BA7FF] hover:bg-[#6CA0FA] text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#7BA7FF]/25 active:scale-95 border-none h-[52px]"
          >
            <Upload size={16} className="stroke-[2.5]" />
            <span>Enviar da Galeria</span>
          </button>
        </div>
      </div>

      {/* HEADER DE COMUTAÇÃO COM BOTÕES DUOS REESTILIZADOS */}
      <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl p-3 rounded-[2rem] border border-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="flex bg-slate-150/40 p-1 rounded-[1.5rem] border border-slate-200/20">
          <button 
            onClick={() => { setComparing(false); if ('vibrate' in navigator) navigator.vibrate(5); }} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
              !comparing 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Ver Galeria
          </button>
          <button 
            onClick={() => { setComparing(true); if ('vibrate' in navigator) navigator.vibrate(5); }} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
              comparing 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Comparar Imagens
          </button>
        </div>
        
        <div className="flex gap-2">
          {/* CAMERA TRIGGER (ICON) */}
          <button 
            onClick={startCamera} 
            className="w-10 h-10 bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            title="Tirar Foto com Câmera"
          >
            <Camera size={16} />
          </button>

          {/* FILE UPLOAD TRIGGER (ICON) */}
          <button 
            onClick={() => {
              setSelectedUploadFile(null);
              setUploadFilePreviewUrl(null);
              setShowUploadModal(true);
              if ('vibrate' in navigator) navigator.vibrate(5);
            }} 
            className="w-10 h-10 bg-[#7BA7FF]/10 text-[#7BA7FF] rounded-xl flex items-center justify-center transition-all cursor-pointer"
            title="Enviar Foto da Galeria"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      {comparing ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          {selectedForCompare.length === 2 ? (
            <div className="space-y-10">
              {/* SLIDER AVANÇADO */}
              <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 bg-slate-50 group">
                {/* Imagem de Fundo (Depois) */}
                <img src={sortedSelection[1].photo_url} className="absolute inset-0 w-full h-full object-cover" alt="Depois" />
                <div className="absolute top-6 right-6 z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full">
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Depois: {new Date(sortedSelection[1].created_at).toLocaleDateString()}</span>
                </div>

                {/* Imagem de Cima (Antes) */}
                <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={sortedSelection[0].photo_url} className="absolute inset-0 w-full h-full object-cover" alt="Antes" />
                  <div className="absolute top-6 left-6 z-10 bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-full">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Antes: {new Date(sortedSelection[0].created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Barra do Slider */}
                <div className="absolute inset-y-0 z-20 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                  <div className="h-full w-0.5 bg-white shadow-2xl"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-950">
                    <i className="fas fa-arrows-alt-h text-slate-900 text-xs"></i>
                  </div>
                </div>

                {/* Input Invisível para Controle */}
                <input 
                  type="range" min="0" max="100" value={sliderPos} 
                  onChange={e => setSliderPos(parseInt(e.target.value))} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" 
                />
              </div>

              <div className="text-center space-y-4">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Transformação Visual</p>
                 <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">Deslize para comparar cada detalhe da sua evolução.</p>
                 <button 
                  onClick={() => setSelectedForCompare([])} 
                  className="pt-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-650 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Nova Comparação
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
               {photos.length < 2 ? (
                 <div className="text-center py-12 px-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200/35">
                     <Sliders size={20} />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Fotos Insuficientes para Comparar</p>
                     <p className="text-xs text-slate-400 max-w-xs mx-auto">Você precisa de pelo menos 2 fotos cadastradas nesta seção. Use os botões de <strong>Tirar Foto</strong> ou <strong>Enviar da Galeria</strong> acima para registrar mais fotos corporal de frente, lado ou costas.</p>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="text-center py-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/35">
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-750 flex items-center justify-center gap-1.5">
                        <Sparkles size={11} className="text-indigo-500 animate-pulse" />
                        <span>Selecione 2 fotos abaixo para carregar o controle deslizante</span>
                      </p>
                   </div>
                   <div className="grid grid-cols-2 xs:grid-cols-3 gap-4">
                      {photos.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => toggleSelectForCompare(p.id)}
                          className={`aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative ${selectedForCompare.includes(p.id) ? 'border-indigo-600 scale-95 shadow-2xl shadow-indigo-600/20 animate-pulse' : 'border-transparent shadow-sm hover:scale-[1.01]'}`}
                        >
                           <img src={p.photo_url} className={`w-full h-full object-cover transition-opacity ${selectedForCompare.includes(p.id) ? 'opacity-100' : 'opacity-40'}`} />
                           <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-md text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                             {p.tag}
                           </div>
                           <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl text-center">
                             <p className="text-[8px] font-black text-white uppercase tracking-wider">{new Date(p.created_at).toLocaleDateString()}</p>
                           </div>
                           {selectedForCompare.includes(p.id) && (
                             <div className="absolute inset-0 bg-indigo-650/15 flex items-center justify-center">
                                <div className="w-8 h-8 bg-indigo-650 rounded-full flex items-center justify-center shadow-lg transform scale-110">
                                  <Check size={16} className="text-white" />
                                </div>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                 </>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {photos.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-5">
               <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350 shadow-sm">
                 <Image size={28} />
               </div>
               <div className="space-y-1.5">
                 <p className="text-slate-800 text-[11px] font-black uppercase tracking-widest">Sua jornada visual começa aqui</p>
                 <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">Você ainda não tem fotos cadastradas nesta seção. Use os botões no painel acima para registrar agora.</p>
               </div>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-slate-50 active:scale-95 transition-all shadow-xl shadow-slate-200/50 bg-white">
                <img src={photo.photo_url} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} 
                    className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-2xl cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 p-6">
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">{new Date(photo.created_at).toLocaleDateString()}</p>
                  <span className="inline-block text-[8px] font-extrabold bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full uppercase tracking-widest mt-1.5">{photo.tag}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE ENVIO - DRAG AND DROP / SELECTOR INTERATIVO */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[1200] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { if (!uploading) setShowUploadModal(false); }} 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white rounded-t-[3rem] p-8 space-y-6 shadow-2xl relative z-10 border-t border-slate-100 pb-safe"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <Upload size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-[900] tracking-tight text-slate-950 uppercase">Enviar Foto de Evolução</h3>
                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Selecione uma imagem de seu arquivo</p>
                  </div>
                </div>
                <button 
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* DRAG ZONE */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingOver 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-98' 
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50/30 hover:bg-slate-50/70'
                } flex flex-col items-center justify-center gap-3 relative overflow-hidden aspect-[4/3]`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {uploadFilePreviewUrl ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950">
                    <img src={uploadFilePreviewUrl} className="w-full h-full object-contain" alt="Preview" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUploadFile(null);
                        setUploadFilePreviewUrl(null);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition cursor-pointer"
                      title="Remover Imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-550 shadow-md border border-slate-100/50 animate-bounce">
                      <FileImage size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Arraste a foto ou clique para escolher</p>
                      <p className="text-[9px] font-medium text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Formatos suportados: JPEG, PNG, WEBP. Tamanho recomendado até 10MB.</p>
                    </div>
                  </>
                )}
              </div>

              {/* SELEÇÃO DE MARCAÇÃO / POSICIONAMENTO */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enquadramento da pose</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['frente', 'lado', 'costas'] as const).map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => setUploadModalTag(tag)}
                      className={`py-3.5 rounded-2xl text-[9px] font-[1000] uppercase tracking-widest border transition-all cursor-pointer ${
                        uploadModalTag === tag 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTÕES DE CONFIRMAÇÃO */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={!selectedUploadFile || uploading}
                  className="w-full py-4 rounded-2xl bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-[1000] text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-650/10 active:scale-98 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Salvar na Evolução</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showCamera && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-500">
          <header className="px-6 pt-12 pb-6 flex justify-between items-center shrink-0">
             <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Captura</h3>
             <button onClick={stopCamera} className="w-10 h-10 flex items-center justify-center text-white/40 active:text-white transition-colors cursor-pointer"><X size={18} /></button>
          </header>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
             <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
             <canvas ref={canvasRef} className="hidden" />
             <div className="absolute inset-10 border border-white/10 rounded-[4rem] pointer-events-none"></div>
             {uploading && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                 <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mt-6 animate-pulse">Sincronizando...</p>
               </div>
             )}
          </div>
          <footer className="px-10 py-12 flex flex-col items-center gap-10 pb-safe bg-black">
             <div className="flex gap-8 border-b border-white/10 w-full justify-center">
                {(['frente', 'lado', 'costas'] as const).map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setActiveTag(tag)} 
                    className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTag === tag ? 'border-indigo-500 text-white' : 'border-transparent text-white/30'}`}
                  >
                    {tag}
                  </button>
                ))}
             </div>
             <button 
              onClick={captureAndUpload} 
              disabled={uploading} 
              className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-all cursor-pointer"
            >
                <div className="w-full h-full rounded-full bg-white"></div>
             </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotos;
