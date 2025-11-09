import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      
      // ✅ Filtre 'status' retiré - colonne n'existe pas encore dans vendor_profiles
      // TODO: Ajouter après migration DB: query = query.eq('status', 'active');
      
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
        // ✅ Filtre 'is_verified' temporairement désactivé - colonne n'existe pas encore
        // TODO: Ajouter après migration DB: query = query.eq('is_verified', true);
        console.warn('[useAllVendors] is_verified filter skipped - column does not exist yet');
      }
      
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      query = query.range(from, to);

      const { data: vendors, error, count } = await query;
      
      if (error) {
        console.error('[useAllVendors] Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          filters,
          sort
        });
        
        toast({
          title: "❌ Erreur de chargement",
          description: error.message || "Impossible de charger les boutiques",
          variant: "destructive"
        });
        
        throw error;
      }

      console.log('[useAllVendors] Loaded vendors:', {
        count: vendors?.length || 0,
        totalCount: count,
        filters,
        sort
      });

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
