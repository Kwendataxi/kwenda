import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Store, Sparkles } from 'lucide-react';
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
  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const handleAddClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Vibration haptique
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setIsAdding(true);
    onAddToCart();
    
    // Reset animation after delay
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestaurantClick?.();
  };

  const isAvailable = dish.is_available !== false;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn('relative', className)}
    >
      <Card className="relative w-[220px] overflow-hidden cursor-pointer border-0 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/10 dark:shadow-black/30 hover:shadow-2xl transition-shadow duration-300">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />
        
        {/* Top Position Badge - Premium design */}
        {topPosition && topPosition <= 3 && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
            className="absolute top-3 left-3 z-20"
          >
            <Badge 
              className={cn(
                "font-bold text-xs px-2.5 py-1 shadow-lg border-2 border-white/50",
                topPosition === 1 && "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
                topPosition === 2 && "bg-gradient-to-r from-slate-300 to-slate-400 text-black",
                topPosition === 3 && "bg-gradient-to-r from-orange-400 to-amber-600 text-white"
              )}
            >
              <Star className="w-3 h-3 mr-1 fill-current" />
              #{topPosition}
            </Badge>
            
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
              animate={{ x: [-50, 50] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {/* Unavailable Overlay */}
        <AnimatePresence>
          {!isAvailable && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center"
            >
              <Badge variant="destructive" className="text-sm font-bold px-4 py-2">
                Indisponible
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image with lazy loading */}
        <div className="relative h-[140px] overflow-hidden">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
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
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content - Glass effect */}
        <div className="relative p-3.5 space-y-2 bg-gradient-to-b from-card/90 to-card">
          {/* Dish Name */}
          <h3 className="text-[15px] font-bold text-foreground line-clamp-1">
            {dish.name}
          </h3>

          {/* Description */}
          {dish.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[28px] leading-tight">
              {dish.description}
            </p>
          )}

          {/* Restaurant Info */}
          {dish.restaurant_name && (
            <motion.div
              onClick={handleRestaurantClick}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {dish.restaurant_logo_url ? (
                <img
                  src={dish.restaurant_logo_url}
                  alt={dish.restaurant_name}
                  className="w-6 h-6 rounded-full object-cover border-2 border-primary/30"
                  loading="lazy"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Store className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-[11px] font-semibold text-primary group-hover:text-primary/80 transition-colors truncate max-w-[120px]">
                {dish.restaurant_name}
              </span>
            </motion.div>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between pt-2">
            {/* Price with animation */}
            <motion.div 
              className="text-lg font-extrabold text-foreground"
              animate={isAdding ? { scale: [1, 1.1, 1] } : {}}
            >
              {formatPrice(dish.price)}
            </motion.div>

            {/* Add Button - Ripple effect */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85, rotate: 90 }}
              className="relative"
            >
              <Button
                size="icon"
                disabled={!isAvailable}
                onClick={handleAddClick}
                className={cn(
                  "w-11 h-11 rounded-full shadow-lg transition-all duration-300",
                  "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                  "text-white disabled:opacity-50 disabled:cursor-not-allowed",
                  isAdding && "animate-pulse"
                )}
              >
                <Plus className="w-5 h-5" />
              </Button>
              
              {/* Success ripple */}
              <AnimatePresence>
                {isAdding && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-green-500"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        
        {/* Sparkle effect on hover */}
        <motion.div
          className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0, rotate: 0 }}
          whileHover={{ opacity: 1, rotate: 180 }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      </Card>
    </motion.div>
  );
};
