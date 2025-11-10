import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import PickupLocationDialog from './PickupLocationDialog';
import UnifiedTaxiSheet from './UnifiedTaxiSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import PriceConfirmationModal from './PriceConfirmationModal';
import DriverSearchProgressModal from './DriverSearchProgressModal';
import BeneficiarySelector from './BeneficiarySelector';
import { NearbyDriversIndicator } from '@/components/maps/NearbyDriversIndicator';
import { FloatingHomeButton } from '@/components/driver/FloatingHomeButton';
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
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [manualPosition, setManualPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [persistedUserLocation, setPersistedUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(420);
  
  // États pour réservation pour autrui
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [clientProposedPrice, setClientProposedPrice] = useState<number | null>(null);
  
  const { currentLocation, getCurrentPosition, getPopularPlaces, currentCity, source } = useSmartGeolocation();
  
  // 🔍 LOG DE DEBUG - Tracker les changements de ville
  useEffect(() => {
    console.log('🌍 [ModernTaxiInterface] currentCity changed:', {
      cityObject: currentCity,
      cityName: currentCity?.name,
      timestamp: new Date().toISOString()
    });
  }, [currentCity]);
  
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

  const [tempBookingId, setTempBookingId] = useState<string | null>(null);

  const handleSearchDriver = async () => {
    if (!pickupLocation || !destinationLocation || !selectedVehicle) {
      toast.error('Veuillez compléter tous les champs');
      return;
    }

    // Validation bénéficiaire
    if (isForSomeoneElse && !selectedBeneficiary) {
      toast.error('Veuillez sélectionner un bénéficiaire');
      return;
    }

    // Ouvrir le modal de confirmation
    setShowPriceConfirm(true);
  };

  const handleConfirmBooking = async () => {
    if (!pickupLocation || !destinationLocation || !selectedVehicle) return;

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

      console.log('🚗 [ModernTaxiInterface] Starting ride dispatch with bidding:', biddingEnabled, 'Proposed price:', clientProposedPrice);

      // ✅ Passer le mode bidding ET le prix proposé au dispatching
      const result = await createAndDispatchRide(bookingData, {
        biddingMode: biddingEnabled,
        clientProposedPrice: clientProposedPrice || Math.floor(calculatedPrice * 0.8), // Par défaut 80% du prix estimé
        biddingDuration: 300 // 5 minutes
      });

      // Stocker l'ID de la réservation pour le bidding
      if (result.booking?.id) {
        setTempBookingId(result.booking.id);
      }

      if (result.biddingActive) {
        // Mode bidding : notification et attente des offres
        console.log('✅ Bidding mode active, waiting for offers...');
        toast.success('🎯 Mode enchères activé !', {
          description: `${result.notifiedDrivers || 0} chauffeurs notifiés. Attendez les offres...`
        });
        // Le modal RideBiddingModal s'ouvrira automatiquement via PriceConfirmationModal
      } else if (result.success && result.driver) {
        console.log('✅ [ModernTaxiInterface] Driver assigned successfully');
        
        // Commencer à écouter les mises à jour en temps réel
        if (result.booking?.id) {
          listenForDriverAssignment(result.booking.id);
        }

        onSubmit?.({
          ...result,
          bookingId: result.booking.id
        });
      } else if (!result.success) {
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
      {/* Bouton retour accueil - toujours visible */}
      <FloatingHomeButton 
        onClick={() => window.location.href = '/'}
        serviceType="taxi"
        variant="circle"
      />

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

      {/* Pin rouge animé style Yango */}
      {pickupLocation && (
        <div 
          className="absolute z-10 pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="relative">
            {/* Pin principal */}
            <div className="w-8 h-8 bg-congo-red border-4 border-white rounded-full shadow-xl pulsing-pin" />
            {/* Pointe du pin */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
          </div>
        </div>
      )}
      
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
      
      
      {/* Sheet unifié moderne */}
      <UnifiedTaxiSheet
        pickup={pickupLocation}
        destination={destinationLocation}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={handleVehicleSelect}
        onDestinationSelect={() => setShowDestinationSearch(true)}
        onBook={handleSearchDriver}
        isSearching={isSearching}
        distance={distance}
        duration={routeData?.duration || distance * 120}
        calculatedPrice={calculatedPrice}
        city={currentCity?.name || 'Kinshasa'}
        biddingEnabled={biddingEnabled}
        onToggleBidding={setBiddingEnabled}
        onClientProposedPrice={setClientProposedPrice}
        isForSomeoneElse={isForSomeoneElse}
        onToggleBeneficiary={setIsForSomeoneElse}
        selectedBeneficiary={selectedBeneficiary}
        onSelectBeneficiary={setSelectedBeneficiary}
      />

      {/* Modal de confirmation avec prix */}
      {pickupLocation && destinationLocation && (
        <PriceConfirmationModal
          open={showPriceConfirm}
          onOpenChange={setShowPriceConfirm}
          vehicleType={selectedVehicle}
          pickup={pickupLocation}
          destination={destinationLocation}
          distance={distance}
          duration={routeData?.duration || distance * 120}
          calculatedPrice={calculatedPrice}
          onConfirm={handleConfirmBooking}
          onBack={() => setShowPriceConfirm(false)}
          beneficiary={isForSomeoneElse && selectedBeneficiary ? {
            name: selectedBeneficiary.name,
            phone: selectedBeneficiary.phone
          } : null}
          bookingId={tempBookingId || undefined}
          onOfferAccepted={(driverId) => {
            console.log('Offer accepted from driver:', driverId);
            onSubmit?.({ driver: { id: driverId }, bookingId: tempBookingId });
          }}
          onBiddingEnabled={(enabled) => setBiddingEnabled(enabled)}
          onClientProposedPrice={(price) => setClientProposedPrice(price)}
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
