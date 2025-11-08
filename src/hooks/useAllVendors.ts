import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Filters {
  search: string;
  minRating: number;
  minSales: number;
  verifiedOnly: boolean;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: Filters = {
  search: '',
  minRating: 0,
  minSales: 0,
  verifiedOnly: false
};

const ITEMS_PER_PAGE = 15;

export const useAllVendors = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<Sort>({ field: 'average_rating', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-vendors', filters, sort, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Construction conditionnelle avec typage any pour éviter l'inférence TypeScript profonde
      let query: any = supabase.from('vendor_profiles').select('*', { count: 'exact' });
      
      query = query.eq('status', 'active');
      
      if (filters.search) {
        query = query.ilike('shop_name', `%${filters.search}%`);
      }
      if (filters.minRating > 0) {
        query = query.gte('average_rating', filters.minRating);
      }
      if (filters.minSales > 0) {
        query = query.gte('total_sales', filters.minSales);
      }
      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true);
      }
      
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      query = query.range(from, to);

      const { data: vendors, error, count } = await query;
      if (error) throw error;

      const vendorIds = (vendors || []).map(v => v.user_id);
      const productsCount: Record<string, number> = {};
      
      if (vendorIds.length > 0) {
        const { data: productsData } = await supabase
          .from('marketplace_products')
          .select('seller_id')
          .in('seller_id', vendorIds);
        
        productsData?.forEach(p => {
          productsCount[p.seller_id] = (productsCount[p.seller_id] || 0) + 1;
        });
      }

      const vendorsWithCount = (vendors || []).map(vendor => ({
        ...vendor,
        product_count: productsCount[vendor.user_id] || 0
      }));

      return {
        vendors: vendorsWithCount,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    }
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
    vendors: data?.vendors || [],
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
