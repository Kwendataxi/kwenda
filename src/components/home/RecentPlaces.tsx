import { MapPin, Clock, Star, Home, Building, Navigation, TrendingUp, X, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlaces } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface RecentPlacesProps {
  onPlaceSelect: (placeName: string, coordinates?: { lat: number; lng: number }) => void;
  onViewAll?: () => void;
}

export const RecentPlaces = ({ onPlaceSelect, onViewAll }: RecentPlacesProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { 
    recentPlaces, 
    homePlace, 
    workPlace, 
    loading, 
    markAsUsed, 
    removeRecentPlace,
    addCurrentLocation,
    setHomePlace,
    setWorkPlace 
  } = usePlaces();

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

  const handleRemovePlace = (e: React.MouseEvent, placeId: string) => {
    e.stopPropagation();
    removeRecentPlace(placeId);
    toast({
      title: "Lieu supprimé",
      description: "Le lieu a été retiré de vos lieux récents",
    });
  };

  const handleAddCurrentLocation = async () => {
    try {
      await addCurrentLocation();
      toast({
        title: "Position ajoutée",
        description: "Votre position actuelle a été ajoutée aux lieux récents",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position actuelle",
        variant: "destructive"
      });
    }
  };

  const handleSetAsHome = (place: any) => {
    setHomePlace({
      name: place.name,
      address: place.address || place.name,
      coordinates: place.coordinates
    });
    toast({
      title: "Domicile défini",
      description: `${place.name} est maintenant votre domicile`,
    });
  };

  const handleSetAsWork = (place: any) => {
    setWorkPlace({
      name: place.name,
      address: place.address || place.name,
      coordinates: place.coordinates
    });
    toast({
      title: "Bureau défini",
      description: `${place.name} est maintenant votre bureau`,
    });
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
          <p className="text-sm mt-1 mb-4">{t('home.recent_places_help')}</p>
          <Button 
            onClick={handleAddCurrentLocation}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Ajouter ma position
          </Button>
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
            className="group p-3 cursor-pointer border-0 rounded-xl hover:shadow-md transition-all duration-200"
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
                {place.address && place.address !== place.name && (
                  <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                )}
              </div>

              {/* Actions rapides */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {place.place_type === 'recent' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetAsHome(place);
                      }}
                      className="h-7 w-7 p-0 hover:bg-primary/10"
                      title="Définir comme domicile"
                    >
                      <Home className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetAsWork(place);
                      }}
                      className="h-7 w-7 p-0 hover:bg-secondary/10"
                      title="Définir comme bureau"
                    >
                      <Building className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRemovePlace(e, place.id)}
                      className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive"
                      title="Supprimer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {/* Bouton pour ajouter la position actuelle */}
        <Card className="p-3 border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 transition-colors">
          <Button
            onClick={handleAddCurrentLocation}
            variant="ghost"
            className="w-full h-auto p-0 justify-start hover:bg-transparent"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">Ajouter ma position</h3>
                <p className="text-sm text-muted-foreground">Utiliser ma position actuelle</p>
              </div>
            </div>
          </Button>
        </Card>
      </div>
    </div>
  );
};