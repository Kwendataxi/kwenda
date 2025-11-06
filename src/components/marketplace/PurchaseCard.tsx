import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, ShoppingBag, ShoppingCart, Minus, Plus, ShieldCheck, Truck, MessageCircle } from 'lucide-react';

interface PurchaseCardProps {
  productId: string;
  productPrice: number;
  stockCount: number;
  walletBalance: number;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
  onTopUp: () => void;
  onContactSeller?: () => void;
  sellerName?: string;
}

export const PurchaseCard: React.FC<PurchaseCardProps> = ({
  productId,
  productPrice,
  stockCount,
  walletBalance,
  onAddToCart,
  onBuyNow,
  onTopUp,
  onContactSeller,
  sellerName
}) => {
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPrice = productPrice * quantity;
  const canAfford = walletBalance >= totalPrice;

  const handleIncrement = () => {
    if (quantity < stockCount) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-xl sticky top-20">
      <CardContent className="p-6 space-y-4">
        {/* Wallet balance */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Solde KwendaPay</span>
          </div>
          <span className="font-bold">{formatPrice(walletBalance)}</span>
        </div>
        
        {/* Sélecteur quantité */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantité</label>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDecrement}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold min-w-[3rem] text-center">{quantity}</span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleIncrement}
              disabled={quantity >= stockCount}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {stockCount <= 5 && (
            <p className="text-xs text-orange-600">Plus que {stockCount} en stock !</p>
          )}
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-semibold">{formatPrice(productPrice * quantity)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>
        
        {/* Boutons */}
        <div className="space-y-2">
          {canAfford ? (
            <>
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 h-12"
                onClick={() => onBuyNow(quantity)}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Acheter maintenant
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full h-12"
                onClick={() => onAddToCart(quantity)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ajouter au panier
              </Button>
              {onContactSeller && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full h-12 border-primary/30 hover:bg-primary/5"
                  onClick={onContactSeller}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contacter {sellerName || 'le vendeur'}
                </Button>
              )}
            </>
          ) : (
            <Button 
              size="lg" 
              className="w-full h-12 bg-orange-500 hover:bg-orange-600"
              onClick={onTopUp}
            >
              <Wallet className="h-5 w-5 mr-2" />
              Recharger mon wallet ({formatPrice(walletBalance)})
            </Button>
          )}
        </div>
        
        {/* Trust badges */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span>Paiement 100% sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Livraison rapide disponible</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
