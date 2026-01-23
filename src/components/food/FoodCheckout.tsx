import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, AlertCircle, CheckCircle2, Loader2, MapPin, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Restaurant, FoodCartItem } from '@/types/food';
import type { LocationData } from '@/hooks/useSmartGeolocation';
import { motion } from 'framer-motion';

interface FoodCheckoutProps {
  cart: FoodCartItem[];
  restaurant: Restaurant;
  subtotal: number;
  serviceFee: number;
  total: number;
  onPlaceOrder: (deliveryAddress: string, paymentMethod: 'kwenda_pay' | 'cash') => void;
  onBack: () => void;
}

export const FoodCheckout = ({
  cart,
  restaurant,
  subtotal,
  serviceFee,
  total,
  onPlaceOrder,
  onBack,
}: FoodCheckoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const minimumOrder = restaurant.minimum_order_amount || 0;
  const isUnderMinimum = subtotal < minimumOrder;
  const missingAmount = minimumOrder - subtotal;
  
  const walletBalance = wallet?.balance || 0;
  const hasInsufficientFunds = walletBalance < total;
  const canPlaceOrder = deliveryAddress.trim() && !isUnderMinimum && !hasInsufficientFunds;

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} CDF`;
  };

  const handleConfirmOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: 'Adresse requise',
        description: 'Veuillez entrer votre adresse de livraison',
        variant: 'destructive'
      });
      return;
    }

    if (isUnderMinimum) {
      toast({
        title: 'Commande minimale non atteinte',
        description: `Ajoutez encore ${formatPrice(missingAmount)} pour commander`,
        variant: 'destructive'
      });
      return;
    }

    if (hasInsufficientFunds) {
      toast({
        title: 'Solde insuffisant',
        description: 'Veuillez recharger votre compte KwendaPay',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onPlaceOrder(deliveryAddress, 'kwenda_pay');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-5 max-w-2xl mx-auto pb-24"
    >
      {/* Restaurant Header */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{restaurant.restaurant_name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{restaurant.address}</p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <h3 className="font-semibold text-foreground mb-4">Votre commande</h3>
        
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{item.quantity}x</span>
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-border/50 my-4" />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de service</span>
            <span className="text-foreground">{formatPrice(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-xs text-muted-foreground italic">Après validation</span>
          </div>
        </div>

        <div className="h-px bg-border/50 my-4" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Minimum Order Warning */}
      {isUnderMinimum && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Commande minimale : {formatPrice(minimumOrder)}. 
            Ajoutez {formatPrice(missingAmount)} de produits.
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Address */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Adresse de livraison</h3>
        </div>
        
        <AddressAutocompleteInput
          value={deliveryAddress}
          onChange={(address, location) => {
            setDeliveryAddress(address);
            setDeliveryLocation(location || null);
          }}
          required
        />
        
        <Textarea
          placeholder="Instructions de livraison (optionnel)"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          rows={2}
          className="mt-3 rounded-xl border-border/50 bg-background resize-none"
        />
      </div>

      {/* Payment - KwendaPay Only */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Paiement</h3>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">KwendaPay</p>
              <p className="text-xs text-muted-foreground">Solde: {formatPrice(walletBalance)}</p>
            </div>
          </div>
          {!hasInsufficientFunds && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </div>

        {hasInsufficientFunds && (
          <div className="mt-3 p-3 bg-destructive/10 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-xs text-destructive">
              Solde insuffisant. Rechargez {formatPrice(total - walletBalance)} pour continuer.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/40">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-12 rounded-xl"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleConfirmOrder}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
            disabled={!canPlaceOrder || isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </span>
            ) : (
              `Commander ${formatPrice(total)}`
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
