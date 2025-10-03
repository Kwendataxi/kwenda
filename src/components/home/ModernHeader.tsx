import { useState, useEffect } from 'react';
import { MapPin, Battery, Wifi, WifiOff, Signal, RefreshCw, Navigation } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useProfile } from '@/hooks/useProfile';
import { AnimatedKwendaIcon } from './AnimatedKwendaIcon';

import { GooglePlacesService } from '@/services/googlePlacesService';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface ModernHeaderProps {}

export const ModernHeader = ({}: ModernHeaderProps) => {
  const { user } = useAuth();
  
  // Safely access language context with fallback
  let t: (key: string) => string;
  let language: string;
  
  try {
    const languageContext = useLanguage();
    t = languageContext.t;
    language = languageContext.language;
  } catch (error) {
    // Fallback when LanguageProvider is not available
    t = (key: string) => key;
    language = 'fr';
  }
  
  const geolocation = useGeolocation();
  const [currentAddress, setCurrentAddress] = useState(t('city.kinshasa') + ', RD Congo');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const { metrics, isSlowConnection } = usePerformanceMonitor();
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const { displayName, loading: profileLoading } = useProfile();
  
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) return 'Bonsoir'; // 18h-6h = Bonsoir
    return 'Salut'; // 6h-18h = Salut
  };

  // Get current location on component mount and start a short watch to refine accuracy
  useEffect(() => {
    geolocation.getCurrentPosition();

    // Auto-stop the watch after 30s or when accuracy is good enough
    const timer = setTimeout(() => {
      // Timer cleanup
    }, 30000);

    const interval = setInterval(() => {
      if (geolocation.isRealGPS && geolocation.accuracy !== null && geolocation.accuracy <= 60) {
        clearTimeout(timer);
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Reverse geocoding to get address from coordinates - only for real GPS
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude && !geocodingLoading) {
      const reverseGeocode = async () => {
        try {
          setGeocodingLoading(true);
          const address = await GooglePlacesService.reverseGeocode(
            geolocation.longitude,
            geolocation.latitude
          );
          setCurrentAddress(address);
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to coordinates if reverse geocode fails
          setCurrentAddress(`${geolocation.latitude.toFixed(4)}, ${geolocation.longitude.toFixed(4)}`);
        } finally {
          setGeocodingLoading(false);
        }
      };

      reverseGeocode();
    } else if (geolocation.error && !geolocation.loading) {
      // No GPS available - show error state
      setCurrentAddress(t('location.unavailable'));
    }
  }, [geolocation.latitude, geolocation.longitude, geolocation.error]);

  // Battery status monitoring
  useEffect(() => {
    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          
          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (error) {
          // Fallback for unsupported browsers
          setBatteryLevel(85);
        }
      }
    };
    
    getBatteryInfo();
  }, []);

  return (
    <div className="relative overflow-hidden border-b border-border/40 shadow-md backdrop-blur-xl bg-gradient-to-r from-primary/5 via-background/95 to-secondary/5">
      {/* Fond gradient animé subtil */}
      <div className="absolute inset-0 bg-gradient-to-r from-congo-red/5 via-congo-yellow/5 to-congo-green/5 opacity-50 animate-congo-gradient bg-[length:200%_100%]" />
      
      <div className="relative px-6 py-4 pt-12 z-10">
        {/* Structure en 2 colonnes améliorée */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1 min-w-0">
            {/* Logo Kwenda avec effet shimmer */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-md animate-pulse" />
                <AnimatedKwendaIcon />
              </div>
            </div>
            
            {/* Greeting avec couleur gradient */}
            <p className="text-sm font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-1">
              {getGreeting()} ✨
            </p>
            
            {/* Nom utilisateur plus imposant */}
            <p className="text-lg font-bold text-foreground truncate">
              {profileLoading ? '...' : displayName.split(' ')[0]}
            </p>
            
            {/* Location visible avec icône */}
            {geolocation.latitude && geolocation.longitude && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 text-primary animate-pulse flex-shrink-0" />
                {geocodingLoading ? (
                  <span className="animate-pulse">Localisation...</span>
                ) : currentAddress ? (
                  <span className="truncate max-w-[180px] font-medium">{currentAddress}</span>
                ) : (
                  <span>Position détectée</span>
                )}
              </div>
            )}
          </div>
          
          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            {/* Battery indicator with badge */}
            {batteryLevel !== null && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                batteryLevel < 20 ? 'bg-destructive/10' :
                batteryLevel < 50 ? 'bg-warning/10' :
                'bg-success/10'
              }`}>
                <Battery 
                  className={`h-4 w-4 ${
                    batteryLevel < 20 ? 'text-destructive' :
                    batteryLevel < 50 ? 'text-warning' :
                    'text-success'
                  }`}
                />
              </div>
            )}
            
            <ThemeToggle variant="icon" size="md" className="bg-card border border-border shadow-lg" />
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
};