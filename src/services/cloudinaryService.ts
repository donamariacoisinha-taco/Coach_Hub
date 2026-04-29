/**
 * COACH RUBI - Cloudinary Service
 * Robust, professional media management for athlete performance tracking.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dq11mcq7v';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gympro';
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'coach-rubi';

export interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

export const cloudinaryService = {
  /**
   * Upload an image to Cloudinary using unsigned upload preset
   */
  async uploadImage(
    file: File | Blob, 
    subFolder: string = 'images',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log('[CLOUDINARY_UPLOAD_START]', { name: (file as File).name, size: file.size, subFolder });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `${FOLDER}/exercises/${subFolder}`);

    try {
      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            console.log('[CLOUDINARY_PROGRESS]', percent + '%');
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText) as CloudinaryResponse;
            console.log('[CLOUDINARY_SUCCESS]', response.secure_url);
            resolve(this.generateOptimizedUrl(response.secure_url));
          } else {
            console.error('[CLOUDINARY_ERROR_STATUS]', xhr.status, xhr.responseText);
            reject(new Error(`Cloudinary upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          console.error('[CLOUDINARY_NETWORK_ERROR]');
          reject(new Error('Network error during Cloudinary upload'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      console.error('[CLOUDINARY_CRITICAL_FAILURE]', error);
      throw error;
    }
  },

  /**
   * Specifically for 1:1 Static Frames
   */
  async uploadStaticFrame(file: File | Blob, onProgress?: (progress: number) => void): Promise<string> {
    return this.uploadImage(file, 'static-frames', onProgress);
  },

  /**
   * Generate highly optimized URL with auto formatting and quality
   */
  generateOptimizedUrl(url: string, options: { width?: number, height?: number, crop?: string } = {}): string {
    if (!url.includes('cloudinary.com')) return url;

    // Transform: f_auto (format), q_auto (quality), c_fill (crop)
    const { width = 1200, height = 1200, crop = 'fill' } = options;
    const transformation = `f_auto,q_auto,c_${crop},w_${width},h_${height}`;
    
    // Insert transformation after /upload/
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformation}/`);
    }
    
    return url;
  },

  /**
   * Small thumb for mobile grids
   */
  getThumbnailUrl(url: string): string {
    return this.generateOptimizedUrl(url, { width: 300, height: 300 });
  },

  /**
   * Helper to extract Public ID from URL for deletion
   */
  extractPublicId(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null;
    
    // Typical URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/id.jpg
    const parts = url.split('/upload/')[1].split('/');
    // Remove version (v12345) and join remaining to get path/id
    const idWithExt = parts.slice(1).join('/');
    // Remove extension
    return idWithExt.substring(0, idWithExt.lastIndexOf('.'));
  },

  /**
   * Deletion (requires signed if done client side, or can be skipped for now as per "temporarily abandon" logic)
   * For now we implement the placeholder to keep the interface clean
   */
  async deleteAsset(url: string) {
    const publicId = this.extractPublicId(url);
    if (!publicId) return;
    console.warn('[CLOUDINARY_DELETE_SKIPPED] Client-side deletion requires Admin API / Signed requests.');
    // Note: Usually handled via backend proxy
  }
};
