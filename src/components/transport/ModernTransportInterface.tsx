// Interface de transport simplifiée - Version moderne unifiée
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useNextGenDispatch } from '@/hooks/useNextGenDispatch';
import { formatCurrency } from '@/lib/utils';
import { 
  MapPin, 
  Navigation,
  Car,
  Clock,
  CreditCard,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { LocationData } from '@/types/location';

interface ModernTransportInterfaceProps {
  onBookingRequest?: (booking: any) => void;
}

export default function ModernTransportInterface({ onBookingRequest }: ModernTransportInterfaceProps) {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [vehicleClass, setVehicleClass] = useState<'standard' | 'premium' | 'luxury'>('standard');
  const [step, setStep] = useState<'locations' | 'vehicle' | 'confirmation'>('locations');

  const { 
    location: currentLocation, 
    getCurrentPosition,
    hasLocation,
    loading: locationLoading 
  } = useMasterLocation({
    autoDetectLocation: true,
    fallbackToIP: true
  });

  const {
    searchDrivers,
    getPriceEstimate,
    isSearching,
    error: dispatchError,
    cancelSearch
  } = useNextGenDispatch();

  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);

  // Auto-détecter la position actuelle comme pickup
  useEffect(() => {
    if (currentLocation && !pickup) {
      setPickup(currentLocation);
    }
  }, [currentLocation, pickup]);

  // Calculer le prix estimé quand pickup et destination sont sélectionnés
  useEffect(() => {
    if (pickup && destination) {
      const estimate = getPriceEstimate(pickup, destination, 'transport');
      estimate.then(result => {
        setPriceEstimate(result.finalPrice);
      }).catch(() => {
        setPriceEstimate(3000); // Prix par défaut
      });
    }
  }, [pickup, destination, vehicleClass, getPriceEstimate]);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setPickup(position);
      toast.success('Position actuelle utilisée');
    } catch (error) {
      toast.error('Impossible d\'obtenir votre position');
    }
  };

  const handleConfirmBooking = async () => {
    if (!pickup || !destination) return;

    try {
      await searchDrivers({
        pickup_location: pickup.address,
        pickup_coordinates: { lat: pickup.lat, lng: pickup.lng },
        destination: destination.address,
        destination_coordinates: { lat: destination.lat, lng: destination.lng },
        service_type: 'transport' as const,
        vehicle_class: vehicleClass,
        priority: 'normal' as const
      });

      toast.success('Recherche de chauffeur en cours...');
      setStep('confirmation');
    } catch (error) {
      toast.error('Erreur lors de la réservation');
    }
  };

  const vehicleOptions = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Véhicule confortable',
      multiplier: 1.0,
      icon: Car
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Véhicule haut de gamme',
      multiplier: 1.3,
      icon: Car
    },
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'Véhicule de luxe',
      multiplier: 1.6,
      icon: Car
    }
  ];

  if (isSearching) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Navigation className="h-12 w-12 mx-auto text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold">Recherche de chauffeur...</h3>
            <p className="text-sm text-muted-foreground">
              Nous recherchons le meilleur chauffeur près de vous
            </p>
            <Button variant="outline" onClick={cancelSearch} className="w-full">
              Annuler
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <AnimatePresence mode="wait">
        {step === 'locations' && (
          <motion.div
            key="locations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Où allez-vous ?</h2>
              <p className="text-muted-foreground">
                Sélectionnez votre point de départ et destination
              </p>
            </div>

            {/* Point de départ */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Point de départ</span>
                </div>
                
                {pickup ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground truncate">
                      {pickup.address}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPickup(null)}
                    >
                      Modifier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UniversalLocationPicker
                      onLocationSelect={setPickup}
                      placeholder="Rechercher un lieu de départ..."
                      className="w-full"
                    />
                    {hasLocation && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleUseCurrentLocation}
                        className="w-full"
                        disabled={locationLoading}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ma position actuelle
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Destination */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">Destination</span>
                </div>
                
                {destination ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground truncate">
                      {destination.address}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDestination(null)}
                    >
                      Modifier
                    </Button>
                  </div>
                ) : (
                  <UniversalLocationPicker
                    onLocationSelect={setDestination}
                    placeholder="Rechercher une destination..."
                    className="w-full"
                  />
                )}
              </CardContent>
            </Card>

            {/* Prix estimé */}
            {priceEstimate && (
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-medium">Prix estimé</span>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {formatCurrency(priceEstimate)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={() => setStep('vehicle')}
              disabled={!pickup || !destination}
              className="w-full"
              size="lg"
            >
              Continuer
            </Button>
          </motion.div>
        )}

        {step === 'vehicle' && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Type de véhicule</h2>
              <p className="text-muted-foreground">
                Choisissez le type de véhicule souhaité
              </p>
            </div>

            <div className="space-y-3">
              {vehicleOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    vehicleClass === option.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setVehicleClass(option.id as any)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <option.icon className="h-6 w-6" />
                        <div>
                          <h3 className="font-medium">{option.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      {priceEstimate && (
                        <Badge variant="outline">
                          {formatCurrency(priceEstimate * option.multiplier)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('locations')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                className="flex-1"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Réserver
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informations du trajet */}
      {pickup && destination && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Temps estimé: 15-25 min
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}