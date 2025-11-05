import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import YangoBottomSheet from './YangoBottomSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import PriceConfirmationModal from './PriceConfirmationModal';
import DriverSearchProgressModal from './DriverSearchProgressModal';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useRideDispatch } from '@/hooks/useRideDispatch';
import { LocationData } from '@/types/location';
import { secureNavigationService } from '@/services/secureNavigationService';
import { toast } from 'sonner';

interface ModernTaxiInterfaceProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export default function ModernTaxiInterface({ onSubmit, onCancel }: ModernTaxiInterfaceProps) {
  const [bookingStep, setBookingStep] = useState<'vehicle' | 'destination' | 'confirm'>('vehicle');
  const [selectedVehicle, setSelectedVehicle] = useState('taxi_eco');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  
  const { currentLocation, getCurrentPosition, getPopularPlaces, currentCity, source } = useSmartGeolocation();
  const popularPlaces = getPopularPlaces();
  const { 
    isSearching, 
    assignedDriver, 
    searchProgress, 
    activeBookingId,
    createAndDispatchRide, 
    listenForDriverAssignment,
    resetSearch
  } = useRideDispatch();
  
  console.log('🌍 Ville détectée:', currentCity?.name || 'Non détectée');
  console.log('📍 Position actuelle:', currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : 'Aucune');
  console.log('🔍 Source position:', source || 'Aucune');

  // Détecter position actuelle au montage
  useEffect(() => {
    if (!currentLocation && !pickupLocation) {
      getCurrentPosition().then(pos => {
        setPickupLocation(pos);
      }).catch(err => {
        console.error('Position error:', err);
      });
    } else if (currentLocation && !pickupLocation) {
      setPickupLocation(currentLocation);
    }
  }, [currentLocation, pickupLocation, getCurrentPosition]);

  // Calcul automatique de la route et distance dès sélection pickup + destination
  useEffect(() => {
    const calculateRouteAndPrice = async () => {
      if (!pickupLocation || !destinationLocation) {
        setDistance(0);
        setRouteData(null);
        return;
      }

      setCalculatingRoute(true);
      console.log('🧮 Calcul route:', {
        pickup: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng }
      });

      try {
        const route = await secureNavigationService.calculateRoute({
          origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
          destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
          mode: 'driving'
        });

        if (route) {
          const distanceKm = route.distance / 1000;
          setDistance(distanceKm);
          setRouteData(route);
          console.log('✅ Route calculée:', {
            distance: `${distanceKm.toFixed(2)} km`,
            duration: `${Math.round(route.duration / 60)} min`
          });
        }
      } catch (error) {
        console.error('❌ Erreur calcul route:', error);
        toast.error('Impossible de calculer la route');
      } finally {
        setCalculatingRoute(false);
      }
    };

    calculateRouteAndPrice();
  }, [pickupLocation, destinationLocation]);

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    setBookingStep('destination');
  };

  const handlePlaceSelect = (place: any) => {
    const newDestination = {
      address: place.name || place.destination || place.address,
      lat: place.destination_coordinates?.lat || place.lat,
      lng: place.destination_coordinates?.lng || place.lng,
      type: 'popular' as const,
      name: place.name || place.destination
    };
    setDestinationLocation(newDestination);
    setShowDestinationSearch(false);
    setBookingStep('confirm');
  };

  const handleDestinationSelect = (destination: { address: string; lat: number; lng: number; name?: string }) => {
    setDestinationLocation({
      ...destination,
      type: 'geocoded' as const
    });
    setShowDestinationSearch(false);
    setBookingStep('confirm');
  };

  const handleSearchDriver = async () => {
    if (!pickupLocation || !destinationLocation || !selectedVehicle) {
      toast.error('Veuillez compléter tous les champs');
      return;
    }

    try {
      const bookingData = {
        pickupLocation: pickupLocation.address,
        destination: destinationLocation.address,
        pickupCoordinates: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destinationCoordinates: { lat: destinationLocation.lat, lng: destinationLocation.lng },
        vehicleType: selectedVehicle,
        estimatedPrice: calculatedPrice,
        city: currentCity?.name || 'Kinshasa'
      };

      console.log('🚗 [ModernTaxiInterface] Starting ride dispatch...', bookingData);

      const result = await createAndDispatchRide(bookingData);

      if (result.success && result.driver) {
        console.log('✅ [ModernTaxiInterface] Driver assigned successfully');
        
        // Commencer à écouter les mises à jour en temps réel
        if (result.booking?.id) {
          listenForDriverAssignment(result.booking.id);
        }

        onSubmit?.({
          ...result,
          bookingId: result.booking.id
        });
      } else {
        toast.error('Aucun chauffeur disponible', {
          description: result.message || 'Tous les chauffeurs sont occupés. Réessayez dans quelques instants.'
        });
      }
    } catch (error) {
      console.error('❌ [ModernTaxiInterface] Error dispatching ride:', error);
      toast.error('Erreur lors de la recherche', {
        description: 'Une erreur est survenue. Veuillez réessayer.'
      });
    }
  };

  const handleBackToDestination = () => {
    setBookingStep('destination');
  };

  // Calculer le prix estimé
  const calculatedPrice = distance > 0 ? Math.round(2500 + (distance * 500)) : 0;

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Carte plein écran optimisée */}
      <OptimizedMapView
        pickup={pickupLocation}
        destination={destinationLocation}
        userLocation={pickupLocation}
      />
      
      {/* Badge ville détectée */}
      {currentCity && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 bg-card/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-border/50"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-foreground">{currentCity.name}</span>
          </div>
        </motion.div>
      )}
      
      {/* Menu hamburger */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-4 left-4 z-10 w-12 h-12 bg-card/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow border border-border/50"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </motion.button>
      
      {/* Card Point de prise en charge */}
      <PickupLocationCard
        pickupAddress={pickupLocation?.address || null}
        onEdit={() => {
          console.log('Edit pickup location');
        }}
      />
      
      {/* Bottom Sheet avec flux par étapes */}
      <AnimatePresence mode="wait">
        <YangoBottomSheet
          key={bookingStep}
          bookingStep={bookingStep}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={handleVehicleSelect}
          distance={distance}
          city={currentCity?.name || 'Kinshasa'}
          calculatingRoute={calculatingRoute}
          popularPlaces={popularPlaces || []}
          onPlaceSelect={handlePlaceSelect}
          onSearchFocus={() => setShowDestinationSearch(true)}
          hasDestination={!!destinationLocation}
        />
      </AnimatePresence>

      {/* Modal de confirmation avec prix */}
      {pickupLocation && destinationLocation && (
        <PriceConfirmationModal
          open={bookingStep === 'confirm'}
          onOpenChange={(open) => !open && setBookingStep('destination')}
          vehicleType={selectedVehicle}
          pickup={pickupLocation}
          destination={destinationLocation}
          distance={distance}
          duration={routeData?.duration || distance * 120}
          calculatedPrice={calculatedPrice}
          onConfirm={handleSearchDriver}
          onBack={handleBackToDestination}
        />
      )}
      
      {/* Dialog de recherche de destination */}
      <DestinationSearchDialog
        open={showDestinationSearch}
        onOpenChange={setShowDestinationSearch}
        onSelectDestination={handleDestinationSelect}
        currentLocation={pickupLocation}
      />

      {/* Modal de progression de recherche */}
      <DriverSearchProgressModal
        isSearching={isSearching}
        searchProgress={searchProgress}
        assignedDriver={assignedDriver}
        bookingId={activeBookingId}
        onClose={resetSearch}
      />
    </div>
  );
}
