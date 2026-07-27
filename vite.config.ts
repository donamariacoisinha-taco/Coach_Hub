import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const normalizeId = (id: string) => id.replaceAll('\\', '/');

const featureChunk = (id: string) => {
  const normalized = normalizeId(id);

  if (normalized.includes('/src/features/workout/') || normalized.includes('/src/domain/workout/')) return 'feature-workout';
  if (normalized.includes('/src/features/admin/')) return 'feature-admin';
  if (normalized.includes('/src/features/dashboard/') || normalized.includes('/src/domain/eke/')) return 'feature-dashboard';
  if (normalized.includes('/src/features/onboarding/')) return 'feature-onboarding';
  if (normalized.includes('/src/features/user/')) return 'feature-user';
  if (normalized.includes('/src/components/WorkoutEditor') || normalized.includes('/src/components/WorkoutPreparation')) return 'feature-workout-management';
  if (normalized.includes('/src/components/ExerciseLibrary')) return 'feature-exercise-library';
  if (normalized.includes('/src/lib/sync/') || normalized.includes('/src/lib/offline/') || normalized.includes('/src/lib/cache/')) return 'runtime-sync';
  if (normalized.includes('/src/lib/api/')) return 'runtime-api';

  return undefined;
};

const vendorChunk = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  const normalized = normalizeId(id);
  if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/scheduler/')) return 'vendor-react';
  if (normalized.includes('/motion/') || normalized.includes('/framer-motion/')) return 'vendor-motion';
  if (normalized.includes('/@supabase/') || normalized.includes('/@realtime/') || normalized.includes('/@gotrue/') || normalized.includes('/@postgrest/')) return 'vendor-supabase';
  if (normalized.includes('/@dnd-kit/')) return 'vendor-dnd';
  if (normalized.includes('/recharts/') || normalized.includes('/d3-')) return 'vendor-charts';
  if (normalized.includes('/lucide-react/')) return 'vendor-icons';
  if (normalized.includes('/react-zoom-pan-pinch/') || normalized.includes('/react-easy-crop/')) return 'vendor-media-tools';
  if (normalized.includes('/@google/')) return 'vendor-ai';

  return 'vendor-misc';
};

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return featureChunk(id) || vendorChunk(id);
          },
        },
      },
    },
  };
});
