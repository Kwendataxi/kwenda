import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Banknote, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Restaurant, FoodCartItem } from '@/types/food';
import type { LocationData } from '@/hooks/useSmartGeolocation';

interface FoodCheckoutProps {
  cart: FoodCartItem[];
  restaurant: Restaurant;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  onPlaceOrder: (deliveryAddress: string, paymentMethod: 'kwenda_pay' | 'cash') => void;
  onBack: () => void;
}

export const FoodCheckout = ({
  cart,
  restaurant,
  subtotal,
  deliveryFee,
  serviceFee,
  total,
  onPlaceOrder,
  onBack,
}: FoodCheckoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [paymentMethod, setPaymentMethod] = useState<'kwenda_pay' | 'cash'>('kwenda_pay');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const minimumOrder = restaurant.minimum_order_amount || 0;
  const isUnderMinimum = subtotal < minimumOrder;
  const missingAmount = minimumOrder - subtotal;
  
  const walletBalance = wallet?.balance || 0;
  const hasInsufficientFunds = paymentMethod === 'kwenda_pay' && walletBalance < total;
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

    setIsProcessing(true);
    const steps = [
      'Vérification des produits...',
      'Traitement du paiement...',
      'Recherche d\'un livreur...',
      'Confirmation en cours...'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setProcessingStep((i / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setProcessingStep(100);
      await onPlaceOrder(deliveryAddress, paymentMethod);
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Restaurant Info */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-bold text-lg">{restaurant.restaurant_name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{restaurant.address}</p>
        <p className="text-sm text-muted-foreground">{restaurant.phone_number}</p>
      </div>

      {/* Order Summary */}
      <div>
        <h3 className="font-bold text-lg mb-3">Récapitulatif</h3>
        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frais de service</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-orange-600">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Minimum Order Warning */}
      {isUnderMinimum && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Commande minimale : {formatPrice(minimumOrder)}. 
            Ajoutez encore {formatPrice(missingAmount)} de produits.
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Address */}
      <div>
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
          className="mt-2"
        />
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="font-bold text-lg mb-3">Mode de paiement</h3>
        
        {/* Wallet Balance Display */}
        {user && wallet && (
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Solde KwendaPay</span>
              <span className="font-bold text-primary">{formatPrice(walletBalance)}</span>
            </div>
            {hasInsufficientFunds && (
              <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Solde insuffisant. Rechargez votre compte de {formatPrice(total - walletBalance)}
              </div>
            )}
          </div>
        )}

        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'kwenda_pay' | 'cash')}>
          <div className={`flex items-center space-x-3 rounded-lg p-4 cursor-pointer transition-colors ${
            hasInsufficientFunds ? 'bg-muted/20 opacity-50' : 'bg-muted/30 hover:bg-muted/50'
          }`}>
            <RadioGroupItem value="kwenda_pay" id="kwenda_pay" disabled={hasInsufficientFunds} />
            <Label htmlFor="kwenda_pay" className="flex items-center gap-2 cursor-pointer flex-1">
              <Wallet className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">KwendaPay</p>
                <p className="text-xs text-muted-foreground">Paiement instantané</p>
              </div>
              {paymentMethod === 'kwenda_pay' && !hasInsufficientFunds && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
              <Banknote className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold">Espèces</p>
                <p className="text-xs text-muted-foreground">Payer à la livraison</p>
              </div>
              {paymentMethod === 'cash' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Processing Feedback */}
      {isProcessing && (
        <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">
              {processingStep < 25 && 'Vérification des produits...'}
              {processingStep >= 25 && processingStep < 50 && 'Traitement du paiement...'}
              {processingStep >= 50 && processingStep < 75 && 'Recherche d\'un livreur...'}
              {processingStep >= 75 && 'Confirmation en cours...'}
            </span>
          </div>
          <Progress value={processingStep} className="h-2" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isProcessing}
        >
          Retour
        </Button>
        <Button
          onClick={handleConfirmOrder}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
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
  );
};
