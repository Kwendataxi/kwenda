import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.kwenda.driver',
  appName: 'Kwenda Driver',
  webDir: 'dist',
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
      iconColor: "#F59E0B",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: "#F59E0B"
    },
    BackgroundMode: {
      enabled: true,
      title: "Kwenda Driver - En service",
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
    overrideUserAgent: "Kwenda Driver Congo Mobile App",
    backgroundModes: ["location", "background-fetch", "background-processing"]
  }
};

export default config;
