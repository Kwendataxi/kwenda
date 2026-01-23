import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star, Clock, Store, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';

interface FoodDishDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: FoodProduct & {
    restaurant_name?: string;
    restaurant_logo_url?: string;
    preparation_time?: number;
    rating?: number;
  };
  onAddToCart: (quantity: number, notes?: string) => void;
  onRestaurantClick?: () => void;
}

export const FoodDishDetailSheet = ({
  open,
  onOpenChange,
  dish,
  onAddToCart,
  onRestaurantClick
}: FoodDishDetailSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(quantity, notes.trim() || undefined);
    onOpenChange(false);
    // Reset for next open
    setTimeout(() => {
      setQuantity(1);
      setNotes('');
    }, 300);
  };

  const handleRestaurantClick = () => {
    onOpenChange(false);
    onRestaurantClick?.();
  };

  const totalPrice = dish.price * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border border-border/40 bg-background shadow-xl max-h-[85vh] flex flex-col [&>button]:hidden">
        {/* Close button - highly visible */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image hero - responsive height */}
        <div className="relative h-36 sm:h-44 bg-muted shrink-0">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={dish.main_image_url || '/placeholder.svg'}
            alt={dish.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
          {/* Titre et infos */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {dish.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              {dish.rating && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {dish.rating.toFixed(1)}
                </span>
              )}
              {dish.preparation_time && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {dish.preparation_time} min
                </span>
              )}
              <span className="text-sm font-medium text-primary">
                {formatCurrency(dish.price, 'CDF')}
              </span>
            </div>
          </div>

          {/* Description */}
          {dish.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {dish.description}
            </p>
          )}

          {/* Lien restaurant */}
          {dish.restaurant_name && onRestaurantClick && (
            <button 
              onClick={handleRestaurantClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {dish.restaurant_logo_url ? (
                  <img 
                    src={dish.restaurant_logo_url} 
                    alt={dish.restaurant_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Store className="w-5 h-5 text-primary" />
                )}
              </div>
              <span className="flex-1 text-left text-sm font-medium text-foreground truncate">
                {dish.restaurant_name}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}

          {/* Instructions spéciales */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Instructions spéciales
            </label>
            <Textarea
              placeholder="Ex: Sans piment, bien cuit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted/30 border-border/40 resize-none focus:ring-1 focus:ring-primary/30"
              rows={2}
            />
          </div>

          {/* Quantité +/- */}
          <div className="flex items-center justify-center gap-6 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted border border-border/30 disabled:opacity-40"
            >
              <Minus className="h-5 w-5" />
            </Button>
            
            <AnimatePresence mode="wait">
              <motion.span 
                key={quantity}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-bold tabular-nums w-12 text-center text-foreground"
              >
                {quantity}
              </motion.span>
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 rounded-full bg-muted/50 hover:bg-muted border border-border/30"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Footer fixe avec 2 boutons */}
        <div className="shrink-0 p-3 sm:p-4 pt-3 border-t border-border/40 flex gap-2 sm:gap-3 safe-area-bottom">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 sm:h-12 rounded-xl text-sm border-border/60"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddToCart}
            className="flex-[1.5] h-11 sm:h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter • {formatCurrency(totalPrice, 'CDF')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
