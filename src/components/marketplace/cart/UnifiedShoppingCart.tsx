import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Plus, Minus, Trash2, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCartItem } from './AnimatedCartItem';
import { CartEmptyState } from './CartEmptyState';
import { KwendaPayCheckout } from './KwendaPayCheckout';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/marketplace';

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
  const { user } = useAuth();
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
      // ✅ NOUVEAU : Appeler edge function sécurisée pour paiement + escrow
      const { data, error } = await supabase.functions.invoke('process-marketplace-checkout', {
        body: {
          cartItems: cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            seller_id: item.seller_id
          })),
          userId: user?.id,
          userCoordinates
        }
      });

      if (error) throw error;

      setCheckoutStep('success');
      setShowConfetti(true);

      toast({
        title: '✅ Paiement réussi !',
        description: `${data.orderIds.length} commande(s) créée(s) • ${data.totalAmount.toLocaleString()} CDF ${data.paidWithBonus ? '(bonus)' : ''}`,
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
      {/* Header - responsive padding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-4 sm:p-6">
        {/* Pattern décoratif animé */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        <SheetHeader className="relative z-10">
          <SheetTitle className="flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
              >
                <ShoppingBag className="w-6 h-6" />
              </motion.div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold">Mon Panier</span>
                <motion.span
                  key={totalItems}
                  initial={{ scale: 1.3, color: 'rgb(239, 68, 68)' }}
                  animate={{ scale: 1, color: 'inherit' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-sm text-white/90 font-normal"
                >
                  {totalItems} article{totalItems > 1 ? 's' : ''} • {vendorCount} vendeur{vendorCount > 1 ? 's' : ''}
                </motion.span>
              </div>
            </div>
            {cartItems.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const confirmMessage = `Voulez-vous vraiment vider le panier ?\n\n📦 ${totalItems} article${totalItems > 1 ? 's' : ''}\n💰 ${totalPrice.toLocaleString()} CDF\n\nCette action est irréversible.`;
                  
                  if (confirm(confirmMessage)) {
                    console.log('[UnifiedCart] Clearing entire cart');
                    
                    // Animation progressive de suppression
                    cartItems.forEach((item, index) => {
                      setTimeout(() => {
                        console.log('[UnifiedCart] Removing:', item.id);
                        onRemoveItem(item.id);
                      }, index * 100); // 100ms entre chaque suppression
                    });
                    
                    toast({
                      title: "✅ Panier vidé",
                      description: `${totalItems} article${totalItems > 1 ? 's' : ''} retiré${totalItems > 1 ? 's' : ''}`,
                      duration: 3000
                    });
                  }
                }}
                className="text-xs text-white/80 hover:text-white hover:bg-white/20"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Vider
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
      </div>

      {cartItems.length === 0 ? (
        <CartEmptyState onClose={onClose} />
      ) : (
        <div className="flex flex-col h-[calc(100vh-140px)]">
          {/* Items grouped by vendor - optimized scroll */}
          <ScrollArea className="flex-1 px-3 sm:px-4">
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {Object.values(vendorGroups).map((group) => (
                <Card key={group.sellerId} className="overflow-hidden">
                  <div className="bg-muted/30 px-2.5 sm:px-3 py-1.5 sm:py-2 border-b">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold truncate">{group.sellerName}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0">
                        {group.total.toLocaleString()} CDF
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                    <AnimatePresence mode="popLayout">
                      {group.items.map((item, index) => (
                        <AnimatedCartItem
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdateQuantity={(id, qty) => {
                            console.log('[UnifiedCart] Update quantity:', id, qty);
                            onUpdateQuantity(id, qty);
                          }}
                          onRemove={(id, name) => {
                            console.log('[UnifiedCart] Remove item:', id, name);
                            onRemoveItem(id);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Footer with total and checkout - sticky */}
          <div className="sticky bottom-0 border-t bg-background/98 backdrop-blur-md shadow-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 z-50">
            {/* Wallet Balance - compact */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">KwendaPay</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">Solde disponible</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap">{wallet?.balance?.toLocaleString() || 0} CDF</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {wallet && wallet.balance >= totalPrice ? '✓ Suffisant' : '⚠ Insuffisant'}
                    </p>
                  </div>
                </div>
                
                {/* Progress bar de solde */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Couverture</span>
                    <span>{Math.min(100, ((wallet?.balance || 0) / totalPrice * 100)).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (wallet?.balance || 0) / totalPrice * 100)}%` }}
                      className={cn(
                        "h-full transition-all duration-700",
                        wallet && wallet.balance >= totalPrice 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-amber-500 to-orange-500"
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total - responsive */}
            <div className="flex justify-between items-center px-1">
              <span className="text-base sm:text-lg font-semibold">Total</span>
              <motion.span
                key={totalPrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xl sm:text-2xl font-bold text-primary tabular-nums"
              >
                {totalPrice.toLocaleString()} CDF
              </motion.span>
            </div>

            {/* Checkout Button - touch-optimized */}
            <Button 
              data-checkout-button
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary-light min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform"
              onClick={handleCheckout}
              disabled={!wallet || wallet.balance < totalPrice}
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Payer avec KwendaPay
            </Button>
            
            <p className="text-[10px] sm:text-xs text-center text-muted-foreground leading-tight">
              🔒 Paiement sécurisé • {vendorCount} commande{vendorCount > 1 ? 's' : ''} groupée{vendorCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );

  const renderProcessingView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 p-6 sm:p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/30 border-t-primary rounded-full"
      />
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-semibold">Traitement en cours</h3>
        <p className="text-sm sm:text-base text-muted-foreground">Création de {vendorCount} commande{vendorCount > 1 ? 's' : ''}...</p>
        <p className="text-xs sm:text-sm text-muted-foreground">Paiement sécurisé par KwendaPay</p>
        <p className="text-xs text-muted-foreground/70">Ne fermez pas cette fenêtre</p>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 p-6 sm:p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-green-600">Paiement Réussi !</h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          {vendorCount} commande{vendorCount > 1 ? 's' : ''} créée{vendorCount > 1 ? 's' : ''}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Total payé : {totalPrice.toLocaleString()} CDF
        </p>
      </div>
    </div>
  );

  // Confirmation avant fermeture si panier non-vide
  const handleCloseAttempt = (open: boolean) => {
    if (!open && cartItems.length > 0 && checkoutStep === 'cart') {
      const confirmed = confirm(
        `⚠️ Vous avez ${totalItems} article${totalItems > 1 ? 's' : ''} dans votre panier !\n\n` +
        `💰 Total : ${totalPrice.toLocaleString()} CDF\n\n` +
        `Voulez-vous vraiment quitter sans finaliser votre commande ?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleCloseAttempt}>
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
