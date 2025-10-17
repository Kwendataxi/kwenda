import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Restaurant, FoodCartItem } from '@/types/food';

interface FoodCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: FoodCartItem[];
  restaurant: Restaurant;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export const FoodCart = ({
  open,
  onOpenChange,
  cart,
  restaurant,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: FoodCartProps) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2000; // Fixed delivery fee
  const serviceFee = subtotal * 0.05;
  const total = subtotal + deliveryFee + serviceFee;
  const canCheckout = subtotal >= (restaurant.minimum_order_amount || 0);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-3">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Votre panier - {restaurant.restaurant_name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 bg-muted/30 rounded-lg p-3">
                  {item.main_image_url && (
                    <img
                      src={item.main_image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{item.name}</h4>
                    <p className="text-sm text-orange-600 font-bold mt-1">
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-auto text-destructive"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span className="font-semibold">{formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de service (5%)</span>
                <span className="font-semibold">{formatPrice(serviceFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>

            {!canCheckout && restaurant.minimum_order_amount && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                Commande minimum: {formatPrice(restaurant.minimum_order_amount)} (encore {formatPrice(restaurant.minimum_order_amount - subtotal)} requis)
              </p>
            )}

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={!canCheckout}
              onClick={onCheckout}
            >
              Commander {formatPrice(total)}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
