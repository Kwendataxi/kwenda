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

      // ✅ PHASE 1: Récupérer d'abord les produits du vendeur
      const { data: vendorProducts } = await supabase
        .from('marketplace_products')
        .select('id, title, price, images')
        .eq('seller_id', user.id);

      if (!vendorProducts || vendorProducts.length === 0) {
        setPendingOrders([]);
        return;
      }

      const vendorProductIds = vendorProducts.map((p: any) => p.id);

      // ✅ PHASE 1: Récupérer les commandes avec JOIN sur buyer (profiles)
      const { data: orders, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          buyer:profiles!marketplace_orders_buyer_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .in('product_id', vendorProductIds)
        .eq('vendor_confirmation_status', 'awaiting_confirmation')
        .in('status', ['pending', 'pending_payment', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ PHASE 1: Enrichir avec les données produit SANS transformer la structure
      const enrichedOrders = orders?.map((order: any) => {
        const product = vendorProducts.find((p: any) => p.id === order.product_id);
        
        return {
          ...order, // ✅ Garder toute la structure DB (unit_price, total_amount, etc.)
          product: product ? { 
            id: product.id,
            title: product.title,
            price: product.price,
            images: product.images || []
          } : null
        };
      }) || [];

      console.log('📦 [useVendorOrders] Commandes chargées:', {
        count: enrichedOrders.length,
        firstOrder: enrichedOrders[0] ? {
          id: enrichedOrders[0].id,
          product_title: enrichedOrders[0].product?.title,
          unit_price: enrichedOrders[0].unit_price,
          buyer_name: enrichedOrders[0].buyer?.display_name,
          has_pickup_coords: !!enrichedOrders[0].pickup_coordinates,
          has_delivery_coords: !!enrichedOrders[0].delivery_coordinates
        } : null
      });

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

      // Récupérer les détails de la commande
      const { data: order, error: fetchError } = await supabase
        .from('marketplace_orders')
        .select('*, marketplace_products(price)')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) throw new Error('Commande introuvable');

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

      // ✅ PHASE 2.3: Créer transaction escrow automatique
      const platformCommission = 0.05; // 5% commission plateforme
      const platformFee = order.total_amount * platformCommission;
      const sellerAmount = order.total_amount - platformFee;

      const { error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert({
          order_id: orderId,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          total_amount: order.total_amount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'held',
          currency: 'CDF'
        });

      if (escrowError) {
        console.error('Erreur création escrow:', escrowError);
        // Ne pas bloquer la confirmation si l'escrow échoue
      }

      // ✅ PHASE 2.2: Notification au client
      await supabase.from('delivery_notifications').insert({
        user_id: order.buyer_id,
        delivery_order_id: orderId,
        notification_type: 'vendor_confirmed',
        title: '✅ Commande confirmée',
        message: 'Le vendeur a confirmé votre commande. Préparation en cours.',
        read: false,
        metadata: {
          order_id: orderId,
          vendor_id: user.id,
          confirmed_at: new Date().toISOString()
        }
      });

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
