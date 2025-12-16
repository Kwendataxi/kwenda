import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Store, Sparkles, Check, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/utils/formatCurrency';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FoodDishCardProps {
  dish: FoodProduct & {
    restaurant_name?: string;
    restaurant_logo_url?: string;
  };
  topPosition?: number;
  onAddToCart: () => void;
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
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const handleAddClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
    
    setIsAdding(true);
    onAddToCart();
    
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }, 300);
  };

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestaurantClick?.();
  };

  const isAvailable = dish.is_available !== false;
  const isTopThree = topPosition && topPosition <= 3;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn('relative group', className)}
    >
      <Card className={cn(
        "relative w-[230px] overflow-hidden cursor-pointer border-0",
        "bg-card/90 backdrop-blur-xl",
        "shadow-xl shadow-black/10 dark:shadow-black/30",
        "hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500",
        isTopThree && "ring-2 ring-primary/20"
      )}>
        {/* Premium glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Top Position Badge - Design premium avec shine */}
        {isTopThree && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
            className="absolute top-3 left-3 z-20"
          >
            <Badge 
              className={cn(
                "font-black text-sm px-3 py-1.5 shadow-xl border-2 border-white/60 relative overflow-hidden",
                topPosition === 1 && "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black",
                topPosition === 2 && "bg-gradient-to-r from-slate-300 via-gray-300 to-slate-400 text-black",
                topPosition === 3 && "bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-white"
              )}
            >
              <Star className="w-3.5 h-3.5 mr-1 fill-current" />
              #{topPosition}
              
              {/* Shine effect animé */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
            </Badge>
          </motion.div>
        )}

        {/* Like button */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-red-400 transition-colors"
        >
          <Heart className="w-4 h-4" />
        </motion.button>

        {/* Unavailable Overlay */}
        <AnimatePresence>
          {!isAvailable && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md z-30 flex items-center justify-center"
            >
              <Badge variant="destructive" className="text-sm font-bold px-5 py-2.5 shadow-xl">
                Indisponible
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image section agrandie */}
        <div className="relative h-[160px] overflow-hidden">
          {/* Enhanced skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}
          
          <motion.img
            src={dish.main_image_url || '/placeholder.svg'}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100" : "opacity-0",
              "group-hover:scale-110"
            )}
          />
          
          {/* Premium gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        {/* Content - Enhanced glass effect */}
        <div className="relative p-4 space-y-2.5 bg-gradient-to-b from-card/95 to-card">
          {/* Dish Name */}
          <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {dish.name}
          </h3>

          {/* Description */}
          {dish.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[28px] leading-relaxed">
              {dish.description}
            </p>
          )}

          {/* Restaurant Info - Enhanced */}
          {dish.restaurant_name && (
            <motion.div
              onClick={handleRestaurantClick}
              whileHover={{ x: 2 }}
              className="flex items-center gap-2.5 cursor-pointer group/restaurant py-1"
            >
              {dish.restaurant_logo_url ? (
                <img
                  src={dish.restaurant_logo_url}
                  alt={dish.restaurant_name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-primary/30 shadow-sm"
                  loading="lazy"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-sm">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <span className="text-xs font-semibold text-primary group-hover/restaurant:text-primary/80 transition-colors truncate max-w-[130px]">
                {dish.restaurant_name}
              </span>
            </motion.div>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            {/* Price with enhanced animation */}
            <motion.div 
              className="space-y-0.5"
              animate={isAdding ? { scale: [1, 1.05, 1] } : {}}
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prix</span>
              <p className="text-xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {formatPrice(dish.price)}
              </p>
            </motion.div>

            {/* Add Button - Premium design */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="relative"
            >
              <Button
                size="icon"
                disabled={!isAvailable}
                onClick={handleAddClick}
                className={cn(
                  "w-12 h-12 rounded-2xl shadow-xl transition-all duration-300",
                  showSuccess 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : "bg-gradient-to-br from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500",
                  "text-white disabled:opacity-50 disabled:cursor-not-allowed",
                  "border-2 border-white/20"
                )}
              >
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: isAdding ? 90 : 0 }}
                      exit={{ scale: 0 }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              
              {/* Ripple effect */}
              <AnimatePresence>
                {isAdding && (
                  <>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-2xl bg-primary"
                    />
                    <motion.div
                      initial={{ scale: 1, opacity: 0.4 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute inset-0 rounded-2xl bg-primary"
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        
        {/* Hover sparkle effect */}
        <motion.div
          className="absolute top-14 right-4 z-20 pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          whileHover={{ opacity: 1, scale: 1 }}
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </motion.div>
      </Card>
    </motion.div>
  );
};
