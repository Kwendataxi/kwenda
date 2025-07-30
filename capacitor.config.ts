import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e825ab5672bd4bcab1048ec14fdf48d8',
  appName: 'nta-drive-iva',
  webDir: 'dist',
  server: {
    url: 'https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;