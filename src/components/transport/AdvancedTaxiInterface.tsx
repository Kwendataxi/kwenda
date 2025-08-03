import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Star, Phone, Navigation, X, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LocationInput from './LocationInput';
import YangoStyleVehicleSelection from './YangoStyleVehicleSelection';
import { EnhancedTaxiSearchBar } from './EnhancedTaxiSearchBar';
import { QuickBookingInterface } from './QuickBookingInterface';
import { useAdvancedRideRequest } from '@/hooks/useAdvancedRideRequest';
import { useLanguage } from '@/contexts/LanguageContext';

interface Location {
  address: string;
  coordinates: [number, number];
  type?: string;
}

export const AdvancedTaxiInterface = () => {
  const { t } = useLanguage();
  const {
    loading,
    searchingDrivers,
    currentRequest,
    availableDrivers,
    estimatedPrice,
    createRideRequest,
    cancelRideRequest,
    acceptDriver,
    calculateEstimatedPrice
  } = useAdvancedRideRequest();

  const [step, setStep] = useState<'location' | 'vehicle' | 'confirmation' | 'searching' | 'tracking'>('location');
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  const [distance, setDistance] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Calculer prix estimé quand les locations changent
  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistance(
        pickup.coordinates[1], pickup.coordinates[0],
        destination.coordinates[1], destination.coordinates[0]
      );
      setDistance(dist);

      calculateEstimatedPrice(pickup.coordinates, destination.coordinates, selectedVehicle)
        .then(price => setCurrentPrice(price));
    }
  }, [pickup, destination, selectedVehicle, calculateEstimatedPrice]);

  // Gérer les changements d'état de la course
  useEffect(() => {
    if (currentRequest) {
      switch (currentRequest.status) {
        case 'pending':
        case 'dispatching':
          setStep('searching');
          break;
        case 'accepted':
        case 'driver_arrived':
        case 'in_progress':
          setStep('tracking');
          break;
        case 'completed':
        case 'cancelled':
          setStep('location');
          setPickup(null);
          setDestination(null);
          break;
      }
    }
  }, [currentRequest]);

  const handleLocationChange = (type: 'pickup' | 'destination', location: Location | null) => {
    if (type === 'pickup') {
      setPickup(location);
    } else {
      setDestination(location);
    }
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle.id);
  };

  const handleBookingRequest = async () => {
    if (!pickup || !destination) return;

    setStep('confirmation');
  };

  const confirmBooking = async () => {
    if (!pickup || !destination) return;

    const request = await createRideRequest({
      pickupLocation: pickup.address,
      pickupCoordinates: pickup.coordinates,
      destination: destination.address,
      destinationCoordinates: destination.coordinates,
      vehicleClass: selectedVehicle
    });

    if (request) {
      setStep('searching');
    }
  };

  const handleDriverAccept = async (driverId: string) => {
    const success = await acceptDriver(driverId);
    if (success) {
      setStep('tracking');
    }
  };

  const handleCancel = async () => {
    await cancelRideRequest('Annulé par le client');
    setStep('location');
    setPickup(null);
    setDestination(null);
  };

  if (step === 'searching') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Recherche de chauffeurs...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Nous recherchons les meilleurs chauffeurs disponibles près de vous
            </p>
            
            {searchingDrivers && (
              <div className="space-y-2">
                <div className="animate-pulse bg-gradient-to-r from-primary/20 to-primary/5 h-2 rounded-full"></div>
                <p className="text-sm text-muted-foreground">
                  {availableDrivers.length > 0 
                    ? `${availableDrivers.length} chauffeurs notifiés`
                    : 'Recherche en cours...'
                  }
                </p>
              </div>
            )}

            {availableDrivers.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Chauffeurs disponibles:</h4>
                {availableDrivers.map((driver) => (
                  <div key={driver.driver_id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <p className="font-medium">
                          {driver.driver_profiles.vehicle_make} {driver.driver_profiles.vehicle_model}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{driver.driver_profiles.rating_average.toFixed(1)}</span>
                          <span>•</span>
                          <span>{driver.distance.toFixed(1)} km</span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleDriverAccept(driver.driver_id)}
                      >
                        Accepter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleCancel}
          >
            Annuler la recherche
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'tracking' && currentRequest) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Course en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              {currentRequest.status === 'accepted' && 'Chauffeur accepté'}
              {currentRequest.status === 'driver_arrived' && 'Chauffeur arrivé'}
              {currentRequest.status === 'in_progress' && 'En route'}
            </Badge>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Départ</p>
                  <p className="text-sm text-muted-foreground">{currentRequest.pickup_location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{currentRequest.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Votre chauffeur</p>
                  <p className="text-sm text-muted-foreground">
                    {currentRequest.surge_price} CDF
                  </p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleCancel}
          >
            Annuler la course
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirmation') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Confirmer votre course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Départ</p>
                <p className="text-sm text-muted-foreground">{pickup?.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">Destination</p>
                <p className="text-sm text-muted-foreground">{destination?.address}</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Distance</span>
                <span>{distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Prix estimé</span>
                <span className="text-lg font-bold text-primary">
                  {currentPrice.toFixed(0)} CDF
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setStep('vehicle')}
            >
              Retour
            </Button>
            <Button 
              className="flex-1"
              onClick={confirmBooking}
              disabled={loading}
            >
              {loading ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Enhanced Taxi Search Interface */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Recherche
          </TabsTrigger>
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Express
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Programmé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 mt-6">
          {/* Enhanced Search Bar */}
          <EnhancedTaxiSearchBar
            onSearch={(query, coordinates) => {
              if (coordinates) {
                setDestination({
                  address: query,
                  coordinates: [coordinates.lng, coordinates.lat]
                });
                setStep('vehicle');
              }
            }}
            onTransportSelect={() => {}}
            placeholder="Où allez-vous ?"
          />

          {/* Navigation Steps */}
          <div className="flex justify-center space-x-4 mb-6">
            {['location', 'vehicle'].map((stepName, index) => (
              <div 
                key={stepName}
                className={`flex items-center space-x-2 ${
                  step === stepName ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === stepName ? 'border-primary bg-primary text-white' : 'border-muted'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium capitalize">{stepName}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="mt-6">
          <QuickBookingInterface />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Programmer une course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Fonctionnalité de programmation bientôt disponible
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {step === 'location' && (
        <Card>
          <CardHeader>
            <CardTitle>Où allez-vous ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocationInput
              placeholder="Lieu de départ"
              value={pickup?.address || ''}
              onChange={(location) => handleLocationChange('pickup', location)}
              onInputChange={() => {}}
            />
            
            <LocationInput
              placeholder="Destination"
              value={destination?.address || ''}
              onChange={(location) => handleLocationChange('destination', location)}
              onInputChange={() => {}}
            />

            {pickup && destination && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Distance estimée:</span>
                  <span className="font-medium">{distance.toFixed(1)} km</span>
                </div>
              </div>
            )}

            <Button 
              className="w-full"
              onClick={() => setStep('vehicle')}
              disabled={!pickup || !destination}
            >
              Continuer
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'vehicle' && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <YangoStyleVehicleSelection
              distance={distance}
              onVehicleSelect={handleVehicleSelect}
              selectedVehicleId={selectedVehicle}
            />
            
            <div className="mt-6 flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep('location')}
              >
                Retour
              </Button>
              <Button 
                className="flex-1"
                onClick={handleBookingRequest}
              >
                Réserver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}