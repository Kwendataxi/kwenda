import React, { createContext, useContext, useState, useEffect } from 'react';
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
  addToFavorites: (product: any) => void;
  removeFromFavorites: (id: string) => void;
  clearFavorites: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: any) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const { toast } = useToast();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('kwenda_favorites');
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavoriteItems(parsedFavorites);
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
        localStorage.removeItem('kwenda_favorites');
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kwenda_favorites', JSON.stringify(favoriteItems));
  }, [favoriteItems]);

  const addToFavorites = (product: any) => {
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
    
    setFavoriteItems(prev => [...prev, favoriteItem]);
    toast({
      title: "Ajouté aux favoris",
      description: `${product.name} a été ajouté à vos favoris`,
    });
  };

  const removeFromFavorites = (id: string) => {
    const item = favoriteItems.find(item => item.id === id);
    setFavoriteItems(prev => prev.filter(item => item.id !== id));
    
    if (item) {
      toast({
        title: "Retiré des favoris",
        description: `${item.name} a été retiré de vos favoris`,
      });
    }
  };

  const clearFavorites = () => {
    setFavoriteItems([]);
    toast({
      title: "Favoris vidés",
      description: "Tous les favoris ont été supprimés",
    });
  };

  const isFavorite = (id: string) => {
    return favoriteItems.some(item => item.id === id);
  };

  const toggleFavorite = (product: any) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };

  const favoriteCount = favoriteItems.length;

  const value: FavoritesContextType = {
    favoriteItems,
    favoriteCount,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};