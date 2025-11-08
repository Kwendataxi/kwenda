import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant } from '@/types/food';

type PriceRange = 'economic' | 'medium' | 'premium';

interface RestaurantFilters {
  search: string;
  cuisineTypes: string[];
  minRating: number;
  maxDeliveryTime: number;
  priceRange: PriceRange | null;
  deliveryAvailable?: boolean;
  takeawayAvailable?: boolean;
}

interface SortOption {
  field: 'rating_average' | 'average_preparation_time' | 'created_at' | 'restaurant_name';
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 15;

export const useAllRestaurants = (city: string) => {
  const [filters, setFilters] = useState<RestaurantFilters>({
    search: '',
    cuisineTypes: [],
    minRating: 0,
    maxDeliveryTime: 60,
    priceRange: null,
  });
  
  const [sort, setSort] = useState<SortOption>({ field: 'rating_average', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-restaurants', city, filters, sort, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('restaurant_profiles')
        .select('*', { count: 'exact' })
        .eq('city', city)
        .eq('is_active', true)
        .eq('verification_status', 'approved')
        .ilike('restaurant_name', filters.search ? `%${filters.search}%` : '%')
        .gte('rating_average', filters.minRating)
        .lte('average_preparation_time', filters.maxDeliveryTime)
        .order(sort.field, { ascending: sort.direction === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        restaurants: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  const updateFilters = useCallback((newFilters: Partial<RestaurantFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      cuisineTypes: [],
      minRating: 0,
      maxDeliveryTime: 60,
      priceRange: null,
    });
    setCurrentPage(1);
  }, []);

  const updateSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  }, []);

  return {
    restaurants: data?.restaurants || [],
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
