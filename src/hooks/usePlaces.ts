import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Place {
  id: string;
  name?: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: 'home' | 'work' | 'recent' | 'favorite';
  alias?: string;
  place_type?: string;
  usage_count?: number;
  createdAt: Date;
}

export const usePlaces = () => {
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
  const [homePlace, setHomePlace] = useState<Place | null>(null);
  const [workPlace, setWorkPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadPlaces = () => {
      try {
        // Récupérer les places récentes depuis localStorage
        const recentData = localStorage.getItem(`kwenda_recent_places_${user?.id || 'anonymous'}`);
        if (recentData) {
          const places = JSON.parse(recentData) as Place[];
          setRecentPlaces(places.slice(0, 5)); // Limiter à 5 places récentes
        }

        // Récupérer les places favorites depuis localStorage
        const favoriteData = localStorage.getItem(`kwenda_favorite_places_${user?.id || 'anonymous'}`);
        if (favoriteData) {
          setFavoritePlaces(JSON.parse(favoriteData));
        }

        // Récupérer les places spéciales
        const homeData = localStorage.getItem(`kwenda_home_place_${user?.id || 'anonymous'}`);
        if (homeData) {
          setHomePlace(JSON.parse(homeData));
        }

        const workData = localStorage.getItem(`kwenda_work_place_${user?.id || 'anonymous'}`);
        if (workData) {
          setWorkPlace(JSON.parse(workData));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des places:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [user]);

  const addRecentPlace = useCallback((place: Omit<Place, 'id' | 'createdAt' | 'type'>) => {
    const newPlace: Place = {
      ...place,
      id: `recent_${Date.now()}`,
      type: 'recent',
      createdAt: new Date(),
    };

    setRecentPlaces(prev => {
      // Éviter les doublons
      const filtered = prev.filter(p => p.address !== place.address);
      const updated = [newPlace, ...filtered].slice(0, 5);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(
        `kwenda_recent_places_${user?.id || 'anonymous'}`, 
        JSON.stringify(updated)
      );
      
      return updated;
    });
  }, [user]);

  const addFavoritePlace = useCallback((place: Omit<Place, 'id' | 'createdAt' | 'type'>, alias?: string) => {
    const newPlace: Place = {
      ...place,
      id: `favorite_${Date.now()}`,
      type: 'favorite',
      alias,
      createdAt: new Date(),
    };

    setFavoritePlaces(prev => {
      const updated = [...prev, newPlace];
      
      // Sauvegarder dans localStorage
      localStorage.setItem(
        `kwenda_favorite_places_${user?.id || 'anonymous'}`, 
        JSON.stringify(updated)
      );
      
      return updated;
    });
  }, [user]);

  const removeFavoritePlace = useCallback((placeId: string) => {
    setFavoritePlaces(prev => {
      const updated = prev.filter(p => p.id !== placeId);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(
        `kwenda_favorite_places_${user?.id || 'anonymous'}`, 
        JSON.stringify(updated)
      );
      
      return updated;
    });
  }, [user]);

  const clearRecentPlaces = useCallback(() => {
    setRecentPlaces([]);
    localStorage.removeItem(`kwenda_recent_places_${user?.id || 'anonymous'}`);
  }, [user]);

  const searchAndSave = useCallback(async (query: string) => {
    // Mock search functionality - replace with real implementation
    return [];
  }, []);

  const markAsUsed = useCallback((placeId: string) => {
    setRecentPlaces(prev => prev.map(place => 
      place.id === placeId 
        ? { ...place, usage_count: (place.usage_count || 0) + 1 }
        : place
    ));
  }, []);

  const addPlace = useCallback((place: Omit<Place, 'id' | 'createdAt' | 'type'>) => {
    addFavoritePlace(place);
  }, [addFavoritePlace]);

  const updatePlace = useCallback((placeId: string, updates: Partial<Place>) => {
    setFavoritePlaces(prev => prev.map(place => 
      place.id === placeId ? { ...place, ...updates } : place
    ));
  }, []);

  const deletePlace = useCallback((placeId: string) => {
    removeFavoritePlace(placeId);
  }, [removeFavoritePlace]);

  return {
    recentPlaces,
    favoritePlaces,
    homePlace,
    workPlace,
    places: [...recentPlaces, ...favoritePlaces],
    loading,
    addRecentPlace,
    addFavoritePlace,
    removeFavoritePlace,
    clearRecentPlaces,
    searchAndSave,
    markAsUsed,
    addPlace,
    updatePlace,
    deletePlace,
  };
};