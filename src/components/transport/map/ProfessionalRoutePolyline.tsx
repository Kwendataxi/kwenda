/**
 * 🛣️ Composant de tracé de route professionnel style Yango
 * - Tracé fluide sans segments cassés
 * - Effet d'ombre pour profondeur
 * - Coloration trafic optionnelle
 * - Animation d'apparition progressive
 * - Padding dynamique adaptatif
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { professionalRouteService, ProfessionalRouteResult } from '@/services/professionalRouteService';
import { calculateDynamicPadding, MapPaddingConfig, MapPadding } from '@/utils/mapPaddingUtils';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface ProfessionalRoutePolylineProps {
  map: google.maps.Map;
  pickup: Location;
  destination: Location;
  showTraffic?: boolean;
  animate?: boolean;
  onRouteCalculated?: (result: ProfessionalRouteResult) => void;
  primaryColor?: string;
  strokeWeight?: number;
  bottomSheetHeight?: number;
  paddingConfig?: MapPaddingConfig | MapPadding;
}

// Couleurs Kwenda
const KWENDA_PRIMARY = '#1A1A1A';
const KWENDA_ACCENT = '#EF4444';

export default function ProfessionalRoutePolyline({
  map,
  pickup,
  destination,
  showTraffic = false,
  animate = true,
  onRouteCalculated,
  primaryColor = KWENDA_PRIMARY,
  strokeWeight = 6,
  bottomSheetHeight = 420,
  paddingConfig
}: ProfessionalRoutePolylineProps) {
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);
  const shadowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const trafficPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔧 FIX: Ne faire fitBounds qu'une seule fois
  const hasFittedBoundsRef = useRef(false);

  // Nettoyer toutes les polylines
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    mainPolylineRef.current?.setMap(null);
    mainPolylineRef.current = null;

    shadowPolylineRef.current?.setMap(null);
    shadowPolylineRef.current = null;

    trafficPolylinesRef.current.forEach(p => p.setMap(null));
    trafficPolylinesRef.current = [];
  }, []);

  // Animation de dessin progressive
  const animatePolyline = useCallback((
    polyline: google.maps.Polyline,
    fullPath: google.maps.LatLng[],
    duration: number = 800
  ) => {
    const startTime = performance.now();
    const totalPoints = fullPath.length;

    const animateFrame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const pointsToShow = Math.floor(eased * totalPoints);
      polyline.setPath(fullPath.slice(0, Math.max(2, pointsToShow)));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateFrame);
  }, []);

  // Calculer et afficher la route
  useEffect(() => {
    if (!map || !pickup || !destination) {
      cleanup();
      return;
    }

    const calculateAndDisplay = async () => {
      setIsLoading(true);
      
      try {
        const result = await professionalRouteService.calculateRoute(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destination.lat, lng: destination.lng },
          { showTraffic, smoothing: true }
        );

        cleanup();

        const path = result.geometrySmoothed;

        // 1. Créer l'ombre (effet de profondeur)
        shadowPolylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#000000',
          strokeOpacity: 0.15,
          strokeWeight: strokeWeight + 4,
          map,
          zIndex: 99
        });

        // 2. Créer le tracé principal
        mainPolylineRef.current = new google.maps.Polyline({
          path: animate ? [] : path,
          geodesic: true,
          strokeColor: primaryColor,
          strokeOpacity: 1,
          strokeWeight,
          map,
          zIndex: 100
        });

        // 3. Ajouter les segments de trafic si activé
        if (showTraffic && result.trafficSegments.length > 0) {
          result.trafficSegments.forEach((segment, index) => {
            const trafficLine = new google.maps.Polyline({
              path: segment.path,
              geodesic: true,
              strokeColor: segment.color,
              strokeOpacity: 0.9,
              strokeWeight: strokeWeight - 1,
              map,
              zIndex: 101 + index
            });
            trafficPolylinesRef.current.push(trafficLine);
          });
        }

        // 4. Animation d'apparition
        if (animate && mainPolylineRef.current) {
          animatePolyline(mainPolylineRef.current, path, 600);
        }

        // 5. 🔧 FIX: Ajuster les bounds UNE SEULE FOIS avec padding DYNAMIQUE
        if (!hasFittedBoundsRef.current) {
          // Calculer le padding dynamique basé sur la config ou les defaults
          const padding = paddingConfig 
            ? (typeof paddingConfig === 'object' && 'top' in paddingConfig)
              ? paddingConfig as MapPadding
              : calculateDynamicPadding(paddingConfig as MapPaddingConfig)
            : calculateDynamicPadding({ 
                bottomSheetHeight, 
                isMobile: window.innerWidth < 768 
              });
          
          map.fitBounds(result.bounds, padding);
          
          // Limiter le zoom max après fitBounds
          google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 17) {
              map.setZoom(17);
            }
          });
          
          hasFittedBoundsRef.current = true;
        }

        // Notifier le parent
        onRouteCalculated?.(result);

        console.log('✅ Route professionnelle affichée:', {
          points: path.length,
          distance: result.distanceText,
          duration: result.durationText
        });

      } catch (error) {
        console.error('❌ Erreur calcul route:', error);
        toast.error('Impossible de calculer l\'itinéraire');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(calculateAndDisplay, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [map, pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, showTraffic, animate, primaryColor, strokeWeight, cleanup, animatePolyline, onRouteCalculated]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return null;
}
