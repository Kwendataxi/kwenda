import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FoodDishDetailSheet } from './FoodDishDetailSheet';

interface FoodDishCardProps {
  dish: FoodProduct & {
    restaurant_name?: string;
    restaurant_logo_url?: string;
    preparation_time?: number;
    rating?: number;
  };
  topPosition?: number;
  onAddToCart: (quantity?: number, notes?: string) => void;
  onRestaurantClick?: () => void;
  className?: string;
}

export const FoodDishCard = ({ 
  dish, 
  topPosition, 
  onAddToCart, 
  onRestaurantClick,
  className 
}: FoodDishCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    
    onAddToCart(1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
  };

  const handleCardClick = () => {
    setShowDetail(true);
  };

  const handleAddFromSheet = (quantity: number, notes?: string) => {
    onAddToCart(quantity, notes);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
  };

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestaurantClick?.();
  };

  const isAvailable = dish.is_available !== false;

  // Badge position styling - simple et sobre
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-amber-500 text-white';
      case 2:
        return 'bg-slate-400 text-white';
      case 3:
        return 'bg-amber-700 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className={cn('relative cursor-pointer', className)}
      >
      <div className={cn(
        "relative w-[200px] overflow-hidden rounded-2xl bg-card border border-border/30 shadow-md",
        !isAvailable && "opacity-60"
      )}>
        {/* Image section */}
        <div className="relative h-28 overflow-hidden bg-muted">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          <img
            src={dish.main_image_url || '/placeholder.svg'}
            alt={dish.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Badge position - sobre */}
          {topPosition && topPosition <= 3 && (
            <div className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
              getPositionStyle(topPosition)
            )}>
              {topPosition}
            </div>
          )}

          {/* Badge promo */}
          {(dish as any).discount_percentage && (dish as any).discount_percentage > 0 && (
            <Badge className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5">
              -{(dish as any).discount_percentage}%
            </Badge>
          )}

          {/* Unavailable overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Indisponible
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          {/* Nom du plat */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {dish.name}
          </h3>

          {/* Description courte */}
          {dish.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {dish.description}
            </p>
          )}

          {/* Infos rapides */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(dish as any).preparation_time && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {(dish as any).preparation_time}min
              </span>
            )}
            {(dish as any).rating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {(dish as any).rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Restaurant link */}
          {dish.restaurant_name && onRestaurantClick && (
            <button
              onClick={handleRestaurantClick}
              className="text-[11px] text-primary/80 hover:text-primary transition-colors truncate w-full text-left"
            >
              📍 {dish.restaurant_name}
            </button>
          )}

          {/* Prix et bouton */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
            <div>
              <span className="text-base font-bold text-primary">
                {formatPrice(dish.price)}
              </span>
              {(dish as any).original_price && (dish as any).original_price > dish.price && (
                <span className="text-xs text-muted-foreground line-through ml-1.5">
                  {formatPrice((dish as any).original_price)}
                </span>
              )}
            </div>

            <Button
              size="icon"
              disabled={!isAvailable}
              onClick={handleAddClick}
              className={cn(
                "w-9 h-9 rounded-xl shadow-sm transition-all active:scale-95",
                showSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-500"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
      </motion.div>

      {/* Detail Sheet */}
      <FoodDishDetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        dish={dish}
        onAddToCart={handleAddFromSheet}
        onRestaurantClick={onRestaurantClick}
      />
    </>
  );
};
