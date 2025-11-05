import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import { throttle } from '@/utils/performanceUtils';
import KwendaMapControls from '@/components/maps/KwendaMapControls';
import CurrentPositionMarker from '@/components/maps/CurrentPositionMarker';
import { PickupMarker, DestinationMarker } from '@/components/maps/CustomMarkers';
import { motion } from 'framer-motion';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface OptimizedMapViewProps {
  pickup?: Location | null;
  destination?: Location | null;
  userLocation?: { lat: number; lng: number } | null;
  currentCity?: { name: string; coordinates: { lat: number; lng: number } } | null;
  onMapReady?: (map: google.maps.Map) => void;
  onClickPosition?: () => void;
  onDragMarker?: (newPosition: { lat: number; lng: number }) => void;
  bottomSheetHeight?: number;
  className?: string;
}

const OptimizedMapView = React.memo(({ 
  pickup, 
  destination, 
  userLocation,
  currentCity,
  onMapReady,
  onClickPosition,
  onDragMarker,
  bottomSheetHeight = 450,
  className = '' 
}: OptimizedMapViewProps) => {

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { isLoaded } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 🔧 PERF FIX: Initialisation carte UNE SEULE FOIS
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        await window.google.maps.importLibrary('maps');
        await window.google.maps.importLibrary('marker');

        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        const mapId = googleMapsLoader.getMapId();

        const defaultCenter = userLocation || pickup || currentCity?.coordinates || { lat: -4.3217, lng: 15.3069 };

        const map = new google.maps.Map(mapRef.current!, {
          mapId,
          center: defaultCenter,
          zoom: userLocation ? 15 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          tilt: 45,
          gestureHandling: 'greedy',
          styles: mapStyles
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);
        onMapReady?.(map);
      } catch (error) {
        console.error('Map init error:', error);
      }
    };

    initMap();
  }, [isLoaded]); // 🔧 PERF FIX: Uniquement isLoaded pour éviter réinitialisations


  // Auto-centrage dynamique sur la position utilisateur
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !isMapReady) return;
    
    mapInstanceRef.current.panTo(userLocation);
    mapInstanceRef.current.setZoom(15);
  }, [userLocation, isMapReady]);

  // 🔧 PERF FIX: Route affichée UNIQUEMENT (calcul fait dans parent)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !pickup || !destination) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    // ✅ Affichage visuel uniquement - pas de calcul de route ici
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickup,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
          }

          routePolylineRef.current = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            geodesic: true,
            strokeColor: 'hsl(var(--primary))',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: mapInstanceRef.current
          });

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          mapInstanceRef.current?.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
        }
      }
    );
  }, [pickup, destination, isMapReady]);

  // Contrôles carte
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      setIsLocating(true);
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(16);
      setTimeout(() => setIsLocating(false), 1000);
    }
  }, [userLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      routePolylineRef.current?.setMap(null);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Markers personnalisés */}
      {/* Ne pas afficher le PickupMarker vert si c'est la même position que userLocation */}
      {pickup && userLocation && (
        Math.abs(pickup.lat - userLocation.lat) > 0.0001 || 
        Math.abs(pickup.lng - userLocation.lng) > 0.0001
      ) && <PickupMarker map={mapInstanceRef.current} position={pickup} label={pickup.name || pickup.address} />}
      {destination && <DestinationMarker map={mapInstanceRef.current} position={destination} label={destination.name || destination.address} />}
      
      {/* Marqueur position actuelle - Draggable avec fallback */}
      <CurrentPositionMarker 
        map={mapInstanceRef.current} 
        position={userLocation || pickup} 
        onClickPosition={onClickPosition}
        onDragEnd={onDragMarker}
        isDraggable={true}
      />
      
      {/* Contrôles carte */}
      <KwendaMapControls
        onLocate={handleLocate}
        isLocating={isLocating}
        bottomSheetHeight={bottomSheetHeight}
      />
    </div>
  );
});

OptimizedMapView.displayName = 'OptimizedMapView';

export default OptimizedMapView;
