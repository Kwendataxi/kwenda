import { Card } from '@/components/ui/card';
import { Star, Clock, ChevronRight, MapPin } from 'lucide-react';
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
  const prepTime = restaurant.average_preparation_time || 25;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group"
    >
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer",
          "bg-card rounded-3xl",
          "border border-border/50",
          "shadow-sm hover:shadow-md",
          "transition-shadow duration-300"
        )}
        onClick={handleClick}
      >
        {/* Image section */}
        <div className="relative h-36 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          <img
            src={restaurant.banner_url 
              ? `${restaurant.banner_url}?t=${restaurant.updated_at || Date.now()}` 
              : '/placeholder-food.jpg'
            }
            alt={restaurant.restaurant_name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              imageLoaded ? "opacity-100" : "opacity-0",
              "group-hover:scale-105"
            )}
          />
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Logo */}
          {restaurant.logo_url && (
            <div className="absolute top-3 left-3 w-10 h-10 rounded-xl border border-white/80 shadow-sm overflow-hidden bg-white">
              <img 
                src={`${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`}
                alt={`${restaurant.restaurant_name} logo`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Delivery badge */}
          {restaurant.delivery_available && (
            <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-[10px] border-0 font-medium px-2 py-0.5">
              Livraison
            </Badge>
          )}
          
          {/* Restaurant name */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-semibold text-white line-clamp-1 drop-shadow-sm">
              {restaurant.restaurant_name}
            </h3>
          </div>
        </div>
        
        {/* Info section */}
        <div className="p-4 space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            </span>
            <span className="text-border/60">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {prepTime}-{prepTime + 10} min
            </span>
            {restaurant.address && (
              <>
                <span className="text-border/60">·</span>
                <span className="flex items-center gap-1 truncate text-xs">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{restaurant.address.split(',')[0]}</span>
                </span>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Min.</p>
              <p className="font-semibold text-sm text-foreground">
                {restaurant.minimum_order_amount 
                  ? formatPrice(restaurant.minimum_order_amount)
                  : formatCurrency(5000, 'CDF')
                }
              </p>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost"
              className="rounded-full text-primary hover:text-primary hover:bg-primary/10 font-medium px-3 h-8"
            >
              Voir menu
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
