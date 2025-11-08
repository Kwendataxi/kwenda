import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wallet, Banknote, CreditCard, Loader2 } from 'lucide-react';

interface DeliverySeparatePaymentDialogProps {
  orderId: string;
  orderType: 'food' | 'marketplace';
  productAmount: number;
  deliveryFee: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeliverySeparatePaymentDialog = ({
  orderId,
  orderType,
  productAmount,
  deliveryFee,
  open,
  onClose,
  onSuccess,
}: DeliverySeparatePaymentDialogProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'kwenda_pay' | 'cash' | 'mobile_money'>('kwenda_pay');
  const [paying, setPaying] = useState(false);

  const handlePayDelivery = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('pay-delivery-separately', {
        body: {
          orderId,
          orderType,
          deliveryFee,
          paymentMethod,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: '❌ Erreur',
          description: data.message || data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '✅ Paiement confirmé',
        description: data.message || 'Livraison payée avec succès',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error paying delivery:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de traiter le paiement',
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>💳 Payer la livraison</DialogTitle>
          <DialogDescription>
            Le montant du produit est déjà payé. Choisissez comment payer la livraison.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé financier */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Montant produit (payé)</span>
              <span className="text-lg font-bold line-through text-green-600">
                {productAmount.toLocaleString()} CDF
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Frais de livraison</span>
              <span className="text-2xl font-bold text-orange-600">
                {deliveryFee.toLocaleString()} CDF
              </span>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Méthode de paiement</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="kwenda_pay" id="kwenda" />
                <Label htmlFor="kwenda" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">KwendaPay</p>
                    <p className="text-xs text-muted-foreground">Paiement instantané depuis votre wallet</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Espèces au livreur</p>
                    <p className="text-xs text-muted-foreground">Payez directement en espèces</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="mobile_money" id="mobile_money" />
                <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Mobile Money</p>
                    <p className="text-xs text-muted-foreground">Orange Money, M-Pesa, Airtel Money</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Info selon méthode choisie */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {paymentMethod === 'kwenda_pay' && (
                <>
                  ℹ️ Le montant sera débité immédiatement de votre wallet KwendaPay
                </>
              )}
              {paymentMethod === 'cash' && (
                <>
                  ℹ️ Préparez {deliveryFee.toLocaleString()} CDF en espèces pour le livreur
                </>
              )}
              {paymentMethod === 'mobile_money' && (
                <>
                  ℹ️ Le livreur vous contactera pour le paiement Mobile Money
                </>
              )}
            </p>
          </div>

          {/* Bouton de confirmation */}
          <Button
            onClick={handlePayDelivery}
            disabled={paying}
            className="w-full"
            size="lg"
          >
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                {paymentMethod === 'kwenda_pay' ? '💳 Payer maintenant' : '✓ Confirmer'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
