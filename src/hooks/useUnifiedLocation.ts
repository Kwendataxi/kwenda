import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedLocationService, type LocationData } from '@/services/unifiedLocationService';

interface UseUnifiedLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDefault?: boolean;
}

interface UseUnifiedLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  getCurrentPosition: (options?: UseUnifiedLocationOptions) => Promise<LocationData>;
  searchLocation: (query: string) => Promise<LocationData[]>;
  calculateDistance: (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => number;
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
}

export const useUnifiedLocation = (defaultOptions: UseUnifiedLocationOptions = {}): UseUnifiedLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const { toast } = useToast();

  const getCurrentPosition = useCallback(async (options?: UseUnifiedLocationOptions): Promise<LocationData> => {
    setLoading(true);
    setError(null);
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const position = await unifiedLocationService.getCurrentPosition(finalOptions);
      
      setLocation(position);
      setAccuracy(position.accuracy || null);
      
      // Show appropriate feedback
      if (position.type === 'ip') {
        toast({
          title: "Position approximative",
          description: "Position estimée via votre connexion internet",
          variant: "default"
        });
      } else if (position.type === 'fallback') {
        toast({
          title: "Position par défaut",
          description: "Centre-ville utilisé par défaut",
          variant: "default"
        });
      }
      
      return position;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de géolocalisation';
      setError(errorMessage);
      
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [defaultOptions, toast]);

  const searchLocation = useCallback(async (query: string): Promise<LocationData[]> => {
    try {
      const results = await unifiedLocationService.searchLocation(query, location || undefined);
      return results;
    } catch (error) {
      console.error('Search location error:', error);
      return [];
    }
  }, [location]);

  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return unifiedLocationService.calculateDistance(point1, point2);
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    return unifiedLocationService.formatDistance(meters);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    return unifiedLocationService.formatDuration(seconds);
  }, []);

  return {
    location,
    loading,
    error,
    accuracy,
    getCurrentPosition,
    searchLocation,
    calculateDistance,
    formatDistance,
    formatDuration
  };
};