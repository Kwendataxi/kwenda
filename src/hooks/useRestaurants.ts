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
      let query = supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      if (filters?.minRating) {
        query = query.gte('rating_average', filters.minRating);
      }

      const { data, error } = await query.order('rating_average', { ascending: false });
      
      if (error) throw error;

      setRestaurants((data || []) as Restaurant[]);
      return (data || []) as Restaurant[];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
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
