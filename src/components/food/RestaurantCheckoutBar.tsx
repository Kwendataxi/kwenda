import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

  if (totalItems === 0) return null;

  const progressValue = Math.min((totalItems / 5) * 100, 100);
  const isReady = totalItems >= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        <Card className="mx-4 mb-4 p-4 bg-background/95 backdrop-blur-lg border-primary/20 shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-3">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="origin-left"
            >
              <Progress value={progressValue} className="h-2" />
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            {/* Left: Restaurant & Badge */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <ShoppingBag className="w-6 h-6 text-primary" />
              </motion.div>
              
              <div>
                <div className="text-sm text-muted-foreground">{restaurantName}</div>
                <div className="font-semibold">
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </div>
              </div>

              {isReady && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Prêt
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Right: Total & Button */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <motion.div
                  key={totalAmount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-xl font-bold text-primary"
                >
                  {totalAmount.toLocaleString()} FC
                </motion.div>
              </div>

              <Button
                size="lg"
                onClick={onCheckout}
                className="relative overflow-hidden group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative font-semibold">Commander</span>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
