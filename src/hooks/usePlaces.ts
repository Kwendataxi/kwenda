import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Place {
  id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: 'home' | 'work' | 'recent' | 'favorite';
  alias?: string;
  createdAt: Date;
}

export const usePlaces = () => {
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
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
      } catch (error) {
        console.error('Erreur lors du chargement des places:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [user]);

  const addRecentPlace = (place: Omit<Place, 'id' | 'createdAt' | 'type'>) => {
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
  };

  const addFavoritePlace = (place: Omit<Place, 'id' | 'createdAt' | 'type'>, alias?: string) => {
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
  };

  const removeFavoritePlace = (placeId: string) => {
    setFavoritePlaces(prev => {
      const updated = prev.filter(p => p.id !== placeId);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(
        `kwenda_favorite_places_${user?.id || 'anonymous'}`, 
        JSON.stringify(updated)
      );
      
      return updated;
    });
  };

  const clearRecentPlaces = () => {
    setRecentPlaces([]);
    localStorage.removeItem(`kwenda_recent_places_${user?.id || 'anonymous'}`);
  };

  return {
    recentPlaces,
    favoritePlaces,
    loading,
    addRecentPlace,
    addFavoritePlace,
    removeFavoritePlace,
    clearRecentPlaces,
  };
};