import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedGeolocation } from '@/hooks/useEnhancedGeolocation';
import { GooglePlacesService } from '@/services/googlePlacesService';
import { DirectionsService } from '@/services/directionsService';
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

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
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
  initialPickup?: { address: string; coordinates?: { lat: number; lng: number } };
  initialDestination?: { address: string; coordinates?: { lat: number; lng: number } };
  onBack?: () => void;
}

const StepByStepTaxiInterface: React.FC<StepByStepTaxiInterfaceProps> = ({
  onBookingRequest,
  initialPickup,
  initialDestination,
  onBack
}) => {
  const { user } = useAuth();
  const geolocation = useEnhancedGeolocation({ 
    enableBackgroundTracking: false
  });
  
  const { 
    enhancedData,
    currentZone 
  } = geolocation;
  
  const [currentStep, setCurrentStep] = useState<'pickup' | 'destination' | 'vehicle' | 'confirm'>(
    initialDestination ? 'pickup' : 'pickup'
  );
  const [pickup, setPickup] = useState<Location | null>(
    initialPickup ? { address: initialPickup.address, coordinates: initialPickup.coordinates || { lat: 0, lng: 0 } } : null
  );
  const [destination, setDestination] = useState<Location | null>(
    initialDestination ? { address: initialDestination.address, coordinates: initialDestination.coordinates || { lat: 0, lng: 0 } } : null
  );
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Auto-detect current location for pickup
  useEffect(() => {
    if (currentStep === 'pickup' && !pickup && enhancedData?.latitude) {
      detectCurrentLocation();
    }
  }, [currentStep, enhancedData]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (pickup && destination && !routeDetails) {
      calculateRoute();
    }
  }, [pickup, destination]);

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Enhanced geolocation is automatically tracking, just check current data
      if (enhancedData?.latitude && enhancedData?.longitude) {
        const address = await GooglePlacesService.reverseGeocode(
          enhancedData.longitude, 
          enhancedData.latitude
        );
        
        setPickup({
          address,
          coordinates: { lat: enhancedData.latitude, lng: enhancedData.longitude }
        });
        
        toast.success('Position détectée automatiquement');
        setTimeout(() => setCurrentStep('destination'), 800);
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      toast.error('Impossible de détecter votre position');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const proximity = enhancedData ? { lng: enhancedData.longitude, lat: enhancedData.latitude } : undefined;
      const results = await GooglePlacesService.searchPlaces(query, proximity);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateRoute = async () => {
    if (!pickup || !destination) return;

    setIsCalculatingRoute(true);
    try {
      const directions = await DirectionsService.getDirections(
        pickup.coordinates,
        destination.coordinates
      );
      setRouteDetails(directions);
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error);
      toast.error('Impossible de calculer l\'itinéraire');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const selectLocation = (result: any) => {
    const location = {
      address: result.place_name,
      coordinates: { lat: result.center[1], lng: result.center[0] }
    };

    if (currentStep === 'pickup') {
      setPickup(location);
      setCurrentStep('destination');
    } else if (currentStep === 'destination') {
      setDestination(location);
      setCurrentStep('vehicle');
    }

    setSearchQuery('');
    setSearchResults([]);
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
        pickupCoordinates: [pickup.coordinates.lng, pickup.coordinates.lat],
        destination: destination.address,
        destinationCoordinates: [destination.coordinates.lng, destination.coordinates.lat],
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
                      Nous détectons automatiquement votre position
                    </p>
                  </div>

                  {currentZone && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      Zone: {currentZone.name}
                    </div>
                  )}

                  <Button
                    onClick={detectCurrentLocation}
                    disabled={isDetectingLocation}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Détection en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Détecter ma position
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Saisir une adresse manuellement"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchPlaces(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {isSearching && (
                      <div className="text-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => selectLocation(result)}
                            className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                              <span className="text-foreground">{result.place_name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

                  <input
                    type="text"
                    placeholder="Où souhaitez-vous aller ?"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchPlaces(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />

                  {isSearching && (
                    <div className="text-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocation(result)}
                          className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center">
                            <Navigation className="w-4 h-4 mr-3 text-muted-foreground" />
                            <span className="text-foreground">{result.place_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

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
                        pickup={pickup.coordinates}
                        destination={destination.coordinates}
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