import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapTheme } from '@/hooks/useMapTheme';
import KwendaMapControls from '@/components/maps/KwendaMapControls';
import ProfessionalRoutePolyline from './ProfessionalRoutePolyline';
import { PickupMarker, DestinationMarker } from '@/components/maps/CustomMarkers';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
  
  const { isLoaded } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // 🔧 FIX: Flags pour éviter auto-pan intempestif
  const hasCenteredRef = useRef(false);
  const isUserInteractingRef = useRef(false);

  // 🔧 FIX: Initialisation carte sans mapId (incompatible avec styles)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        await window.google.maps.importLibrary('maps');
        await window.google.maps.importLibrary('marker');

        const defaultCenter = userLocation || pickup || currentCity?.coordinates || { lat: -4.3217, lng: 15.3069 };

        // ✅ FIX: Ne pas utiliser mapId avec styles personnalisés (incompatible)
        const map = new google.maps.Map(mapRef.current!, {
          center: defaultCenter,
          zoom: userLocation ? 15 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          tilt: 0, // Désactiver tilt pour éviter problèmes de rendu
          gestureHandling: 'greedy',
          styles: mapStyles,
          backgroundColor: '#f8fafc' // Fallback clair au lieu de noir
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);
        onMapReady?.(map);
        
        // 🔧 FIX: Détecter interaction utilisateur pour éviter recentrage auto
        map.addListener('dragstart', () => {
          isUserInteractingRef.current = true;
        });
        map.addListener('dragend', () => {
          setTimeout(() => { isUserInteractingRef.current = false; }, 500);
        });
        
      } catch (error) {
        console.error('Map init error:', error);
      }
    };

    initMap();
  }, [isLoaded]);


  // 🔧 FIX: Auto-centrage UNE SEULE FOIS au démarrage (pas en boucle)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !isMapReady) return;
    if (hasCenteredRef.current || isUserInteractingRef.current) return;
    
    mapInstanceRef.current.panTo(userLocation);
    mapInstanceRef.current.setZoom(15);
    hasCenteredRef.current = true;
  }, [userLocation, isMapReady]);

  // Note: Le tracé de route est maintenant géré par ProfessionalRoutePolyline

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

  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    
    // 🎯 GPS NATIF - Utilise Capacitor sur Android/iOS
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Force nouvelle position
      });
      
      const newLocation = {
        lat: position.lat,
        lng: position.lng
      };
      const accuracy = position.accuracy;
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newLocation);
        mapInstanceRef.current.setZoom(16);
      }
      
      // Feedback selon la précision et la source
      const sourceLabel = position.source === 'capacitor' ? 'GPS natif' : 'GPS';
      if (accuracy <= 30) {
        toast.success(`${sourceLabel} précis (±${Math.round(accuracy)}m)`);
      } else if (accuracy <= 100) {
        toast.success(`${sourceLabel} mis à jour (±${Math.round(accuracy)}m)`);
      } else {
        toast.warning(`${sourceLabel} approximatif (±${Math.round(accuracy)}m)`, {
          description: 'Déplacez-vous à l\'extérieur pour améliorer'
        });
      }
      
      console.log(`📍 Position ${sourceLabel}:`, newLocation, `Précision: ${Math.round(accuracy)}m`);
      
      // Remonter la nouvelle position au parent
      onClickPosition?.();
      
    } catch (error: any) {
      console.error('❌ Erreur géolocalisation:', error);
      
      // Fallback 1: utiliser la position connue
      if (userLocation && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(userLocation);
        mapInstanceRef.current.setZoom(16);
        toast.info('Recentré sur dernière position connue');
      } 
      // Fallback 2: utiliser la ville courante
      else if (currentCity?.coordinates && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(currentCity.coordinates);
        mapInstanceRef.current.setZoom(14);
        toast.info('Recentré sur ' + currentCity.name);
      } else {
        toast.error('GPS indisponible', {
          description: error?.message || 'Vérifiez vos autorisations de localisation'
        });
      }
    } finally {
      setTimeout(() => setIsLocating(false), 600);
    }
  }, [userLocation, currentCity, onClickPosition]);

  // Cleanup - pas de polyline à nettoyer, géré par ProfessionalRoutePolyline

  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-muted/50 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="mt-4 text-sm text-muted-foreground">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* 📍 Marker de départ (cercle vert pulsant) */}
      {isMapReady && mapInstanceRef.current && pickup && (
        <PickupMarker 
          map={mapInstanceRef.current} 
          position={{ lat: pickup.lat, lng: pickup.lng }}
          label={pickup.name || pickup.address}
        />
      )}
      
      {/* 🎯 Marker de destination (pin rouge professionnel) */}
      {isMapReady && mapInstanceRef.current && destination && (
        <DestinationMarker 
          map={mapInstanceRef.current} 
          position={{ lat: destination.lat, lng: destination.lng }}
          label={destination.name || destination.address}
        />
      )}
      
      {/* 🛣️ Tracé de route professionnel style Yango */}
      {isMapReady && mapInstanceRef.current && pickup && destination && (
        <ProfessionalRoutePolyline
          map={mapInstanceRef.current}
          pickup={pickup}
          destination={destination}
          showTraffic={false}
          animate={true}
        />
      )}
      
      {/* Contrôles carte - Toujours visible */}
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
