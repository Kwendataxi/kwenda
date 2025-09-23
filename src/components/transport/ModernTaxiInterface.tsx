import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { ModernLocationPicker } from '@/components/delivery/ModernLocationPicker';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign,
  Car,
  Users,
  Zap
} from 'lucide-react';
import { LocationData as UnifiedLocationData } from '@/services/simpleLocationService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TaxiBookingData {
  pickup: UnifiedLocationData | null;
  destination: UnifiedLocationData | null;
  vehicleType: 'taxi_standard' | 'taxi_premium' | 'moto_transport';
  passengers: number;
  scheduledAt?: Date;
  notes?: string;
}

interface ModernTaxiInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VEHICLE_TYPES = [
  {
    id: 'taxi_standard',
    name: 'Taxi Standard',
    description: '4 places, confortable',
    icon: Car,
    basePrice: 2000,
    pricePerKm: 400
  },
  {
    id: 'taxi_premium',
    name: 'Taxi Premium',  
    description: '4 places, climatisé',
    icon: Car,
    basePrice: 3000,
    pricePerKm: 600
  },
  {
    id: 'moto_transport',
    name: 'Moto-Taxi',
    description: '1 place, rapide',
    icon: Zap,
    basePrice: 1000,
    pricePerKm: 200
  }
];

