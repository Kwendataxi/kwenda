import { useState, useEffect } from 'react';
import { DirectionsService, DirectionsResult } from '@/services/directionsService';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const useAnimatedRoute = (pickup: Location, destination: Location) => {
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const routeData = await DirectionsService.getDirections(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destination.lat, lng: destination.lng }
        );

        setRoute(routeData);
      } catch (err) {
        console.error('Erreur calcul de route:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setRoute(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  return {
    route,
    isLoading,
    error
  };
};
