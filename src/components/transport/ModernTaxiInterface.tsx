import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import YangoBottomSheet from './YangoBottomSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import PriceConfirmationModal from './PriceConfirmationModal';
import DriverSearchProgressModal from './DriverSearchProgressModal';
import { NearbyDriversIndicator } from '@/components/maps/NearbyDriversIndicator';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useRideDispatch } from '@/hooks/useRideDispatch';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import { LocationData } from '@/types/location';
import { secureNavigationService } from '@/services/secureNavigationService';
import { routeCache } from '@/services/routeCacheService';
import { predictiveRouteCache } from '@/services/predictiveRouteCacheService';
import { taxiMetrics } from '@/services/taxiMetricsService';
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
  const [manualPosition, setManualPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [persistedUserLocation, setPersistedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(450);
  
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
  
  // Hook pour afficher le vrai nombre de chauffeurs disponibles
  const { driversCount } = useLiveDrivers({
    userLocation: pickupLocation,
    maxRadius: 5, // 5km de rayon
    showOnlyAvailable: true,
    updateInterval: 30000 // Refresh toutes les 30s
  });
  
  // État de préparation géolocalisation
  const [locationReady, setLocationReady] = useState(false);

  console.log('🌍 Ville détectée:', currentCity?.name || 'Non détectée');
  console.log('📍 Position actuelle:', currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : 'Aucune');
  console.log('🔍 Source position:', source || 'Aucune');

  // 🚀 FORCER GÉOLOCALISATION AU MONTAGE AVEC FALLBACK RAPIDE
  useEffect(() => {
    const initLocation = async () => {
      try {
        console.log('🔍 [ModernTaxiInterface] Initialisation géolocalisation...');
        const pos = await getCurrentPosition({
          timeout: 10000, // 10 secondes max pour GPS
          enableHighAccuracy: false, // Désactiver haute précision pour vitesse
          fallbackToIP: true
        });
        setPickupLocation(pos);
        setPersistedUserLocation({ lat: pos.lat, lng: pos.lng });
        setLocationReady(true);
        console.log('✅ [ModernTaxiInterface] Position initiale obtenue:', pos);
        
        // ⚡ PHASE 3: Précharger les routes populaires en arrière-plan
        predictiveRouteCache.smartPreload(
          { lat: pos.lat, lng: pos.lng },
          currentCity?.name || 'Kinshasa'
        );
        
        // ⚡ PHASE 4: Logger le début de la session
        taxiMetrics.logBookingStarted({
          pickup: { lat: pos.lat, lng: pos.lng },
          city: currentCity?.name || 'Kinshasa'
        });
      } catch (error) {
        console.error('❌ [ModernTaxiInterface] Erreur géolocalisation:', error);
        // Fallback ville par défaut
        const defaultPos = {
          address: currentCity?.name || 'Kinshasa',
          lat: currentCity?.coordinates.lat || -4.3217,
          lng: currentCity?.coordinates.lng || 15.3069,
          type: 'default' as const
        };
        setPickupLocation(defaultPos);
        setLocationReady(true);
        console.log('⚠️ [ModernTaxiInterface] Position par défaut utilisée:', defaultPos);
      }
    };
    
    initLocation();
  }, [getCurrentPosition, currentCity]);

  // ⚡ PHASE 2: Calcul de route avec cache intelligent
  useEffect(() => {
    const calculateRouteAndPrice = async () => {
      if (!pickupLocation || !destinationLocation) {
        setDistance(0);
        setRouteData(null);
        return;
      }

      setCalculatingRoute(true);
      console.log('🧮 Calcul route avec cache:', {
        pickup: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng }
      });

      try {
        // ⚡ Utiliser le cache de routes
        const route = await routeCache.getOrCalculate(
          { lat: pickupLocation.lat, lng: pickupLocation.lng },
          { lat: destinationLocation.lat, lng: destinationLocation.lng },
          () => secureNavigationService.calculateRoute({
            origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
            destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
            mode: 'driving'
          })
        );

        if (route) {
          const distanceKm = route.distance / 1000;
          setDistance(distanceKm);
          setRouteData(route);
          console.log('✅ Route obtenue:', {
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
    // Ne change plus automatiquement l'étape - attend le clic sur "Continuer"
    
    // ⚡ PHASE 4: Logger la sélection de véhicule
    taxiMetrics.logVehicleSelected({
      vehicle_type: vehicleId,
      estimated_price: calculatedPrice
    });
  };

  const handleContinueToDestination = () => {
    setBookingStep('destination');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
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
    
    // ⚡ PHASE 4: Logger la destination
    if (distance > 0) {
      taxiMetrics.logDestinationEntered({
        destination: newDestination.address,
        distance_km: distance,
        duration_seconds: routeData?.duration || distance * 120
      });
    }
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

  const handleClickPosition = () => {
    console.log('📍 User clicked position marker');
    // Réinitialiser la position manuelle pour revenir au GPS
    setManualPosition(null);
    toast.info('Position GPS restaurée', {
      description: 'Retour à votre position actuelle'
    });
    
    // Vibration haptique si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleMarkerDrag = (newPosition: { lat: number; lng: number }) => {
    console.log('📍 Marqueur déplacé à:', newPosition);
    setManualPosition(newPosition);
    toast.info('Position ajustée', {
      description: 'Déplacez le marqueur pour préciser votre position'
    });
  };

  // Calculer le prix estimé
  const calculatedPrice = distance > 0 ? Math.round(2500 + (distance * 500)) : 0;

  // Logs de débogage détaillés pour OptimizedMapView
  console.log('📍 [ModernTaxiInterface] Rendu OptimizedMapView:', {
    pickup: pickupLocation,
    destination: destinationLocation,
    userLocation: manualPosition || currentLocation,
    manualPosition,
    currentLocation,
    locationReady
  });

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Carte plein écran optimisée */}
      <OptimizedMapView
        pickup={pickupLocation}
        destination={destinationLocation}
        userLocation={manualPosition || currentLocation || persistedUserLocation}
        currentCity={currentCity}
        onClickPosition={handleClickPosition}
        onDragMarker={handleMarkerDrag}
        bottomSheetHeight={bottomSheetHeight}
      />
      
      {/* Indicateur chauffeurs à proximité - vrai compteur temps réel */}
      <NearbyDriversIndicator 
        driverCount={driversCount}
        onClick={() => console.log('Toggle drivers visibility')}
      />
      
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
          onSheetPositionChange={setBottomSheetHeight}
          onContinue={handleContinueToDestination}
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
        currentCity={currentCity?.name}
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
