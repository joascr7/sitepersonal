import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurafit.app',
  appName: 'AuraFit',
  webDir: 'out',
  server: {
    // Apontando o App Nativo para a sua Vercel
    url: 'https://aurafit.usoprime.com', 
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;