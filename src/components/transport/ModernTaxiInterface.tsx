import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { unifiedToLocationData } from '@/utils/locationConverters';
import { useModernTaxiBooking } from '@/hooks/useModernTaxiBooking';
import { LocationData } from '@/types/location';
import { useLocation } from 'react-router-dom';
import { useRideDispatchProgress } from '@/hooks/useRideDispatchProgress';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign,
  Car,
  Users,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Map,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';
import DriverSearchDialog from './DriverSearchDialog';
import ModernMapView from './map/ModernMapView';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { motion, AnimatePresence } from 'framer-motion';

interface TaxiBookingData {
  pickup: LocationData | null;
  destination: LocationData | null;
  vehicleType: 'taxi_standard' | 'taxi_premium' | 'moto_transport';
  passengers: number;
  scheduledAt?: Date;
  notes?: string;
}

interface ModernTaxiInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const getVehicleTypes = (t: any) => [
  {
    id: 'taxi_standard',
    name: t('transport.taxi_standard'),
    description: t('transport.taxi_standard_desc'),
    icon: Car,
    basePrice: 2000,
    pricePerKm: 400
  },
  {
    id: 'taxi_premium',
    name: t('transport.taxi_premium'),  
    description: t('transport.taxi_premium_desc'),
    icon: Car,
    basePrice: 3000,
    pricePerKm: 600
  },
  {
    id: 'moto_transport',
    name: t('transport.moto_taxi'),
    description: t('transport.moto_taxi_desc'),
    icon: Zap,
    basePrice: 1000,
    pricePerKm: 200
  }
];

