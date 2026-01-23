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
  
  // Dynamic greeting based on time + season (ABRÉGÉ)
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    // Greetings festifs COURTS pour ne pas décaler le nom
    if (currentSeason === 'christmas') return '🎄 Noël';
    if (currentSeason === 'newYear') return '🎆 2026';
    if (currentSeason === 'valentine') return '💝 St-Val';
    
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
    <header className="fixed top-0 left-0 right-0 z-[150] bg-background/95 backdrop-blur-xl border-b border-border/20">
      <div className="px-4 py-2.5 pt-safe">
        {/* Grid propre et aligné */}
        <div className="flex items-center justify-between gap-3 min-h-[48px]">
          {/* Zone gauche: Greeting + Nom + Position alignés à gauche */}
          <div className="flex flex-col items-start min-w-0">
            {/* Ligne 1: Greeting court + Nom */}
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider whitespace-nowrap">
                {getGreeting()}
              </span>
              <span className="text-base font-bold text-foreground truncate max-w-[110px]">
                {profileLoading ? '...' : displayName.split(' ')[0]}
              </span>
            </div>
            
            {/* Ligne 2: Position flush left */}
            {geolocation.latitude && geolocation.longitude && (
              <button
                onClick={() => setLocationSheetOpen(true)}
                className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <span className="truncate max-w-[140px]">
                  {geocodingLoading ? t('client.locating') : t('client.my_position')}
                </span>
                <ChevronDown className="h-2.5 w-2.5 text-primary/60" />
              </button>
            )}
          </div>
          
          {/* Zone droite: Icônes soft et discrètes */}
          <div className="flex items-center gap-1 bg-muted/30 backdrop-blur-sm rounded-full px-1.5 py-1 border border-border/10">
            <NotificationCenter />
            <div className="w-px h-4 bg-border/20" />
            <SeasonalThemeSelector />
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