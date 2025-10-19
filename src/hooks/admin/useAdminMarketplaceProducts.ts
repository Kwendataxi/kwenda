import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminMarketplaceProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingProducts = [], isLoading } = useQuery({
    queryKey: ['admin-marketplace-products-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles(shop_name)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((p: any) => ({
        ...p,
        seller_name: p.vendor_profiles?.shop_name
      }));
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ moderation_status: 'approved' })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products-pending'] });
      toast({ title: 'Produit approuvé' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ 
          moderation_status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products-pending'] });
      toast({ title: 'Produit rejeté' });
    }
  });

  return {
    pendingProducts,
    loading: isLoading,
    approveProduct: (id: string) => approveMutation.mutate(id),
    rejectProduct: (id: string, reason: string) => rejectMutation.mutate({ productId: id, reason })
  };
};
