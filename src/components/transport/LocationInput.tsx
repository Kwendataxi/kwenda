import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Clock, Home, Building2, Target, Loader2 } from 'lucide-react';
import { usePlaces } from '@/hooks/usePlaces';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeocodingService } from '@/services/geocoding';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Location {
  address: string;
  coordinates: [number, number];
  type?: 'home' | 'work' | 'other' | 'recent' | 'favorite';
}

interface LocationInputProps {
  placeholder: string;
  value: string;
  onChange: (location: Location) => void;
  onInputChange: (value: string) => void;
}

const LocationInput = ({ placeholder, value, onChange, onInputChange }: LocationInputProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Hooks pour les lieux sauvegardés et géolocalisation
  const { recentPlaces, favoritePlaces, homePlace, workPlace, markAsUsed, searchAndSave } = usePlaces();
  const { getCurrentPosition, latitude, longitude } = useGeolocation();

  // Recherche de lieux avec Mapbox
  useEffect(() => {
    const searchPlaces = async () => {
      if (value.length > 2) {
        setLoading(true);
        try {
          const results = await GeocodingService.searchPlaces(
            value, 
            latitude && longitude ? { lng: longitude, lat: latitude } : undefined
          );
          
          const formattedResults: Location[] = results.map(result => ({
            address: result.place_name,
            coordinates: [result.center[0], result.center[1]] as [number, number],
            type: 'other'
          }));
          
          setSuggestions(formattedResults);
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(searchPlaces, 300);
    return () => clearTimeout(timeoutId);
  }, [value, latitude, longitude]);

  const handleLocationSelect = async (location: Location) => {
    try {
      // Sauvegarder le lieu dans l'historique de l'utilisateur
      if (location.type === 'other') {
        await searchAndSave(location.address, {
          lat: location.coordinates[1],
          lng: location.coordinates[0]
        });
      } else if (location.type === 'recent' || location.type === 'favorite') {
        // Marquer comme utilisé pour remonter dans les récents
        const userPlace = recentPlaces.find(p => p.address === location.address) ||
                         favoritePlaces.find(p => p.address === location.address);
        if (userPlace) {
          await markAsUsed(userPlace.id);
        }
      }
      
      onChange(location);
      onInputChange(location.address);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      onChange(location);
      onInputChange(location.address);
      setIsOpen(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setGeoLoading(true);
    try {
      const position = await getCurrentPosition();
      if (position && latitude && longitude) {
        // Reverse geocoding pour obtenir l'adresse
        try {
          const address = await GeocodingService.reverseGeocode(longitude, latitude);
          const location: Location = {
            address: address || "Ma position actuelle",
            coordinates: [longitude, latitude]
          };
          handleLocationSelect(location);
        } catch {
          // Fallback si le reverse geocoding échoue
          const location: Location = {
            address: "Ma position actuelle",
            coordinates: [longitude, latitude]
          };
          handleLocationSelect(location);
        }
      } else {
        toast({
          title: "Erreur de localisation",
          description: "Impossible d'obtenir votre position actuelle",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      toast({
        title: "Erreur de localisation",
        description: "Veuillez vérifier que la géolocalisation est activée",
        variant: "destructive"
      });
    } finally {
      setGeoLoading(false);
    }
  };

  // Convertir les lieux sauvegardés au format Location
  const savedPlaces = [
    ...(homePlace ? [{
      location: {
        address: homePlace.address,
        coordinates: homePlace.coordinates ? 
          [homePlace.coordinates.lng, homePlace.coordinates.lat] as [number, number] : 
          [-15.3094, 4.3076] as [number, number],
        type: 'home' as const
      },
      icon: Home,
      label: "Domicile",
      subtitle: homePlace.address
    }] : []),
    ...(workPlace ? [{
      location: {
        address: workPlace.address,
        coordinates: workPlace.coordinates ? 
          [workPlace.coordinates.lng, workPlace.coordinates.lat] as [number, number] : 
          [-15.3094, 4.3276] as [number, number],
        type: 'work' as const
      },
      icon: Building2,
      label: "Bureau", 
      subtitle: workPlace.address
    }] : [])
  ];

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onInputChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-white rounded-xl border-grey-100 h-12 pl-4 pr-12"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            className="h-8 w-8 p-0"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 text-grey-400 animate-spin" />
            ) : (
              <Target className="h-4 w-4 text-grey-400" />
            )}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-grey-100 shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Current Location */}
          <div className="p-2 border-b border-grey-100">
            <button
              onClick={handleGetCurrentLocation}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
              disabled={geoLoading}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-grey-900">Ma position actuelle</p>
                <p className="text-sm text-grey-600">Utiliser le GPS</p>
              </div>
            </button>
          </div>

          {/* Saved Places */}
          {value.length === 0 && (
            <div className="p-2 border-b border-grey-100">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Lieux enregistrés</h4>
              {savedPlaces.map((place, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(place.location)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <place.icon className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{place.label}</p>
                    <p className="text-sm text-grey-600">{place.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Suggestions</h4>
              {suggestions.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{location.address}</p>
                    <p className="text-sm text-grey-600">Kinshasa, RDC</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Locations */}
          {value.length === 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-grey-700 px-3 py-2">Récemment</h4>
              {recentPlaces.slice(0, 3).map((place, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect({
                    address: place.address,
                    coordinates: place.coordinates ? 
                      [place.coordinates.lng, place.coordinates.lat] as [number, number] : 
                      [-15.3094, 4.3276] as [number, number],
                    type: 'recent'
                  })}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-grey-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-grey-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-grey-900">{place.name}</p>
                    <p className="text-sm text-grey-600">Récent</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;