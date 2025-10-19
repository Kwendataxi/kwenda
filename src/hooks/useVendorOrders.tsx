import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorOrder {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  currency: string;
  delivery_address: string;
  buyer_contact: string;
  vendor_confirmation_status: string;
  status: string;
  created_at: string;
  product?: {
    name: string;
    price: number;
  };
}

export const useVendorOrders = () => {
  const [pendingOrders, setPendingOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Non authentifié');
        return;
      }

      // Récupérer d'abord les produits du vendeur
      const { data: vendorProducts } = await supabase
        .from('marketplace_products')
        .select('id, title, price')
        .eq('seller_id', user.id);

      if (!vendorProducts || vendorProducts.length === 0) {
        setPendingOrders([]);
        return;
      }

      const vendorProductIds = vendorProducts.map((p: any) => p.id);

      // Récupérer les commandes pour ces produits
      const { data: orders, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .in('product_id', vendorProductIds)
        .eq('vendor_confirmation_status', 'awaiting_confirmation')
        .in('status', ['pending', 'pending_payment'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec les infos produit
      const enrichedOrders: VendorOrder[] = orders?.map((order: any) => {
        const product = vendorProducts.find((p: any) => p.id === order.product_id);
        
        // Fallback pour buyer_phone si null (migration en cours)
        let buyerPhone = order.buyer_phone;
        if (!buyerPhone) {
          console.warn('⚠️ buyer_phone manquant pour commande:', order.id);
          buyerPhone = 'Non disponible';
        }
        
        return {
          id: order.id,
          product_id: order.product_id,
          quantity: order.quantity,
          total_price: order.unit_price * order.quantity,
          currency: 'CDF',
          delivery_address: order.delivery_address || 'Non renseignée',
          buyer_contact: buyerPhone,
          vendor_confirmation_status: order.vendor_confirmation_status,
          status: order.status,
          created_at: order.created_at,
          product: product ? { name: (product as any).title, price: (product as any).price } : undefined
        };
      }) || [];

      setPendingOrders(enrichedOrders);

    } catch (error) {
      console.error('Erreur chargement commandes vendeur:', error);
      toast.error('Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Mettre à jour le statut de confirmation
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          vendor_confirmation_status: 'confirmed',
          vendor_confirmed_at: new Date().toISOString(),
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Logger l'activité
      await supabase.from('activity_logs').insert({
        activity_type: 'vendor_order_confirmed',
        description: 'Vendeur a confirmé la commande',
        metadata: { order_id: orderId, vendor_id: user.id }
      });

      return true;
    } catch (error) {
      console.error('Erreur confirmation commande:', error);
      toast.error('Impossible de confirmer la commande');
      return false;
    }
  };

  const rejectOrder = async (orderId: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          vendor_confirmation_status: 'rejected',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('activity_logs').insert({
        activity_type: 'vendor_order_rejected',
        description: `Vendeur a refusé la commande: ${reason}`,
        metadata: { order_id: orderId, vendor_id: user.id, reason }
      });

      return true;
    } catch (error) {
      console.error('Erreur refus commande:', error);
      toast.error('Impossible de refuser la commande');
      return false;
    }
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('vendor-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_orders'
        },
        (payload) => {
          console.log('Nouvelle commande reçue:', payload);
          loadPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    pendingOrders,
    loading,
    confirmOrder,
    rejectOrder,
    loadPendingOrders
  };
};
