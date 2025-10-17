import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Plus, Minus, Trash2, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { AnimatedCartItem } from './AnimatedCartItem';
import { CartEmptyState } from './CartEmptyState';
import { KwendaPayCheckout } from './KwendaPayCheckout';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useToast } from '@/hooks/use-toast';

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

interface UnifiedShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  userCoordinates?: { lat: number; lng: number };
}

type CheckoutStep = 'cart' | 'processing' | 'success';

export const UnifiedShoppingCart: React.FC<UnifiedShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  userCoordinates,
}) => {
  const { toast } = useToast();
  const { wallet } = useWallet();
  const { createBulkOrder } = useMarketplaceOrders();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Calculs
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Grouper les items par vendeur pour affichage
  const vendorGroups = cartItems.reduce((groups, item) => {
    if (!groups[item.seller_id]) {
      groups[item.seller_id] = {
        sellerId: item.seller_id,
        sellerName: item.seller,
        items: [],
        total: 0
      };
    }
    groups[item.seller_id].items.push(item);
    groups[item.seller_id].total += item.price * item.quantity;
    return groups;
  }, {} as Record<string, { sellerId: string; sellerName: string; items: CartItem[]; total: number }>);

  const vendorCount = Object.keys(vendorGroups).length;

  const handleCheckout = () => {
    if (!wallet || wallet.balance < totalPrice) {
      toast({
        title: 'Solde insuffisant',
        description: `Vous avez besoin de ${totalPrice.toLocaleString()} CDF mais votre solde est de ${wallet?.balance?.toLocaleString() || 0} CDF`,
        variant: 'destructive',
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentDialog(false);
    setCheckoutStep('processing');
    setIsProcessing(true);

    try {
      // Grouper les commandes par vendeur et créer en masse
      await createBulkOrder(cartItems, userCoordinates);

      setCheckoutStep('success');
      setShowConfetti(true);

      toast({
        title: '✅ Commande réussie !',
        description: `${vendorCount} commande(s) créée(s) pour ${totalPrice.toLocaleString()} CDF`,
      });

      // Vider le panier et fermer après 2 secondes
      setTimeout(() => {
        cartItems.forEach(item => onRemoveItem(item.id));
        onClose();
        setCheckoutStep('cart');
        setShowConfetti(false);
      }, 2000);

    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutStep('cart');
      
      toast({
        title: 'Erreur de paiement',
        description: error.message || 'Veuillez réessayer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCartView = () => (
    <>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-secondary p-4 sm:p-6">
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
              <span className="text-lg sm:text-xl font-bold">Mon Panier</span>
              <span className="text-sm text-white/80">
                {totalItems} article{totalItems > 1 ? 's' : ''} • {vendorCount} vendeur{vendorCount > 1 ? 's' : ''}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
      </div>

      {cartItems.length === 0 ? (
        <CartEmptyState onClose={onClose} />
      ) : (
        <div className="flex flex-col h-[calc(100vh-140px)]">
          {/* Items grouped by vendor */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {Object.values(vendorGroups).map((group) => (
                <Card key={group.sellerId} className="overflow-hidden">
                  <div className="bg-muted/30 px-3 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{group.sellerName}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {group.total.toLocaleString()} CDF
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {group.items.map((item, index) => (
                        <AnimatedCartItem
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemoveItem}
                        />
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Footer with total and checkout */}
          <div className="border-t bg-background/95 backdrop-blur-sm p-4 space-y-4">
            {/* Wallet Balance */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">KwendaPay</p>
                      <p className="text-xs text-muted-foreground">Solde disponible</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{wallet?.balance?.toLocaleString() || 0} CDF</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet && wallet.balance >= totalPrice ? '✓ Suffisant' : '⚠ Insuffisant'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-primary"
              >
                {totalPrice.toLocaleString()} CDF
              </motion.span>
            </div>

            {/* Checkout Button */}
            <Button 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary-light"
              onClick={handleCheckout}
              disabled={!wallet || wallet.balance < totalPrice}
            >
              <Shield className="w-5 h-5 mr-2" />
              Payer avec KwendaPay
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              🔒 Paiement sécurisé • {vendorCount} commande{vendorCount > 1 ? 's' : ''} groupée{vendorCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );

  const renderProcessingView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full"
      />
      <div>
        <h3 className="text-lg font-semibold mb-2">Traitement en cours</h3>
        <p className="text-muted-foreground">Création de {vendorCount} commande{vendorCount > 1 ? 's' : ''}...</p>
        <p className="text-sm text-muted-foreground mt-2">Paiement sécurisé par KwendaPay</p>
      </div>
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>
      <div>
        <h3 className="text-xl font-bold text-green-600 mb-2">Paiement Réussi !</h3>
        <p className="text-muted-foreground mb-2">
          {vendorCount} commande{vendorCount > 1 ? 's' : ''} créée{vendorCount > 1 ? 's' : ''}
        </p>
        <p className="text-sm text-muted-foreground">
          Total payé : {totalPrice.toLocaleString()} CDF
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden">
          {checkoutStep === 'cart' && renderCartView()}
          {checkoutStep === 'processing' && renderProcessingView()}
          {checkoutStep === 'success' && renderSuccessView()}
        </SheetContent>
      </Sheet>

      <KwendaPayCheckout
        isOpen={showPaymentDialog}
        total={totalPrice}
        walletBalance={wallet?.balance || 0}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowPaymentDialog(false)}
      />

      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </>
  );
};
