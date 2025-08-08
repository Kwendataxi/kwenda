import { MapPin, Clock, Star, Home, Building, Navigation, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlaces } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentPlacesProps {
  onPlaceSelect: (placeName: string, coordinates?: { lat: number; lng: number }) => void;
  onViewAll?: () => void;
}

export const RecentPlaces = ({ onPlaceSelect, onViewAll }: RecentPlacesProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { recentPlaces, homePlace, workPlace, loading, markAsUsed } = usePlaces();

  if (!user) return null;

  const displayPlaces = [
    ...(homePlace ? [homePlace] : []),
    ...(workPlace ? [workPlace] : []),
    ...recentPlaces.slice(0, 2)
  ];

  const handlePlaceClick = async (place: any) => {
    try {
      await markAsUsed(place.id);
      onPlaceSelect(place.name, place.coordinates);
    } catch (error) {
      console.error('Error selecting place:', error);
      onPlaceSelect(place.name, place.coordinates);
    }
  };

  if (loading) {
    return (
      <div className="px-4 mb-8">
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (displayPlaces.length === 0) {
    return (
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-md text-foreground">Lieux récents</h3>
        </div>
        <div className="text-center p-8 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>Aucun lieu récent trouvé</p>
          <p className="text-sm mt-1">{t('home.recent_places_help')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{t('home.recent_places')}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
            aria-label="Voir tous les lieux"
          >
            Voir tout
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {displayPlaces.map((place) => (
          <Card 
            key={place.id}
            className="p-3 cursor-pointer border-0 rounded-xl hover:shadow-md transition-all duration-200"
            onClick={() => handlePlaceClick(place)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                {place.place_type === 'home' && <Home className="h-4 w-4 text-primary" />}
                {place.place_type === 'work' && <Building className="h-4 w-4 text-primary" />}
                {(place.place_type === 'recent' || place.place_type === 'favorite') && <MapPin className="h-4 w-4 text-primary" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">{place.name}</h3>
                  {place.place_type === 'home' && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">
                      Domicile
                    </span>
                  )}
                  {place.place_type === 'work' && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded font-medium">
                      Bureau
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};