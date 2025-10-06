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

    // Créer la polyligne avec gradient et animation
    const polyline = new google.maps.Polyline({
      path: route.geometry.map(coord => ({ lat: coord[1], lng: coord[0] })),
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map
    });

    polylineRef.current = polyline;

    // Animation du tracé (dash array)
    let offset = 0;
    const animatePolyline = () => {
      offset = (offset + 2) % 20;
      if (polylineRef.current) {
        polylineRef.current.setOptions({
          strokeOpacity: 0.8,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 3
            },
            offset: `${offset}px`,
            repeat: '20px'
          }]
        });
      }
      requestAnimationFrame(animatePolyline);
    };

    const animationId = requestAnimationFrame(animatePolyline);

    return () => {
      cancelAnimationFrame(animationId);
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [route, isLoading, map]);

  return null;
}
