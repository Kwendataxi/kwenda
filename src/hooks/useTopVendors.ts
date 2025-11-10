import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopVendor {
  user_id: string;
  shop_name: string;
  shop_logo_url?: string;
  shop_banner_url?: string;
  shop_description?: string;
  average_rating: number;
  total_sales: number;
  product_count: number;
}

export const useTopVendors = (limit: number = 10) => {
  const [vendors, setVendors] = useState<TopVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTopVendors();
  }, [limit]);

  const loadTopVendors = async () => {
    try {
      setLoading(true);
      
      // ✅ Charger les données RÉELLES depuis vendor_profiles
      const { data: vendorProfiles, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('user_id, shop_name, shop_logo_url, shop_banner_url, shop_description, average_rating, total_sales')
        .order('average_rating', { ascending: false })
        .order('total_sales', { ascending: false });

      if (vendorError) throw vendorError;

      // ✅ Compter les produits pour chaque vendeur
      const vendorsWithProductCount = await Promise.all(
        (vendorProfiles || []).map(async (vendor) => {
          const { count, error: countError } = await supabase
            .from('marketplace_products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', vendor.user_id)
            .eq('moderation_status', 'approved');

          if (countError) {
            console.error('Error counting products for vendor:', vendor.user_id, countError);
          }

          return {
            ...vendor,
            product_count: count || 0,
          };
        })
      );

      // ✅ Filtrer les vendeurs sans produits et trier par score
      const activeVendors = vendorsWithProductCount
        .filter(v => v.product_count > 0)
        .sort((a, b) => {
          // Score de popularité : (rating * 10) + (sales * 2) + product_count
          const scoreA = (a.average_rating * 10) + (a.total_sales * 2) + a.product_count;
          const scoreB = (b.average_rating * 10) + (b.total_sales * 2) + b.product_count;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      setVendors(activeVendors);
    } catch (err) {
      console.error('Error loading top vendors:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    vendors,
    loading,
    error,
    refetch: loadTopVendors,
  };
};
