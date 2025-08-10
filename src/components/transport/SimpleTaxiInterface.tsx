import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { LocationData } from '@/types/location';
import { toast } from 'sonner';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Car,
  Bike,
  Loader2,
  Zap,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface Vehicle {
  id: string;
  name: string;
  type: 'eco' | 'standard' | 'premium' | 'moto';
  icon: any;
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  estimatedTime: string;
  features: string[];
  color: string;
}

const VEHICLES: Vehicle[] = [
  {
    id: 'moto',
    name: 'Kwenda Moto',
    type: 'moto',
    icon: Bike,
    capacity: 1,
    pricePerKm: 800,
    basePrice: 1500,
    estimatedTime: '3-5 min',
    features: ['Très rapide', 'Évite embouteillages'],
    color: 'bg-orange-500'
  },
  {
    id: 'eco',
    name: 'Kwenda Eco',
    type: 'eco',
    icon: Car,
    capacity: 4,
    pricePerKm: 1200,
    basePrice: 2500,
    estimatedTime: '5-8 min',
    features: ['Économique', 'Confortable'],
    color: 'bg-green-500'
  },
  {
    id: 'standard',
    name: 'Kwenda Standard',
    type: 'standard',
    icon: Car,
    capacity: 4,
    pricePerKm: 1500,
    basePrice: 3000,
    estimatedTime: '5-10 min',
    features: ['Climatisation', 'WiFi'],
    color: 'bg-blue-500'
  },
  {
    id: 'premium',
    name: 'Kwenda Premium',
    type: 'premium',
    icon: Car,
    capacity: 4,
    pricePerKm: 2500,
    basePrice: 5000,
    estimatedTime: '3-7 min',
    features: ['Luxe', 'Chauffeur professionnel'],
    color: 'bg-purple-500'
  }
];

interface SimpleTaxiInterfaceProps {
  onBookingRequest: (bookingData: any) => void;
  initialPickup?: LocationData;
  initialDestination?: LocationData;
  onBack?: () => void;
}

const SimpleTaxiInterface: React.FC<SimpleTaxiInterfaceProps> = ({
  onBookingRequest,
  initialPickup,
  initialDestination,
  onBack
}) => {
  const { user } = useAuth();
  const { 
    location,
    getCurrentPosition,
    calculateDistance,
    loading: locationLoading,
    error: locationError
  } = useMasterLocation();
  
  const [pickup, setPickup] = useState<LocationData | null>(initialPickup || null);
  const [destination, setDestination] = useState<LocationData | null>(initialDestination || null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Auto-detect location
  useEffect(() => {
    if (location && !pickup) {
      setPickup(location);
      toast.success('Position détectée automatiquement');
    }
  }, [location, pickup]);

  // Calculate distance when both locations are set
  useEffect(() => {
    if (pickup && destination) {
      setIsCalculatingPrice(true);
      try {
        const distanceInMeters = calculateDistance(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destination.lat, lng: destination.lng }
        );
        setDistance(distanceInMeters);
      } catch (error) {
        console.error('Erreur calcul distance:', error);
        toast.error('Impossible de calculer la distance');
      } finally {
        setIsCalculatingPrice(false);
      }
    }
  }, [pickup, destination, calculateDistance]);

  const calculatePrice = (vehicle: Vehicle): number => {
    if (!distance) return vehicle.basePrice;
    const distanceKm = distance / 1000;
    return vehicle.basePrice + (distanceKm * vehicle.pricePerKm);
  };

  const handleBooking = async () => {
    if (!pickup || !destination || !selectedVehicle || !user) {
      toast.error('Veuillez compléter toutes les informations');
      return;
    }

    try {
      const estimatedPrice = calculatePrice(selectedVehicle);

      const bookingData = {
        pickupLocation: pickup.address,
        pickupCoordinates: [pickup.lng, pickup.lat],
        destination: destination.address,
        destinationCoordinates: [destination.lng, destination.lat],
        vehicleClass: selectedVehicle.type,
        estimatedPrice: Math.round(estimatedPrice),
        distance: distance || 0
      };

      await onBookingRequest(bookingData);
      
      toast.success('Demande de course créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast.error('Erreur lors de la réservation');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Réserver une course</h1>
        <p className="text-sm text-muted-foreground">Simple et rapide</p>
      </div>

      {/* Locations Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Pickup */}
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              Départ
            </div>
            <UniversalLocationPicker
              context="transport"
              placeholder="D'où partez-vous ?"
              value={pickup}
              onLocationSelect={setPickup}
              showCurrentLocation={true}
              showNearbyPlaces={true}
              className="w-full"
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-foreground">
              <Navigation className="w-4 h-4 mr-2 text-secondary" />
              Destination
            </div>
            <UniversalLocationPicker
              context="transport"
              placeholder="Où souhaitez-vous aller ?"
              value={destination}
              onLocationSelect={setDestination}
              showNearbyPlaces={true}
              showRecentLocations={true}
              className="w-full"
            />
          </div>

          {/* Distance info */}
          {pickup && destination && distance && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium">{(distance / 1000).toFixed(1)} km</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Selection */}
      {pickup && destination && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Choisissez votre véhicule</h3>
              
              {isCalculatingPrice ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Calcul du prix...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {VEHICLES.map((vehicle) => {
                    const isSelected = selectedVehicle?.id === vehicle.id;
                    const price = calculatePrice(vehicle);
                    
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`w-full p-3 border rounded-lg transition-all duration-200 hover:shadow-sm ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vehicle.color}`}>
                              <vehicle.icon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="text-left">
                              <h4 className="font-medium text-foreground text-sm">{vehicle.name}</h4>
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {vehicle.estimatedTime}
                                </span>
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {vehicle.capacity}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(Math.round(price))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Book Button */}
      {selectedVehicle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Button 
            onClick={handleBooking}
            className="w-full py-3 text-base font-semibold"
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Réserver maintenant - {formatCurrency(Math.round(calculatePrice(selectedVehicle)))}
          </Button>
        </motion.div>
      )}

      {/* Back button */}
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          ← Retour
        </Button>
      )}
    </div>
  );
};

export default SimpleTaxiInterface;