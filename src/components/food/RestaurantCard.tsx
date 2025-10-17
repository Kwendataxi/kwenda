import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden"
      onClick={onClick}
    >
      {/* Banner */}
      {restaurant.banner_url && (
        <div className="h-32 relative overflow-hidden">
          <img 
            src={restaurant.banner_url} 
            alt={restaurant.restaurant_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {restaurant.logo_url && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border-2 border-background shadow-md -mt-10 relative z-10">
              <img 
                src={restaurant.logo_url} 
                alt={restaurant.restaurant_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg truncate">{restaurant.restaurant_name}</h3>
              <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                Livraison
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground capitalize">
              {restaurant.cuisine_types?.[0] || 'Restaurant'}
            </p>

            {restaurant.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{restaurant.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {restaurant.rating_average && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{restaurant.rating_average.toFixed(1)}</span>
                  <span className="text-muted-foreground">({restaurant.rating_count || 0})</span>
                </div>
              )}

              {restaurant.average_preparation_time && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.average_preparation_time} min</span>
                </div>
              )}

              {restaurant.minimum_order_amount && restaurant.minimum_order_amount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Min {formatPrice(restaurant.minimum_order_amount)}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              {restaurant.address}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
