import { motion } from 'framer-motion';
import { FoodDishCard } from './FoodDishCard';
import { usePopularDishes } from '@/hooks/usePopularDishes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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
      <div className="px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-[240px] flex-shrink-0 rounded-2xl" />
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
    <div className="space-y-4">
      {/* Header */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            🔥 Top Plats
          </h2>
          <p className="text-sm text-muted-foreground">
            Les plats les plus populaires
          </p>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="group"
          >
            Tout voir
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>

      {/* Carousel horizontal scrollable */}
      <div className="overflow-x-auto scrollbar-hide">
        <div 
          className="flex gap-3 px-4 pb-2" 
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayedDishes.map((dish, index) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{ scrollSnapAlign: 'start' }}
              className="flex-shrink-0"
            >
              <FoodDishCard
                dish={dish}
                topPosition={index < 3 ? index + 1 : undefined}
                onAddToCart={() => {
                  onAddToCart(dish);
                  
                  // Vibration
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
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
  );
};
