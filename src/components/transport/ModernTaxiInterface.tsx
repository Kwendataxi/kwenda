import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import YangoBottomSheet from './YangoBottomSheet';
import DestinationSearchDialog from './DestinationSearchDialog';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { LocationData } from '@/types/location';
import { secureNavigationService } from '@/services/secureNavigationService';
import { toast } from 'sonner';

interface ModernTaxiInterfaceProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export default function ModernTaxiInterface({ onSubmit, onCancel }: ModernTaxiInterfaceProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('taxi_eco');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  
  const { currentLocation, getCurrentPosition, getPopularPlaces, currentCity, source } = useSmartGeolocation();
  const popularPlaces = getPopularPlaces();
  
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
  };

  const handleDestinationSelect = (destination: { address: string; lat: number; lng: number; name?: string }) => {
    setDestinationLocation({
      ...destination,
      type: 'geocoded' as const
    });
  };

  const handleConfirmBooking = () => {
    if (!pickupLocation || !destinationLocation || !selectedVehicle) {
      toast.error('Veuillez compléter tous les champs');
      return;
    }

    console.log('✅ Confirmation booking:', {
      pickup: pickupLocation,
      destination: destinationLocation,
      vehicleType: selectedVehicle,
      distance: `${distance.toFixed(2)} km`
    });

    onSubmit?.({
      pickup: pickupLocation,
      destination: destinationLocation,
      vehicleType: selectedVehicle,
      distance,
      route: routeData,
      bookingId: `booking-${Date.now()}`
    });
  };

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
          className="absolute top-4 right-4 z-10 bg-card/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-border/50"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground">{currentCity.name}</span>
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
      
      {/* Bottom Sheet */}
      <YangoBottomSheet
        selectedVehicle={selectedVehicle}
        onVehicleSelect={setSelectedVehicle}
        distance={distance}
        city={currentCity?.name || 'Kinshasa'}
        calculatingRoute={calculatingRoute}
        popularPlaces={popularPlaces || []}
        onPlaceSelect={handlePlaceSelect}
        onSearchFocus={() => setShowDestinationSearch(true)}
        onConfirmBooking={handleConfirmBooking}
        hasDestination={!!destinationLocation}
      />
      
      {/* Dialog de recherche de destination */}
      <DestinationSearchDialog
        open={showDestinationSearch}
        onOpenChange={setShowDestinationSearch}
        onSelectDestination={handleDestinationSelect}
        currentLocation={pickupLocation}
      />
    </div>
  );
}
