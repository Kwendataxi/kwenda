import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  X, 
  Navigation, 
  Clock, 
  Star,
  Car,
  Bike,
  Users,
  CreditCard
} from 'lucide-react';
import LocationInput from './LocationInput';
import GoogleMapsKwenda from '../maps/GoogleMapsKwenda';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface IntermediateStop {
  id: string;
  address: string;
  coordinates?: [number, number];
}

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
}

const VEHICLES: Vehicle[] = [
  {
    id: 'moto',
    name: 'Kwenda Moto',
    type: 'moto',
    icon: Bike,
    capacity: 1,
    pricePerKm: 80,
    basePrice: 200,
    estimatedTime: '3-5 min',
    features: ['Très rapide', 'Évite embouteillages']
  },
  {
    id: 'eco',
    name: 'Kwenda Eco',
    type: 'eco',
    icon: Car,
    capacity: 4,
    pricePerKm: 120,
    basePrice: 400,
    estimatedTime: '5-8 min',
    features: ['Économique', 'Confortable']
  },
  {
    id: 'standard',
    name: 'Kwenda Standard',
    type: 'standard',
    icon: Car,
    capacity: 4,
    pricePerKm: 150,
    basePrice: 500,
    estimatedTime: '5-10 min',
    features: ['Climatisation', 'WiFi']
  },
  {
    id: 'premium',
    name: 'Kwenda Premium',
    type: 'premium',
    icon: Car,
    capacity: 4,
    pricePerKm: 250,
    basePrice: 800,
    estimatedTime: '3-7 min',
    features: ['Luxe', 'Chauffeur professionnel', 'WiFi Premium']
  }
];

interface ModernTaxiInterfaceProps {
  onBookingRequest: (bookingData: any) => void;
}

