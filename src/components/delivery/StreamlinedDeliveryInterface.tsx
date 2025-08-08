import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeocodingService } from '@/services/geocoding';
import { usePriceEstimator } from '@/hooks/usePricingRules';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useToast } from '@/hooks/use-toast';
import { UniversalLocationSearch } from '@/components/location/UniversalLocationSearch';
import MapboxMap from '@/components/maps/MapboxMap';
import { 
  ArrowLeft,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  Clock,
  Loader2,
  Navigation2,
  Package,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface DeliveryOption {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  time: string;
  description: string;
  priceEstimator: (distance: number) => number;
}

interface StreamlinedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StreamlinedDeliveryInterface = ({ onSubmit, onCancel }: StreamlinedDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge'>('flash');
  const [distance, setDistance] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState<'pickup' | 'destination' | null>(null);

  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();
  const { createDeliveryOrder, loading: orderLoading } = useDeliveryOrders();
  
  const { estimate: flashEstimate } = usePriceEstimator('delivery', 'flash');
  const { estimate: flexEstimate } = usePriceEstimator('delivery', 'flex');
  const { estimate: maxichargeEstimate } = usePriceEstimator('delivery', 'maxicharge');

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'flash',
      name: 'Flash',
      subtitle: 'Moto rapide',
      icon: Bike,
      time: '15-30 min',
      description: 'Petits colis, documents',
      priceEstimator: flashEstimate,
    },
    {
      id: 'flex',
      name: 'Flex',
      subtitle: 'Voiture standard',
      icon: Car,
      time: '30-60 min',
      description: 'Colis moyens, fragiles',
      priceEstimator: flexEstimate,
    },
    {
      id: 'maxicharge',
      name: 'MaxiCharge',
      subtitle: 'Camion gros volume',
      icon: Truck,
      time: '1-2h',
      description: 'Électroménager, meubles',
      priceEstimator: maxichargeEstimate,
    },
  ];

  // Calcul automatique de la distance et du prix
  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistance(pickup.coordinates, destination.coordinates);
      setDistance(dist);
      
      const option = deliveryOptions.find(opt => opt.id === selectedMode);
      if (option) {
        setEstimatedPrice(option.priceEstimator(dist));
      }
    }
  }, [pickup, destination, selectedMode]);

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      // Coordonnées de Kinshasa par défaut
      const defaultKinshasa = { latitude: -4.4419, longitude: 15.2663 };
      
      let position = await getCurrentPosition();
      
      // Validation de la position obtenue
      if (!position?.coords || 
          position.coords.latitude === 0 || 
          position.coords.longitude === 0 ||
          Math.abs(position.coords.latitude) < 0.01 ||
          Math.abs(position.coords.longitude) < 0.01) {
        
        // Utiliser les coordonnées de Kinshasa par défaut
        position = {
          coords: {
            ...defaultKinshasa,
            accuracy: 1000,
            altitudeAccuracy: null,
            altitude: null,
            speed: null,
            heading: null
          },
          timestamp: Date.now()
        };
        
        toast({
          title: 'Position à Kinshasa',
          description: 'Localisation centrée sur Kinshasa',
          variant: 'default'
        });
      }

      if (position?.coords) {
        const address = await GeocodingService.reverseGeocode(
          position.coords.longitude,
          position.coords.latitude
        );
        const location = {
          address: address || 'Ma position actuelle',
          coordinates: [position.coords.longitude, position.coords.latitude] as [number, number]
        };
        setPickup(location);
        setPickupSearch(location.address);
        
        toast({
          title: 'Position trouvée',
          description: 'Point de départ mis à jour',
          variant: 'default'
        });
      }
    } catch (error) {
      // Fallback vers Kinshasa
      const defaultLocation = {
        address: 'Kinshasa, République Démocratique du Congo',
        coordinates: [15.2663, -4.4419] as [number, number]
      };
      setPickup(defaultLocation);
      setPickupSearch(defaultLocation.address);
      
      toast({
        title: 'Position par défaut',
        description: 'Utilisation de Kinshasa comme point de départ',
        variant: 'default'
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleLocationSearch = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Proximité centrée sur Kinshasa
      const kinshasaProximity = { lng: 15.2663, lat: -4.4419 };
      
      const results = await GeocodingService.searchPlaces(query, kinshasaProximity);
      if (results.length > 0) {
        const location = { 
          address: results[0].place_name, 
          coordinates: results[0].center as [number, number] 
        };
        
        if (isPickup) {
          setPickup(location);
          setPickupSearch(location.address);
        } else {
          setDestination(location);
          setDestinationSearch(location.address);
        }
        
        toast({
          title: 'Adresse trouvée',
          description: `${isPickup ? 'Départ' : 'Destination'} mis à jour`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Aucun résultat',
          description: 'Essayez une autre adresse ou un repère connu à Kinshasa',
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible de trouver cette adresse',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapLocationSelect = async (coordinates: [number, number]) => {
    if (!selectingLocation) return;

    try {
      const address = await GeocodingService.reverseGeocode(coordinates[0], coordinates[1]);
      const location = {
        address: address || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`,
        coordinates
      };

      if (selectingLocation === 'pickup') {
        setPickup(location);
        setPickupSearch(location.address);
        toast({
          title: 'Départ sélectionné',
          description: 'Point de départ mis à jour sur la carte',
          variant: 'default'
        });
      } else {
        setDestination(location);
        setDestinationSearch(location.address);
        toast({
          title: 'Destination sélectionnée',
          description: 'Destination mise à jour sur la carte',
          variant: 'default'
        });
      }
      
      setSelectingLocation(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer l\'adresse',
        variant: 'destructive'
      });
    }
  };

  const handleQuickBook = async () => {
    if (!pickup || !destination) return;

    try {
      const orderData = {
        pickupLocation: pickup.address,
        deliveryLocation: destination.address,
        pickupCoordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        deliveryCoordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        deliveryType: selectedMode as 'flash' | 'cargo',
        estimatedPrice: estimatedPrice,
      };

      const result = await createDeliveryOrder(orderData);
      if (result) {
        onSubmit({
          orderId: result.id,
          mode: selectedMode,
          pickup,
          destination,
          price: estimatedPrice,
          distance
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
    }
  };

  const canBook = pickup && destination && !isLoading && !orderLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* En-tête compact */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Livraison Express</h1>
              <p className="text-sm text-muted-foreground">Tout-en-un, simple et rapide</p>
            </div>
          </div>
          {estimatedPrice > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{estimatedPrice.toLocaleString()} FC</p>
              <p className="text-xs text-muted-foreground">{distance.toFixed(1)} km</p>
            </div>
          )}
        </div>
      </div>

      {/* Interface unique simplifiée */}
      <div className="p-4 space-y-4">
        
        {/* Carte interactive Mapbox */}
        <Card className="p-3 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Carte Interactive - Kinshasa</h3>
            </div>
            {selectingLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectingLocation(null)}
                className="text-xs"
              >
                Annuler
              </Button>
            )}
          </div>
          
          <div className="relative">
            <MapboxMap
              onLocationSelect={handleMapLocationSelect}
              pickupLocation={pickup?.coordinates}
              destination={destination?.coordinates}
              showRouting={!!(pickup && destination)}
              center={[15.2663, -4.4419]} // Kinshasa
              zoom={12}
              height="30vh"
            />
            
            {selectingLocation && (
              <div className="absolute top-2 left-2 right-2 bg-primary/90 text-white p-2 rounded-lg text-center text-sm font-medium">
                {selectingLocation === 'pickup' 
                  ? 'Cliquez sur la carte pour sélectionner le départ'
                  : 'Cliquez sur la carte pour sélectionner la destination'
                }
              </div>
            )}
          </div>
        </Card>

        {/* Point de départ */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Départ</label>
              <div className="mt-2">
                <UniversalLocationSearch
                  placeholder="Adresse de départ..."
                  value={pickup ? {
                    address: pickup.address,
                    coordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
                    type: 'search'
                  } : undefined}
                  onChange={(location) => {
                    setPickup({
                      address: location.address,
                      coordinates: [location.coordinates.lng, location.coordinates.lat]
                    });
                  }}
                  showCurrentLocation={true}
                  showSavedPlaces={true}
                  showRecentPlaces={true}
                />
              </div>
            </div>
            {pickup && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
          </div>
        </Card>

        {/* Destination */}
        <Card className="p-4 border-secondary/20 bg-secondary/5">
          <div className="flex items-center gap-3">
            <MapPin className="w-3 h-3 text-secondary flex-shrink-0" />
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground">Destination</label>
              <div className="mt-2">
                <UniversalLocationSearch
                  placeholder="Où livrer ?"
                  value={destination ? {
                    address: destination.address,
                    coordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
                    type: 'search'
                  } : undefined}
                  onChange={(location) => {
                    setDestination({
                      address: location.address,
                      coordinates: [location.coordinates.lng, location.coordinates.lat]
                    });
                  }}
                  showCurrentLocation={false}
                  showSavedPlaces={true}
                  showRecentPlaces={true}
                />
              </div>
            </div>
            {destination && <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />}
          </div>
        </Card>

        {/* Modes de livraison compacts */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Mode de livraison</h3>
          <div className="grid grid-cols-3 gap-2">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMode === option.id;
              const price = distance > 0 ? option.priceEstimator(distance) : 0;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedMode(option.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm scale-105'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-xs font-semibold text-foreground">{option.name}</p>
                  <p className="text-xs text-muted-foreground">{option.time}</p>
                  {price > 0 && (
                    <p className="text-xs font-bold text-primary mt-1">{price.toLocaleString()} FC</p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Résumé et confirmation */}
        {canBook && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Récapitulatif</p>
                  <p className="text-sm text-muted-foreground">
                    {distance.toFixed(1)} km • {deliveryOptions.find(o => o.id === selectedMode)?.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{estimatedPrice.toLocaleString()} FC</p>
                <p className="text-xs text-muted-foreground">Prix estimé</p>
              </div>
            </div>
            
            <Button
              onClick={handleQuickBook}
              disabled={orderLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
              size="lg"
            >
              {orderLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Confirmer la livraison
            </Button>
          </Card>
        )}

        {/* Assistance si pas encore prêt */}
        {!canBook && (
          <Card className="p-4 border-dashed border-muted-foreground/30">
            <div className="text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {!pickup && !destination && 'Sélectionnez le départ et la destination'}
                {pickup && !destination && 'Choisissez la destination'}
                {!pickup && destination && 'Choisissez le point de départ'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StreamlinedDeliveryInterface;