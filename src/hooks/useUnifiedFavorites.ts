import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  seller: string;
  sellerId: string;
  category: string;
  rating: number;
  addedAt: string;
}

interface FavoritesContextType {
  favoriteItems: FavoriteItem[];
  favoriteCount: number;
  favorites: string[];
  addToFavorites: (product: any) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: any) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();
  const { toast } = useToast();

  // Surveiller l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les favoris depuis localStorage comme fallback
  const loadLocalFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('kwenda_favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavoriteItems(parsedFavorites);
        setFavorites(parsedFavorites.map((item: FavoriteItem) => item.id));
      }
    } catch (error) {
      console.error('Error loading local favorites:', error);
    }
  };

  // Sauvegarder vers localStorage comme backup
  const saveLocalFavorites = (items: FavoriteItem[]) => {
    try {
      localStorage.setItem('kwenda_favorites', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving local favorites:', error);
    }
  };

  // Charger les favoris depuis Supabase avec retry
  const loadSupabaseFavorites = async (retryCount = 0) => {
    if (!user || !isOnline) {
      loadLocalFavorites();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = data?.map(fav => fav.product_id) || [];
      setFavorites(favoriteIds);

      // Convertir en format compatible avec l'ancien système
      const savedItems = localStorage.getItem('kwenda_favorites');
      if (savedItems) {
        const localItems = JSON.parse(savedItems);
        const syncedItems = localItems.filter((item: FavoriteItem) => 
          favoriteIds.includes(item.id)
        );
        setFavoriteItems(syncedItems);
        saveLocalFavorites(syncedItems);
      }
    } catch (error) {
      console.error('Error loading Supabase favorites:', error);
      
      // Retry logic avec backoff exponentiel
      if (retryCount < 3) {
        setTimeout(() => {
          loadSupabaseFavorites(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        // Fallback vers localStorage
        loadLocalFavorites();
        if (isOnline) {
          toast({
            title: "Mode hors ligne",
            description: "Utilisation des favoris sauvegardés localement",
            variant: "default",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les favoris au changement d'utilisateur ou de connexion
  useEffect(() => {
    if (user && isOnline) {
      loadSupabaseFavorites();
    } else {
      loadLocalFavorites();
      setFavorites([]);
    }
  }, [user, isOnline]);

  const addToFavorites = async (product: any) => {
    const favoriteItem: FavoriteItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      seller: product.seller,
      sellerId: product.sellerId,
      category: product.category,
      rating: product.rating,
      addedAt: new Date().toISOString(),
    };

    // Mise à jour immédiate de l'UI
    const newFavoriteItems = [...favoriteItems, favoriteItem];
    const newFavorites = [...favorites, product.id];
    
    setFavoriteItems(newFavoriteItems);
    setFavorites(newFavorites);
    saveLocalFavorites(newFavoriteItems);

    // Synchronisation avec Supabase si connecté
    if (user && isOnline) {
      try {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) throw error;

        toast({
          title: "Ajouté aux favoris",
          description: `${product.name} a été ajouté à vos favoris`,
        });
      } catch (error) {
        console.error('Error adding to Supabase favorites:', error);
        toast({
          title: "Ajouté localement",
          description: "Sera synchronisé quand la connexion sera rétablie",
        });
      }
    } else {
      toast({
        title: "Ajouté aux favoris",
        description: user ? "Sera synchronisé quand la connexion sera rétablie" : `${product.name} sauvegardé localement`,
      });
    }
  };

  const removeFromFavorites = async (id: string) => {
    const item = favoriteItems.find(item => item.id === id);
    
    // Mise à jour immédiate de l'UI
    const newFavoriteItems = favoriteItems.filter(item => item.id !== id);
    const newFavorites = favorites.filter(favId => favId !== id);
    
    setFavoriteItems(newFavoriteItems);
    setFavorites(newFavorites);
    saveLocalFavorites(newFavoriteItems);

    // Synchronisation avec Supabase si connecté
    if (user && isOnline) {
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;

        if (item) {
          toast({
            title: "Retiré des favoris",
            description: `${item.name} a été retiré de vos favoris`,
          });
        }
      } catch (error) {
        console.error('Error removing from Supabase favorites:', error);
        toast({
          title: "Retiré localement",
          description: "Sera synchronisé quand la connexion sera rétablie",
        });
      }
    } else if (item) {
      toast({
        title: "Retiré des favoris",
        description: user ? "Sera synchronisé quand la connexion sera rétablie" : `${item.name} retiré localement`,
      });
    }
  };

  const clearFavorites = async () => {
    setFavoriteItems([]);
    setFavorites([]);
    saveLocalFavorites([]);

    if (user && isOnline) {
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error clearing Supabase favorites:', error);
      }
    }

    toast({
      title: "Favoris vidés",
      description: "Tous les favoris ont été supprimés",
    });
  };

  const isFavorite = (id: string) => {
    return favorites.includes(id);
  };

  const toggleFavorite = async (product: any) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  const favoriteCount = favoriteItems.length;

  const value: FavoritesContextType = {
    favoriteItems,
    favoriteCount,
    favorites,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isFavorite,
    toggleFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};