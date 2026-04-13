
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ProgressPhoto } from '../types';

const ProgressPhotos: React.FC = () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('progress_photos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
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
      alert("Não foi possível acessar a câmera.");
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
      alert("Configure o Cloudinary no Painel de Controle.");
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('progress_photos').insert([{
            user_id: user.id,
            photo_url: json.secure_url,
            tag: activeTag
          }]);
          stopCamera();
          fetchPhotos();
        }
      }
    } catch (err: any) { alert(err.message); }
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
    const { error } = await supabase.from('progress_photos').delete().eq('id', id);
    if (!error) setPhotos(photos.filter(p => p.id !== id));
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4">
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setComparing(false)} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${!comparing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Galeria</button>
          <button onClick={() => setComparing(true)} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${comparing ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400'}`}>Comparar</button>
        </div>
        <button onClick={startCamera} className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-90 transition-all border border-blue-400/20"><i className="fas fa-camera text-white"></i></button>
      </div>

      {comparing ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {selectedForCompare.length === 2 ? (
            <div className="space-y-6">
              {/* SLIDER AVANÇADO */}
              <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                {/* Imagem de Fundo (Depois) */}
                <img src={sortedSelection[1].photo_url} className="absolute inset-0 w-full h-full object-cover" alt="Depois" />
                <div className="absolute top-6 right-6 z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <span className="text-[8px] font-bold text-white uppercase">Depois: {new Date(sortedSelection[1].created_at).toLocaleDateString()}</span>
                </div>

                {/* Imagem de Cima (Antes) */}
                <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={sortedSelection[0].photo_url} className="absolute inset-0 w-full h-full object-cover" alt="Antes" />
                  <div className="absolute top-6 left-6 z-10 bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[8px] font-bold text-white uppercase">Antes: {new Date(sortedSelection[0].created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Barra do Slider */}
                <div className="absolute inset-y-0 z-20 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                  <div className="h-full w-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-slate-900">
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

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 text-center shadow-sm">
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Transformação Visual</p>
                 <p className="text-sm font-bold text-slate-900 leading-tight">Mantenha o controle deslizando o círculo central para comparar cada detalhe.</p>
                 <button onClick={() => setSelectedForCompare([])} className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Nova Comparação</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="text-center py-10 opacity-40">
                  <i className="fas fa-layer-group text-4xl mb-4 text-slate-300"></i>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selecione 2 fotos para iniciar o slider</p>
               </div>
               <div className="grid grid-cols-3 gap-3">
                  {photos.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => toggleSelectForCompare(p.id)}
                      className={`aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative ${selectedForCompare.includes(p.id) ? 'border-blue-600 scale-95 ring-4 ring-blue-50' : 'border-slate-100'}`}
                    >
                       <img src={p.photo_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                       {selectedForCompare.includes(p.id) && (
                         <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.length === 0 ? (
            <div className="col-span-full py-24 border-2 border-dashed border-slate-200 rounded-[3rem] text-center bg-white/50">
               <i className="fas fa-images text-slate-200 text-5xl mb-6"></i>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sua jornada começa aqui.</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-slate-200 active:scale-95 transition-all shadow-sm bg-white">
                <img src={photo.photo_url} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg"><i className="fas fa-trash-alt text-[10px]"></i></button>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 p-4">
                  <p className="text-[9px] font-bold text-white uppercase tracking-tighter">{new Date(photo.created_at).toLocaleDateString()}</p>
                  <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest">{photo.tag}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
          <header className="p-8 pt-12 flex justify-between items-center shrink-0">
             <div><h3 className="text-xl font-bold text-white uppercase tracking-tight">Captura</h3></div>
             <button onClick={stopCamera} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
          </header>
          <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
             <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
             <canvas ref={canvasRef} className="hidden" />
             <div className="absolute inset-10 border-2 border-white/10 rounded-[4rem] pointer-events-none"></div>
             {uploading && <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
          <footer className="p-10 flex flex-col items-center gap-6 bg-slate-950 pb-safe">
             <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/5">
                {(['frente', 'lado', 'costas'] as const).map(tag => (
                  <button key={tag} onClick={() => setActiveTag(tag)} className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${activeTag === tag ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{tag}</button>
                ))}
             </div>
             <button onClick={captureAndUpload} disabled={uploading} className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-all">
                <div className="w-full h-full rounded-full bg-white"></div>
             </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotos;
