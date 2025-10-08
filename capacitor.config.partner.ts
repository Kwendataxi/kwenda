import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.kwenda.partner',
  appName: 'Kwenda Partner',
  webDir: 'dist',
  plugins: {
    Camera: {
      permissions: ["camera", "photos"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#10B981",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#10B981"
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
    overrideUserAgent: "Kwenda Partner Congo Mobile App"
  }
};

export default config;
