import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uno.kyron.app',
  appName: 'KYRON OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
