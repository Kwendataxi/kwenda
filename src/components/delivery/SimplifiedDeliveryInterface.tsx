import React, { useState, useEffect } from 'react';
import { MapPin, Package, Clock, DollarSign, ArrowRight, Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GoogleMapsService } from '@/services/googleMapsService';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { IntelligentLocationSearch } from '@/components/maps/IntelligentLocationSearch';
import { IntelligentAddressSearch } from '@/components/location/IntelligentAddressSearch';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';

interface Location {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryMode {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  icon: string;
  time: string;
  description: string;
  basePrice: number;
}

interface SimplifiedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const deliveryModes: DeliveryMode[] = [
  {
    id: 'flash',
    name: 'Flash',
    icon: '🏍️',
    time: '15-30 min',
    description: 'Livraison ultra-rapide par moto',
    basePrice: 5000
  },
  {
    id: 'flex',
    name: 'Flex',
    icon: '🚗',
    time: '30-60 min',
    description: 'Livraison standard économique',
    basePrice: 3000
  },
  {
    id: 'maxicharge',
    name: 'MaxiCharge',
    icon: '🚛',
    time: '1-2 heures',
    description: 'Gros colis et marchandises',
    basePrice: 8000
  }
];

const popularPlaces = [
  { name: 'Gombe Centre', lat: -4.3276, lng: 15.3154 },
  { name: 'Aéroport N\'djili', lat: -4.3857, lng: 15.4446 },
  { name: 'Marché Central', lat: -4.3217, lng: 15.3069 },
  { name: 'Université de Kinshasa', lat: -4.4339, lng: 15.3505 }
];

const SimplifiedDeliveryInterface: React.FC<SimplifiedDeliveryInterfaceProps> = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState<'locations' | 'delivery'>('locations');
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedMode, setSelectedMode] = useState<DeliveryMode | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [mapError, setMapError] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();
  const { getCurrentPosition } = useGeolocation();
  const { calculateDeliveryPrice, createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();

  // Auto-detect current location
  useEffect(() => {
    getCurrentPosition()
      .then(async (position) => {
        try {
        const address = await GoogleMapsService.reverseGeocode(position.lng, position.lat);
        setPickup({
          address,
          lat: position.lat,
          lng: position.lng
        });
          setPickupSearch(address);
        } catch (error) {
          // Fallback to Kinshasa center
          setPickup({
            address: 'Kinshasa Centre',
            lat: -4.3217,
            lng: 15.3069
          });
          setPickupSearch('Kinshasa Centre');
        }
      })
      .catch(() => {
        // Fallback location
        setPickup({
          address: 'Kinshasa Centre',
          lat: -4.3217,
          lng: 15.3069
        });
        setPickupSearch('Kinshasa Centre');
      });
  }, []);

  // Calculate price when locations change
  useEffect(() => {
    if (pickup && destination && selectedMode) {
      setIsCalculating(true);
      calculateDeliveryPrice(pickup, destination, selectedMode.id)
        .then(({ price, distance: dist }) => {
          setEstimatedPrice(price);
          setDistance(dist);
        })
        .catch(() => {
          // Fallback calculation
          const dist = Math.sqrt(
            Math.pow(pickup.lat - destination.lat, 2) + 
            Math.pow(pickup.lng - destination.lng, 2)
          ) * 111000; // Approximate km to meters
          setDistance(dist);
          setEstimatedPrice(selectedMode.basePrice + (dist / 1000) * 500);
        })
        .finally(() => {
          setIsCalculating(false);
        });
    }
  }, [pickup, destination, selectedMode]);

  const searchLocation = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return;

    try {
      const results = await GoogleMapsService.searchPlaces(query);
      if (results.length > 0) {
        const location = {
          address: results[0].place_name,
          lat: results[0].center[1],
          lng: results[0].center[0]
        };
        
        if (isPickup) {
          setPickup(location);
        } else {
          setDestination(location);
        }
      }
    } catch (error) {
      // Fallback: use predefined places
      const fallbackPlace = popularPlaces.find(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      
      if (fallbackPlace) {
        const location = {
          address: fallbackPlace.name,
          lat: fallbackPlace.lat,
          lng: fallbackPlace.lng
        };
        
        if (isPickup) {
          setPickup(location);
        } else {
          setDestination(location);
        }
      }
    }
  };

  const handleConfirm = async () => {
    if (!pickup || !destination || !selectedMode) return;

    try {
      const orderData = {
        city: 'Kinshasa',
        pickup,
        destination,
        mode: selectedMode.id,
        estimatedPrice,
        distance,
        duration: Math.round(distance / 1000 * 60) // Approximation: 1 km/min
      };

      const orderId = await createDeliveryOrder(orderData);
      onSubmit({ ...orderData, orderId });
    } catch (error) {
      // Error handled by hook
    }
  };

  if (step === 'locations') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Livraison Express</h1>
              <p className="text-sm opacity-90">Où souhaitez-vous livrer ?</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-primary-foreground">
              ✕
            </Button>
          </div>
        </div>

        {/* Location Inputs */}
        <div className="p-4 space-y-4">
          {/* Pickup */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-muted-foreground">Point de récupération</span>
            </div>
            <IntelligentAddressSearch
              placeholder="Adresse de récupération"
              onLocationSelect={(result) => {
                const loc = {
                  address: result.name,
                  lat: result.lat,
                  lng: result.lng
                };
                setPickup(loc);
                setPickupSearch(loc.address);
              }}
              showCurrentLocation={true}
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-muted-foreground">Destination</span>
            </div>
            <IntelligentAddressSearch
              placeholder="Adresse de livraison"
              onLocationSelect={(result) => {
                const loc = {
                  address: result.name,
                  lat: result.lat,
                  lng: result.lng
                };
                setDestination(loc);
                setDestinationSearch(loc.address);
              }}
              showCurrentLocation={true}
            />
          </div>

          {/* Popular Places */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Lieux populaires</span>
            <div className="grid grid-cols-2 gap-2">
              {popularPlaces.map((place) => (
                <Button
                  key={place.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!destination) {
                      setDestination({
                        address: place.name,
                        lat: place.lat,
                        lng: place.lng
                      });
                      setDestinationSearch(place.name);
                    }
                  }}
                  className="justify-start text-xs"
                >
                  <Star className="w-3 h-3 mr-1" />
                  {place.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {!mapError ? (
            <GoogleMapsKwenda
              pickup={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
              destination={destination ? { lat: destination.lat, lng: destination.lng } : undefined}
              showRoute={!!(pickup && destination)}
              height="100%"
            />
          ) : (
            <div className="h-full bg-muted flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Carte non disponible - Mode basique activé
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t">
          <Button
            onClick={() => setStep('delivery')}
            disabled={!pickup || !destination}
            className="w-full"
            size="lg"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mode de livraison</h1>
            <p className="text-sm opacity-90">
              {pickup?.address} → {destination?.address}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setStep('locations')}
            className="text-primary-foreground"
          >
            ←
          </Button>
        </div>
      </div>

      {/* Delivery Modes */}
      <div className="flex-1 p-4 space-y-3">
        {deliveryModes.map((mode) => (
          <Card
            key={mode.id}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedMode?.id === mode.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedMode(mode)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{mode.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{mode.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {mode.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
              </div>
              <div className="text-right">
                {isCalculating && selectedMode?.id === mode.id ? (
                  <div className="text-sm text-muted-foreground">Calcul...</div>
                ) : (
                  <div className="font-bold text-lg">
                    {selectedMode?.id === mode.id && estimatedPrice > 0
                      ? `${estimatedPrice.toLocaleString()} CDF`
                      : `${mode.basePrice.toLocaleString()}+ CDF`
                    }
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary & Confirm */}
      {selectedMode && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Distance estimée</span>
            <span className="font-medium">
              {distance > 0 ? `${(distance / 1000).toFixed(1)} km` : '---'}
            </span>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !pickup || !destination || !selectedMode}
            className="w-full"
            size="lg"
          >
            {submitting ? 'Création...' : `Confirmer • ${estimatedPrice.toLocaleString()} CDF`}
            <Package className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimplifiedDeliveryInterface;