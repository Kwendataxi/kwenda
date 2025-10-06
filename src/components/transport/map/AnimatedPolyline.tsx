import { useEffect, useRef, useState } from 'react';
import { useAnimatedRoute } from '@/hooks/useAnimatedRoute';
import { processBatch, performanceMonitor } from '@/utils/performanceUtils';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface AnimatedPolylineProps {
  map: google.maps.Map;
  pickup: Location;
  destination: Location;
}

export default function AnimatedPolyline({ map, pickup, destination }: AnimatedPolylineProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const distanceMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const { route, isLoading } = useAnimatedRoute(pickup, destination);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Nettoyer les markers de distance
  const clearDistanceMarkers = () => {
    distanceMarkersRef.current.forEach(marker => {
      marker.map = null;
    });
    distanceMarkersRef.current = [];
  };

  // Créer un marker de distance intermédiaire (optimisé avec lazy loading)
  const createDistanceMarker = async (position: google.maps.LatLng, distanceKm: number) => {
    const start = performance.now();
    
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
    
    const content = document.createElement('div');
    content.className = 'distance-marker';
    content.innerHTML = `
      <div class="relative animate-bounce">
        <div class="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg border-2 border-white text-xs font-bold">
          ${distanceKm.toFixed(1)} km
        </div>
        <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      map,
      position,
      content
    });

    const duration = performance.now() - start;
    performanceMonitor.record('marker_creation', duration);

    return marker;
  };

  useEffect(() => {
    if (!route || isLoading) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      clearDistanceMarkers();
      return;
    }

    const setupRoute = async () => {
      // Créer le path de la route
      const path = route.geometry.map(coord => ({ lat: coord[1], lng: coord[0] }));

      // Créer une polyligne avec gradient (simulation via multiple segments)
      const segments: google.maps.Polyline[] = [];
      const numSegments = 10;
      const segmentLength = Math.floor(path.length / numSegments);

      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentLength;
        const end = i === numSegments - 1 ? path.length : (i + 1) * segmentLength;
        const segmentPath = path.slice(start, end + 1);

        // Calculer la couleur du gradient (vert -> bleu -> rouge)
        const ratio = i / numSegments;
        let color: string;
        if (ratio < 0.5) {
          // Vert vers bleu
          const greenToBlue = ratio * 2;
          color = `rgb(${Math.floor(34 + greenToBlue * 25)}, ${Math.floor(197 - greenToBlue * 67)}, ${Math.floor(94 + greenToBlue * 150)})`;
        } else {
          // Bleu vers rouge
          const blueToRed = (ratio - 0.5) * 2;
          color = `rgb(${Math.floor(59 + blueToRed * 180)}, ${Math.floor(130 - blueToRed * 47)}, ${Math.floor(246 - blueToRed * 162)})`;
        }

        const segment = new google.maps.Polyline({
          path: segmentPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 6,
          map
        });

        segments.push(segment);
      }

      // Animation de tracé progressif
      let currentSegment = 0;
      const animateDrawing = () => {
        if (currentSegment < segments.length) {
          segments[currentSegment].setOptions({ strokeOpacity: 0.9, strokeWeight: 7 });
          currentSegment++;
          setAnimationProgress((currentSegment / segments.length) * 100);
          setTimeout(animateDrawing, 100);
        } else {
          // Animation de pulsation continue après le tracé
          animatePulsation(segments);
        }
      };

      animateDrawing();

      // Ajouter des markers de distance tous les 2km (lazy loading par batch)
      const totalDistanceKm = route.distance / 1000;
      if (totalDistanceKm > 2) {
        const interval = 2; // km
        const numMarkers = Math.floor(totalDistanceKm / interval);
        
        // Créer les markers par batch pour ne pas bloquer le thread
        const markerPositions: { position: google.maps.LatLng; distance: number }[] = [];
        
        for (let i = 1; i <= numMarkers; i++) {
          const distanceRatio = (i * interval) / totalDistanceKm;
          const pointIndex = Math.floor(distanceRatio * path.length);
          
          if (pointIndex < path.length) {
            markerPositions.push({
              position: new google.maps.LatLng(path[pointIndex].lat, path[pointIndex].lng),
              distance: i * interval
            });
          }
        }

        // Créer les markers par batch de 3
        await processBatch(
          markerPositions,
          async (item) => {
            const marker = await createDistanceMarker(item.position, item.distance);
            distanceMarkersRef.current.push(marker);
          },
          3
        );
      }

      // Sauvegarder la référence (première polyligne pour le cleanup)
      polylineRef.current = segments[0];
    };

    setupRoute();

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      clearDistanceMarkers();
    };
  }, [route, isLoading, map]);

  // Animation de pulsation continue
  const animatePulsation = (segments: google.maps.Polyline[]) => {
    let phase = 0;
    const pulsate = () => {
      phase = (phase + 0.05) % (Math.PI * 2);
      const opacity = 0.7 + Math.sin(phase) * 0.2;
      const weight = 6 + Math.sin(phase) * 1;

      segments.forEach(segment => {
        segment.setOptions({
          strokeOpacity: opacity,
          strokeWeight: weight
        });
      });

      requestAnimationFrame(pulsate);
    };
    pulsate();
  };

  return null;
}
