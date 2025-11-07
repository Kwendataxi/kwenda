import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Restaurant, FoodProduct } from '@/types/food';

export const useRestaurantsQuery = (city: string) => {
  const queryClient = useQueryClient();
  
  const { data: restaurants = [], isLoading, error, refetch } = useQuery({
    queryKey: ['restaurants', city],
    queryFn: async () => {
      const timestamp = Date.now();
      console.log(`[${timestamp}] 🔍 Fetching restaurants for:`, city.trim());
      
      const { data, error } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .ilike('city', city.trim())
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching restaurants:', error);
        toast.error('Erreur de chargement des restaurants');
        throw error;
      }
      
      console.log(`[${timestamp}] ✅ Fetched restaurants:`, {
        city: city.trim(),
        count: data?.length,
        restaurants: data?.map(r => ({
          id: r.id,
          name: r.restaurant_name,
          city: r.city,
          is_active: r.is_active
        }))
      });
      
      if (data.length === 0) {
        toast.info(`Aucun restaurant à ${city} pour le moment`);
      } else {
        toast.success(`${data.length} restaurant(s) trouvé(s) à ${city}`);
      }
      
      return (data || []) as Restaurant[];
    },
    staleTime: 0, // Force refresh - no cache
    gcTime: 0, // No cache time (replaces cacheTime in v5)
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  
  const forceRefresh = () => {
    console.log('🔄 Force refreshing restaurants...');
    queryClient.invalidateQueries({ queryKey: ['restaurants', city] });
    refetch();
  };
  
  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('restaurant-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurant_profiles',
        filter: `city=eq.${city.trim()}`,
      }, (payload) => {
        console.log('🔄 Restaurant data changed:', payload);
        
        // Force image cache bust on image updates
        if (payload.new) {
          const newData = payload.new as any;
          if (newData.logo_url || newData.banner_url) {
            console.log('📸 Image updated, forcing cache invalidation');
            // Clear any cached images
            if (newData.logo_url) {
              const img = new Image();
              img.src = `${newData.logo_url}?t=${Date.now()}`;
            }
            if (newData.banner_url) {
              const img = new Image();
              img.src = `${newData.banner_url}?t=${Date.now()}`;
            }
          }
        }
        
        forceRefresh();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [city]);
  
  // Function to fetch menu for a specific restaurant
  const fetchRestaurantMenu = async (restaurantId: string): Promise<FoodProduct[]> => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] 🍽️ Fetching menu for restaurant:`, restaurantId);
    
    const { data, error } = await supabase
      .from('food_products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .eq('moderation_status', 'approved')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching menu:', error);
      toast.error('Erreur de chargement du menu');
      throw error;
    }
    
    console.log(`[${timestamp}] ✅ Fetched menu:`, {
      restaurantId,
      count: data?.length,
      products: data?.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        moderation_status: p.moderation_status,
        is_available: p.is_available
      }))
    });
    
    if (data && data.length === 0) {
      toast.info('Aucun plat disponible pour le moment');
    } else if (data) {
      toast.success(`${data.length} plat(s) disponible(s)`);
    }
    
    return (data || []) as FoodProduct[];
  };
  
  return {
    restaurants,
    loading: isLoading,
    error,
    refetch: forceRefresh,
    fetchRestaurantMenu,
  };
};
