import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { unifiedLocationService } from '@/services/unifiedLocationService';

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
  const [homePlace, setHomePlaceState] = useState<Place | null>(null);
  const [workPlace, setWorkPlaceState] = useState<Place | null>(null);
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
          setHomePlaceState(JSON.parse(homeData));
        }

        const workData = localStorage.getItem(`kwenda_work_place_${user?.id || 'anonymous'}`);
        if (workData) {
          setWorkPlaceState(JSON.parse(workData));
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

  const addLocationFromSearch = useCallback((address: string, coordinates?: { lat: number; lng: number }, name?: string) => {
    if (!address.trim()) return;
    
    const newPlace = {
      name: name || address,
      address,
      coordinates: coordinates || { lat: -4.4419, lng: 15.2663 }, // Kinshasa par défaut
    };
    
    addRecentPlace(newPlace);
  }, [addRecentPlace]);

  const addCurrentLocation = useCallback(async () => {
    try {
      const location = await unifiedLocationService.getCurrentPosition();
      const newPlace = {
        name: 'Ma position actuelle',
        address: location.address,
        coordinates: { lat: location.lat, lng: location.lng },
      };
      addRecentPlace(newPlace);
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
    }
  }, [addRecentPlace]);

  const setHomePlace = useCallback((place: Omit<Place, 'id' | 'createdAt' | 'type'>) => {
    const homePlace: Place = {
      ...place,
      id: 'home_place',
      type: 'home',
      createdAt: new Date(),
    };
    
    localStorage.setItem(
      `kwenda_home_place_${user?.id || 'anonymous'}`, 
      JSON.stringify(homePlace)
    );
    
    setHomePlaceState(homePlace);
  }, [user]);

  const setWorkPlace = useCallback((place: Omit<Place, 'id' | 'createdAt' | 'type'>) => {
    const workPlace: Place = {
      ...place,
      id: 'work_place',
      type: 'work',
      createdAt: new Date(),
    };
    
    localStorage.setItem(
      `kwenda_work_place_${user?.id || 'anonymous'}`, 
      JSON.stringify(workPlace)
    );
    
    setWorkPlaceState(workPlace);
  }, [user]);

  const removeRecentPlace = useCallback((placeId: string) => {
    setRecentPlaces(prev => {
      const updated = prev.filter(p => p.id !== placeId);
      localStorage.setItem(
        `kwenda_recent_places_${user?.id || 'anonymous'}`, 
        JSON.stringify(updated)
      );
      return updated;
    });
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
    removeRecentPlace,
    clearRecentPlaces,
    addLocationFromSearch,
    addCurrentLocation,
    setHomePlace,
    setWorkPlace,
    searchAndSave,
    markAsUsed,
    addPlace,
    updatePlace,
    deletePlace,
  };
};