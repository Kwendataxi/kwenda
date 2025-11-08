import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { FoodCartItem } from '@/types/food';

interface RestaurantCheckoutBarProps {
  cart: FoodCartItem[];
  restaurantName: string;
  onCheckout: () => void;
  onUpdateCart: (productId: string, quantity: number) => void;
}

export const RestaurantCheckoutBar: React.FC<RestaurantCheckoutBarProps> = ({
  cart,
  restaurantName,
  onCheckout,
  onUpdateCart,
}) => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-2xl p-4 text-white relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Progress Bar */}
              <motion.div
                className="h-1 bg-white/30 rounded-full mb-3 overflow-hidden relative z-10"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min((totalItems / 3) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </motion.div>

              <div className="flex items-center justify-between gap-4 relative z-10">
                {/* Left: Cart Info with Badge */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <ShoppingCart className="w-6 h-6" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    >
                      {totalItems}
                    </motion.div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{restaurantName}</span>
                      {totalItems >= 3 && (
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          Prêt
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-white/90">
                      {totalItems} article{totalItems > 1 ? 's' : ''} • {formatCurrency(totalAmount, 'CDF')}
                    </div>
                  </div>
                </div>

                {/* Right: Checkout Button */}
                <Button
                  onClick={onCheckout}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 font-bold shadow-lg"
                >
                  Commander
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
