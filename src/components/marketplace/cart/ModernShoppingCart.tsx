import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag } from 'lucide-react';
import { AnimatedCartItem } from './AnimatedCartItem';
import { AnimatedCartTotal } from './AnimatedCartTotal';
import { CartEmptyState } from './CartEmptyState';
import { CartCheckoutButton } from './CartCheckoutButton';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { FloatingParticles } from '@/components/wallet/FloatingParticles';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
  seller_id: string;
  coordinates?: { lat: number; lng: number };
}

interface ModernShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout?: () => void;
}

export const ModernShoppingCart: React.FC<ModernShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deletedItem, setDeletedItem] = useState<{ id: string; name: string } | null>(null);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (id: string, name: string) => {
    setDeletedItem({ id, name });
    onRemoveItem(id);

    // Auto-clear undo after 5s
    setTimeout(() => {
      setDeletedItem(null);
    }, 5000);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowConfetti(true);
    setIsProcessing(false);
    
    if (onCheckout) {
      setTimeout(() => {
        onCheckout();
        setShowConfetti(false);
      }, 2000);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden">
          {/* Modern gradient header with glassmorphism */}
          <div className="relative overflow-hidden">
            <FloatingParticles />
            <div className="relative bg-gradient-to-br from-primary via-primary/80 to-secondary p-6 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <ShoppingBag className="w-6 h-6" />
                  </motion.div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-bold">Mon Panier</span>
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm font-normal text-white/80"
                    >
                      {totalItems} {totalItems > 1 ? 'articles' : 'article'}
                    </motion.span>
                  </div>
                </SheetTitle>
              </SheetHeader>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <CartEmptyState onClose={onClose} />
          ) : (
            <div className="flex flex-col h-[calc(100vh-140px)]">
              {/* Cart items with scroll */}
              <ScrollArea className="flex-1 px-4">
                <motion.div 
                  className="space-y-3 py-4"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {cartItems.map((item, index) => (
                      <AnimatedCartItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ScrollArea>

              {/* Footer with total and checkout */}
              <div className="border-t bg-background/95 backdrop-blur-sm p-4 space-y-4">
                <AnimatedCartTotal total={totalPrice} />
                
                <CartCheckoutButton
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  isProcessing={isProcessing}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continuer les achats
                </motion.button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </>
  );
};
