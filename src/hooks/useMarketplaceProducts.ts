/**
 * ✅ PHASE 2: Hook marketplace avec cache Redis intelligent
 */

import { useCachedQuery } from './useCachedQuery';
import { supabase } from '@/integrations/supabase/client';
import { cacheStrategies } from '@/lib/redis';
import { useAuth } from './useAuth';

export const useMarketplaceProducts = () => {
  const { user } = useAuth();

  return useCachedQuery(
    ['marketplace-products', user?.id],
    async () => {
      // Récupérer les produits publics
      const { data: publicProducts, error: publicError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Si connecté, récupérer aussi ses propres produits
      let sellerProducts: any[] = [];
      if (user) {
        const { data: myProducts } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        if (myProducts) {
          sellerProducts = myProducts;
        }
      }
      
      // Fusionner sans doublons
      const allProducts = [
        ...sellerProducts,
        ...(publicProducts || []).filter(
          p => !sellerProducts.some(sp => sp.id === p.id)
        )
      ];

      // Transform products
      return allProducts.map(product => ({
        id: product.id,
        name: product.title,
        price: product.price,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? product.images[0] 
          : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
        images: Array.isArray(product.images) ? product.images : [],
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 10,
        seller: 'Vendeur Kwenda',
        category: product.category?.toLowerCase() || 'other',
        description: product.description || '',
        specifications: {},
        inStock: product.status === 'active',
        stockCount: Math.floor(Math.random() * 20) + 1,
        isTrending: product.featured || false,
        trendingScore: product.featured ? Math.floor(Math.random() * 30) + 70 : 0,
        condition: product.condition,
        location: product.location,
        coordinates: product.coordinates,
        moderationStatus: product.moderation_status,
        productStatus: product.status,
        isOwnProduct: user?.id === product.seller_id
      }));
    },
    {
      cacheStrategy: cacheStrategies.POPULAR_PRODUCTS,
      invalidateOn: [
        { table: 'marketplace_products', event: '*' }
      ]
    }
  );
};
