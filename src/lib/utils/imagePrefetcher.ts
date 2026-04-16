
/**
 * Utility to prefetch images to eliminate pop-in during navigation.
 */
export const imagePrefetcher = {
  /**
   * Prefetches a single image.
   * @param url The URL of the image to prefetch.
   */
  prefetch(url: string): Promise<void> {
    if (!url) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  },

  /**
   * Prefetches multiple images.
   * @param urls Array of image URLs.
   */
  async prefetchBatch(urls: string[]): Promise<void[]> {
    const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
    return Promise.all(uniqueUrls.map(url => this.prefetch(url).catch(() => {})));
  }
};
