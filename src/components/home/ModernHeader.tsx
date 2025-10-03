import { useState, useEffect } from 'react';
import { MapPin, Battery, Wifi, WifiOff, Signal, RefreshCw, Navigation } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useProfile } from '@/hooks/useProfile';
import kwendaIcon from '@/assets/kwenda-icon.png';

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
    <div className="relative overflow-hidden">
      {/* Fond moderne avec gradient adaptatif */}
      <div className="px-6 py-4 pt-12 relative z-10 bg-background">

        {/* Structure en 2 colonnes améliorée */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={kwendaIcon} 
                alt="Kwenda" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <p className="text-foreground font-bold text-lg">
              {getGreeting()}, {profileLoading ? '...' : displayName.split(' ')[0]}
            </p>
            <div className="hidden">
              <div className="flex items-center gap-1">
                {geolocation.isRealGPS ? (
                  <Navigation className="h-4 w-4 text-green-500" />
                ) : (
                  <MapPin className="h-4 w-4 text-orange-500" />
                )}
                {geolocation.error && !geolocation.loading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={geolocation.forceRefreshPosition}
                    className="h-6 px-2 ml-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <span className="hidden" />
            </div>
          </div>
          
          {/* Actions à droite */}
          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" size="md" className="bg-card border border-border shadow-lg" />
            <LanguageSelector />
          </div>
        </div>
      </div>

    </div>
  );
};