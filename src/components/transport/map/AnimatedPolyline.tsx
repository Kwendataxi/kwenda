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
      <div class="relative animate-bounce-subtle">
        <!-- Badge distance Kwenda noir/rouge -->
        <div class="relative px-3 py-1.5 rounded-full text-xs font-bold font-montserrat border-2 border-white/50" 
             style="background: linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 50%, #EF4444 100%); 
                    color: white; 
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 16px rgba(239, 68, 68, 0.3);">
          📏 ${distanceKm.toFixed(1)} km
        </div>
        <!-- Pulsation subtile rouge -->
        <div class="absolute inset-0 rounded-full animate-ping opacity-30" style="background: rgba(239, 68, 68, 0.5);"></div>
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

        // Gradient Kwenda : Noir (#1A1A1A) -> Rouge (#EF4444)
        const ratio = i / numSegments;
        
        // Interpolation linéaire de noir vers rouge
        // Noir RGB: 26, 26, 26 -> Rouge RGB: 239, 68, 68
        const r = Math.floor(26 + ratio * (239 - 26));
        const g = Math.floor(26 + ratio * (68 - 26));
        const b = Math.floor(26 + ratio * (68 - 26));
        
        const color = `rgb(${r}, ${g}, ${b})`;

        const segment = new google.maps.Polyline({
          path: segmentPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 7,
          map,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 0.8,
              scale: 2,
              strokeColor: 'white',
              strokeWeight: 1
            },
            offset: '0',
            repeat: '20px'
          }]
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
