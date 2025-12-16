import { Card } from '@/components/ui/card';
import { Star, Clock, Bike, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Restaurant } from '@/types/food';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard = ({ restaurant, onClick }: RestaurantCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };

  const rating = restaurant.rating_average || 4.0;
  const isTopRated = rating >= 4.5;
  const prepTime = restaurant.average_preparation_time || 25;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-300",
          "bg-card/90 backdrop-blur-sm",
          "border border-border/40 hover:border-primary/40",
          "shadow-lg hover:shadow-2xl hover:shadow-primary/10"
        )}
        onClick={handleClick}
      >
        {/* Image avec overlay premium */}
        <div className="relative h-48 overflow-hidden group">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          )}
          
          <motion.img
            src={restaurant.banner_url 
              ? `${restaurant.banner_url}?t=${restaurant.updated_at || Date.now()}` 
              : '/placeholder-food.jpg'
            }
            alt={restaurant.restaurant_name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Gradient overlay premium */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Badges - Top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {isTopRated && (
              <motion.div
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg border-0 font-bold px-2.5 py-1">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Top
                </Badge>
              </motion.div>
            )}
            {restaurant.delivery_available && (
              <motion.div
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg border-0 font-semibold">
                  <Bike className="w-3 h-3 mr-1" />
                  Express
                </Badge>
              </motion.div>
            )}
          </div>
          
          {/* Info bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Restaurant name */}
                <h3 className="text-xl sm:text-2xl font-bold truncate text-white drop-shadow-lg">
                  {restaurant.restaurant_name}
                </h3>
                
                {/* Stats row */}
                <div className="flex items-center gap-3 text-sm text-white/90">
                  {/* Rating with animated stars */}
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                    <span className="font-bold">{rating.toFixed(1)}</span>
                  </div>
                  
                  {/* Delivery time with animated icon */}
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Clock className="w-4 h-4" />
                    </motion.div>
                    <span className="font-medium">{prepTime}-{prepTime + 10} min</span>
                  </div>
                </div>
              </div>
              
              {/* Logo circulaire */}
              {restaurant.logo_url && (
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 rounded-2xl border-3 border-white shadow-xl overflow-hidden bg-white ml-3 flex-shrink-0"
                >
                  <img 
                    src={`${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`}
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom section - Prix & CTA */}
        <div className="p-4 bg-gradient-to-b from-card to-card/80">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Commande minimum
              </p>
              <p className="text-lg font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
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
                className={cn(
                  "shadow-lg font-bold px-5",
                  "bg-gradient-to-r from-orange-500 to-red-500",
                  "hover:from-orange-600 hover:to-red-600",
                  "text-white border-0"
                )}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Commander
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};