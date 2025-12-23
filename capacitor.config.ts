import { CapacitorConfig } from '@capacitor/cli';

/**
 * 📱 CAPACITOR CONFIGURATION - PRODUCTION READY
 * 
 * Pour le développement avec hot-reload, décommentez server.url
 * En production, le bundle local (dist/) est utilisé
 * 
 * Build multi-apps:
 * - cd.kwenda.client : App Client
 * - cd.kwenda.driver : App Chauffeur  
 * - cd.kwenda.partner : App Partenaire
 */
const config: CapacitorConfig = {
  appId: 'cd.kwenda.client',
  appName: 'Kwenda',
  webDir: 'dist',
  
  // 🔧 DEVELOPMENT: Décommenter pour hot-reload
  // server: {
  //   url: "https://e825ab56-72bd-4bca-b104-8ec14fdf48d8.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // },
  
  appUrlScheme: "kwenda",
  
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
      iconColor: "#DC2626",
      sound: "default"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: "#DC2626",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
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
    allowMixedContent: false,
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
    overrideUserAgent: "Kwenda Mobile App",
    backgroundModes: ["location", "background-fetch", "background-processing"]
  }
};

export default config;