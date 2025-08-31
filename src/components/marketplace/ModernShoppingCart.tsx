import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus, Trash2, MapPin, Shield, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useWallet } from '@/hooks/useWallet';
import { formatCurrency } from '@/lib/utils';

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
  userCoordinates?: { lat: number; lng: number };
}

export const ModernShoppingCart: React.FC<ModernShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  userCoordinates,
}) => {
  const { toast } = useToast();
  const { createOrderFlexible } = useMarketplaceOrders();
  const { wallet, transferFunds } = useWallet();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'processing' | 'success'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cartItems.length > 0 ? 2000 : 0; // Base delivery fee
  const serviceFee = Math.round(subtotal * 0.02); // 2% service fee
  const total = subtotal + deliveryFee + serviceFee;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSecureCheckout = async () => {
    if (!userCoordinates) {
      toast({
        title: 'Localisation requise',
        description: 'Activez la géolocalisation pour calculer la livraison',
        variant: 'destructive',
      });
      return;
    }

    if (!wallet || wallet.balance < total) {
      toast({
        title: 'Solde insuffisant',
        description: `Vous avez besoin de ${formatCurrency(total)} mais votre solde est de ${formatCurrency(wallet?.balance || 0)}`,
        variant: 'destructive',
      });
      return;
    }

    setCheckoutStep('payment');
  };

  const handleEscrowPayment = async () => {
    setIsProcessing(true);
    setCheckoutStep('processing');

    try {
      // Group items by seller for separate orders
      const vendorGroups = cartItems.reduce((groups, item) => {
        const vendorId = item.seller_id;
        if (!groups[vendorId]) {
          groups[vendorId] = [];
        }
        groups[vendorId].push(item);
        return groups;
      }, {} as Record<string, CartItem[]>);

      // Create escrow orders for each vendor
      for (const [vendorId, items] of Object.entries(vendorGroups)) {
        for (const item of items) {
          const vendorLocation = item.coordinates;
          let distance = 5; // Default distance
          
          if (vendorLocation && userCoordinates) {
            distance = calculateDistance(
              userCoordinates.lat, userCoordinates.lng,
              vendorLocation.lat, vendorLocation.lng
            );
          }

          await createOrderFlexible({
            productId: item.id,
            sellerId: vendorId,
            quantity: item.quantity,
            unitPrice: item.price,
            deliveryAddress: `${userCoordinates.lat}, ${userCoordinates.lng}`,
            deliveryCoordinates: userCoordinates,
            deliveryMethod: 'flash',
            notes: `Commande sécurisée via escrow - Distance: ${distance.toFixed(1)}km`,
            paymentMethod: 'wallet',
            paymentData: {
              totalAmount: total,
              escrowEnabled: true,
              sellerAmount: item.price * item.quantity,
              driverAmount: Math.round(deliveryFee / items.length),
              platformFee: Math.round(serviceFee / items.length)
            }
          });
        }
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCheckoutStep('success');
      
      // Clear cart after 3 seconds
      setTimeout(() => {
        onClose();
        setCheckoutStep('cart');
        cartItems.forEach(item => onRemoveItem(item.id));
      }, 3000);

      toast({
        title: 'Commandes créées !',
        description: 'Vos achats ont été finalisés avec succès',
      });

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutStep('cart');
      toast({
        title: 'Erreur de paiement',
        description: 'Veuillez réessayer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCartView = () => (
    <>
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="flex items-center gap-3 text-xl">
          <ShoppingCartIcon className="w-6 h-6" />
          Mon Panier
          {cartItems.length > 0 && (
            <Badge variant="secondary" className="ml-2">{cartItems.length}</Badge>
          )}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-green-600" />
          Paiement sécurisé avec KwendaPay
        </SheetDescription>
      </SheetHeader>

      {cartItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
              <ShoppingCartIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Panier vide</h3>
              <p className="text-muted-foreground">Découvrez nos produits et ajoutez-les à votre panier</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Items List */}
          <div className="flex-1 overflow-y-auto py-6 content-scrollable">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-sm bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">par {item.seller}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-l-lg touch-manipulation"
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="px-3 py-2 text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-r-lg touch-manipulation"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {item.price.toLocaleString()} FC × {item.quantity}
                          </span>
                          <span className="font-bold text-foreground">
                            {(item.price * item.quantity).toLocaleString()} FC
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Wallet & Summary */}
          <div className="border-t pt-6 space-y-4 bg-background">
            {/* Wallet Balance */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">KwendaPay</p>
                      <p className="text-xs text-muted-foreground">Solde disponible</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(wallet?.balance || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet && wallet.balance >= total ? '✓ Suffisant' : '⚠ Insuffisant'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Shield className="w-4 h-4" />
                  <span>Récapitulatif</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{subtotal.toLocaleString()} FC</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>Livraison</span>
                    </div>
                    <span className="font-medium">{deliveryFee.toLocaleString()} FC</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de service</span>
                    <span className="font-medium">{serviceFee.toLocaleString()} FC</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString()} FC</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 touch-manipulation" 
              onClick={handleSecureCheckout}
              disabled={!wallet || wallet.balance < total}
            >
              <Shield className="w-5 h-5 mr-2" />
              {wallet && wallet.balance >= total ? 'Payer avec KwendaPay' : 'Solde insuffisant'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              🔒 Paiement sécurisé • Livraison rapide • Protection acheteur
            </p>
          </div>
        </>
      )}
    </>
  );

  const renderPaymentView = () => (
    <>
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          Confirmer le paiement
        </SheetTitle>
      </SheetHeader>
      
      <div className="flex-1 py-6 space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Paiement KwendaPay</h3>
                <p className="text-sm text-muted-foreground">Transaction sécurisée</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Débit immédiat de votre solde</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Fonds sécurisés jusqu'à livraison</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Protection acheteur garantie</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium">Récapitulatif de la commande</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Montant total</span>
                <span className="font-semibold">{total.toLocaleString()} FC</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Solde actuel: {formatCurrency(wallet?.balance || 0)}</span>
                <span>Après: {formatCurrency((wallet?.balance || 0) - total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-light touch-manipulation"
          onClick={handleEscrowPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Traitement...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Payer {formatCurrency(total)}
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full touch-manipulation" 
          onClick={() => setCheckoutStep('cart')}
          disabled={isProcessing}
        >
          Retour au panier
        </Button>
      </div>
    </>
  );

  const renderProcessingView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Traitement en cours</h3>
        <p className="text-muted-foreground">Finalisation de votre commande...</p>
      </div>
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-green-600">Paiement Réussi !</h3>
        <p className="text-muted-foreground mb-4">
          Vos commandes ont été créées et le paiement a été effectué
        </p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Les vendeurs ont été notifiés</p>
          <p>• Livraison sous 24-48h</p>
          <p>• Paiement sécurisé effectué</p>
        </div>
      </div>
    </div>
  );

  const getCurrentView = () => {
    switch (checkoutStep) {
      case 'cart': return renderCartView();
      case 'payment': return renderPaymentView();
      case 'processing': return renderProcessingView();
      case 'success': return renderSuccessView();
      default: return renderCartView();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col mobile-safe-layout">
        {getCurrentView()}
      </SheetContent>
    </Sheet>
  );
};