import { MapPin, Clock, Star, Home, Building, Navigation, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlaces } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';

interface RecentPlacesProps {
  onPlaceSelect: (placeName: string, coordinates?: { lat: number; lng: number }) => void;
}

export const RecentPlaces = ({ onPlaceSelect }: RecentPlacesProps) => {
  const { user } = useAuth();
  const { recentPlaces, homePlace, workPlace, loading, markAsUsed } = usePlaces();

  if (!user) return null;

  const displayPlaces = [
    ...(homePlace ? [homePlace] : []),
    ...(workPlace ? [workPlace] : []),
    ...recentPlaces.slice(0, 3)
  ];

  const handlePlaceClick = async (place: any) => {
    try {
      await markAsUsed(place.id);
      onPlaceSelect(place.name, place.coordinates);
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
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
          <p className="text-sm mt-1">Commencez à rechercher des lieux pour les voir apparaître ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Lieux récents</h3>
            <p className="text-xs text-muted-foreground">Vos destinations fréquentes</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>{displayPlaces.length} lieux</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {displayPlaces.map((place, index) => (
          <Card 
            key={place.id}
            className="group p-4 cursor-pointer border-0 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] animate-fade-in"
            onClick={() => handlePlaceClick(place)}
            style={{ 
              boxShadow: 'var(--shadow-sm)',
              background: 'var(--gradient-card)',
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="relative w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center border border-primary/10 group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300"
              >
                {place.place_type === 'home' && <Home className="h-5 w-5 text-primary" />}
                {place.place_type === 'work' && <Building className="h-5 w-5 text-primary" />}
                {(place.place_type === 'recent' || place.place_type === 'favorite') && <MapPin className="h-5 w-5 text-primary" />}
                
                {/* Badge de popularité */}
                {place.usage_count > 5 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-secondary to-secondary-light rounded-full flex items-center justify-center">
                    <Star className="h-2 w-2 text-white fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {place.name}
                  </h3>
                  {place.place_type === 'home' && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      Domicile
                    </span>
                  )}
                  {place.place_type === 'work' && (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded-full font-medium">
                      Bureau
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{place.address}</p>
              </div>
              
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 rounded-lg">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {place.usage_count}x
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {place.usage_count > 10 ? 'Très fréquent' : 
                   place.usage_count > 5 ? 'Fréquent' : 'Récent'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};