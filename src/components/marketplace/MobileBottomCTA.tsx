import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart, Minus, Plus, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomCTAProps {
  productPrice: number;
  stockCount: number;
  walletBalance: number;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
  onTopUp: () => void;
}

export const MobileBottomCTA: React.FC<MobileBottomCTAProps> = ({
  productPrice,
  stockCount,
  walletBalance,
  onAddToCart,
  onBuyNow,
  onTopUp
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
    <>
      {/* Mobile bottom bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      >
        <div className="bg-background/95 backdrop-blur-lg border-t shadow-2xl p-4 space-y-3">
          {/* Prix & Quantité inline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Quantité compacte */}
              <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-bold min-w-[1.5rem] text-center">{quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleIncrement}
                  disabled={quantity >= stockCount}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Prix total */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</p>
            </div>
          </div>
          
          {/* Bouton principal */}
          {canAfford ? (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="lg" 
                variant="outline"
                className="h-12"
                onClick={() => onAddToCart(quantity)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Panier
              </Button>
              <Button 
                size="lg" 
                className="h-12 bg-primary"
                onClick={() => onBuyNow(quantity)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Acheter
              </Button>
            </div>
          ) : (
            <Button 
              size="lg" 
              className="w-full h-12 bg-orange-500 hover:bg-orange-600"
              onClick={onTopUp}
            >
              <Wallet className="h-5 w-5 mr-2" />
              Recharger ({formatPrice(walletBalance)})
            </Button>
          )}
        </div>
      </motion.div>

      {/* Spacer pour éviter que le contenu soit caché */}
      <div className="h-32 lg:hidden" />
    </>
  );
};
