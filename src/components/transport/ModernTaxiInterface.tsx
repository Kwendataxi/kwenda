import { useState, useEffect } from 'react';
import { Menu, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import ModernMapView from './map/ModernMapView';
import PickupLocationCard from './PickupLocationCard';
import YangoBottomSheet from './YangoBottomSheet';
import CurrentPositionMarker from '@/components/maps/CurrentPositionMarker';
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
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  
  const { getCurrentPosition, getPopularPlaces, searchLocations } = useSmartGeolocation();
  const popularPlaces = getPopularPlaces();

  // Détecter position actuelle au montage
  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const position = await getCurrentPosition();
        if (position && !pickupLocation) {
          setPickupLocation(position);
        }
      } catch (error) {
        console.error('Error getting position:', error);
      }
    };
    
    fetchPosition();
  }, []);

  const handlePlaceSelect = (place: any) => {
    setDestinationLocation({
      address: place.name || place.address,
      lat: place.lat,
      lng: place.lng,
      type: 'popular'
    });
  };

  const handleCenterOnUser = () => {
    if (mapInstance && pickupLocation) {
      mapInstance.panTo({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      mapInstance.setZoom(16);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Carte plein écran */}
      <ModernMapView
        pickup={pickupLocation}
        destination={destinationLocation}
        showLiveDrivers={false}
        onMapClick={(coords) => {
          console.log('Map clicked:', coords);
        }}
        userLocation={pickupLocation}
      />
      
      {/* Marker position actuelle */}
      <CurrentPositionMarker 
        map={mapInstance} 
        position={pickupLocation} 
      />
      
      {/* Menu hamburger */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-4 left-4 z-10 w-12 h-12 bg-background rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
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
      
      {/* Bouton navigation - centrer sur position */}
      <motion.button 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCenterOnUser}
        className="absolute bottom-[28rem] right-4 z-10 w-14 h-14 bg-background rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
      >
        <Navigation className="w-6 h-6 text-primary" />
      </motion.button>
      
      {/* Bottom Sheet */}
      <YangoBottomSheet
        selectedVehicle={selectedVehicle}
        onVehicleSelect={setSelectedVehicle}
        popularPlaces={popularPlaces || []}
        onPlaceSelect={handlePlaceSelect}
        onSearchFocus={() => {
          console.log('Open destination search');
          setShowDestinationSearch(true);
        }}
      />
    </div>
  );
}
