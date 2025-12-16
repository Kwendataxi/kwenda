import { Card } from '@/components/ui/card';
import { Star, Clock, Bike, ChevronRight, MapPin } from 'lucide-react';
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
          "bg-card rounded-2xl",
          "border-0 shadow-md hover:shadow-xl",
          "transition-shadow duration-300"
        )}
        onClick={handleClick}
      >
        {/* Image section - plus compacte */}
        <div className="relative h-40 overflow-hidden">
          {/* Skeleton loading */}
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
          
          {/* Overlay gradient subtil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Logo en haut à gauche - petit et discret */}
          {restaurant.logo_url && (
            <div className="absolute top-3 left-3 w-12 h-12 rounded-xl border-2 border-white/90 shadow-lg overflow-hidden bg-white">
              <img 
                src={`${restaurant.logo_url}?t=${restaurant.updated_at || Date.now()}`}
                alt={`${restaurant.restaurant_name} logo`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Badge livraison en haut à droite */}
          {restaurant.delivery_available && (
            <Badge className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs border-0 font-medium px-2.5 py-1">
              <Bike className="w-3 h-3 mr-1" />
              Livraison
            </Badge>
          )}
          
          {/* Nom du restaurant sur l'image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-white line-clamp-1 drop-shadow-md">
              {restaurant.restaurant_name}
            </h3>
          </div>
        </div>
        
        {/* Informations */}
        <div className="p-4 space-y-3">
          {/* Stats: rating + temps */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {prepTime}-{prepTime + 10} min
            </span>
            {restaurant.address && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{restaurant.address.split(',')[0]}</span>
                </span>
              </>
            )}
          </div>
          
          {/* Footer: prix minimum + bouton */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Minimum</p>
              <p className="font-bold text-primary">
                {restaurant.minimum_order_amount 
                  ? formatPrice(restaurant.minimum_order_amount)
                  : formatCurrency(5000, 'CDF')
                }
              </p>
            </div>
            
            <Button 
              size="sm" 
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
            >
              Voir menu
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
