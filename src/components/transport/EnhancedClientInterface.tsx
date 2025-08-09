import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdvancedRideRequest } from '@/hooks/useAdvancedRideRequest';
import { useClientBookings } from '@/hooks/useClientBookings';
import { 
  Car, 
  MapPin, 
  Navigation, 
  Clock, 
  Star,
  Search,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IntegrationGeocodingService } from '@/services/integrationGeocoding';

interface EnhancedClientInterfaceProps {
  className?: string;
}

const EnhancedClientInterface: React.FC<EnhancedClientInterfaceProps> = ({ className }) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  
  const { 
    createRideRequest, 
    searchingDrivers,
    availableDrivers,
    currentRequest,
    loading 
  } = useAdvancedRideRequest();
  
  const { 
    activeBooking, 
    createNewBooking,
    cancelBooking,
    loading: bookingLoading 
  } = useClientBookings();

  const vehicleTypes = [
    { id: 'standard', name: 'Standard', price: '2,500', icon: Car, description: 'Véhicule économique' },
    { id: 'comfort', name: 'Confort', price: '3,500', icon: Car, description: 'Véhicule climatisé' },
    { id: 'premium', name: 'Premium', price: '5,000', icon: Car, description: 'Véhicule de luxe' }
  ];

  const handleBookingRequest = async () => {
    if (!pickupLocation || !destination) {
      toast.error('Veuillez saisir les lieux de départ et d\'arrivée');
      return;
    }

    try {
      // Géocoder les adresses - simulation pour le moment
      // En production, utiliser le service de géocodage 
      const pickupCoords = await geocodeAddress(pickupLocation);
      const destCoords = await geocodeAddress(destination);

      // Create ride request using the enhanced system
      const request = await createRideRequest({
        pickupLocation,
        destination,
        pickupCoordinates: pickupCoords,
        destinationCoordinates: destCoords,
        vehicleClass: selectedVehicle
      });

      if (request) {
        toast.success('Recherche de chauffeur en cours...');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Erreur lors de la création de la réservation');
    }
  };

  // Géocodage d'adresse avec le service intégré
  const geocodeAddress = async (address: string): Promise<[number, number]> => {
    try {
      const result = await IntegrationGeocodingService.geocodeAddress(address);
      return [result.lat, result.lng];
    } catch (error) {
      console.error('Erreur géocodage:', error);
      // Fallback coordonnées Kinshasa avec variation
      const baseCoords: [number, number] = [-4.3217, 15.3069];
      const variation = (Math.random() - 0.5) * 0.02;
      return [baseCoords[0] + variation, baseCoords[1] + variation];
    }
  };

  const handleCancelRequest = async () => {
    if (activeBooking) {
      const success = await cancelBooking(activeBooking.id);
      if (success) {
        setPickupLocation('');
        setDestination('');
      }
    }
  };

  // Show active booking if exists
  if (activeBooking) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            Course en cours
            <Badge variant="secondary" className="bg-blue-500 text-white">
              {activeBooking.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-500" />
              <span><strong>Départ:</strong> {activeBooking.pickup_location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-red-500" />
              <span><strong>Arrivée:</strong> {activeBooking.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span><strong>Prix estimé:</strong> {activeBooking.estimated_price.toLocaleString()} CDF</span>
            </div>
            {activeBooking.driver_name && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span><strong>Chauffeur:</strong> {activeBooking.driver_name} ({activeBooking.driver_rating}/5)</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <div className="text-sm text-blue-800">
              {activeBooking.status === 'pending' && 'Recherche de chauffeur en cours...'}
              {activeBooking.status === 'accepted' && 'Chauffeur en route vers vous'}
              {activeBooking.status === 'driver_arrived' && 'Votre chauffeur est arrivé'}
              {activeBooking.status === 'in_progress' && 'Course en cours'}
            </div>
          </div>

          {(activeBooking.status === 'pending' || activeBooking.status === 'dispatching') && (
            <Button 
              variant="outline" 
              onClick={handleCancelRequest}
              disabled={bookingLoading}
              className="w-full"
            >
              Annuler la course
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Réserver une course
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Inputs */}
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            <Input
              placeholder="Lieu de départ"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
            <Input
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Type de véhicule :</div>
          <div className="grid gap-2">
            {vehicleTypes.map((vehicle) => (
              <Button
                key={vehicle.id}
                variant={selectedVehicle === vehicle.id ? 'default' : 'outline'}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <vehicle.icon className="h-5 w-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-xs text-muted-foreground">{vehicle.description}</div>
                  </div>
                  <div className="font-semibold">{vehicle.price} CDF</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleBookingRequest}
          disabled={loading || bookingLoading || !pickupLocation || !destination}
          className="w-full"
        >
          {loading || bookingLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Recherche...
            </div>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Trouver un chauffeur
            </>
          )}
        </Button>

        {/* Driver Search Results */}
        {searchingDrivers && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            <div className="text-sm text-yellow-800">
              Recherche de chauffeurs disponibles...
            </div>
          </div>
        )}

        {availableDrivers.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Chauffeurs disponibles :</div>
            {availableDrivers.map((driver, index) => (
              <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Chauffeur disponible</div>
                    <div className="text-sm text-muted-foreground">
                      Distance: {driver.distance?.toFixed(1)} km
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    5 min
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedClientInterface;