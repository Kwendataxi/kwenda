import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CustomMarkers from './CustomMarkers';
import AnimatedPolyline from './AnimatedPolyline';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface ModernMapViewProps {
  pickup?: Location | null;
  destination?: Location | null;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  visualizationMode?: 'selection' | 'route' | 'tracking';
  currentDriverLocation?: { lat: number; lng: number };
  className?: string;
}

export default function ModernMapView({
  pickup,
  destination,
  onMapClick,
  visualizationMode = 'selection',
  currentDriverLocation,
  className = ''
}: ModernMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, error } = useGoogleMaps();
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialisation de la carte Google Maps
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initializeMap = async () => {
      try {
        const defaultCenter = pickup 
          ? { lat: pickup.lat, lng: pickup.lng }
          : { lat: -4.3217, lng: 15.3069 }; // Kinshasa par défaut

        const map = new google.maps.Map(mapRef.current!, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Gestion du clic sur la carte
        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          });
        }

        mapInstanceRef.current = map;
        setIsMapReady(true);
      } catch (err) {
        console.error('Erreur initialisation carte:', err);
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick]);

  // Ajuster la vue pour afficher pickup et destination
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    if (pickup && destination) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (pickup) {
      mapInstanceRef.current.setCenter({ lat: pickup.lat, lng: pickup.lng });
      mapInstanceRef.current.setZoom(15);
    } else if (destination) {
      mapInstanceRef.current.setCenter({ lat: destination.lat, lng: destination.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [pickup, destination, isMapReady]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <p className="text-destructive">Erreur de chargement de la carte</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Carte Google Maps */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Markers personnalisés */}
      {isMapReady && mapInstanceRef.current && (
        <>
          <CustomMarkers
            map={mapInstanceRef.current}
            pickup={pickup}
            destination={destination}
            currentDriverLocation={currentDriverLocation}
          />

          {/* Route animée */}
          {pickup && destination && visualizationMode === 'route' && (
            <AnimatedPolyline
              map={mapInstanceRef.current}
              pickup={pickup}
              destination={destination}
            />
          )}
        </>
      )}

      {/* Indicateur de mode */}
      {visualizationMode !== 'selection' && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
          <span className="text-xs font-medium">
            {visualizationMode === 'route' && '🗺️ Trajet planifié'}
            {visualizationMode === 'tracking' && '📍 Suivi en direct'}
          </span>
        </div>
      )}
    </div>
  );
}
