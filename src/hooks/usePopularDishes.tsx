import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FoodProduct } from '@/types/food';

interface PopularDish extends FoodProduct {
  restaurant_name?: string;
  restaurant_logo_url?: string;
}

export const usePopularDishes = (city: string) => {
  return useQuery({
    queryKey: ['popular-dishes', city],
    queryFn: async () => {
      // Récupérer les plats les plus populaires avec info restaurant
      const { data, error } = await supabase
        .from('food_products')
        .select(`
          *,
          restaurant_profiles!inner (
            restaurant_name,
            logo_url,
            city,
            is_active,
            verification_status
          )
        `)
        .eq('restaurant_profiles.city', city)
        .eq('restaurant_profiles.is_active', true)
        .eq('restaurant_profiles.verification_status', 'verified')
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching popular dishes:', error);
        throw error;
      }

      // Transformer les données pour avoir un format plat
      const dishes: PopularDish[] = (data || []).map((item: any) => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        name: item.name,
        description: item.description,
        price: item.price,
        main_image_url: item.main_image_url,
        category: item.category,
        is_available: item.is_available,
        moderation_status: item.moderation_status,
        restaurant_name: item.restaurant_profiles?.restaurant_name,
        restaurant_logo_url: item.restaurant_profiles?.logo_url
      }));

      return dishes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
