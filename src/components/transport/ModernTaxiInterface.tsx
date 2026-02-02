import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Car } from 'lucide-react';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import PickupLocationDialog from './PickupLocationDialog';
import UnifiedTaxiSheet from './UnifiedTaxiSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import PriceConfirmationModal from './PriceConfirmationModal';
import DriverSearchProgressModal from './DriverSearchProgressModal';
import { NearbyDriversIndicator } from '@/components/maps/NearbyDriversIndicator';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { useRideDispatch } from '@/hooks/useRideDispatch';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import { LocationData } from '@/types/location';
import { routeCache } from '@/services/routeCacheService';
import { predictiveRouteCache } from '@/services/predictiveRouteCacheService';
import { taxiMetrics } from '@/services/taxiMetricsService';
import { ProfessionalRouteResult } from '@/services/professionalRouteService';
import { toast } from 'sonner';
import { debounce } from '@/utils/performanceUtils';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { Button } from '@/components/ui/button';
import { getCurrencyByCity } from '@/utils/formatCurrency';

interface ModernTaxiInterfaceProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  initialDestination?: LocationData | null;
}

export default function ModernTaxiInterface({ onSubmit, onCancel, initialDestination }: ModernTaxiInterfaceProps) {
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
  
  // 🎯 Mode enchères
  const [biddingMode, setBiddingMode] = useState(false);
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

  // 🎯 PRÉ-REMPLIR DESTINATION depuis Mes Adresses
  useEffect(() => {
    if (initialDestination && !destinationLocation) {
      setDestinationLocation(initialDestination);
      toast.success('Destination pré-remplie', {
        description: initialDestination.name || initialDestination.address
      });
    }
  }, [initialDestination]);

  // 🎯 GÉOLOCALISATION HAUTE PRÉCISION
  useEffect(() => {
    const initLocation = async () => {
      try {
        // ✅ CORRECTION: Demander une position GPS précise dès le départ
        const pos = await getCurrentPosition({
          timeout: 10000,
          enableHighAccuracy: true, // ✅ HAUTE PRÉCISION
          maximumAge: 5000, // ✅ Position fraîche (5s max)
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

  // ✅ ÉTAPE A: Callback pour recevoir la distance/durée depuis le tracé de route sur la carte
  const handleRouteCalculated = useCallback((result: ProfessionalRouteResult) => {
    console.log('🛣️ [ModernTaxiInterface] Route calculée depuis la carte:', {
      distance: result.distance,
      distanceText: result.distanceText,
      duration: result.duration,
      durationText: result.durationText,
      provider: result.provider
    });
    
    const distanceKm = result.distance / 1000;
    setDistance(distanceKm);
    setRouteData({
      distance: result.distance,
      duration: result.duration,
      distanceText: result.distanceText,
      durationText: result.durationText,
      provider: result.provider
    });
    setCalculatingRoute(false);
  }, []);

  // ✅ Marquer le calcul comme "en cours" quand les locations changent
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      setCalculatingRoute(true);
      // Le callback handleRouteCalculated mettra calculatingRoute à false
    } else {
      setDistance(0);
      setRouteData(null);
      setCalculatingRoute(false);
    }
  }, [pickupLocation?.lat, pickupLocation?.lng, destinationLocation?.lat, destinationLocation?.lng]);

  // ✅ ÉTAPE C: Devise dynamique basée sur la ville
  const currency = useMemo(() => {
    if (currentCity?.name?.toLowerCase()?.includes('abidjan')) {
      return 'XOF';
    }
    return 'CDF';
  }, [currentCity?.name]);

  // ✅ PHASE 1: Charger les véhicules avec prix réels depuis la DB (source unique)
  const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ 
    distance, 
    city: currentCity?.name || 'Kinshasa' 
  });

  // ✅ PHASE 3: Calcul dynamique des prix basé sur la distance RÉELLE
  const vehiclesWithPrices = useMemo(() => {
    return vehicles.map(v => ({
      ...v,
      calculatedPrice: Math.round(v.basePrice + (distance * v.pricePerKm))
    }));
  }, [vehicles, distance]);

  // Calculer le prix basé sur le véhicule sélectionné
  const calculatedPrice = useMemo(() => {
    if (!selectedVehicle || vehiclesWithPrices.length === 0) return 0;
    const vehicle = vehiclesWithPrices.find(v => v.id === selectedVehicle);
    return vehicle?.calculatedPrice || 0;
  }, [selectedVehicle, vehiclesWithPrices]);

  // Auto-sélectionner le véhicule le moins cher au chargement
  useEffect(() => {
    if (vehiclesWithPrices.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehiclesWithPrices[0].id);
    }
  }, [vehiclesWithPrices, selectedVehicle]);

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
      // ✅ CORRECTION: Position GPS fraîche et précise
      const pos = await getCurrentPosition({
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0, // ✅ Force nouvelle position
        fallbackToIP: true
      });
      setPickupLocation(pos);
      setManualPosition(null);
      
      const accuracy = pos.accuracy || 0;
      if (accuracy <= 50) {
        toast.success('Position GPS précise activée', {
          description: `Précision: ${Math.round(accuracy)}m`
        });
      } else if (accuracy <= 150) {
        toast.success('Position GPS activée', {
          description: `Précision moyenne: ${Math.round(accuracy)}m`
        });
      } else {
        toast.warning('Position GPS approximative', {
          description: `Précision: ${Math.round(accuracy)}m - Déplacez-vous pour améliorer`
        });
      }
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

    // ✅ CRÉER LE BOOKING IMMÉDIATEMENT
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

      const result = await createAndDispatchRide(bookingData, {
        biddingMode: biddingMode,
        clientProposedPrice: clientProposedPrice,
        biddingDuration: 300
      });

      // ✅ STOCKER L'ID pour le passer au modal
      if (result.booking?.id) {
        setTempBookingId(result.booking.id);
        setShowPriceConfirm(true);
      } else {
        toast.error('Erreur lors de la création de la réservation');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Erreur lors de la création de la réservation');
    }
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
        city: currentCity?.name || 'Kinshasa'
      };

      // ✅ Passer le mode bidding ET le prix proposé au dispatching
      const result = await createAndDispatchRide(bookingData, {
        biddingMode: biddingMode,
        clientProposedPrice: clientProposedPrice,
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

  const navigate = useNavigate();
  
  const handleGoBack = useCallback(() => {
    // ✅ Navigation fiable vers dashboard client
    navigate('/app/client', { replace: true });
  }, [navigate]);

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {/* 🛡️ Header moderne soft - Toujours visible */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-[200] pt-safe-top bg-background/95 backdrop-blur-xl border-b border-border/40"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Gauche: Retour + Titre */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="h-9 w-9 rounded-full text-foreground hover:bg-muted/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground leading-tight">Taxi</h1>
                <p className="text-[11px] text-muted-foreground">
                  {currentCity?.name || 'Kinshasa'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Droite: Indicateur GPS */}
          {!locationReady && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground">GPS...</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Carte plein écran optimisée */}
      <OptimizedMapView
        pickup={pickupLocation}
        destination={destinationLocation}
        userLocation={manualPosition || currentLocation || persistedUserLocation}
        currentCity={currentCity}
        onClickPosition={handleClickPosition}
        onDragMarker={handleMarkerDrag}
        bottomSheetHeight={bottomSheetHeight}
        onRouteCalculated={handleRouteCalculated}
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
      
      
      {/* ✅ PHASE 1: Sheet unifié avec véhicules passés en props */}
      <UnifiedTaxiSheet
        pickup={pickupLocation}
        destination={destinationLocation}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={handleVehicleSelect}
        onDestinationSelect={() => setShowDestinationSearch(true)}
        onQuickDestinationSelect={(location) => {
          setDestinationLocation({
            ...location,
            type: 'geocoded' as const
          });
        }}
        onBook={handleSearchDriver}
        isSearching={isSearching}
        distance={distance}
        city={currentCity?.name || 'Kinshasa'}
        currency={currency}
        biddingMode={biddingMode}
        onBiddingModeChange={setBiddingMode}
        clientProposedPrice={clientProposedPrice}
        onClientProposedPriceChange={setClientProposedPrice}
        vehicles={vehiclesWithPrices}
        vehiclesLoading={vehiclesLoading || calculatingRoute}
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
          currency={currency}
          onConfirm={handleConfirmBooking}
          onBack={() => setShowPriceConfirm(false)}
          bookingId={tempBookingId || undefined}
          onOfferAccepted={(driverId) => {
            console.log('Offer accepted from driver:', driverId);
            onSubmit?.({ driver: { id: driverId }, bookingId: tempBookingId });
          }}
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
