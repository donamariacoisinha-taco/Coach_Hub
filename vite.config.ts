import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const normalizeId = (id: string) => id.replaceAll('\\', '/');

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
            return vendorChunk(id);
          },
        },
      },
    },
  };
});
