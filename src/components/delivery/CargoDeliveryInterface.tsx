import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import VehicleSizeSelector, { VehicleSize } from './VehicleSizeSelector';
import LoadingAssistanceToggle from './LoadingAssistanceToggle';
import { GeocodingService } from '@/services/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Truck,
  Target,
  Package,
  Search,
  History
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface CargoDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CargoDeliveryInterface = ({ onSubmit, onCancel }: CargoDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('size-s');
  const [hasAssistance, setHasAssistance] = useState(false);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { getCurrentPosition, latitude, longitude } = useGeolocation();
  const { recentPlaces, searchAndSave } = usePlaces();
  const { toast } = useToast();

  const vehicleSizes: VehicleSize[] = [
    {
      id: 'tricycle',
      name: 'Tricycle',
      description: 'Petit volume',
      dimensions: '60x40x30 cm',
      maxWeight: '20 kg',
      price: 800,
      examples: ['Cartons moyens', 'Appareils ménagers']
    },
    {
      id: 'size-s',
      name: 'Taille S',
      description: 'Coffre standard',
      dimensions: '80x60x40 cm',
      maxWeight: '40 kg',
      price: 1500,
      examples: ['Télévision', 'Micro-ondes', 'Caisses']
    },
    {
      id: 'size-m',
      name: 'Taille M',
      description: 'Pick-up compact',
      dimensions: '120x80x60 cm',
      maxWeight: '80 kg',
      price: 2500,
      examples: ['Réfrigérateur', 'Lave-linge', 'Matelas']
    },
    {
      id: 'size-l',
      name: 'Taille L',
      description: 'Camionnette',
      dimensions: '200x120x100 cm',
      maxWeight: '150 kg',
      price: 4000,
      examples: ['Gazinière', 'Armoire', 'Canapé']
    },
    {
      id: 'size-xl',
      name: 'Taille XL',
      description: 'Grand camion',
      dimensions: '300x150x150 cm',
      maxWeight: '300 kg',
      price: 6500,
      examples: ['Déménagement', 'Mobilier complet', 'Gros électroménager']
    }
  ];

  const selectedVehicle = vehicleSizes.find(v => v.id === selectedSize);
  
  const calculatePrice = () => {
    if (!pickup || !destination) return selectedVehicle?.price || 0;
    
    // Calculate real distance using coordinates
    const lat1 = pickup.coordinates[1];
    const lon1 = pickup.coordinates[0];
    const lat2 = destination.coordinates[1];
    const lon2 = destination.coordinates[0];
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const basePrice = selectedVehicle?.price || 0;
    const assistancePrice = hasAssistance ? 500 : 0;
    const distancePrice = Math.round(distance * 300); // 300 FC per km for cargo
    return Math.round(basePrice + assistancePrice + distancePrice);
  };

  const handleSubmit = async () => {
    if (!pickup || !destination || !selectedVehicle || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Save the delivery order to Supabase
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentification requise",
          description: "Vous devez être connecté pour effectuer une livraison",
          variant: "destructive"
        });
        return;
      }

      const orderData = {
        user_id: user.user.id,
        delivery_type: 'cargo',
        pickup_location: pickup.address,
        pickup_coordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        delivery_location: destination.address,
        delivery_coordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        estimated_price: calculatePrice(),
        vehicle_size: selectedSize,
        loading_assistance: hasAssistance,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Save locations to recent places
      await searchAndSave(pickup.address, { lat: pickup.coordinates[1], lng: pickup.coordinates[0] });
      await searchAndSave(destination.address, { lat: destination.coordinates[1], lng: destination.coordinates[0] });

      toast({
        title: "Commande créée",
        description: "Votre demande de livraison Cargo a été enregistrée"
      });

      onSubmit({
        orderId: data.id,
        mode: 'cargo',
        pickup,
        destination,
        vehicleSize: selectedSize,
        hasAssistance,
        price: calculatePrice(),
        estimatedTime: '30-60 min'
      });
    } catch (error) {
      console.error('Error creating delivery order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSearch = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return;
    
    try {
      const isSearching = isPickup ? setIsSearchingPickup : setIsSearchingDestination;
      isSearching(true);
      
      const proximity = latitude && longitude ? { lat: latitude, lng: longitude } : undefined;
      const results = await GeocodingService.searchPlaces(query, proximity);
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
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de trouver cette adresse",
        variant: "destructive"
      });
    } finally {
      const isSearching = isPickup ? setIsSearchingPickup : setIsSearchingDestination;
      isSearching(false);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      if (position && position.coords) {
        const address = await GeocodingService.reverseGeocode(position.coords.longitude, position.coords.latitude);
        setPickup({
          address: address || "Ma position actuelle",
          coordinates: [position.coords.longitude, position.coords.latitude]
        });
        setPickupSearch(address || "Ma position actuelle");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header Cargo-style */}
      <div className="bg-gradient-to-r from-primary to-primary-glow px-6 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading-md text-white">Cargo Delivery</h1>
              <p className="text-white/80 text-body-sm">Moyens et gros colis • Tous véhicules</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-caption uppercase tracking-wider">Prix estimé</p>
            <p className="text-heading-lg text-white font-bold">{calculatePrice().toLocaleString()} FC</p>
          </div>
        </div>
      </div>

      {/* Real Mapbox Map */}
      <div className="px-6 py-4">
        <div className="relative">
          <GoogleMapsKwenda
            pickup={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : undefined}
            destination={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : undefined}
            showRoute={!!(pickup && destination)}
            center={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : { lat: 4.0383, lng: 21.7587 }}
            zoom={12}
            height="200px"
            deliveryMode="maxicharge"
            onLocationSelect={(coordinates) => {
              // Handle map location selection
              if (!pickup) {
                GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                  setPickup({
                    address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
                    coordinates: [coordinates.lng, coordinates.lat]
                  });
                  setPickupSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
                });
              } else if (!destination) {
                GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                  setDestination({
                    address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
                    coordinates: [coordinates.lng, coordinates.lat]
                  });
                  setDestinationSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
                });
              }
            }}
          />
        </div>
      </div>

      {/* Smart Address Inputs */}
      <div className="px-6 space-y-4 mb-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-4 h-4 bg-primary rounded-full shadow-sm"></div>
          </div>
          <Input
            placeholder="D'où récupérer le colis ?"
            value={pickupSearch}
            onChange={(e) => setPickupSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, true)}
            className="pl-12 pr-32 h-14 rounded-xl border-2 border-border focus:border-primary text-body-md bg-white shadow-sm transition-all"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-light text-caption font-medium px-2 py-1 h-8"
            onClick={handleCurrentLocation}
            disabled={isSearchingPickup}
          >
            <Target className="w-4 h-4 mr-1" />
            Ma position
          </Button>
          {isSearchingPickup && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <Input
            placeholder="Où livrer le colis ?"
            value={destinationSearch}
            onChange={(e) => setDestinationSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(destinationSearch, false)}
            className="pl-12 pr-12 h-14 rounded-xl border-2 border-border focus:border-primary text-body-md bg-white shadow-sm transition-all"
          />
          {isSearchingDestination && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Recent Places */}
        {recentPlaces.length > 0 && (
          <div className="bg-white rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-body-sm text-muted-foreground">Lieux récents</span>
            </div>
            <div className="space-y-2">
              {recentPlaces.slice(0, 2).map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    if (!pickup) {
                      setPickup({
                        address: place.address,
                        coordinates: place.coordinates ? [place.coordinates.lng, place.coordinates.lat] : [-15.3094, 4.3276]
                      });
                      setPickupSearch(place.address);
                    } else if (!destination) {
                      setDestination({
                        address: place.address,
                        coordinates: place.coordinates ? [place.coordinates.lng, place.coordinates.lat] : [-15.2094, 4.4276]
                      });
                      setDestinationSearch(place.address);
                    }
                  }}
                  className="w-full text-left p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-body-sm font-medium">{place.name}</p>
                      <p className="text-caption text-muted-foreground">{place.address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Vehicle Size Selection */}
        <VehicleSizeSelector
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
        />

        {/* Loading Assistance */}
        <LoadingAssistanceToggle
          hasAssistance={hasAssistance}
          onToggle={setHasAssistance}
        />
      </div>

      {/* CTA Button */}
      <div className="p-6 bg-white border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-body-md">Prix total</span>
          <span className="text-heading-lg font-bold text-primary">
            {calculatePrice().toLocaleString()} FC
          </span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination || isSubmitting}
          className="w-full h-16 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold text-body-lg rounded-2xl shadow-lg mb-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: 'var(--shadow-elegant)' }}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création en cours...
            </div>
          ) : (
            'Confirmer la livraison Cargo'
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full text-muted-foreground hover:text-foreground text-body-md"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default CargoDeliveryInterface;