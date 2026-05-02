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
    const isNetworkError = 
      err?.message?.includes('Failed to fetch') || 
      err?.message?.includes('network') ||
      err?.message?.includes('load') ||
      err?.status === 0;

    if (retries > 0 && isNetworkError) {
      console.warn(`[RETRY] Fetch failed. Retrying in ${interval}ms... (${retries} left)`);
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
