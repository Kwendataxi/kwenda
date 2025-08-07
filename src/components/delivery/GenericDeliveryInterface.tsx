import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapboxMap from '@/components/maps/MapboxMap';
import { GeocodingService } from '@/services/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Package, 
  Clock, 
  Bike,
  Truck,
  Target,
  Shield,
  Search,
  History
} from 'lucide-react';
import { usePriceEstimator } from '@/hooks/usePricingRules';

interface Location {
  address: string;
  coordinates: [number, number];
}

export type GenericDeliveryMode = 'flash' | 'flex' | 'maxicharge';

interface GenericDeliveryInterfaceProps {
  mode: GenericDeliveryMode;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const titles: Record<GenericDeliveryMode, { title: string; subtitle: string; Icon: any; gradient: string; cta: string }> = {
  flash: { title: 'Flash (Moto)', subtitle: 'Livraison rapide • Moto', Icon: Bike, gradient: 'from-secondary to-secondary-light', cta: 'Confirmer la livraison Flash' },
  flex: { title: 'Flex (≤ 1 000 kg)', subtitle: 'Cargo léger • Jusqu’à 1 000 kg', Icon: Truck, gradient: 'from-primary to-primary-glow', cta: 'Confirmer la livraison Flex' },
  maxicharge: { title: 'MaxiCharge (≤ 3 500 kg)', subtitle: 'Cargo lourd • Jusqu’à 3 500 kg', Icon: Truck, gradient: 'from-primary to-primary-glow', cta: 'Confirmer la livraison MaxiCharge' },
};

const GenericDeliveryInterface = ({ mode, onSubmit, onCancel }: GenericDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getCurrentPosition, latitude, longitude } = useGeolocation();
  const { recentPlaces, searchAndSave } = usePlaces();
  const { toast } = useToast();
  const { estimate, rule } = usePriceEstimator('delivery', mode);

  const HeaderIcon = titles[mode].Icon;

  const getPricingParts = () => {
    if (rule) return { base: rule.base_price || 0, perKm: rule.price_per_km || 0 };
    const defaults: Record<GenericDeliveryMode, { base: number; perKm: number }> = {
      flash: { base: 5000, perKm: 1000 },
      flex: { base: 55000, perKm: 2500 },
      maxicharge: { base: 100000, perKm: 5000 }
    };
    return defaults[mode];
  };

  const pricing = getPricingParts();

  const calculatePrice = () => {
    if (!pickup || !destination) return estimate(0);
    const lat1 = pickup.coordinates[1];
    const lon1 = pickup.coordinates[0];
    const lat2 = destination.coordinates[1];
    const lon2 = destination.coordinates[0];
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return estimate(distance);
  };

  const handleSubmit = async () => {
    if (!pickup || !destination || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({ title: 'Authentification requise', description: 'Vous devez être connecté pour effectuer une livraison', variant: 'destructive' });
        return;
      }

      const orderData = {
        user_id: user.user.id,
        delivery_type: mode,
        pickup_location: pickup.address,
        pickup_coordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        delivery_location: destination.address,
        delivery_coordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        estimated_price: calculatePrice(),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      await searchAndSave(pickup.address, { lat: pickup.coordinates[1], lng: pickup.coordinates[0] });
      await searchAndSave(destination.address, { lat: destination.coordinates[1], lng: destination.coordinates[0] });

      toast({ title: 'Commande créée', description: `Votre demande de livraison ${mode} a été enregistrée` });

      onSubmit({
        orderId: data.id,
        mode,
        pickup,
        destination,
        price: calculatePrice(),
        estimatedTime: mode === 'flash' ? '15-25 min' : mode === 'flex' ? '30-60 min' : '60-120 min'
      });
    } catch (error) {
      console.error('Error creating delivery order:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer la commande. Veuillez réessayer.', variant: 'destructive' });
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
        const location = { address: results[0].place_name, coordinates: results[0].center as [number, number] };
        if (isPickup) { setPickup(location); setPickupSearch(location.address); }
        else { setDestination(location); setDestinationSearch(location.address); }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'Erreur de recherche', description: 'Impossible de trouver cette adresse', variant: 'destructive' });
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
        setPickup({ address: address || 'Ma position actuelle', coordinates: [position.coords.longitude, position.coords.latitude] });
        setPickupSearch(address || 'Ma position actuelle');
      }
    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible d'obtenir votre position", variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${titles[mode].gradient} px-6 py-4 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <HeaderIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-heading-md text-white">{titles[mode].title}</h1>
              <p className="text-white/80 text-body-sm">{titles[mode].subtitle}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px]">
                  {mode === 'flash' ? 'Moto' : mode === 'flex' ? '≤ 1 000 kg' : '≤ 3 500 kg'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px]">
                  Tarif: Base {pricing.base.toLocaleString()} FC + {pricing.perKm.toLocaleString()} FC/km
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-caption uppercase tracking-wider">Prix estimé</p>
            <p className="text-heading-lg text-white font-bold">{calculatePrice().toLocaleString()} FC</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="px-4 py-2">
        <div className="relative">
          <MapboxMap
            pickupLocation={pickup ? pickup.coordinates : undefined}
            destination={destination ? destination.coordinates : undefined}
            showRouting={!!(pickup && destination)}
            height="160px"
            onLocationSelect={(coordinates) => {
              if (!pickup) {
                GeocodingService.reverseGeocode(coordinates[0], coordinates[1]).then(address => {
                  setPickup({ address: address || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`, coordinates });
                  setPickupSearch(address || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
                });
              } else if (!destination) {
                GeocodingService.reverseGeocode(coordinates[0], coordinates[1]).then(address => {
                  setDestination({ address: address || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`, coordinates });
                  setDestinationSearch(address || `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`);
                });
              }
            }}
          />
        </div>
      </div>

      {/* Address Inputs */}
      <div className="px-4 space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="w-4 h-4 bg-primary rounded-full shadow-sm"></div>
          </div>
          <Input
            placeholder="D'où partons-nous ?"
            value={pickupSearch}
            onChange={(e) => setPickupSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, true)}
            className="pl-12 pr-32 h-12 rounded-xl border border-border focus:border-primary text-sm bg-white shadow-sm transition-all"
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
            placeholder="Où livrer ?"
            value={destinationSearch}
            onChange={(e) => setDestinationSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(destinationSearch, false)}
            className="pl-12 pr-12 h-12 rounded-xl border border-border focus:border-primary text-sm bg-white shadow-sm transition-all"
          />
          {isSearchingDestination && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {recentPlaces.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lieux récents</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentPlaces.slice(0, 4).map((place) => (
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
                  className="flex-shrink-0 bg-white border border-border/50 rounded-lg p-3 hover:shadow-md transition-all min-w-[140px]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground truncate max-w-[120px]">{place.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle info / ETA */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-white flex items-center justify-center">
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{titles[mode].title}</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{mode === 'flash' ? '15-25 min' : mode === 'flex' ? '30-60 min' : '60-120 min'}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 text-primary" />
                  <span>Assuré</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{calculatePrice().toLocaleString()} FC</p>
              <p className="text-caption text-muted-foreground">Base {pricing.base.toLocaleString()} + {pricing.perKm.toLocaleString()}/km</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="sticky bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-border/50">
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination || isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-white font-semibold text-sm rounded-xl shadow-lg mb-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création en cours...
            </div>
          ) : (
            titles[mode].cta
          )}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground hover:text-foreground text-sm">
          Annuler
        </Button>
      </div>
    </div>
  );
};

export default GenericDeliveryInterface;
