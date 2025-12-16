import { Card } from '@/components/ui/card';
import { Star, Clock, Bike, Sparkles, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
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
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group"
    >
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-500",
          "bg-card/95 backdrop-blur-xl",
          "border border-border/30 hover:border-primary/30",
          "shadow-lg hover:shadow-2xl hover:shadow-primary/15",
          isTopRated && "ring-1 ring-amber-500/20"
        )}
        onClick={handleClick}
      >
        {/* Image Hero section */}
        <div className="relative h-52 overflow-hidden">
          {/* Enhanced skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-muted/80">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
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
              "w-full h-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100" : "opacity-0",
              "group-hover:scale-105"
            )}
          />
          
          {/* Premium gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Top badges row */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {/* Left badges */}
            <div className="flex flex-col gap-2">
              {isTopRated && (
                <motion.div
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-xl border-0 font-bold px-3 py-1.5">
                    <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Top Noté
                  </Badge>
                </motion.div>
              )}
            </div>
            
            {/* Right badges */}
            <div className="flex flex-col gap-2 items-end">
              {restaurant.delivery_available && (
                <motion.div
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl border-0 font-semibold px-3 py-1.5">
                    <Bike className="w-3.5 h-3.5 mr-1.5" />
                    Express
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Floating logo */}
          {restaurant.logo_url && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-8 right-4 z-10"
            >
              <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-2xl overflow-hidden bg-card">
                <img 
                  src={`${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`}
                  alt={`${restaurant.restaurant_name} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          )}
          
          {/* Bottom content on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pr-28">
            {/* Restaurant name */}
            <motion.h3 
              className="text-2xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {restaurant.restaurant_name}
            </motion.h3>
            
            {/* Quick stats */}
            <motion.div 
              className="flex items-center gap-2 mt-2 flex-wrap"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Rating pill */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </motion.div>
                <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
              </div>
              
              {/* Time pill */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Clock className="w-4 h-4 text-white" />
                </motion.div>
                <span className="text-white font-medium text-sm">{prepTime}-{prepTime + 10} min</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="p-4 pt-6 bg-gradient-to-b from-card to-card/95">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Price info */}
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Commande minimum
              </p>
              <p className="text-xl font-black bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                {restaurant.minimum_order_amount 
                  ? formatPrice(restaurant.minimum_order_amount)
                  : formatCurrency(5000, 'CDF')
                }
              </p>
            </div>
            
            {/* Right: CTA Button */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                size="default" 
                className={cn(
                  "shadow-xl font-bold px-5 py-2.5 rounded-xl",
                  "bg-gradient-to-r from-primary via-orange-500 to-red-500",
                  "hover:from-primary/90 hover:via-orange-500/90 hover:to-red-500/90",
                  "text-white border-0 transition-all duration-300",
                  "group/btn"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                Voir le menu
                <motion.div
                  className="ml-1"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
