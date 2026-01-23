import { motion } from 'framer-motion';
import { FoodDishCard } from './FoodDishCard';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { FoodProduct } from '@/types/food';

interface PopularDishesSectionProps {
  city: string;
  onAddToCart: (product: FoodProduct) => void;
  onViewAll?: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
}

export const PopularDishesSection = ({ 
  city, 
  onAddToCart, 
  onViewAll, 
  onRestaurantClick 
}: PopularDishesSectionProps) => {
  const { data: dishes, isLoading, error } = usePopularDishes(city);

  // Limiter à 8 plats pour performance
  const displayedDishes = (dishes || []).slice(0, 8);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[220px] w-[200px] flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || displayedDishes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header épuré */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Plats populaires
          </h2>
          <p className="text-xs text-muted-foreground/70">
            Les plus commandés
          </p>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="text-xs text-primary h-8 px-2"
          >
            Voir tout
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Carousel horizontal */}
      <div className="relative">
        {/* Masques de fondu */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-x-auto scrollbar-hide">
          <div 
            className="flex gap-3 px-4 pb-1" 
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {displayedDishes.map((dish, index) => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ scrollSnapAlign: 'start' }}
              >
                <FoodDishCard
                  dish={dish}
                  topPosition={index < 3 ? index + 1 : undefined}
                  onAddToCart={(quantity = 1, notes) => {
                    // Call parent handler with the dish and quantity
                    for (let i = 0; i < quantity; i++) {
                      onAddToCart(dish);
                    }
                    if ('vibrate' in navigator) {
                      navigator.vibrate(30);
                    }
                  }}
                  onRestaurantClick={
                    onRestaurantClick && dish.restaurant_id
                      ? () => onRestaurantClick(dish.restaurant_id!)
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
