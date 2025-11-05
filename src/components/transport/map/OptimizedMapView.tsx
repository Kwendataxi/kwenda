import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import { throttle } from '@/utils/performanceUtils';
import KwendaMapControls from '@/components/maps/KwendaMapControls';
import CurrentPositionMarker from '@/components/maps/CurrentPositionMarker';
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
  onMapReady?: (map: google.maps.Map) => void;
  className?: string;
}

const OptimizedMapView = React.memo(({ 
  pickup, 
  destination, 
  userLocation,
  onMapReady,
  className = '' 
}: OptimizedMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { isLoaded } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialisation carte optimisée
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        await window.google.maps.importLibrary('maps');
        await window.google.maps.importLibrary('marker');

        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        const mapId = googleMapsLoader.getMapId();

        const defaultCenter = userLocation || pickup || { lat: -4.3217, lng: 15.3069 };

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
  }, [isLoaded, userLocation, pickup, mapStyles, onMapReady]);

  // Gestion des markers avec throttle
  const updateMarkers = useCallback(
    throttle(async () => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

      // Pickup marker
      if (pickup) {
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.position = pickup;
        } else {
          const content = document.createElement('div');
          content.className = 'w-10 h-10 bg-card border-2 border-primary rounded-full shadow-lg flex items-center justify-center';
          content.innerHTML = '📍';

          pickupMarkerRef.current = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: pickup,
            content,
            title: pickup.name || 'Point de départ'
          });
        }
      }

      // Destination marker
      if (destination) {
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.position = destination;
        } else {
          const content = document.createElement('div');
          content.className = 'w-10 h-10 bg-primary border-2 border-background rounded-full shadow-lg flex items-center justify-center animate-pulse';
          content.innerHTML = '🎯';

          destinationMarkerRef.current = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: destination,
            content,
            title: destination.name || 'Destination'
          });
        }
      }
    }, 300),
    [pickup, destination, isMapReady]
  );

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Gestion de la route
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !pickup || !destination) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

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

          // Ajuster bounds
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
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(16);
    }
  }, [userLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      pickupMarkerRef.current?.map && (pickupMarkerRef.current.map = null);
      destinationMarkerRef.current?.map && (destinationMarkerRef.current.map = null);
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
      
      {/* Marker position actuelle */}
      <CurrentPositionMarker map={mapInstanceRef.current} position={userLocation} />
      
      {/* Contrôles carte */}
      <KwendaMapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
      />
    </div>
  );
});

OptimizedMapView.displayName = 'OptimizedMapView';

export default OptimizedMapView;