export default function ModernTaxiInterface({ onSubmit, onCancel }: ModernTaxiInterfaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentPosition, calculateDistance, formatDistance } = useSimpleLocation();
  
  const [bookingData, setBookingData] = useState<TaxiBookingData>({
    pickup: null,
    destination: null,
    vehicleType: 'taxi_standard',
    passengers: 1
  });

  const [step, setStep] = useState<'pickup' | 'destination' | 'details' | 'confirm'>('pickup');
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');

  // Auto-detect current location for pickup
  useEffect(() => {
    if (step === 'pickup' && !bookingData.pickup) {
      getCurrentPosition().then(location => {
        if (location) {
          setBookingData(prev => ({ 
            ...prev, 
            pickup: location
          }));
        }
      }).catch(console.warn);
    }
  }, [step, bookingData.pickup, getCurrentPosition]);

  // Calculate pricing when both locations are selected
  useEffect(() => {
    if (bookingData.pickup && bookingData.destination) {
      const distance = calculateDistance(bookingData.pickup, bookingData.destination);
      const vehicleInfo = VEHICLE_TYPES.find(v => v.id === bookingData.vehicleType);
      
      if (vehicleInfo && distance > 0) {
        const distanceKm = distance / 1000;
        const price = vehicleInfo.basePrice + (distanceKm * vehicleInfo.pricePerKm);
        setEstimatedPrice(Math.round(price));
        
        // Estimate duration (assuming 25 km/h average in city)
        const durationMinutes = Math.round((distanceKm / 25) * 60);
        setEstimatedDuration(`${durationMinutes} min`);
      }
    }
  }, [bookingData.pickup, bookingData.destination, bookingData.vehicleType, calculateDistance]);

  const handleLocationSelect = (location: UnifiedLocationData | null) => {
    if (!location) return;
    
    if (step === 'pickup') {
      setBookingData(prev => ({ 
        ...prev, 
        pickup: location
      }));
      setStep('destination');
    } else if (step === 'destination') {
      setBookingData(prev => ({ 
        ...prev, 
        destination: location
      }));
      setStep('details');
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingData.pickup || !bookingData.destination) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les adresses de départ et d'arrivée",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const bookingPayload = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        pickup_location: bookingData.pickup.address,
        pickup_coordinates: { lat: bookingData.pickup.lat, lng: bookingData.pickup.lng },
        destination: bookingData.destination.address,
        destination_coordinates: { lat: bookingData.destination.lat, lng: bookingData.destination.lng },
        vehicle_type: bookingData.vehicleType,
        passengers: bookingData.passengers,
        estimated_price: estimatedPrice,
        notes: bookingData.notes || '',
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('transport_bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Réservation créée",
        description: "Recherche d'un chauffeur en cours...",
      });

      // Try to dispatch driver automatically
      try {
        const dispatchResponse = await supabase.functions.invoke('ride-dispatcher', {
          body: {
            booking_id: data.id,
            pickup_coordinates: {
              lat: bookingData.pickup.lat,
              lng: bookingData.pickup.lng
            },
            service_type: bookingData.vehicleType
          }
        });

        if (dispatchResponse.error) {
          console.warn('❌ Dispatch failed:', dispatchResponse.error);
          toast({
            title: "Réservation créée",
            description: "Recherche de chauffeurs en cours...",
          });
        } else if (dispatchResponse.data?.success) {
          toast({
            title: "Chauffeur trouvé!",
            description: `Arrivée estimée: ${dispatchResponse.data.driver_assigned.estimated_arrival_minutes} min`,
          });
        } else {
          toast({
            title: "Aucun chauffeur disponible",
            description: "Nous recherchons d'autres chauffeurs...",
          });
        }
      } catch (dispatchError) {
        console.warn('Dispatch error:', dispatchError);
        toast({
          title: "Réservation créée",
          description: "Recherche de chauffeurs en cours...",
        });
      }

      onSubmit({ 
        bookingId: data.id, 
        ...bookingPayload,
        estimatedDuration 
      });

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'pickup':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-full">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Point de départ</h3>
                <p className="text-sm text-muted-foreground">D'où partez-vous ?</p>
              </div>
            </div>
            
            <ModernLocationPicker
              value={bookingData.pickup}
              onChange={handleLocationSelect}
              placeholder="Rechercher votre position actuelle..."
              context="pickup"
            />
          </div>
        );

      case 'destination':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-secondary/10 rounded-full">
                <MapPin className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Destination</h3>
                <p className="text-sm text-muted-foreground">Où allez-vous ?</p>
              </div>
            </div>
            
            <ModernLocationPicker
              value={bookingData.destination}
              onChange={handleLocationSelect}
              placeholder="Rechercher votre destination..."
              context="delivery"
            />

            {bookingData.pickup && (
              <Card className="glassmorphism border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Départ:</span>
                    <span className="font-medium">{bookingData.pickup.address}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Type de véhicule</h3>
              <p className="text-sm text-muted-foreground">Choisissez votre mode de transport</p>
            </div>

            <div className="grid gap-3">
              {VEHICLE_TYPES.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = bookingData.vehicleType === vehicle.id;
                
                return (
                  <Card 
                    key={vehicle.id}
                    className={`cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected 
                        ? 'ring-2 ring-primary glassmorphism-active' 
                        : 'glassmorphism hover:bg-muted/20'
                    }`}
                    onClick={() => setBookingData(prev => ({ ...prev, vehicleType: vehicle.id as any }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted/20'}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{vehicle.name}</h4>
                          <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{vehicle.basePrice} CDF</p>
                          <p className="text-xs text-muted-foreground">+ {vehicle.pricePerKm}/km</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {bookingData.vehicleType !== 'moto_transport' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de passagers</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <Button
                      key={num}
                      variant={bookingData.passengers === num ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setBookingData(prev => ({ ...prev, passengers: num }))}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Input
                placeholder="Instructions particulières..."
                value={bookingData.notes || ''}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Confirmer la réservation</h3>
              <p className="text-sm text-muted-foreground">Vérifiez les détails de votre course</p>
            </div>

            <Card className="glassmorphism">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Départ</p>
                    <p className="font-medium">{bookingData.pickup?.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{bookingData.destination?.address}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Type de véhicule</span>
                    <span className="font-medium">
                      {VEHICLE_TYPES.find(v => v.id === bookingData.vehicleType)?.name}
                    </span>
                  </div>
                  
                  {bookingData.vehicleType !== 'moto_transport' && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Passagers</span>
                      <span className="font-medium">{bookingData.passengers}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Distance</span>
                    <span className="font-medium">
                      {bookingData.pickup && bookingData.destination && 
                        formatDistance(calculateDistance(bookingData.pickup, bookingData.destination))
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Durée estimée</span>
                    <span className="font-medium">{estimatedDuration}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Prix estimé</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">{estimatedPrice.toLocaleString()} CDF</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {['pickup', 'destination', 'details', 'confirm'].map((stepName, index) => (
          <div
            key={stepName}
            className={`h-2 w-8 rounded-full transition-colors ${
              ['pickup', 'destination', 'details', 'confirm'].indexOf(step) >= index
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <Card className="glassmorphism">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        {step !== 'pickup' && (
          <Button
            variant="outline"
            onClick={() => {
              const steps = ['pickup', 'destination', 'details', 'confirm'];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1] as any);
              }
            }}
            className="flex-1"
          >
            Retour
          </Button>
        )}
        
        {step === 'pickup' && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annuler
          </Button>
        )}

        {step !== 'confirm' && (
          <Button
            onClick={() => {
              if (step === 'pickup' && bookingData.pickup) {
                setStep('destination');
              } else if (step === 'destination' && bookingData.destination) {
                setStep('details');
              } else if (step === 'details') {
                setStep('confirm');
              }
            }}
            disabled={
              (step === 'pickup' && !bookingData.pickup) ||
              (step === 'destination' && !bookingData.destination)
            }
            className="flex-1"
          >
            Continuer
          </Button>
        )}

        {step === 'confirm' && (
          <Button
            onClick={handleSubmitBooking}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Réservation...' : 'Confirmer'}
          </Button>
        )}
      </div>
    </div>
  );
}