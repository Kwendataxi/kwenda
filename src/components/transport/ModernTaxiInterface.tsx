import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedMapView from './map/OptimizedMapView';
import PickupLocationCard from './PickupLocationCard';
import YangoBottomSheet from './YangoBottomSheet';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { LocationData } from '@/types/location';

interface ModernTaxiInterfaceProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export default function ModernTaxiInterface({ onSubmit, onCancel }: ModernTaxiInterfaceProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('taxi_eco');
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  
  const { currentLocation, getCurrentPosition, getPopularPlaces } = useSmartGeolocation();
  const popularPlaces = getPopularPlaces();

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

  const handlePlaceSelect = (place: any) => {
    setDestinationLocation({
      address: place.name || place.address,
      lat: place.lat,
      lng: place.lng,
      type: 'popular'
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
        popularPlaces={popularPlaces || []}
        onPlaceSelect={handlePlaceSelect}
        onSearchFocus={() => {
          setShowDestinationSearch(true);
        }}
      />
    </div>
  );
}
