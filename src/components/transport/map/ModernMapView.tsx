import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CustomMarkers from './CustomMarkers';
import AnimatedPolyline from './AnimatedPolyline';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { throttle } from '@/utils/performanceUtils';

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
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export default function ModernMapView({
  pickup,
  destination,
  onMapClick,
  visualizationMode = 'selection',
  currentDriverLocation,
  userLocation,
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
        // ✅ Double vérification avant création
        if (!window.google?.maps?.Map) {
          console.error('❌ google.maps.Map is not available');
          return;
        }

        // ✅ S'assurer que la bibliothèque maps est chargée
        console.log('🔄 Importing Google Maps library...');
        await window.google.maps.importLibrary('maps');
        
        // ✅ Délai de sécurité pour laisser le temps au constructeur de s'initialiser
        await new Promise(resolve => setTimeout(resolve, 100));

        // ✅ Vérification finale du constructeur
        if (typeof window.google.maps.Map !== 'function') {
          console.error('❌ google.maps.Map is not a constructor');
          return;
        }

        // 📍 Centrage intelligent : pickup > userLocation > Kinshasa
        const defaultCenter = pickup 
          ? { lat: pickup.lat, lng: pickup.lng }
          : userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: -4.3217, lng: 15.3069 }; // Kinshasa en dernier recours
        
        console.log('📍 Map center:', defaultCenter, 
          pickup ? '(pickup)' : userLocation ? '(user location)' : '(Kinshasa default)');

        const map = new google.maps.Map(mapRef.current!, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          // Tilt pour effet 3D
          tilt: 45,
          heading: 0,
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
            },
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ saturation: 10 }, { lightness: 5 }]
            }
          ]
        });

        // Gestion du clic sur la carte avec effet ripple et throttling
        if (onMapClick) {
          // Throttle à 300ms pour éviter trop de clics rapides
          const throttledClick = throttle((e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              // Créer effet ripple
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
        console.log('✅ Map initialized successfully');
      } catch (err) {
        console.error('❌ Erreur initialisation carte:', err);
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick, pickup, userLocation]);

  // Créer un effet ripple au clic
  const createRippleEffect = (position: google.maps.LatLng) => {
    if (!mapInstanceRef.current) return;

    const ripple = new google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
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

  // Animations de caméra sophistiquées
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    if (pickup && destination) {
      // Animation fluide vers les bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      
      // Animation de caméra avec tilt progressif
      const animateCamera = async () => {
        // Phase 1: Zoom out avec tilt
        await animateCameraTransition({
          center: bounds.getCenter(),
          zoom: 11,
          tilt: 60,
          heading: 0
        }, 1000);

        // Phase 2: Fit bounds avec animation
        mapInstanceRef.current!.fitBounds(bounds, { 
          top: 80, 
          right: 80, 
          bottom: 80, 
          left: 80 
        });

        // Phase 3: Ajuster tilt pour vue optimale
        setTimeout(() => {
          animateCameraTransition({
            tilt: 45,
            heading: 15
          }, 800);
        }, 500);
      };

      animateCamera();
    } else if (pickup) {
      // Animation vers pickup uniquement
      animateCameraTransition({
        center: { lat: pickup.lat, lng: pickup.lng },
        zoom: 15,
        tilt: 45,
        heading: 0
      }, 1000);
    } else if (destination) {
      // Animation vers destination uniquement
      animateCameraTransition({
        center: { lat: destination.lat, lng: destination.lng },
        zoom: 15,
        tilt: 45,
        heading: 0
      }, 1000);
    }
  }, [pickup, destination, isMapReady]);

  // Fonction d'animation de caméra fluide
  const animateCameraTransition = (
    targetOptions: {
      center?: google.maps.LatLng | google.maps.LatLngLiteral;
      zoom?: number;
      tilt?: number;
      heading?: number;
    },
    duration: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!mapInstanceRef.current) {
        resolve();
        return;
      }

      const map = mapInstanceRef.current;
      const startTime = Date.now();
      const startCenter = map.getCenter();
      const startZoom = map.getZoom() || 13;
      const startTilt = map.getTilt() || 0;
      const startHeading = map.getHeading() || 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpoler les valeurs
        if (targetOptions.center && startCenter) {
          let targetLat: number;
          let targetLng: number;
          
          if (typeof targetOptions.center === 'object' && 'lat' in targetOptions.center) {
            targetLat = typeof targetOptions.center.lat === 'function' 
              ? targetOptions.center.lat() 
              : targetOptions.center.lat;
            targetLng = typeof targetOptions.center.lng === 'function'
              ? targetOptions.center.lng()
              : targetOptions.center.lng;
          } else {
            targetLat = (targetOptions.center as google.maps.LatLng).lat();
            targetLng = (targetOptions.center as google.maps.LatLng).lng();
          }
          
          const lat = startCenter.lat() + (targetLat - startCenter.lat()) * eased;
          const lng = startCenter.lng() + (targetLng - startCenter.lng()) * eased;
          map.setCenter({ lat, lng });
        }

        if (targetOptions.zoom !== undefined) {
          const zoom = startZoom + (targetOptions.zoom - startZoom) * eased;
          map.setZoom(zoom);
        }

        if (targetOptions.tilt !== undefined) {
          const tilt = startTilt + (targetOptions.tilt - startTilt) * eased;
          map.setTilt(tilt);
        }

        if (targetOptions.heading !== undefined) {
          const heading = startHeading + (targetOptions.heading - startHeading) * eased;
          map.setHeading(heading);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  };

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
      
      {/* 🙈 Phase 3: Masquer les crédits Google Maps */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Masquer les contrôles copyright Google */
        .gm-style-cc,
        .gm-style a[href^="https://maps.google.com/maps"],
        .gmnoprint,
        .gm-style-mtc,
        a[title="Report errors in the road map or imagery to Google"] {
          opacity: 0.1 !important;
          pointer-events: none !important;
        }
        
        /* Positionner discrètement en bas à droite */
        .gm-style-cc {
          bottom: 2px !important;
          right: 2px !important;
        }
      `}} />
    </div>
  );
}
