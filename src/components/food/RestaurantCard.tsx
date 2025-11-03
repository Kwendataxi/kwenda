import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, TrendingUp, ChefHat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/types/food';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard = ({ restaurant, onClick }: RestaurantCardProps) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-orange-500/50 bg-gradient-to-br from-background to-orange-50/30 dark:to-orange-950/10"
        onClick={onClick}
      >
        {/* Banner avec overlay gradient amélioré */}
        <div className="h-36 relative overflow-hidden group">
          {restaurant.banner_url ? (
            <>
              <motion.img 
                src={restaurant.banner_url} 
                alt={restaurant.restaurant_name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-white/80" />
            </div>
          )}
          
          {/* Badge de statut */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 right-3 bg-green-500 text-white border-0 shadow-lg"
          >
            🚀 Livraison
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Logo avec border gradient */}
            {restaurant.logo_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0 border-4 border-white dark:border-gray-700 shadow-xl -mt-12 relative z-10 ring-2 ring-orange-500/30">
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.restaurant_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate text-foreground group-hover:text-orange-600 transition-colors">
                {restaurant.restaurant_name}
              </h3>

              <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
                <span className="text-orange-500">🍴</span>
                {restaurant.cuisine_types?.[0] || 'Restaurant'}
              </p>

              {restaurant.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {restaurant.description}
                </p>
              )}

              {/* Stats avec icônes colorées */}
              <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
                {restaurant.rating_average && restaurant.rating_average > 0 ? (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="font-semibold">{restaurant.rating_average.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({restaurant.rating_count || 0})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5" />
                    <span className="text-xs">Nouveau</span>
                  </div>
                )}

                {restaurant.average_preparation_time && (
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{restaurant.average_preparation_time} min</span>
                  </div>
                )}

                {restaurant.minimum_order_amount && restaurant.minimum_order_amount > 0 && (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Min {formatPrice(restaurant.minimum_order_amount)}</span>
                  </div>
                )}
              </div>

              {/* Adresse avec icône */}
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1 flex items-center gap-1">
                <span className="text-orange-500">📍</span>
                {restaurant.address}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