export default function ModernTaxiInterface({ onSubmit, onCancel }: ModernTaxiInterfaceProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { recordPromoUsage } = usePromoCodeValidation();
  
  // 📍 Géolocalisation intelligente
  const { 
    currentLocation, 
    loading: locationLoading,
    getCurrentPosition,
    currentCity 
  } = useSmartGeolocation();
  // Utility functions for distance calculation
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };
  const location = useLocation();
  
  const {
    createBooking,
    isCreatingBooking,
    isSearchingDriver,
    lastBooking,
    error: bookingError
  } = useModernTaxiBooking();
  
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
  const [showMap, setShowMap] = useState(true);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  
  // Driver search dialog state
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'searching' | 'analyzing' | 'selecting' | 'found' | 'error'>('searching');
  const [driversFound, setDriversFound] = useState(0);
  const [searchRadius, setSearchRadius] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  
  // 🔥 Hook pour suivre la progression RÉELLE du dispatcher
  const dispatchProgress = useRideDispatchProgress(currentBookingId);

  // 📍 Détecter la position utilisateur au montage
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        await getCurrentPosition();
        if (currentCity) {
          setDetectedCity(currentCity.name);
          console.log('📍 Ville détectée:', currentCity.name);
          toast({
            title: t('transport.map_centered', { city: currentCity.name }),
            description: t('transport.position_detected', { city: currentCity.name }),
          });
        }
      } catch (error) {
        console.error('Erreur détection position:', error);
      }
    };
    
    detectUserLocation();
  }, []);

  // 🔥 Écouter les updates en temps réel du dispatcher
  useEffect(() => {
    if (dispatchProgress.driversFound > 0 || dispatchProgress.status !== 'searching') {
      console.log('📊 [TaxiInterface] Update dispatch:', dispatchProgress);
      setDriversFound(dispatchProgress.driversFound);
      setSearchRadius(dispatchProgress.currentRadius);
      setSearchStatus(dispatchProgress.status);
    }
  }, [dispatchProgress]);

  // Gérer l'adresse pré-remplie depuis la navigation
  useEffect(() => {
    if (location.state?.prefilledAddress) {
      const { prefilledAddress, addressType } = location.state;
      
      const locationData: LocationData = {
        address: prefilledAddress.address,
        lat: prefilledAddress.lat,
        lng: prefilledAddress.lng,
        accuracy: 50
      };

      if (addressType === 'pickup') {
        setBookingData(prev => ({ ...prev, pickup: locationData }));
        setStep('destination');
        
        toast({
          title: t('transport.pickup_location_set'),
          description: prefilledAddress.address,
        });
      } else if (addressType === 'destination') {
        setBookingData(prev => ({ ...prev, destination: locationData }));
        
        // Détecter automatiquement la position actuelle comme point de départ
        detectCurrentLocationAsPickup();
        
        toast({
          title: t('transport.destination_set'),
          description: prefilledAddress.address,
        });
      }
    }
  }, [location.state]);

  // Détecter automatiquement la position actuelle comme point de départ
  const detectCurrentLocationAsPickup = async () => {
    try {
      // Use geolocation API directly
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lng } = position.coords;
            
            // Basic reverse geocoding - you can enhance this
            const pickupLocation: LocationData = {
              address: `Position actuelle (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng,
              accuracy: position.coords.accuracy || 50,
              type: 'current'
            };
            
            setBookingData(prev => ({ 
              ...prev, 
              pickup: pickupLocation 
            }));
            
            setStep('details');
            
            toast({
              title: t('transport.position_detected_title'),
              description: t('transport.position_set_as_pickup'),
            });
          },
          (error) => {
            console.error('Erreur géolocalisation:', error);
            setStep('pickup');
            toast({
              title: t('transport.geolocation_failed'),
              description: t('transport.enter_pickup_manually'),
              variant: "destructive",
            });
          }
        );
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      setStep('pickup');
      toast({
        title: t('transport.geolocation_failed'),
        description: t('transport.enter_pickup_manually'),
        variant: "destructive",
      });
    }
  };

  // Calculate pricing when both locations are selected
  useEffect(() => {
    if (bookingData.pickup && bookingData.destination) {
      const distance = calculateDistance(
        { lat: bookingData.pickup.lat, lng: bookingData.pickup.lng },
        { lat: bookingData.destination.lat, lng: bookingData.destination.lng }
      );
      const vehicleInfo = getVehicleTypes(t).find(v => v.id === bookingData.vehicleType);
      
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

  const handlePickupChange = (location: any) => {
    const locationData = location ? unifiedToLocationData(location) : null;
    setBookingData(prev => ({ ...prev, pickup: locationData }));
    if (locationData && step === 'pickup') {
      // Auto-advance to destination step
      setTimeout(() => setStep('destination'), 500);
    }
  };

  const handleDestinationChange = (location: any) => {
    const locationData = location ? unifiedToLocationData(location) : null;
    setBookingData(prev => ({ ...prev, destination: locationData }));
    if (locationData && step === 'destination') {
      // Auto-advance to details step
      setTimeout(() => setStep('details'), 500);
    }
  };

  // Gérer la visibilité de la carte selon l'étape
  useEffect(() => {
    if (step === 'details' || step === 'confirm') {
      setShowMap(false);
    } else {
      setShowMap(true);
    }
  }, [step]);

  const handleSubmitBooking = async () => {
    if (!bookingData.pickup || !bookingData.destination) {
      toast({
        title: t('common.error'),
        description: t('transport.select_addresses'),
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setShowSearchDialog(true);
      setSearchStatus('searching');
      setElapsedTime(0);
      setDriversFound(0);
      
      // Simulate elapsed time counter
      const timeCounter = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      // Convert LocationData to UltimateLocationData format for createBooking
      const pickupFormatted = {
        address: bookingData.pickup.address,
        lat: bookingData.pickup.lat,
        lng: bookingData.pickup.lng,
        accuracy: bookingData.pickup.accuracy || 50,
        confidence: 85,
        source: 'browser' as const,
        timestamp: Date.now(),
        type: 'precise' as const,
        placeId: bookingData.pickup.placeId
      };

      const destinationFormatted = {
        address: bookingData.destination.address,
        lat: bookingData.destination.lat,
        lng: bookingData.destination.lng,
        accuracy: bookingData.destination.accuracy || 50,
        confidence: 85,
        source: 'browser' as const,
        timestamp: Date.now(),
        type: 'precise' as const,
        placeId: bookingData.destination.placeId
      };

      const result = await createBooking({
        pickup: pickupFormatted,
        destination: destinationFormatted,
        vehicleType: bookingData.vehicleType,
        passengers: bookingData.passengers,
        estimatedPrice,
        distance: calculateDistance(
          { lat: bookingData.pickup.lat, lng: bookingData.pickup.lng },
          { lat: bookingData.destination.lat, lng: bookingData.destination.lng }
        ) / 1000,
        notes: bookingData.notes,
        scheduledTime: bookingData.scheduledAt
      });

      // 🔥 Activer l'écoute temps réel
      if (result?.id) {
        setCurrentBookingId(result.id);
        
        // ✅ Enregistrer l'usage du code promo si actif
        const activePromo = localStorage.getItem('activePromoCode');
        const promoId = localStorage.getItem('activePromoId');
        
        if (activePromo === 'BIENVENUE30' && promoId && user) {
          try {
            const discountAmount = Math.round(estimatedPrice * 0.3);
            
            await recordPromoUsage({
              userId: user.id,
              promoId: promoId,
              orderId: result.id,
              orderType: 'transport',
              discountAmount: discountAmount
            });
            
            // Nettoyer le localStorage après enregistrement
            localStorage.removeItem('activePromoCode');
            localStorage.removeItem('promoDiscount');
            localStorage.removeItem('activePromoId');
            
            console.log('✅ Code promo BIENVENUE30 enregistré avec succès');
            
            toast({
              title: t('promo.code_applied_success'),
              description: t('promo.discount_applied_desc', { amount: discountAmount }),
            });
          } catch (promoError) {
            console.error('❌ Erreur enregistrement promo:', promoError);
          }
        }
      }

      clearInterval(timeCounter);

      // Check actual result of driver search
      if (result && result.status === 'driver_assigned' && result.driverAssigned) {
        // Driver found!
        setSearchStatus('found');
        
        setTimeout(() => {
          setShowSearchDialog(false);
          onSubmit({ 
            bookingId: result.id,
            status: result.status,
            driverAssigned: result.driverAssigned,
            estimatedDuration,
            ...bookingData
          });
        }, 2000);
      } else {
        // No driver available
        setSearchStatus('error');
        setDriversFound(0);
      }

    } catch (error) {
      console.error('❌ [TaxiInterface] Erreur réservation:', error);
      setSearchStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySearch = () => {
    setShowSearchDialog(false);
    setTimeout(() => handleSubmitBooking(), 500);
  };

  const handleExpandRadius = () => {
    setSearchRadius(prev => prev + 5);
    handleRetrySearch();
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
                <h3 className="text-lg font-semibold">{t('transport.pickup_location')}</h3>
                <p className="text-sm text-muted-foreground">{t('transport.where_from')}</p>
              </div>
            </div>
            
            <AutocompleteLocationInput
              value={bookingData.pickup ? {
                id: bookingData.pickup.placeId || `pickup-${Date.now()}`,
                name: bookingData.pickup.name || bookingData.pickup.address,
                address: bookingData.pickup.address,
                coordinates: {
                  lat: bookingData.pickup.lat,
                  lng: bookingData.pickup.lng
                },
                type: bookingData.pickup.type as any || 'manual'
              } : null}
              onChange={handlePickupChange}
              placeholder={t('transport.where_from')}
              types={['establishment', 'geocode']}
            />
            
            {bookingData.pickup && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">
                    Position de départ confirmée
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">{bookingData.pickup.address}</p>
              </div>
            )}
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
            
            <AutocompleteLocationInput
              key="destination-field"
              value={null}
              onChange={handleDestinationChange}
              placeholder="Où allez-vous ?"
              types={['establishment', 'geocode']}
            />
          </div>
        );

      case 'details':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Type de véhicule
              </h3>
              <p className="text-sm text-muted-foreground">Choisissez votre mode de transport</p>
            </div>

            <div className="grid gap-3">
              {getVehicleTypes(t).map((vehicle, index) => {
                const Icon = vehicle.icon;
                const isSelected = bookingData.vehicleType === vehicle.id;
                
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer backdrop-blur-md rounded-2xl transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border-primary/40 shadow-glow ring-2 ring-primary/30' 
                          : 'bg-white/40 dark:bg-gray-900/40 border-white/20 hover:border-primary/30 hover:shadow-soft'
                      }`}
                      onClick={() => setBookingData(prev => ({ ...prev, vehicleType: vehicle.id as any }))}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                              isSelected ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg' : 'bg-muted/30'
                            }`}
                            animate={{ rotate: isSelected ? [0, -5, 5, 0] : 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                          </motion.div>
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
                  </motion.div>
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
          </motion.div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Confirmer la réservation</h3>
              <p className="text-sm text-muted-foreground">Vérifiez les détails de votre course</p>
            </div>

            <Card className="bg-card border border-border shadow-md">
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
                      {getVehicleTypes(t).find(v => v.id === bookingData.vehicleType)?.name}
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
                        formatDistance(calculateDistance(
                          { lat: bookingData.pickup.lat, lng: bookingData.pickup.lng },
                          { lat: bookingData.destination.lat, lng: bookingData.destination.lng }
                        ))
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

  // Déterminer le mode de visualisation de la carte
  const getMapVisualizationMode = () => {
    // 🎯 Phase 1: Afficher la route dès que pickup ET destination sont définis
    if (bookingData.pickup && bookingData.destination) {
      return 'route';
    }
    return 'selection';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 h-full">
      {/* Carte moderne - conditionnelle avec animations */}
      {showMap && (
        <div className="lg:flex-1 h-[400px] lg:h-auto animate-slide-in-right relative">
          <ModernMapView
            pickup={bookingData.pickup}
            destination={bookingData.destination}
            userLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null}
            visualizationMode={getMapVisualizationMode()}
            className="h-full"
          />
          {/* Badge ville détectée */}
          {detectedCity && (
            <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
              <span className="text-xs font-medium">📍 {detectedCity}</span>
            </div>
          )}
          {/* Bouton pour masquer la carte (sur mobile) */}
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-3 right-3 lg:hidden p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors"
            aria-label="Fermer la carte"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Formulaire de réservation */}
      <div className={`${showMap ? 'lg:w-[480px]' : 'lg:w-full lg:max-w-2xl lg:mx-auto'} space-y-4 transition-all duration-300`}>
        {/* Bouton "Voir carte" discret + Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex justify-center space-x-2 flex-1">
            {['pickup', 'destination', 'details', 'confirm'].map((stepName, index) => (
              <motion.div
                key={stepName}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: ['pickup', 'destination', 'details', 'confirm'].indexOf(step) >= index ? 1.1 : 1,
                  backgroundColor: ['pickup', 'destination', 'details', 'confirm'].indexOf(step) >= index 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted))'
                }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                className="h-2 w-8 rounded-full shadow-sm"
              />
            ))}
          </div>
          
          {/* Bouton "Voir carte" - visible uniquement si carte masquée */}
          {!showMap && (
            <button
              onClick={() => setShowMap(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors underline animate-fade-in"
            >
              <Map className="h-3 w-3" />
              Voir carte
            </button>
          )}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="bg-gradient-to-br from-white/60 via-white/40 to-transparent dark:from-gray-900/60 dark:via-gray-900/40 dark:to-transparent backdrop-blur-lg border border-white/30 shadow-2xl rounded-3xl">
              <CardContent className="p-6">
                {renderStepContent()}
              </CardContent>
        
          {/* Action buttons - now inside the card after content */}
          <CardContent className="p-6 pt-0 mt-8">
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
                  disabled={loading || isCreatingBooking}
                  className="flex-1"
                >
                  {(loading || isCreatingBooking) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Réservation...
                    </>
                  ) : (
                    'Confirmer'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
          </motion.div>
        </AnimatePresence>

        {/* Indicateurs de statut */}
        {bookingError && (
          <Card className="glassmorphism border-destructive/20 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{bookingError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {isSearchingDriver && (
          <Card className="glassmorphism border-primary/20 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Recherche d'un chauffeur...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {lastBooking && (
          <Card className="glassmorphism border-green-500/20 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Réservation créée avec succès!
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Driver Search Dialog */}
        <DriverSearchDialog
          isOpen={showSearchDialog}
          onClose={() => setShowSearchDialog(false)}
          searchStatus={searchStatus}
          driversFound={driversFound}
          searchRadius={searchRadius}
          onRetry={handleRetrySearch}
          onExpandRadius={handleExpandRadius}
        />
      </div>
    </div>
  );
}