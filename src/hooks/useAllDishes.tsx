import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FoodProduct } from '@/types/food';

interface PopularDish extends FoodProduct {
  restaurant_name?: string;
  restaurant_logo_url?: string;
}

interface DishFilters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  restaurantId?: string;
  availableOnly: boolean;
}

interface SortOption {
  field: 'created_at' | 'price' | 'name';
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

export const useAllDishes = (city: string) => {
  const [filters, setFilters] = useState<DishFilters>({
    search: '',
    categories: [],
    priceRange: [0, 50000],
    availableOnly: true
  });
  
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-dishes', city, filters, sort, currentPage],
    queryFn: async () => {
      let query = supabase
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
        `, { count: 'exact' })
        .eq('restaurant_profiles.city', city)
        .eq('restaurant_profiles.is_active', true)
        .eq('restaurant_profiles.verification_status', 'approved')
        .eq('moderation_status', 'approved');

      // Filtres
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      
      if (filters.priceRange) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }
      
      if (filters.restaurantId) {
        query = query.eq('restaurant_id', filters.restaurantId);
      }
      
      if (filters.availableOnly) {
        query = query.eq('is_available', true);
      }

      // Tri
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

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

      return {
        dishes,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  const updateFilters = useCallback((newFilters: Partial<DishFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      categories: [],
      priceRange: [0, 50000],
      availableOnly: true
    });
    setCurrentPage(1);
  }, []);

  const updateSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  }, []);

  return {
    dishes: data?.dishes || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage,
    isLoading,
    error,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage,
    refetch
  };
};
