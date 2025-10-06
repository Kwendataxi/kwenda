import { useEffect, useRef } from 'react';
import { useAnimatedRoute } from '@/hooks/useAnimatedRoute';

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
  const { route, isLoading } = useAnimatedRoute(pickup, destination);

  useEffect(() => {
    if (!route || isLoading) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const setupRoute = async () => {
      // Créer le path de la route
      const path = route.geometry.map(coord => ({ lat: coord[1], lng: coord[0] }));

      // Créer une polyligne épurée avec gradient noir → rouge
      const numSegments = 15;
      const segmentLength = Math.floor(path.length / numSegments);

      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentLength;
        const end = i === numSegments - 1 ? path.length : (i + 1) * segmentLength;
        const segmentPath = path.slice(start, end + 1);

        // Gradient Kwenda : Noir (#1A1A1A) → Rouge (#EF4444)
        const ratio = i / numSegments;
        const r = Math.floor(26 + ratio * (239 - 26));
        const g = Math.floor(26 + ratio * (68 - 26));
        const b = Math.floor(26 + ratio * (68 - 26));
        const color = `rgb(${r}, ${g}, ${b})`;

        const segment = new google.maps.Polyline({
          path: segmentPath,
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 1,
          strokeWeight: 5,
          map,
        });

        // Animation d'apparition progressive
        segment.setOptions({ strokeOpacity: 0 });
        setTimeout(() => {
          let opacity = 0;
          const fadeIn = setInterval(() => {
            opacity += 0.1;
            if (opacity >= 1) {
              clearInterval(fadeIn);
              segment.setOptions({ strokeOpacity: 1 });
            } else {
              segment.setOptions({ strokeOpacity: opacity });
            }
          }, 30);
        }, i * 50);
      }
    };

    setupRoute();

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [route, isLoading, map]);

  return null;
}
