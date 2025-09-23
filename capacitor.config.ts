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
      permissions: ["location", "coarseLocation"],
      accuracy: "high",
      requestLocationWhenInUse: true,
      allowsBackgroundLocationUpdates: true,
      showsBackgroundLocationIndicator: true
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#1B365D",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#0B1220"
    },
    BackgroundMode: {
      enabled: true,
      title: "Kwenda - Suivi GPS",
      text: "Position suivie en arrière-plan",
      silent: false
    }
  },
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION", 
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.WAKE_LOCK",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.RECEIVE_BOOT_COMPLETED"
    ]
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    overrideUserAgent: "Kwenda Taxi Congo Mobile App",
    backgroundModes: ["location", "background-fetch", "background-processing"]
  }
};

export default config;