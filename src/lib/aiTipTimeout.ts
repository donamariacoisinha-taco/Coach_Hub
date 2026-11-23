/** Generative tips often return after 8s. Cutting earlier shows the fallback by mistake. */
export const AI_TIP_TIMEOUT_MS = 20000;

export function raceWithTimeout<T>(work: Promise<T>, ms = AI_TIP_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}
