import { motion } from 'framer-motion';
import { Plus, Star, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { FoodProduct } from '@/types/food';

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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Vibration haptique
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onAddToCart();
  };

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestaurantClick?.();
  };

  const isAvailable = dish.is_available !== false;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={className}
    >
      <Card className="relative w-[280px] overflow-hidden cursor-pointer border-border/40 bg-gradient-to-b from-[#F5F1E8] to-[#FAF8F3]">
        {/* Top Position Badge */}
        {topPosition && topPosition <= 3 && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute top-2 left-2 z-20"
          >
            <Badge 
              className="bg-gradient-primary text-white font-bold text-xs px-2 py-1 shadow-lg"
            >
              <Star className="w-3 h-3 mr-1 fill-white" />
              Top #{topPosition}
            </Badge>
          </motion.div>
        )}

        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm font-semibold">
              Indisponible
            </Badge>
          </div>
        )}

        {/* Image */}
        <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
          <motion.img
            src={dish.main_image_url || '/placeholder.svg'}
            alt={dish.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Dish Name */}
          <h3 className="text-lg font-bold text-foreground line-clamp-1">
            {dish.name}
          </h3>

          {/* Description */}
          {dish.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
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
                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <Store className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-semibold text-red-500 group-hover:text-red-600 transition-colors">
                {dish.restaurant_name}
              </span>
            </motion.div>
          )}

          {/* Price and Add Button Row */}
          <div className="flex items-center justify-between pt-2">
            {/* Price */}
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(dish.price)}
            </div>

            {/* Add Button */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                size="icon"
                disabled={!isAvailable}
                onClick={handleAddClick}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
