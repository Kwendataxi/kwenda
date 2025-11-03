import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant, FoodProduct } from '@/types/food';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async (city: string, filters?: {
    cuisine?: string;
    minRating?: number;
    maxDeliveryTime?: number;
  }) => {
    setLoading(true);
    try {
      console.log('🍽️ Fetching restaurants for city:', city);
      
      let query = supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .in('verification_status', ['approved', 'pending']);

      if (filters?.minRating) {
        query = query.gte('rating_average', filters.minRating);
      }

      const { data, error } = await query.order('rating_average', { ascending: false });
      
      console.log('🍽️ Restaurants data:', { data, error, count: data?.length });
      
      if (error) throw error;

      setRestaurants((data || []) as Restaurant[]);
      return (data || []) as Restaurant[];
    } catch (error) {
      console.error('❌ Error fetching restaurants:', error);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantMenu = async (restaurantId: string): Promise<FoodProduct[]> => {
    try {
      const { data, error } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('category', { ascending: true });

      if (error) throw error;
      return (data || []) as FoodProduct[];
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  };

  return {
    restaurants,
    loading,
    fetchRestaurants,
    fetchRestaurantMenu,
  };
};
