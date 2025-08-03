import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';

interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_address?: string;
  delivery_coordinates?: any;
  status: string;
  payment_status: string;
  delivery_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: {
    title: string;
    price: number;
    images: string[];
    seller: {
      display_name: string;
    };
  };
  buyer?: {
    display_name: string;
    phone_number?: string;
  };
  seller?: {
    display_name: string;
    phone_number?: string;
  };
  escrow_payment?: {
    id: string;
    status: string;
    amount: number;
  };
}

export const useMarketplaceOrders = () => {
  const { user } = useAuth();
  const { wallet, transferFunds } = useWallet();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders
  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(title, price, images),
          escrow_payments(id, status, amount)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        ...order,
        product: {
          ...order.marketplace_products,
          images: Array.isArray(order.marketplace_products.images) 
            ? order.marketplace_products.images as string[] 
            : [],
          seller: {
            display_name: 'Vendeur'
          }
        },
        buyer: {
          display_name: 'Acheteur',
          phone_number: undefined
        },
        seller: {
          display_name: 'Vendeur',
          phone_number: undefined
        },
        escrow_payment: order.escrow_payments?.[0]
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Create an order
  const createOrder = async (
    productId: string,
    sellerId: string,
    quantity: number,
    unitPrice: number,
    deliveryAddress?: string,
    deliveryCoordinates?: any,
    deliveryMethod: string = 'pickup',
    notes?: string
  ) => {
    if (!user || !wallet) return null;

    const totalAmount = quantity * unitPrice;

    // Check if user has sufficient balance
    if (wallet.balance < totalAmount) {
      throw new Error('Solde insuffisant pour cette commande');
    }

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          buyer_id: user.id,
          seller_id: sellerId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          delivery_coordinates: deliveryCoordinates,
          delivery_method: deliveryMethod,
          notes: notes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create escrow payment (hold funds)
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          seller_id: sellerId,
          amount: totalAmount,
          payment_method: 'wallet',
          status: 'held'
        });

      if (escrowError) throw escrowError;

      // Deduct from buyer's wallet (funds held in escrow)
      await transferFunds(
        'system',
        totalAmount,
        `Paiement en séquestre pour commande ${order.id}`
      );

      // Update order payment status
      await supabase
        .from('marketplace_orders')
        .update({ payment_status: 'held' })
        .eq('id', order.id);

      fetchOrders();
      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Confirm order (seller accepts)
  const confirmOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  };

  // Mark as delivered
  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      throw error;
    }
  };

  // Complete order (buyer confirms receipt)
  const completeOrder = async (orderId: string) => {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'completed',
          payment_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Release escrow payment
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (escrowError) throw escrowError;

      fetchOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string, reason?: string) => {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          notes: reason
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Refund escrow payment
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (escrowError) throw escrowError;

      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('marketplace-orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `buyer_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `seller_id=eq.${user.id}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchOrders().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    orders,
    loading,
    createOrder,
    confirmOrder,
    markAsDelivered,
    completeOrder,
    cancelOrder,
    refetch: fetchOrders
  };
};