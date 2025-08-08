import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e825ab5672bd4bcab1048ec14fdf48d8',
  appName: 'Kwenda Taxi Congo',
  webDir: 'dist',
  server: {
    url: 'https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: ["location"],
      accuracy: "high"
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#0B1220"
    }
  },
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    overrideUserAgent: "Kwenda Taxi Congo Mobile App"
  }
};

export default config;