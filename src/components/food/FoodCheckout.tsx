import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Banknote, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant, FoodCartItem } from '@/types/food';

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
  const [paymentMethod, setPaymentMethod] = useState<'kwenda_pay' | 'cash'>('kwenda_pay');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
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

    setIsProcessing(true);
    try {
      await onPlaceOrder(deliveryAddress, paymentMethod);
    } finally {
      setIsProcessing(false);
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

      {/* Delivery Address */}
      <div>
        <Label htmlFor="address" className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4" />
          Adresse de livraison
        </Label>
        <Input
          id="address"
          placeholder="Entrez votre adresse complète"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          className="mb-2"
        />
        <Textarea
          placeholder="Instructions de livraison (optionnel)"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="font-bold text-lg mb-3">Mode de paiement</h3>
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'kwenda_pay' | 'cash')}>
          <div className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="kwenda_pay" id="kwenda_pay" />
            <Label htmlFor="kwenda_pay" className="flex items-center gap-2 cursor-pointer flex-1">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">KwendaPay</p>
                <p className="text-xs text-muted-foreground">Paiement instantané</p>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
              <Banknote className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold">Espèces</p>
                <p className="text-xs text-muted-foreground">Payer à la livraison</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

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
          disabled={!deliveryAddress.trim() || isProcessing}
        >
          {isProcessing ? 'Traitement...' : `Commander ${formatPrice(total)}`}
        </Button>
      </div>
    </div>
  );
};
