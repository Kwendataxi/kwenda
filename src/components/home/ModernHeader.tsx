import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useRealtimeGeolocation } from '@/hooks/useRealtimeGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { GooglePlacesService } from '@/services/googlePlacesService';
import { SeasonalThemeSelector } from '@/components/theme/SeasonalThemeSelector';
import { LocationDetailsSheet } from './LocationDetailsSheet';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/lottery/notifications/NotificationCenter';
import { useSeasonalThemeSafe } from '@/contexts/SeasonalThemeContext';

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
  const { currentSeason } = useSeasonalThemeSafe();
  
  // Dynamic greeting based on time + season
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    // Greeting festif selon la saison
    if (currentSeason === 'christmas') {
      return '🎄 Joyeux Noël';
    }
    if (currentSeason === 'newYear') {
      return '🎆 Bonne Année';
    }
    if (currentSeason === 'valentine') {
      return '💝 Joyeuse Saint-Valentin';
    }
    
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
    <header className="fixed top-0 left-0 right-0 z-[150] bg-background/90 backdrop-blur-xl border-b border-border/30 animate-fade-in">
      <div className="relative px-4 py-3 pt-safe z-10">
        {/* Structure en grid pour alignement parfait */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 min-h-[52px]">
          {/* Zone gauche: Salutation + localisation */}
          <div className="flex flex-col justify-center min-w-0">
            {/* Greeting et nom sur la même ligne */}
            <div className="flex items-baseline gap-1.5 animate-fade-up">
              <span className="text-xs font-bold text-primary tracking-wide uppercase">
                {getGreeting()},
              </span>
              <span className="text-lg font-extrabold text-foreground truncate max-w-[160px]">
                {profileLoading ? '...' : displayName.split(' ')[0]}
              </span>
            </div>
            
            {/* Interactive Location Button - plus compact */}
            {geolocation.latitude && geolocation.longitude && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocationSheetOpen(true)}
                className="flex items-center gap-1 h-auto py-0.5 px-1 -ml-1 mt-0.5 hover:bg-muted/50 transition-all rounded-md animate-fade-up text-muted-foreground hover:text-foreground"
                style={{ animationDelay: '100ms' }}
              >
                <span className="text-[11px] font-medium truncate max-w-[180px]">
                  {geocodingLoading ? t('client.locating') : t('client.my_position')}
                </span>
                <ChevronDown className="h-3 w-3 text-primary flex-shrink-0" />
              </Button>
            )}
          </div>
          
          {/* Zone droite: Actions groupées avec glassmorphism */}
          <div 
            className="flex items-center gap-0.5 bg-muted/40 backdrop-blur-sm rounded-full p-1 border border-border/20 animate-fade-up shadow-sm"
            style={{ animationDelay: '150ms' }}
          >
            <div className="transition-all duration-300 hover:scale-110 hover:bg-background/50 rounded-full">
              <NotificationCenter />
            </div>
            <div className="w-px h-5 bg-border/30 mx-0.5" />
            <div className="transition-all duration-300 hover:scale-110 hover:bg-background/50 rounded-full">
              <SeasonalThemeSelector />
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