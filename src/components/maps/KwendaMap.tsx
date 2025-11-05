import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapCamera } from '@/hooks/useMapCamera';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useToast } from '@/hooks/use-toast';
import KwendaMapControls from './KwendaMapControls';
import RouteOverlay from './RouteOverlay';
import { throttle } from '@/utils/performanceUtils';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface KwendaMapProps {
  pickup?: Location | null;
  destination?: Location | null;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  currentDriverLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  showRouteInfo?: boolean;
  className?: string;
  enableControls?: boolean;
  enable3D?: boolean;
}

export default function KwendaMap({
  pickup,
  destination,
  onMapClick,
  currentDriverLocation,
  userLocation,
  showRouteInfo = false,
  className = '',
  enableControls = true,
  enable3D = true
}: KwendaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { isLoaded, error, isLoading } = useGoogleMaps();
  const { mapStyles } = useMapTheme();
  const { toast } = useToast();
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; price?: string } | null>(null);

  const { animateCamera, flyTo, fitBoundsAnimated } = useMapCamera(mapInstanceRef.current);

  // Initialisation de la carte Google Maps moderne
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initializeMap = async () => {
      try {
        await window.google.maps.importLibrary('maps');
        await window.google.maps.importLibrary('marker');
        
        const { googleMapsLoader } = await import('@/services/googleMapsLoader');
        const mapId = googleMapsLoader.getMapId();
        
        if (!mapId) {
          toast({
            title: "Configuration manquante",
            description: "Map ID non configuré",
            variant: "destructive"
          });
          return;
        }

        const defaultCenter = userLocation 
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : pickup 
          ? { lat: pickup.lat, lng: pickup.lng }
          : { lat: -4.3217, lng: 15.3069 };

        const map = new google.maps.Map(mapRef.current!, {
          mapId: mapId,
          center: defaultCenter,
          zoom: userLocation ? 15 : pickup ? 14 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          tilt: enable3D ? 45 : 0,
          heading: 0,
          gestureHandling: 'greedy',
          styles: mapStyles
        });

        // Gestion du clic sur la carte
        if (onMapClick) {
          const throttledClick = throttle((e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              createRippleEffect(e.latLng);
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          }, 300);

          map.addListener('click', throttledClick);
        }

        mapInstanceRef.current = map;
        setIsMapReady(true);
        
        toast({
          title: "🗺️ Carte chargée",
          description: "Carte interactive prête"
        });
      } catch (err) {
        console.error('Erreur initialisation carte:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger la carte",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick, pickup, userLocation, enable3D, mapStyles, toast]);

  // Créer un effet ripple au clic
  const createRippleEffect = (position: google.maps.LatLng) => {
    if (!mapInstanceRef.current) return;

    const ripple = new google.maps.Circle({
      strokeColor: 'hsl(var(--primary))',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'hsl(var(--primary))',
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      center: position,
      radius: 10
    });

    let currentRadius = 10;
    const maxRadius = 100;
    const step = 10;

    const animate = () => {
      currentRadius += step;
      if (currentRadius < maxRadius) {
        ripple.setRadius(currentRadius);
        ripple.setOptions({
          fillOpacity: 0.35 * (1 - currentRadius / maxRadius),
          strokeOpacity: 0.8 * (1 - currentRadius / maxRadius)
        });
        requestAnimationFrame(animate);
      } else {
        ripple.setMap(null);
      }
    };

    animate();
  };

  // Gestion des markers modernes
  useEffect(() => {
    if (!isMapReady || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Nettoyer les anciens markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    const createMarker = async (
      position: { lat: number; lng: number },
      title: string,
      type: 'pickup' | 'destination' | 'driver' | 'user'
    ) => {
      const markerDiv = document.createElement('div');
      markerDiv.className = 'custom-marker';
      
      const colors = {
        pickup: 'linear-gradient(145deg, hsl(var(--foreground)), hsl(var(--foreground)/0.8))',
        destination: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary)/0.8))',
        driver: 'linear-gradient(145deg, hsl(var(--secondary)), hsl(var(--secondary)/0.8))',
        user: 'linear-gradient(145deg, hsl(var(--accent)), hsl(var(--accent)/0.8))'
      };

      const icons = {
        pickup: '📍',
        destination: '🎯',
        driver: '🚗',
        user: '👤'
      };

      markerDiv.style.cssText = `
        width: 44px;
        height: 44px;
        background: ${colors[type]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: ${type === 'user' || type === 'destination' ? 'pulse-marker 2s ease-in-out infinite' : 'bounce-in 0.5s ease-out'};
      `;
      markerDiv.innerHTML = icons[type];

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current!,
        position: position,
        content: markerDiv,
        title: title
      });

      markersRef.current.push(marker);
    };

    if (userLocation) {
      createMarker(userLocation, 'Ma position', 'user');
    }

    if (pickup) {
      createMarker(pickup, 'Départ', 'pickup');
    }

    if (destination) {
      createMarker(destination, 'Destination', 'destination');
    }

    if (currentDriverLocation) {
      createMarker(currentDriverLocation, 'Chauffeur', 'driver');
    }
  }, [isMapReady, pickup, destination, userLocation, currentDriverLocation]);

  // Dessiner la route
  useEffect(() => {
    if (!isMapReady || !pickup || !destination) return;

    // Nettoyer ancienne route
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const path = [
      { lat: pickup.lat, lng: pickup.lng },
      { lat: destination.lat, lng: destination.lng }
    ];

    const polyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: 'hsl(var(--primary))',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: mapInstanceRef.current!
    });

    polylineRef.current = polyline;

    // Calculer distance et durée
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(pickup.lat, pickup.lng),
      new google.maps.LatLng(destination.lat, destination.lng)
    );

    const distanceKm = (distance / 1000).toFixed(1);
    const durationMin = Math.ceil(distance / 500); // ~30km/h moyenne

    setRouteInfo({
      distance: `${distanceKm} km`,
      duration: `${durationMin} min`,
      price: showRouteInfo ? `${Math.ceil(parseFloat(distanceKm) * 500)} CDF` : undefined
    });

    // Ajuster la vue
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(destination);
    fitBoundsAnimated(bounds, 100);
  }, [isMapReady, pickup, destination, showRouteInfo, fitBoundsAnimated]);

  // Contrôles de la carte
  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 13;
    animateCamera({ zoom: currentZoom + 1 }, 300);
  }, [animateCamera]);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 13;
    animateCamera({ zoom: currentZoom - 1 }, 300);
  }, [animateCamera]);

  const handleLocate = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        flyTo(userPos, 16);
        setIsLocating(false);
      },
      () => {
        toast({
          title: "Erreur",
          description: "Impossible d'obtenir votre position",
          variant: "destructive"
        });
        setIsLocating(false);
      }
    );
  }, [flyTo, toast]);

  const handleToggleMapType = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(newType);
    setMapType(newType);
  }, [mapType]);

  // État de chargement
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 ${className}`}>
        <p className="text-sm text-destructive">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {enableControls && isMapReady && (
        <KwendaMapControls
          onLocate={handleLocate}
          isLocating={isLocating}
        />
      )}

      {showRouteInfo && routeInfo && (
        <RouteOverlay
          distance={routeInfo.distance}
          duration={routeInfo.duration}
          price={routeInfo.price}
        />
      )}

      <style>{`
        @keyframes pulse-marker {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
          50% { transform: scale(1.1); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0) translateY(-100px); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
