import { usePopularDishes } from '@/hooks/usePopularDishes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Flame, ShoppingCart } from 'lucide-react';
import type { FoodProduct } from '@/types/food';

interface PopularDishesSectionProps {
  city: string;
  onAddToCart: (product: FoodProduct) => void;
  onViewAll?: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
}

export const PopularDishesSection = ({ city, onAddToCart, onViewAll, onRestaurantClick }: PopularDishesSectionProps) => {
  const { data: dishes, isLoading } = usePopularDishes(city);

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Limiter à 8 plats maximum pour éviter le scroll infini
  const displayedDishes = dishes.slice(0, 8);

  return (
    <section className="py-6 bg-gradient-to-b from-background to-background/50">
      {/* Header avec icon */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-foreground">Top Plats</h2>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="text-primary hover:text-primary/80 font-semibold"
          >
            Voir tout →
          </Button>
        )}
      </div>

      {/* Liste verticale avec design horizontal professionnel */}
      <div className="space-y-3 px-4">
        {displayedDishes.map((dish, index) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all"
          >
            <div className="flex gap-4 p-3">
              {/* Image à gauche - 112x112px */}
              <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                {dish.main_image_url ? (
                  <img
                    src={dish.main_image_url}
                    alt={dish.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">
                    🍽️
                  </div>
                )}

                {/* Badge Top pour les 3 premiers */}
                {index < 3 && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs shadow-md">
                      Top #{index + 1}
                    </Badge>
                  </div>
                )}

                {/* Badge Indisponible si nécessaire */}
                {!dish.is_available && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs">
                      Indisponible
                    </Badge>
                  </div>
                )}
              </div>

              {/* Contenu à droite */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-base line-clamp-2 mb-1">
                    {dish.name}
                  </h3>
                  {dish.restaurant_name && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRestaurantClick && dish.restaurant_id) {
                          onRestaurantClick(dish.restaurant_id);
                        }
                      }}
                      className="text-xs text-muted-foreground mb-2 hover:text-primary hover:underline truncate block"
                    >
                      📍 {dish.restaurant_name}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold text-lg">
                    {formatPrice(dish.price)}
                  </span>
                  <Button
                    size="sm"
                    variant={dish.is_available ? "default" : "secondary"}
                    disabled={!dish.is_available}
                    className="h-9 px-4 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(dish);
                      
                      // Vibration légère si disponible
                      if ('vibrate' in navigator) {
                        navigator.vibrate(50);
                      }
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
