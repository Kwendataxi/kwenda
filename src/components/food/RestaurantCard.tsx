import { Card } from '@/components/ui/card';
import { Star, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/types/food';
import { formatCurrency } from '@/lib/utils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard = ({ restaurant, onClick }: RestaurantCardProps) => {
  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card 
        className="overflow-hidden border-2 border-border/40 dark:border-border/80 hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card dark:bg-card/95 hover:shadow-2xl hover:shadow-primary/20 dark:hover:shadow-primary/30 shadow-lg dark:shadow-2xl dark:shadow-primary/20"
        onClick={handleClick}
      >
        {/* Image avec overlay gradient */}
        <div className="relative h-44 overflow-hidden group">
          <motion.img
            src={restaurant.banner_url || '/placeholder-food.jpg'}
            alt={restaurant.restaurant_name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Gradient overlay adaptatif pour meilleur contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent dark:from-black/80 dark:via-black/30" />
          
          {/* Badge unique - Priorité à Top noté */}
          <div className="absolute top-3 right-3">
            {restaurant.rating_average >= 4.5 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-warning/95 dark:bg-warning text-warning-foreground dark:text-black shadow-lg border-2 border-white/50 backdrop-blur-sm font-semibold">
                  ⭐ Top
                </Badge>
              </motion.div>
            ) : restaurant.delivery_available && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-success/95 dark:bg-success text-success-foreground dark:text-black shadow-lg border-2 border-white/50 backdrop-blur-sm font-semibold">
                  🚀 Rapide
                </Badge>
              </motion.div>
            )}
          </div>
          
          {/* Info bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold mb-1.5 truncate text-white dark:text-white drop-shadow-lg">{restaurant.restaurant_name}</h3>
                <div className="flex items-center gap-2 text-base text-white/95 dark:text-white drop-shadow-md">
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    {restaurant.rating_average?.toFixed(1) || '4.0'}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {restaurant.average_preparation_time || 25}-{(restaurant.average_preparation_time || 25) + 10} min
                  </span>
                </div>
              </div>
              
              {/* Logo circulaire plus petit */}
              {restaurant.logo_url && (
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 rounded-full border-3 border-white shadow-xl overflow-hidden bg-white ml-3 flex-shrink-0"
                >
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Prix minimum & CTA */}
        <div className="p-4 bg-card dark:bg-card/95">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/90">Commande minimum</p>
              <p className="text-base font-bold text-primary dark:text-primary-glow">
                {restaurant.minimum_order_amount 
                  ? formatPrice(restaurant.minimum_order_amount)
                  : formatCurrency(5000, 'CDF')
                }
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="sm" 
                className="shadow-md bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 font-semibold"
              >
                Commander 🍽️
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};