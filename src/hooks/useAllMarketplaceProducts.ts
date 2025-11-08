import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarketplaceProduct } from '@/types/marketplace';

interface Filters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  conditions: string[];
  minRating: number;
  maxDistance: number;
  availableOnly: boolean;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: Filters = {
  search: '',
  categories: [],
  priceRange: [0, 2000000],
  conditions: [],
  minRating: 0,
  maxDistance: 50,
  availableOnly: false
};

const ITEMS_PER_PAGE = 20;

export const useAllMarketplaceProducts = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>({ field: 'popularity_score', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-marketplace-products', filters, sort, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating,
            total_sales
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .eq('moderation_status', 'approved');

      // Appliquer filtres
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      if (filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }
      if (filters.minRating > 0) {
        query = query.gte('rating_average', filters.minRating);
      }
      if (filters.availableOnly) {
        query = query.gt('stock_count', 0);
      }

      // Tri
      const isAscending = sort.direction === 'asc';
      query = query.order(sort.field, { ascending: isAscending });
      
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      // Normaliser images
      const normalizeImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) return images.filter(Boolean);
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      const products: MarketplaceProduct[] = (data || []).map(product => {
        const normalizedImages = normalizeImages(product.images);
        return {
          id: product.id,
          title: product.title,
          description: product.description || '',
          price: product.price,
          images: normalizedImages,
          image: normalizedImages[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300',
          category: product.category,
          condition: product.condition || 'new',
          seller_id: product.seller_id,
          seller: { 
            display_name: (product.vendor_profiles as any)?.shop_name || 'Vendeur'
          },
          location: product.location || 'Kinshasa',
          coordinates: product.coordinates as any,
          inStock: (product.stock_count || 0) > 0,
          stockCount: product.stock_count || 0,
          rating: product.rating_average || 0,
          reviews: product.rating_count || 0,
          brand: product.brand,
          specifications: product.specifications as any,
          viewCount: product.view_count || 0,
          salesCount: product.sales_count || 0,
          popularityScore: product.popularity_score || 0,
          moderation_status: product.moderation_status || 'pending',
          created_at: product.created_at
        };
      });

      return {
        products,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    staleTime: 30000,
    gcTime: 60000
  });

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const updateSort = (newSort: Sort) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage,
    isLoading,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  };
};
