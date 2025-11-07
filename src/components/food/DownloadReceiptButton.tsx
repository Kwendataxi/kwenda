import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateFoodReceipt } from '@/services/foodReceiptPDF';
import { toast } from 'sonner';

interface DownloadReceiptButtonProps {
  orderId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const DownloadReceiptButton = ({ 
  orderId, 
  variant = 'outline',
  size = 'default',
  className = ''
}: DownloadReceiptButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      // Récupérer les données complètes de la commande
      const { data: order, error: orderError } = await supabase
        .from('food_orders')
        .select(`
          *,
          restaurant_profiles!inner(restaurant_name, address, phone_number),
          clients!inner(display_name)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Commande introuvable');

      // Préparer les données pour le PDF
      const receiptData = {
        orderNumber: order.order_number,
        orderDate: order.created_at,
        customerName: order.clients?.display_name || 'Client Kwenda',
        customerPhone: order.delivery_phone || 'N/A',
        restaurantName: order.restaurant_profiles?.restaurant_name || 'Restaurant',
        restaurantAddress: order.restaurant_profiles?.address || '',
        restaurantPhone: order.restaurant_profiles?.phone_number || '',
        items: (order.items as any[]).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        })),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee || 0),
        serviceFee: Number(order.service_fee || 0),
        totalAmount: Number(order.total_amount),
        currency: order.currency || 'CDF',
        deliveryAddress: order.delivery_address || 'Non spécifié',
        paymentMethod: order.payment_method || 'kwenda_pay',
        status: order.status
      };

      // Générer le PDF
      await generateFoodReceipt(receiptData);

      toast.success('Reçu téléchargé !', {
        description: `Fichier : kwenda-food-receipt-${order.order_number}.pdf`
      });

    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Erreur de génération', {
        description: error.message || 'Impossible de générer le reçu'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le reçu
        </>
      )}
    </Button>
  );
};
