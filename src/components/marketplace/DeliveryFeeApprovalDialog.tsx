import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Package, Truck, DollarSign, MessageSquare } from 'lucide-react';

interface DeliveryFeeApprovalDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved?: () => void;
  onOpenChat?: () => void;
}

export const DeliveryFeeApprovalDialog = ({ 
  order, 
  open, 
  onOpenChange,
  onApproved,
  onOpenChat 
}: DeliveryFeeApprovalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);

  if (!order || order.status !== 'pending_buyer_approval') return null;

  const subtotal = order.unit_price * order.quantity;
  const deliveryFee = order.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  const handleAcceptFees = async () => {
    if (!user) return;
    
    setAccepting(true);

    try {
      const { error } = await supabase.functions.invoke('accept-delivery-fee', {
        body: {
          orderId: order.id,
          buyerId: user.id
        }
      });

      if (error) throw error;

      toast({ 
        title: "✅ Frais acceptés", 
        description: "Votre paiement a été traité. La livraison sera bientôt organisée." 
      });
      
      onOpenChange(false);
      onApproved?.();
    } catch (error: any) {
      console.error('Error accepting fees:', error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Frais de livraison proposés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produit */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Package className="h-5 w-5 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{order.product?.title || 'Produit'}</p>
              <p className="text-sm text-muted-foreground">
                Quantité: {order.quantity} × {order.unit_price} FC
              </p>
            </div>
          </div>

          {/* Mode de livraison */}
          {order.vendor_delivery_method && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Mode de livraison</p>
                <Badge variant={order.vendor_delivery_method === 'kwenda' ? 'default' : 'secondary'}>
                  {order.vendor_delivery_method === 'kwenda' ? 'Livreur Kwenda' : 'Livraison par le vendeur'}
                </Badge>
              </div>
            </div>
          )}

          {/* Résumé financier */}
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total produit</span>
              <span className="font-medium">{subtotal} FC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span className="font-semibold text-primary">{deliveryFee} FC</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Total à payer</span>
              <span className="text-xl font-bold">{total} FC</span>
            </div>
          </div>

          {/* Message informatif */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Le vendeur a validé votre commande et fixé les frais de livraison. 
              Acceptez pour procéder au paiement et à la livraison.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onOpenChat?.();
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Discuter
            </Button>
            <Button
              className="flex-1"
              onClick={handleAcceptFees}
              disabled={accepting}
            >
              {accepting ? 'Traitement...' : 'Accepter et payer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};