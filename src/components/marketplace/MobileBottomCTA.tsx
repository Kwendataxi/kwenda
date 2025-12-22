import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart, Minus, Plus, Wallet, MessageCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomCTAProps {
  productPrice: number;
  stockCount: number;
  walletBalance: number;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
  onTopUp: () => void;
  onContactSeller?: () => void;
  // Champs produits digitaux
  isDigital?: boolean;
}

export const MobileBottomCTA: React.FC<MobileBottomCTAProps> = ({
  productPrice,
  stockCount,
  walletBalance,
  onAddToCart,
  onBuyNow,
  onTopUp,
  onContactSeller,
  isDigital = false
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

  // Pour les produits digitaux, quantité = 1 toujours
  const effectiveQuantity = isDigital ? 1 : quantity;
  const totalPrice = productPrice * effectiveQuantity;
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
            {/* Quantité compacte - masquée pour les produits digitaux */}
            {!isDigital ? (
              <div className="flex items-center gap-3">
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
            ) : (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Download className="h-4 w-4" />
                <span className="font-medium">Produit digital</span>
              </div>
            )}
            
            {/* Prix total */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</p>
            </div>
          </div>
          
          {/* Boutons - Hero CTA Mobile */}
          {canAfford ? (
            isDigital ? (
              // Bouton unique pleine largeur pour les produits digitaux
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/30"
                  onClick={() => onBuyNow(1)}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Acheter & Télécharger
                </Button>
              </motion.div>
            ) : (
              // Grille de boutons Hero pour les produits physiques
              <div className="grid grid-cols-5 gap-2">
                <motion.div whileTap={{ scale: 0.95 }} className="col-span-2">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full h-12 border-2 border-primary/30"
                    onClick={() => onAddToCart(quantity)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-1" />
                    Panier
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }} className="col-span-3">
                  <Button 
                    size="lg" 
                    className="w-full h-12 font-bold bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/30"
                    onClick={() => onBuyNow(quantity)}
                  >
                    <ShoppingBag className="h-5 w-5 mr-1" />
                    Commander
                  </Button>
                </motion.div>
              </div>
            )
          ) : (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30"
                onClick={onTopUp}
              >
                <Wallet className="h-5 w-5 mr-2" />
                Recharger mon wallet
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bouton Chat flottant mobile */}
      {onContactSeller && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onContactSeller}
          className="lg:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6.5rem)' }}
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}

      {/* Spacer pour éviter que le contenu soit caché */}
      <div className="h-32 lg:hidden" />
    </>
  );
};
