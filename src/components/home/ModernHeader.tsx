import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRealtimeGeolocation } from '@/hooks/useRealtimeGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { GooglePlacesService } from '@/services/googlePlacesService';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LocationDetailsSheet } from './LocationDetailsSheet';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/lottery/notifications/NotificationCenter';

interface ModernHeaderProps {}

export const ModernHeader = ({}: ModernHeaderProps) => {
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
  
  const geolocation = useRealtimeGeolocation();
  const [currentAddress, setCurrentAddress] = useState(t('city.kinshasa') + ', RD Congo');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const { displayName, loading: profileLoading } = useProfile();
  
  
  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) return t('client.greeting_evening');
    return t('client.greeting_day');
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


  return (
    <header className="fixed top-0 left-0 right-0 z-[150] bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="relative px-4 py-2.5 pt-safe z-10">
        {/* Structure en 2 colonnes améliorée */}
        <div className="flex items-center justify-between">
          {/* Salutation personnalisée et localisation */}
          <div className="flex-1 min-w-0">
            {/* Greeting et nom sur la même ligne */}
            <div className="flex items-baseline gap-2 mb-1 animate-fade-up">
              <p className="text-sm font-bold text-congo-red">
                {getGreeting()},
              </p>
              <p className="text-[22px] font-bold text-foreground">
                {profileLoading ? '...' : displayName.split(' ')[0]}
              </p>
            </div>
            
            {/* Interactive Location Button */}
            {geolocation.latitude && geolocation.longitude && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationSheetOpen(true)}
                className="flex items-center gap-1.5 h-auto p-1.5 -ml-1.5 hover:bg-muted/70 transition-all rounded-lg animate-fade-up"
                style={{ animationDelay: '100ms' }}
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {geocodingLoading ? t('client.locating') : t('client.my_position')}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-primary flex-shrink-0 animate-bounce-subtle" />
              </Button>
            )}
          </div>
          
          {/* Actions à droite - notifications et thème */}
          <div className="flex items-center gap-1.5 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <div className="transition-transform duration-300 hover:scale-110 hover:rotate-12">
              <NotificationCenter />
            </div>
            <div className="transition-transform duration-300 hover:scale-110 hover:rotate-12">
              <ThemeToggle variant="icon" size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Sheet */}
      <LocationDetailsSheet
        open={locationSheetOpen}
        onOpenChange={setLocationSheetOpen}
        address={currentAddress || 'Position non disponible'}
        coordinates={
          geolocation.latitude && geolocation.longitude
            ? { lat: geolocation.latitude, lng: geolocation.longitude }
            : undefined
        }
      />
    </header>
  );
};