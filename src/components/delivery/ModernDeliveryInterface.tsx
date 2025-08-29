import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapsService } from '@/services/googleMapsService';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Target,
  CheckCircle2,
  Navigation,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface DeliveryData {
  pickup: {
    location: DeliveryLocation | null;
    contact: { name: string; phone: string };
  };
  destination: {
    location: DeliveryLocation | null;
    contact: { name: string; phone: string };
  };
}

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ModernDeliveryInterface: React.FC<ModernDeliveryInterfaceProps> = ({ onSubmit, onCancel }) => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickup: { location: null, contact: { name: '', phone: '' } },
    destination: { location: null, contact: { name: '', phone: '' } }
  });
  
  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { toast } = useToast();
  const googleMapsService = new GoogleMapsService();
  
  const pickupTimeoutRef = useRef<NodeJS.Timeout>();
  const destinationTimeoutRef = useRef<NodeJS.Timeout>();

  // ============ GÉOLOCALISATION AMÉLIORÉE ============

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setLocationError('Géolocalisation non supportée');
      return null;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Géocodage inverse avec fallback
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      try {
        // Utiliser une approche simplifiée sans GoogleMapsService pour l'instant
        address = `Position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      } catch (error) {
        console.warn('Géocodage inverse échoué, utilisation des coordonnées');
        // Fallback avec zones connues de Kinshasa
        const zones = [
          { name: 'Gombe', center: [-4.3167, 15.3167], radius: 0.02 },
          { name: 'Kinshasa Centre', center: [-4.3217, 15.3069], radius: 0.03 },
          { name: 'Lemba', center: [-4.3833, 15.2833], radius: 0.03 }
        ];
        
        for (const zone of zones) {
          const distance = Math.sqrt(
            Math.pow(latitude - zone.center[0], 2) + Math.pow(longitude - zone.center[1], 2)
          );
          if (distance < zone.radius) {
            address = `${zone.name}, Kinshasa, RDC`;
            break;
          }
        }
      }

      return { address, lat: latitude, lng: longitude };
    } catch (error: any) {
      let errorMessage = 'Erreur de géolocalisation';
      
      switch (error.code) {
        case 1:
          errorMessage = 'Autorisation refusée';
          break;
        case 2:
          errorMessage = 'Position indisponible';
          break;
        case 3:
          errorMessage = 'Délai dépassé';
          break;
      }
      
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const useCurrentLocationForPickup = async () => {
    const location = await getCurrentLocation();
    if (location) {
      const deliveryLocation: DeliveryLocation = {
        address: location.address,
        coordinates: { lat: location.lat, lng: location.lng }
      };
      
      setDeliveryData(prev => ({
        ...prev,
        pickup: { ...prev.pickup, location: deliveryLocation }
      }));
      
      setPickupQuery(location.address);
      
      toast({
        title: "Position détectée",
        description: "📍 " + location.address,
      });
    } else {
      toast({
        title: "Géolocalisation échouée",
        description: locationError || "Utilisez la recherche manuelle",
        variant: "destructive",
      });
    }
  };

  // ============ RECHERCHE D'ADRESSES ============

  const handlePickupSearch = useCallback(async (query: string) => {
    setPickupQuery(query);
    
    if (pickupTimeoutRef.current) {
      clearTimeout(pickupTimeoutRef.current);
    }

    if (query.length < 2) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      return;
    }

    pickupTimeoutRef.current = setTimeout(async () => {
      try {
        // Fallback direct avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setPickupSuggestions(fallbackResults);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error('Erreur recherche pickup:', error);
        // Fallback avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setPickupSuggestions(fallbackResults);
        setShowPickupSuggestions(true);
      }
    }, 500);
  }, []);

  const handleDestinationSearch = useCallback(async (query: string) => {
    setDestinationQuery(query);
    
    if (destinationTimeoutRef.current) {
      clearTimeout(destinationTimeoutRef.current);
    }

    if (query.length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    destinationTimeoutRef.current = setTimeout(async () => {
      try {
        // Fallback direct avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setDestinationSuggestions(fallbackResults);
        setShowDestinationSuggestions(true);
      } catch (error) {
        console.error('Erreur recherche destination:', error);
        // Fallback avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setDestinationSuggestions(fallbackResults);
        setShowDestinationSuggestions(true);
      }
    }, 500);
  }, []);

  const selectPickupLocation = (suggestion: any) => {
    const location: DeliveryLocation = {
      address: suggestion.address,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      pickup: { ...prev.pickup, location }
    }));
    
    setPickupQuery(suggestion.address);
    setShowPickupSuggestions(false);
  };

  const selectDestinationLocation = (suggestion: any) => {
    const location: DeliveryLocation = {
      address: suggestion.address,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      destination: { ...prev.destination, location }
    }));
    
    setDestinationQuery(suggestion.address);
    setShowDestinationSuggestions(false);
  };

  const canProceed = () => {
    return deliveryData.pickup.location && 
           deliveryData.destination.location && 
           deliveryData.pickup.contact.name && 
           deliveryData.pickup.contact.phone &&
           deliveryData.destination.contact.name;
  };

  const handleSubmit = () => {
    if (canProceed()) {
      onSubmit(deliveryData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4 safe-area-padding">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex items-center gap-2 hover:bg-primary/10 min-touch-target"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Nouvelle livraison
            </h1>
            <div className="w-16" />
          </div>
          
          <Progress value={50} className="w-full h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Configuration des adresses
          </p>
        </div>

        <Card className="glassmorphism animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Adresses de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            {/* Point de collecte */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Point de collecte *
              </label>
              
              {/* Bouton de géolocalisation */}
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={useCurrentLocationForPickup}
                  disabled={isGettingLocation}
                  className="w-full h-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 modern-button min-touch-target"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Target className="h-4 w-4 mr-2 text-primary" />
                  )}
                  <span className="text-sm sm:text-base">
                    {isGettingLocation ? 'Localisation...' : 'Ma position actuelle'}
                  </span>
                </Button>
                
                {locationError && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {locationError}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="text-center text-sm text-muted-foreground mb-3 flex items-center">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="px-3">ou saisir une adresse</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Adresse de collecte..."
                    value={pickupQuery}
                    onChange={(e) => handlePickupSearch(e.target.value)}
                    className="pl-10 h-12 modern-input text-sm sm:text-base"
                  />
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto glassmorphism shadow-lg">
                      <CardContent className="p-2">
                        {pickupSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-primary/5 cursor-pointer rounded-md transition-colors min-touch-target"
                            onClick={() => selectPickupLocation(suggestion)}
                          >
                            <p className="font-medium text-sm">{suggestion.address}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Confirmation de l'adresse sélectionnée */}
                {deliveryData.pickup.location && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Point de collecte confirmé
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          📍 {deliveryData.pickup.location.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact collecte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom du contact *
                  </label>
                  <Input
                    placeholder="Nom"
                    value={deliveryData.pickup.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value } }
                    }))}
                    className="modern-input min-touch-target"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Téléphone *
                  </label>
                  <Input
                    placeholder="+243 xxx xxx xxx"
                    value={deliveryData.pickup.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value } }
                    }))}
                    className="modern-input min-touch-target"
                  />
                </div>
              </div>
            </div>

            {/* Point de destination */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-secondary" />
                Point de livraison *
              </label>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Adresse de livraison..."
                  value={destinationQuery}
                  onChange={(e) => handleDestinationSearch(e.target.value)}
                  className="pl-10 h-12 modern-input text-sm sm:text-base min-touch-target"
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto glassmorphism shadow-lg">
                    <CardContent className="p-2">
                      {destinationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-secondary/5 cursor-pointer rounded-md transition-colors min-touch-target"
                          onClick={() => selectDestinationLocation(suggestion)}
                        >
                          <p className="font-medium text-sm">{suggestion.address}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Confirmation destination */}
              {deliveryData.destination.location && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Point de livraison confirmé
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        🎯 {deliveryData.destination.location.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact livraison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Destinataire *
                  </label>
                  <Input
                    placeholder="Nom du destinataire"
                    value={deliveryData.destination.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value } }
                    }))}
                    className="modern-input min-touch-target"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Téléphone
                  </label>
                  <Input
                    placeholder="+243 xxx xxx xxx"
                    value={deliveryData.destination.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value } }
                    }))}
                    className="modern-input min-touch-target"
                  />
                </div>
              </div>
            </div>

            {/* Bouton continuer */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium modern-button min-touch-target"
              >
                <span className="text-sm sm:text-base">Continuer</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernDeliveryInterface;