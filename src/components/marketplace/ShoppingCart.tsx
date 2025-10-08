import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus, Trash2, MapPin } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <ShoppingCartIcon className="w-6 h-6" />
            Panier
            {cartItems.length > 0 && (
              <Badge className="ml-2">{cartItems.length}</Badge>
            )}
          </SheetTitle>
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
            <div className="flex-1 overflow-y-auto py-6">
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">par {item.seller}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-l-lg"
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
                            className="h-9 w-9 p-0 rounded-r-lg"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6 space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{total.toLocaleString()} FC</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{total.toLocaleString()} FC</span>
                </div>
                
                <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Frais de livraison définis par le vendeur
                  </p>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base font-semibold rounded-xl" 
                onClick={onCheckout}
              >
                Finaliser la commande
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Paiement sécurisé • Frais wallet déjà inclus
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};