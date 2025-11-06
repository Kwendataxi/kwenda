import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Store } from 'lucide-react';
import { CartItem } from '@/types/marketplace';

interface VendorCheckoutBarProps {
  cartItems: CartItem[];
  onCheckout: () => void;
  vendorName: string;
}

export const VendorCheckoutBar = ({ 
  cartItems, 
  onCheckout, 
  vendorName 
}: VendorCheckoutBarProps) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      >
        <div className="vendor-card-glass bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t border-border/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Vendeur info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-2"
            >
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Commande chez <span className="font-semibold text-foreground">{vendorName}</span>
              </span>
            </motion.div>
            
            <div className="flex items-center justify-between gap-4">
              {/* Total animé */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={totalAmount}
                    initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                    animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-2xl font-bold"
                  >
                    {formatPrice(totalAmount)}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </p>
              </div>

              {/* Bouton Commander avec pulse */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  id="vendor-checkout-button"
                  size="lg"
                  onClick={onCheckout}
                  className="relative overflow-hidden bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white font-bold px-8 shadow-lg"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <span className="relative flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Commander maintenant
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
