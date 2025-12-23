import { CapacitorConfig } from '@capacitor/cli';

/**
 * 📱 CAPACITOR CONFIGURATION - KWENDA SUPER APP
 * 
 * Application unique multi-rôles : Client, Chauffeur, Partenaire
 * L'utilisateur bascule entre les espaces depuis l'app
 * 
 * Pour le développement avec hot-reload, décommentez server.url
 * En production, le bundle local (dist/) est utilisé
 */
const config: CapacitorConfig = {
  appId: 'cd.kwenda.app',
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
