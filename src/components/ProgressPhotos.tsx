
import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../lib/api/authApi';
import { mediaApi } from '../lib/api/mediaApi';
import { ProgressPhoto } from '../types';
import { useErrorHandler } from '../hooks/useErrorHandler';

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
          width: { ideal: 1080 } 
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
    if (!canvasRef.current || !videoRef.current || !cloudName || !uploadPreset) {
      showError("Configure o Cloudinary no Painel de Controle.");
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

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.secure_url) {
        const user = await authApi.getUser();
        if (user) {
          const newPhoto = await mediaApi.uploadPhoto(user.id, json.secure_url, activeTag);
          setPhotos(prev => [newPhoto, ...prev]);
          stopCamera();
          showSuccess('Foto salva', 'Sua evolução foi registrada.');
        }
      }
    } catch (err: any) { showError(err); }
    finally { setUploading(false); }
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
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-slate-100">
          <button 
            onClick={() => setComparing(false)} 
            className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${!comparing ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            Galeria
          </button>
          <button 
            onClick={() => setComparing(true)} 
            className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all whitespace-nowrap ${comparing ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            Comparar
          </button>
        </div>
        <button 
          onClick={startCamera} 
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/20 active:scale-90 transition-all"
        >
          <i className="fas fa-camera text-white text-lg"></i>
        </button>
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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-900">
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
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Transformação Visual</p>
                 <p className="text-sm font-black text-slate-900 leading-tight tracking-tight">Deslize para comparar cada detalhe da sua evolução.</p>
                 <button 
                  onClick={() => setSelectedForCompare([])} 
                  className="pt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] active:text-blue-600 transition-colors"
                >
                  Nova Comparação
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
               <div className="text-center py-10">
                  <i className="fas fa-layer-group text-slate-100 text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Selecione 2 fotos</p>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  {photos.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => toggleSelectForCompare(p.id)}
                      className={`aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative ${selectedForCompare.includes(p.id) ? 'border-blue-600 scale-95 shadow-2xl shadow-blue-600/20' : 'border-transparent shadow-sm'}`}
                    >
                       <img src={p.photo_url} className={`w-full h-full object-cover transition-opacity ${selectedForCompare.includes(p.id) ? 'opacity-100' : 'opacity-40'}`} />
                       {selectedForCompare.includes(p.id) && (
                         <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <i className="fas fa-check text-white text-lg"></i>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {photos.length === 0 ? (
            <div className="col-span-full py-24 text-center">
               <i className="fas fa-images text-slate-100 text-5xl mb-6"></i>
               <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Sua jornada começa aqui</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-slate-50 active:scale-95 transition-all shadow-xl shadow-slate-200/50 bg-white">
                <img src={photo.photo_url} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} 
                    className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-2xl"
                  >
                    <i className="fas fa-trash-alt text-[10px]"></i>
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 p-6">
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">{new Date(photo.created_at).toLocaleDateString()}</p>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">{photo.tag}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-500">
          <header className="px-6 pt-12 pb-6 flex justify-between items-center shrink-0">
             <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Captura</h3>
             <button onClick={stopCamera} className="w-10 h-10 flex items-center justify-center text-white/40 active:text-white transition-colors"><i className="fas fa-times text-lg"></i></button>
          </header>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
             <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
             <canvas ref={canvasRef} className="hidden" />
             <div className="absolute inset-10 border border-white/10 rounded-[4rem] pointer-events-none"></div>
             {uploading && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                 <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mt-6">Sincronizando...</p>
               </div>
             )}
          </div>
          <footer className="px-10 py-12 flex flex-col items-center gap-10 pb-safe">
             <div className="flex gap-8 border-b border-white/10">
                {(['frente', 'lado', 'costas'] as const).map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setActiveTag(tag)} 
                    className={`text-[10px] font-black uppercase tracking-widest pb-4 border-b-2 transition-all ${activeTag === tag ? 'border-blue-600 text-white' : 'border-transparent text-white/30'}`}
                  >
                    {tag}
                  </button>
                ))}
             </div>
             <button 
              onClick={captureAndUpload} 
              disabled={uploading} 
              className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-all"
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
