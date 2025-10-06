import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import CustomMarkers from './CustomMarkers';
import AnimatedPolyline from './AnimatedPolyline';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { throttle } from '@/utils/performanceUtils';
import { useToast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapboxMapRef = useRef<mapboxgl.Map | null>(null);
  const { isLoaded, error, isLoading, retryCount, loadingProgress } = useGoogleMaps();
  const [isMapReady, setIsMapReady] = useState(false);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  const { toast } = useToast();

  // 🔍 Phase 5: Logs détaillés
  useEffect(() => {
    console.log('📊 [ModernMapView] État actuel:', {
      isLoaded,
      error,
      isLoading,
      retryCount,
      loadingProgress,
      isMapReady,
      useMapboxFallback,
      hasPickup: !!pickup,
      hasDestination: !!destination,
      hasUserLocation: !!userLocation
    });
  }, [isLoaded, error, isLoading, retryCount, loadingProgress, isMapReady, useMapboxFallback, pickup, destination, userLocation]);

  // 🎯 Phase 2: Fallback Mapbox si Google Maps échoue
  useEffect(() => {
    if (error && !useMapboxFallback) {
      console.log('⚠️ Google Maps failed, switching to Mapbox fallback');
      setUseMapboxFallback(true);
      toast({
        title: "⚠️ Carte alternative chargée",
        description: "Utilisation de Mapbox en raison d'un problème avec Google Maps"
      });
    }
  }, [error, useMapboxFallback, toast]);

  // 🗺️ Initialisation Mapbox Fallback
  useEffect(() => {
    if (!useMapboxFallback || !mapRef.current || mapboxMapRef.current) return;

    const initMapbox = () => {
      try {
        mapboxgl.accessToken = 'pk.eyJ1Ijoia3dlbmRhIiwiYSI6ImNtMWZoZXhtbzA0cWQya3M4Z2o1MjJ4eGwifQ.demo-token';
        
        const center = userLocation 
          ? [userLocation.lng, userLocation.lat]
          : pickup 
          ? [pickup.lng, pickup.lat]
          : [15.3069, -4.3217]; // Kinshasa

        const map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center as [number, number],
          zoom: 13,
          pitch: 45
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Ajouter marker position utilisateur
        if (userLocation) {
          new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([userLocation.lng, userLocation.lat])
            .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 Ma position</strong>'))
            .addTo(map);
        }

        // Ajouter markers pickup/destination
        if (pickup) {
          new mapboxgl.Marker({ color: '#1A1A1A' })
            .setLngLat([pickup.lng, pickup.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>📍 Départ</strong><br/>${pickup.address}`))
            .addTo(map);
        }

        if (destination) {
          new mapboxgl.Marker({ color: '#EF4444' })
            .setLngLat([destination.lng, destination.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>🎯 Destination</strong><br/>${destination.address}`))
            .addTo(map);
        }

        mapboxMapRef.current = map;
        setIsMapReady(true);

        return () => {
          map.remove();
        };
      } catch (err) {
        console.error('❌ Erreur Mapbox:', err);
      }
    };

    initMapbox();
  }, [useMapboxFallback, pickup, destination, userLocation]);

  // Initialisation de la carte Google Maps
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current || useMapboxFallback) return;

    const initializeMap = async () => {
      try {
        // ✅ Double vérification avant création
        if (!window.google?.maps?.Map) {
          console.error('❌ google.maps.Map is not available');
          setUseMapboxFallback(true);
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

        console.log('✅ [ModernMapView] Carte Google Maps créée avec succès');

        // Gestion du clic sur la carte avec effet ripple et throttling
        if (onMapClick) {
          console.log('🖱️ [ModernMapView] Gestionnaire de clic activé');
          // Throttle à 300ms pour éviter trop de clics rapides
          const throttledClick = throttle((e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              console.log('📍 [ModernMapView] Clic carte:', e.latLng.lat(), e.latLng.lng());
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
        console.log('✅ [ModernMapView] Carte prête et référence stockée');
      } catch (err) {
        console.error('❌ [ModernMapView] Erreur initialisation carte:', err);
      }
    };

    initializeMap();
  }, [isLoaded, onMapClick, pickup, userLocation, useMapboxFallback]);

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

    console.log('📹 [ModernMapView] Animation caméra:', { 
      hasPickup: !!pickup, 
      hasDestination: !!destination 
    });

    if (pickup && destination) {
      console.log('🗺️ [ModernMapView] Ajustement bounds pour pickup + destination');
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

  // 🎨 Phase 5: Indicateur de chargement amélioré
  if (!isLoaded && isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="relative mb-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <MapPin className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/60 animate-pulse" />
          </div>
          
          <p className="text-lg font-medium mb-2">🗺️ Chargement de la carte...</p>
          
          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-2 mb-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {retryCount > 0 
              ? `Nouvelle tentative (${retryCount}/5)... Veuillez patienter.`
              : 'Connexion au service de cartographie...'
            }
          </p>
        </div>
      </div>
    );
  }

  // 🚨 Phase 5: Mode hors-ligne si échec complet
  if (error && !useMapboxFallback) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-lg border-2 border-destructive/20 ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 p-4 rounded-full bg-destructive/10 w-fit mx-auto">
            <MapPin className="h-10 w-10 text-destructive" />
          </div>
          
          <p className="text-lg font-semibold text-destructive mb-2">📵 Mode hors-ligne</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <p className="text-xs font-medium">💡 Vérifiez :</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Votre connexion internet</li>
              <li>• La clé API Google Maps</li>
              <li>• Les restrictions de domaine</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`relative ${className}`}>
      {/* Carte Google Maps */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Markers personnalisés */}
      {isMapReady && mapInstanceRef.current && !useMapboxFallback && (
        <>
          <CustomMarkers
            map={mapInstanceRef.current}
            pickup={pickup}
            destination={destination}
            currentDriverLocation={currentDriverLocation}
            userLocation={userLocation}
          />

          {/* Route animée */}
          {pickup && destination && visualizationMode === 'route' && (
            <>
              {console.log('🛣️ [ModernMapView] Affichage route animée')}
              <AnimatedPolyline
                map={mapInstanceRef.current}
                pickup={pickup}
                destination={destination}
              />
            </>
          )}
        </>
      )}

      {/* Badge Mapbox si fallback actif */}
      {useMapboxFallback && (
        <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
          <span className="text-xs font-medium text-white">🗺️ Mapbox</span>
        </div>
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
