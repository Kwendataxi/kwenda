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
  CheckCircle,
  ArrowRight,
  Loader2,
  MapPinIcon,
  Zap
} from 'lucide-react';
import GoogleMapsKwenda from '../maps/GoogleMapsKwenda';
import { motion, AnimatePresence } from 'framer-motion';

// Using unified LocationData type

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
    pricePerKm: 80,
    basePrice: 200,
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
    pricePerKm: 120,
    basePrice: 400,
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
    pricePerKm: 150,
    basePrice: 500,
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
    pricePerKm: 250,
    basePrice: 800,
    estimatedTime: '3-7 min',
    features: ['Luxe', 'Chauffeur professionnel'],
    color: 'bg-purple-500'
  }
];

interface StepByStepTaxiInterfaceProps {
  onBookingRequest: (bookingData: any) => void;
  initialPickup?: LocationData;
  initialDestination?: LocationData;
  onBack?: () => void;
}

const StepByStepTaxiInterface: React.FC<StepByStepTaxiInterfaceProps> = ({
  onBookingRequest,
  initialPickup,
  initialDestination,
  onBack
}) => {
  const { user } = useAuth();
  const { 
    location,
    getCurrentPosition,
    searchLocation,
    calculateDistance,
    loading: locationLoading,
    error: locationError
  } = useMasterLocation();
  
  const [currentStep, setCurrentStep] = useState<'pickup' | 'destination' | 'vehicle' | 'confirm'>(
    initialDestination ? 'pickup' : 'pickup'
  );
  const [pickup, setPickup] = useState<LocationData | null>(initialPickup || null);
  const [destination, setDestination] = useState<LocationData | null>(initialDestination || null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Auto-detect current location for pickup
  useEffect(() => {
    if (currentStep === 'pickup' && !pickup && location) {
      setPickup(location);
      toast.success('Position détectée automatiquement');
      setTimeout(() => setCurrentStep('destination'), 800);
    }
  }, [currentStep, location, pickup]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickup && destination && !routeDetails) {
      calculateRoute();
    }
  }, [pickup, destination]);

  const calculateRoute = async () => {
    if (!pickup || !destination) return;

    setIsCalculatingRoute(true);
    try {
      const distance = calculateDistance(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: destination.lat, lng: destination.lng }
      ) / 1000;
      const duration = Math.round(distance * 60 / 25); // Estimation: 25 km/h en ville
      
      setRouteDetails({
        distance: distance * 1000, // en mètres
        duration: duration * 60,   // en secondes
        polyline: null // Sera ajouté avec Google Maps si nécessaire
      });
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error);
      toast.error('Impossible de calculer l\'itinéraire');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleLocationSelect = (location: LocationData, step: 'pickup' | 'destination') => {
    if (step === 'pickup') {
      setPickup(location);
      setCurrentStep('destination');
    } else if (step === 'destination') {
      setDestination(location);
      setCurrentStep('vehicle');
    }
  };

  const handleBooking = async () => {
    if (!pickup || !destination || !selectedVehicle || !user) {
      toast.error('Veuillez compléter toutes les informations');
      return;
    }

    try {
      const estimatedPrice = selectedVehicle.basePrice + 
        (routeDetails?.distance || 5000) / 1000 * selectedVehicle.pricePerKm;

      const bookingData = {
        pickupLocation: pickup.address,
        pickupCoordinates: [pickup.lng, pickup.lat],
        destination: destination.address,
        destinationCoordinates: [destination.lng, destination.lat],
        vehicleClass: selectedVehicle.type,
        estimatedPrice: Math.round(estimatedPrice),
        routeDetails
      };

      console.log('Création demande de course:', bookingData);
      await onBookingRequest(bookingData);
      
      // Reset form
      setPickup(null);
      setDestination(null);
      setSelectedVehicle(null);
      setRouteDetails(null);
      setCurrentStep('pickup');
      
      toast.success('Demande de course créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast.error('Erreur lors de la réservation');
    }
  };

  const steps = [
    { id: 'pickup', label: 'Départ', icon: MapPin },
    { id: 'destination', label: 'Destination', icon: Navigation },
    { id: 'vehicle', label: 'Véhicule', icon: Car },
    { id: 'confirm', label: 'Confirmation', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isActive 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Pickup Location */}
        {currentStep === 'pickup' && (
          <motion.div
            key="pickup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      D'où partez-vous ?
                    </h2>
                    <p className="text-muted-foreground">
                      Choisissez votre point de départ
                    </p>
                  </div>

                  <UniversalLocationPicker
                    context="transport"
                    placeholder="D'où partez-vous ?"
                    value={pickup}
                    onLocationSelect={(location) => handleLocationSelect(location, 'pickup')}
                    showCurrentLocation={true}
                    showNearbyPlaces={true}
                    showRecentLocations={true}
                    autoFocus={true}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Destination */}
        {currentStep === 'destination' && (
          <motion.div
            key="destination"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Où allez-vous ?
                    </h2>
                    <p className="text-muted-foreground">
                      Choisissez votre destination
                    </p>
                  </div>

                  {pickup && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span className="text-muted-foreground">Départ:</span>
                        <span className="ml-2 font-medium">{pickup.address}</span>
                      </div>
                    </div>
                  )}

                  <UniversalLocationPicker
                    context="transport"
                    placeholder="Où souhaitez-vous aller ?"
                    value={destination}
                    onLocationSelect={(location) => handleLocationSelect(location, 'destination')}
                    showCurrentLocation={false}
                    showNearbyPlaces={true}
                    showRecentLocations={true}
                    autoFocus={true}
                    maxResults={8}
                  />

                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('pickup')}
                    className="w-full"
                  >
                    ← Retour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Vehicle Selection */}
        {currentStep === 'vehicle' && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Choisissez votre véhicule
                    </h2>
                    {routeDetails && (
                      <p className="text-muted-foreground">
                        Distance: {(routeDetails.distance / 1000).toFixed(1)} km • 
                        Durée: {Math.round(routeDetails.duration / 60)} min
                      </p>
                    )}
                  </div>

                  {isCalculatingRoute && (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-muted-foreground">Calcul de l'itinéraire...</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {VEHICLES.map((vehicle) => {
                      const isSelected = selectedVehicle?.id === vehicle.id;
                      const price = routeDetails 
                        ? vehicle.basePrice + (routeDetails.distance / 1000) * vehicle.pricePerKm
                        : vehicle.basePrice;
                      
                      return (
                        <button
                          key={vehicle.id}
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setCurrentStep('confirm');
                          }}
                          className={`w-full p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${vehicle.color}`}>
                                <vehicle.icon className="w-6 h-6 text-white" />
                              </div>
                              
                              <div className="text-left">
                                <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {vehicle.estimatedTime}
                                  </span>
                                  <span>{vehicle.capacity} places</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">
                                {Math.round(price).toLocaleString()} FC
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('destination')}
                    className="w-full"
                  >
                    ← Retour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirm' && selectedVehicle && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Confirmer votre course
                    </h2>
                    <p className="text-muted-foreground">
                      Vérifiez les détails avant de réserver
                    </p>
                  </div>

                  {/* Route Summary */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div className="w-0.5 h-8 bg-muted"></div>
                        <div className="w-3 h-3 bg-secondary rounded-full"></div>
                      </div>
                      
                      <div className="space-y-3 flex-1">
                        <div>
                          <div className="text-sm text-muted-foreground">Départ</div>
                          <div className="font-medium">{pickup?.address}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Arrivée</div>
                          <div className="font-medium">{destination?.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Summary */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedVehicle.color}`}>
                        <selectedVehicle.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedVehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedVehicle.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(
                          selectedVehicle.basePrice + 
                          (routeDetails?.distance || 5000) / 1000 * selectedVehicle.pricePerKm
                        ).toLocaleString()} FC
                      </div>
                    </div>
                  </div>

                  {/* Map Preview */}
                  {pickup && destination && (
                  <div className="h-48 rounded-lg overflow-hidden">
                      <GoogleMapsKwenda
                        pickup={{ lat: pickup.lat, lng: pickup.lng }}
                        destination={{ lat: destination.lat, lng: destination.lng }}
                        showRoute={true}
                        height="192px"
                      />
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('vehicle')}
                      className="flex-1"
                    >
                      ← Retour
                    </Button>
                    <Button
                      onClick={handleBooking}
                      className="flex-1"
                      size="lg"
                    >
                      Confirmer la réservation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepByStepTaxiInterface;