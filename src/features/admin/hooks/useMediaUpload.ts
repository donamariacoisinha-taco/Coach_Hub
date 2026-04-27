
import { useState } from 'react';
import { mediaApi } from '../api/mediaApi';

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'idle' | 'compressing' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export const useMediaUpload = () => {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});

  const updateProgress = (id: string, update: Partial<UploadProgress>) => {
    setUploads(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, progress: 0, status: 'idle' }), ...update }
    }));
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max 1200px
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          }, 'image/webp', 0.82);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFile = async (file: File, path: string, options: { compress?: boolean } = {}) => {
    const uploadId = `${path}-${Date.now()}`;
    updateProgress(uploadId, { status: 'compressing', progress: 10 });

    try {
      let fileToUpload = file;
      if (options.compress && file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }

      updateProgress(uploadId, { status: 'uploading', progress: 40 });
      
      const url = await mediaApi.uploadAsset(fileToUpload, path);
      
      updateProgress(uploadId, { status: 'completed', progress: 100 });
      return url;
    } catch (err: any) {
      updateProgress(uploadId, { status: 'failed', error: err.message });
      throw err;
    }
  };

  return {
    uploadFile,
    uploads,
    isUploading: Object.values(uploads).some(u => u.status === 'uploading' || u.status === 'compressing')
  };
};
