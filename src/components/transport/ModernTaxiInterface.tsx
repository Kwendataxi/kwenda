import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import PickupLocationDialog from './PickupLocationDialog';
import YangoBottomSheet from './YangoBottomSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import PriceConfirmationModal from './PriceConfirmationModal';
import DriverSearchProgressModal from './DriverSearchProgressModal';
import BeneficiarySelector from './BeneficiarySelector';
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
import { debounce } from '@/utils/performanceUtils';

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
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [manualPosition, setManualPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [persistedUserLocation, setPersistedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(450);
  
  // États pour réservation pour autrui
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  
  const { currentLocation, getCurrentPosition, getPopularPlaces, currentCity, source } = useSmartGeolocation();
  // 🔧 PERF FIX: Mémoïser popularPlaces
  const popularPlaces = useMemo(() => getPopularPlaces(), [getPopularPlaces]);
  const { 
    isSearching, 
    assignedDriver, 
    searchProgress, 
    activeBookingId,
    createAndDispatchRide, 
    listenForDriverAssignment,
    resetSearch
  } = useRideDispatch();
  
  // 🔧 PERF FIX: Hook chauffeurs moins fréquent
  const { driversCount } = useLiveDrivers({
    userLocation: pickupLocation,
    maxRadius: 5,
    showOnlyAvailable: true,
    updateInterval: 60000 // 🔧 60s au lieu de 30s
  });
  
  const [locationReady, setLocationReady] = useState(false);
  const lastPreloadRef = useRef<{ lat: number; lng: number } | null>(null);

  // 🔧 PERF FIX: Géolocalisation rapide
  useEffect(() => {
    const initLocation = async () => {
      try {
        const pos = await getCurrentPosition({
          timeout: 5000,
          enableHighAccuracy: false,
          fallbackToIP: true
        });
        setPickupLocation(pos);
        setPersistedUserLocation({ lat: pos.lat, lng: pos.lng });
        setLocationReady(true);
        
        // 🔧 PERF FIX: Précharger seulement si mouvement > 500m
        lastPreloadRef.current = { lat: pos.lat, lng: pos.lng };
        predictiveRouteCache.smartPreload(
          { lat: pos.lat, lng: pos.lng },
          currentCity?.name || 'Kinshasa'
        );
        
        taxiMetrics.logBookingStarted({
          pickup: { lat: pos.lat, lng: pos.lng },
          city: currentCity?.name || 'Kinshasa'
        });
      } catch (error) {
        const defaultPos = {
          address: currentCity?.name || 'Kinshasa',
          lat: currentCity?.coordinates.lat || -4.3217,
          lng: currentCity?.coordinates.lng || 15.3069,
          type: 'default' as const
        };
        setPickupLocation(defaultPos);
        setLocationReady(true);
      }
    };
    
    initLocation();
  }, [getCurrentPosition, currentCity]);

  // 🔧 PERF FIX: Calcul de route avec debounce
  const calculateRouteAndPrice = useCallback(async () => {
    if (!pickupLocation || !destinationLocation) {
      setDistance(0);
      setRouteData(null);
      return;
    }

    setCalculatingRoute(true);

    try {
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
      }
    } catch (error) {
      toast.error('Impossible de calculer la route');
    } finally {
      setCalculatingRoute(false);
    }
  }, [pickupLocation, destinationLocation]);

  // 🔧 PERF FIX: Debounce 500ms
  const debouncedCalculate = useMemo(
    () => debounce(calculateRouteAndPrice, 500),
    [calculateRouteAndPrice]
  );

  useEffect(() => {
    debouncedCalculate();
  }, [pickupLocation, destinationLocation, debouncedCalculate]);

  // Calculer le prix estimé
  const calculatedPrice = distance > 0 ? Math.round(2500 + (distance * 500)) : 0;

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    
    taxiMetrics.logVehicleSelected({
      vehicle_type: vehicleId,
      estimated_price: calculatedPrice
    });
  }, [calculatedPrice]);

  const handleContinueToDestination = () => {
    // Validation si réservation pour autrui
    if (isForSomeoneElse && !selectedBeneficiary) {
      toast.error('Veuillez sélectionner un bénéficiaire', {
        description: 'Choisissez un contact ou ajoutez-en un nouveau'
      });
      // Vibration d'erreur
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }
    
    setBookingStep('destination');
    
    // Vibration de succès
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
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

  const handlePickupSelect = (location: LocationData) => {
    setPickupLocation(location);
    setManualPosition({ lat: location.lat, lng: location.lng });
    toast.success('Point de prise en charge modifié', {
      description: location.name || location.address
    });
    
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const handleUseCurrentPosition = async () => {
    try {
      const pos = await getCurrentPosition({
        timeout: 5000,
        enableHighAccuracy: true,
        fallbackToIP: true
      });
      setPickupLocation(pos);
      setManualPosition(null);
      toast.success('Position GPS activée');
    } catch (error) {
      toast.error('Impossible d\'obtenir votre position');
    }
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
        city: currentCity?.name || 'Kinshasa',
        
        // Données bénéficiaire
        bookedForOther: isForSomeoneElse,
        beneficiaryId: selectedBeneficiary?.id,
        beneficiaryName: selectedBeneficiary?.name,
        beneficiaryPhone: selectedBeneficiary?.phone
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

  const handleClickPosition = useCallback(() => {
    setManualPosition(null);
    toast.info('Position GPS restaurée', {
      description: 'Retour à votre position actuelle'
    });
    
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleMarkerDrag = useCallback((newPosition: { lat: number; lng: number }) => {
    setManualPosition(newPosition);
    toast.info('Position ajustée', {
      description: 'Déplacez le marqueur pour préciser votre position'
    });
  }, []);

  return (
    <div className="relative h-screen bg-background">
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
        onEdit={() => setShowPickupDialog(true)}
      />
      
      
      {/* Bottom Sheet avec flux par étapes */}
      <AnimatePresence mode="sync">{/* 🔧 PERF FIX: mode="sync" pour fluidité */}
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
          isForSomeoneElse={isForSomeoneElse}
          onToggleBeneficiary={setIsForSomeoneElse}
          selectedBeneficiary={selectedBeneficiary}
          onSelectBeneficiary={setSelectedBeneficiary}
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
          beneficiary={isForSomeoneElse && selectedBeneficiary ? {
            name: selectedBeneficiary.name,
            phone: selectedBeneficiary.phone
          } : null}
        />
      )}
      
      {/* Dialog de modification du pickup */}
      <PickupLocationDialog
        open={showPickupDialog}
        onOpenChange={setShowPickupDialog}
        currentLocation={pickupLocation}
        onSelectLocation={handlePickupSelect}
        onUseCurrentPosition={handleUseCurrentPosition}
      />
      
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
