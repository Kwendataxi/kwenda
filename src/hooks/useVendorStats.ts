import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

export const useVendorStats = () => {
  const [stats, setStats] = useState<VendorStats>({
    activeProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    escrowBalance: 0,
    pendingEscrow: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [products, orders, escrow, merchantAccount] = await Promise.all([
      supabase.from('marketplace_products').select('*').eq('seller_id', user.id),
      supabase.from('marketplace_orders').select('*').eq('seller_id', user.id),
      supabase.from('escrow_transactions').select('*').eq('seller_id', user.id),
      supabase.from('merchant_accounts').select('*').eq('vendor_id', user.id).maybeSingle()
    ]);

    setStats({
      activeProducts: products.data?.filter(p => p.moderation_status === 'approved').length || 0,
      pendingProducts: products.data?.filter(p => p.moderation_status === 'pending').length || 0,
      totalOrders: orders.data?.length || 0,
      pendingOrders: orders.data?.filter(o => o.status === 'pending_seller_confirmation').length || 0,
      escrowBalance: merchantAccount.data?.balance || 0,
      pendingEscrow: escrow.data?.filter(e => e.status === 'held').reduce((sum, e) => sum + (e.seller_amount || 0), 0) || 0
    });

    setLoading(false);
  };

  return { stats, loading, refetch: loadStats };
};
