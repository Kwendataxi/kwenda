/**
 * Hook React pour utiliser le MasterLocationService
 * Remplace useUnifiedLocation et useGeolocation
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { masterLocationService, type LocationData, type LocationSearchResult } from '@/services/MasterLocationService';

interface UseMasterLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
  autoDetectLocation?: boolean;
}

interface UseMasterLocationReturn {
  // État de localisation
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  
  // Fonctions principales
  getCurrentPosition: (options?: UseMasterLocationOptions) => Promise<LocationData>;
  searchLocation: (query: string) => Promise<LocationSearchResult[]>;
  getNearbyPlaces: (radiusKm?: number) => Promise<LocationSearchResult[]>;
  
  // Utilitaires
  calculateDistance: (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => number;
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
  clearCache: () => void;
  
  // État dérivé
  hasLocation: boolean;
  isHighAccuracy: boolean;
}

export const useMasterLocation = (defaultOptions: UseMasterLocationOptions = {}): UseMasterLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const { toast } = useToast();

  // ============ GÉOLOCALISATION PRINCIPALE ============

  const getCurrentPosition = useCallback(async (options?: UseMasterLocationOptions): Promise<LocationData> => {
    setLoading(true);
    setError(null);
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const position = await masterLocationService.getCurrentPosition(finalOptions);
      
      setLocation(position);
      setAccuracy(position.accuracy || null);
      
      // Feedback utilisateur intelligent selon le type de position
      switch (position.type) {
        case 'current':
          if (position.accuracy && position.accuracy < 50) {
            toast({
              title: "Position GPS précise",
              description: `Précision: ${Math.round(position.accuracy)}m`,
              variant: "default"
            });
          } else {
            toast({
              title: "Position GPS obtenue",
              description: "Localisation réussie",
              variant: "default"
            });
          }
          break;
          
        case 'ip':
          toast({
            title: "Position approximative",
            description: "Position estimée via votre connexion internet",
            variant: "default"
          });
          break;
          
        case 'database':
          toast({
            title: "Position locale",
            description: "Position basée sur votre région",
            variant: "default"
          });
          break;
          
        case 'fallback':
          toast({
            title: "Position par défaut",
            description: "Centre-ville utilisé par défaut",
            variant: "default"
          });
          break;
      }
      
      return position;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de géolocalisation';
      setError(errorMessage);
      
      // Messages d'erreur contextuels
      const errorMessages: { [key: string]: { title: string; description: string } } = {
        'PERMISSION_DENIED': {
          title: "Permission refusée",
          description: "Veuillez autoriser la géolocalisation dans les paramètres"
        },
        'POSITION_UNAVAILABLE': {
          title: "Position indisponible",
          description: "Vérifiez votre connexion GPS et réseau"
        },
        'TIMEOUT': {
          title: "Délai dépassé",
          description: "La localisation prend trop de temps, mode manuel disponible"
        },
        'HTTPS_REQUIRED': {
          title: "Connexion sécurisée requise",
          description: "La géolocalisation nécessite HTTPS"
        }
      };
      
      const errorInfo = errorMessages[errorMessage] || {
        title: "Erreur de localisation",
        description: "Impossible d'obtenir votre position, sélection manuelle disponible"
      };
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [defaultOptions, toast]);

  // ============ RECHERCHE DE LIEUX ============

  const searchLocation = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query.trim()) return [];
    
    try {
      const results = await masterLocationService.searchLocation(query, location || undefined);
      return results;
    } catch (error) {
      console.error('Search location error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher cette adresse",
        variant: "destructive"
      });
      return [];
    }
  }, [location, toast]);

  // ============ LIEUX À PROXIMITÉ ============

  const getNearbyPlaces = useCallback(async (radiusKm: number = 5): Promise<LocationSearchResult[]> => {
    if (!location) {
      toast({
        title: "Position requise",
        description: "Localisez-vous d'abord pour voir les lieux à proximité",
        variant: "default"
      });
      return [];
    }
    
    try {
      const places = await masterLocationService.getNearbyPlaces(location.lat, location.lng, radiusKm);
      return places;
    } catch (error) {
      console.error('Get nearby places error:', error);
      toast({
        title: "Erreur lieux à proximité",
        description: "Impossible de charger les lieux à proximité",
        variant: "destructive"
      });
      return [];
    }
  }, [location, toast]);

  // ============ UTILITAIRES ============

  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return masterLocationService.calculateDistance(point1, point2);
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    return masterLocationService.formatDistance(meters);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    return masterLocationService.formatDuration(seconds);
  }, []);

  const clearCache = useCallback(() => {
    masterLocationService.clearCache();
    setLocation(null);
    setError(null);
    setAccuracy(null);
    
    toast({
      title: "Cache effacé",
      description: "Les données de localisation ont été supprimées",
      variant: "default"
    });
  }, [toast]);

  // ============ DÉTECTION AUTOMATIQUE NON-BLOQUANTE ============

  useEffect(() => {
    if (defaultOptions.autoDetectLocation && !location && !loading) {
      // Géolocalisation silencieuse et non-bloquante
      getCurrentPosition().catch(() => {
        // Échec silencieux - ne pas bloquer l'interface
        console.log('Auto-detection failed, continuing without location');
      });
    }
  }, [defaultOptions.autoDetectLocation, location, loading, getCurrentPosition]);

  // ============ ÉTAT DÉRIVÉ ============

  const hasLocation = Boolean(location);
  const isHighAccuracy = Boolean(accuracy && accuracy < 100);

  return {
    // État
    location,
    loading,
    error,
    accuracy,
    
    // Fonctions
    getCurrentPosition,
    searchLocation,
    getNearbyPlaces,
    
    // Utilitaires
    calculateDistance,
    formatDistance,
    formatDuration,
    clearCache,
    
    // État dérivé
    hasLocation,
    isHighAccuracy,
  };
};

export default useMasterLocation;