const ModernTaxiInterface: React.FC<ModernTaxiInterfaceProps> = ({
  onBookingRequest
}) => {
  const { user } = useAuth();
  const { getCurrentPosition } = useGeolocation();
  
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [intermediateStops, setIntermediateStops] = useState<IntermediateStop[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentStep, setCurrentStep] = useState<'locations' | 'vehicle' | 'confirm'>('locations');
  const [distance, setDistance] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Calculate distance and price when locations change
  useEffect(() => {
    if (pickup && destination) {
      // Simple distance calculation (in real app, use routing API)
      const dist = calculateDistance(pickup.coordinates, destination.coordinates);
      let totalDistance = dist;
      
      // Add intermediate stops distance
      if (intermediateStops.length > 0) {
        // Simplified calculation
        totalDistance += intermediateStops.length * 2; // Average 2km per stop
      }
      
      setDistance(totalDistance);
    }
  }, [pickup, destination, intermediateStops]);

  // Calculate price when vehicle or distance changes
  useEffect(() => {
    if (selectedVehicle && distance > 0) {
      const price = selectedVehicle.basePrice + (distance * selectedVehicle.pricePerKm);
      setEstimatedPrice(Math.round(price));
    }
  }, [selectedVehicle, distance]);

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const addIntermediateStop = () => {
    if (intermediateStops.length >= 3) {
      toast.error('Maximum 3 arrêts intermédiaires autorisés');
      return;
    }
    
    const newStop: IntermediateStop = {
      id: `stop-${Date.now()}`,
      address: ''
    };
    setIntermediateStops([...intermediateStops, newStop]);
  };

  const removeIntermediateStop = (stopId: string) => {
    setIntermediateStops(intermediateStops.filter(stop => stop.id !== stopId));
  };

  const updateIntermediateStop = (stopId: string, location: Location) => {
    setIntermediateStops(intermediateStops.map(stop => 
      stop.id === stopId 
        ? { ...stop, address: location.address, coordinates: location.coordinates }
        : stop
    ));
  };

  const handleBooking = async () => {
    if (!pickup || !destination || !selectedVehicle || !user) {
      toast.error('Veuillez compléter toutes les informations');
      return;
    }

    try {
      const bookingData = {
        pickupLocation: pickup.address,
        destination: destination.address,
        pickupCoordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        destinationCoordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        intermediateStops: intermediateStops.map(stop => ({
          address: stop.address,
          coordinates: stop.coordinates ? { lat: stop.coordinates[1], lng: stop.coordinates[0] } : null
        })),
        vehicleType: selectedVehicle.type,
        estimatedPrice,
        totalDistance: distance,
        surgeMultiplier: 1.0,
        pickupTime: new Date().toISOString()
      };

      console.log('Tentative de réservation:', bookingData);
      await onBookingRequest(bookingData);
      
      // Reset form after successful booking
      setPickup(null);
      setDestination(null);
      setIntermediateStops([]);
      setSelectedVehicle(null);
      setCurrentStep('locations');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast.error('Erreur lors de la réservation. Veuillez réessayer.');
    }
  };

  const canProceedToVehicle = pickup && destination;
  const canProceedToConfirm = canProceedToVehicle && selectedVehicle;

  return (
    <div className="space-y-6">
      {/* Header with Steps */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Réserver un taxi</h1>
        <div className="flex items-center space-x-2">
          {['locations', 'vehicle', 'confirm'].map((step, index) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : index < ['locations', 'vehicle', 'confirm'].indexOf(currentStep)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Locations */}
      {currentStep === 'locations' && (
        <div className="space-y-6">
          {/* Location Inputs */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Pickup Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Point de départ</label>
                  <LocationInput
                    placeholder="D'où partez-vous ?"
                    onChange={(location) => setPickup({
                      address: location.address,
                      coordinates: [location.coordinates.lng, location.coordinates.lat]
                    })}
                    value={pickup?.address || ''}
                  />
                </div>

                {/* Intermediate Stops */}
                {intermediateStops.map((stop, index) => (
                  <div key={stop.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Arrêt {index + 1}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntermediateStop(stop.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <LocationInput
                      placeholder="Ajouter un arrêt"
                      onChange={(location) => updateIntermediateStop(stop.id, {
                        address: location.address,
                        coordinates: [location.coordinates.lng, location.coordinates.lat]
                      })}
                      value={stop.address}
                    />
                  </div>
                ))}

                {/* Add Stop Button */}
                {intermediateStops.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={addIntermediateStop}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un arrêt ({intermediateStops.length}/3)
                  </Button>
                )}

                {/* Destination */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Destination</label>
                  <LocationInput
                    placeholder="Où allez-vous ?"
                    onChange={(location) => setDestination({
                      address: location.address,
                      coordinates: [location.coordinates.lng, location.coordinates.lat]
                    })}
                    value={destination?.address || ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Preview */}
          {(pickup || destination) && (
            <Card>
              <CardContent className="p-4">
                <GoogleMapsKwenda
                  pickup={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : undefined}
                  destination={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : undefined}
                  showRoute={!!(pickup && destination)}
                  center={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : { lat: -4.2634, lng: 15.2429 }}
                  zoom={13}
                  height="300px"
                />
              </CardContent>
            </Card>
          )}

          {/* Next Button */}
          <Button
            onClick={() => setCurrentStep('vehicle')}
            disabled={!canProceedToVehicle}
            className="w-full h-12"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Choisir un véhicule
          </Button>
        </div>
      )}

      {/* Step 2: Vehicle Selection */}
      {currentStep === 'vehicle' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('locations')}
            >
              ← Retour
            </Button>
            {distance > 0 && (
              <div className="text-sm text-muted-foreground">
                Distance: {distance.toFixed(1)} km
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {VEHICLES.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;
              const price = vehicle.basePrice + (distance * vehicle.pricePerKm);
              
              return (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <vehicle.icon className={`w-6 h-6 ${
                            isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`} />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {vehicle.estimatedTime}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {vehicle.capacity} places
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {vehicle.features.slice(0, 2).map((feature) => (
                              <span
                                key={feature}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {Math.round(price).toLocaleString()} FC
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.pricePerKm} FC/km
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={() => setCurrentStep('confirm')}
            disabled={!canProceedToConfirm}
            className="w-full h-12"
          >
            Confirmer le véhicule
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 'confirm' && selectedVehicle && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('vehicle')}
            >
              ← Retour
            </Button>
          </div>

          {/* Trip Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Résumé du trajet</h3>
              
              <div className="space-y-4">
                {/* Route */}
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    {intermediateStops.length > 0 && (
                      <>
                        <div className="w-0.5 h-4 bg-muted my-1"></div>
                        {intermediateStops.map((_, index) => (
                          <React.Fragment key={index}>
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <div className="w-0.5 h-4 bg-muted my-1"></div>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                    <div className="w-0.5 h-8 bg-muted"></div>
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="text-sm text-muted-foreground">Départ</div>
                      <div className="font-medium">{pickup?.address}</div>
                    </div>
                    
                    {intermediateStops.map((stop, index) => (
                      <div key={stop.id}>
                        <div className="text-sm text-muted-foreground">Arrêt {index + 1}</div>
                        <div className="font-medium">{stop.address}</div>
                      </div>
                    ))}
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Arrivée</div>
                      <div className="font-medium">{destination?.address}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <selectedVehicle.icon className="w-6 h-6 text-primary" />
                      <div>
                        <div className="font-medium">{selectedVehicle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {distance.toFixed(1)} km • {selectedVehicle.estimatedTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {estimatedPrice.toLocaleString()} FC
                      </div>
                      <div className="text-sm text-muted-foreground">Prix estimé</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Mode de paiement
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Portefeuille Kwenda</span>
                  <span className="text-sm text-primary">Défaut</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Vous pouvez aussi payer en espèces à la fin du trajet
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Button */}
          <Button
            onClick={handleBooking}
            className="w-full h-12 bg-gradient-primary text-white"
          >
            <Star className="w-4 h-4 mr-2" />
            Confirmer la réservation
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModernTaxiInterface;