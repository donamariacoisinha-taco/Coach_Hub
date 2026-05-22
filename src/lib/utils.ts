import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  interval = 1000,
  exponential = true
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const message = typeof err === 'string' ? err : err?.message || '';
    const status = err?.status !== undefined ? err.status : (err?.statusCode || -1);

    const isNetworkError = 
      message.includes('Failed to fetch') || 
      message.includes('network') ||
      message.includes('load') ||
      message.toLowerCase().includes('aborted') ||
      status === 0 ||
      status === 503 ||
      status === 504;

    if (retries > 0 && isNetworkError) {
      console.warn(`[RETRY] Fetch failed: ${message.substring(0, 50)}. Retrying in ${interval}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, interval));
      return fetchWithRetry(
        fn, 
        retries - 1, 
        exponential ? interval * 2 : interval, 
        exponential
      );
    }
    throw err;
  }
}
