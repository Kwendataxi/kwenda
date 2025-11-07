import { usePopularDishes } from '@/hooks/usePopularDishes';
import { QuickAddButton } from './QuickAddButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { FoodProduct } from '@/types/food';

interface PopularDishesSectionProps {
  city: string;
  onAddToCart: (product: FoodProduct) => void;
  onViewAll?: () => void;
}

export const PopularDishesSection = ({ city, onAddToCart, onViewAll }: PopularDishesSectionProps) => {
  const { data: dishes, isLoading } = usePopularDishes(city);

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-36 flex-shrink-0 rounded-2xl" />
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

      {/* Carousel horizontal */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4">
        {dishes.map((dish, index) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex-shrink-0 w-36"
          >
            <div className="bg-card dark:bg-card/98 border-2 border-border/50 dark:border-border/80 rounded-xl overflow-hidden shadow-md dark:shadow-xl dark:shadow-primary/10 hover:shadow-lg dark:hover:shadow-primary/20 hover:border-primary/50 dark:hover:border-primary/70 transition-all cursor-pointer h-full flex flex-col">
              {/* Image du plat */}
              <div className="relative h-28 bg-muted dark:bg-muted/80">
                {dish.main_image_url ? (
                  <img
                    src={dish.main_image_url}
                    alt={dish.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl filter drop-shadow-md">
                    🍽️
                  </div>
                )}

                {/* Badge promo si pertinent */}
                {index < 3 && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs bg-orange-500 dark:bg-orange-600 text-white px-2 py-0.5 rounded-full font-semibold shadow-md">
                      Top
                    </span>
                  </div>
                )}
              </div>

              {/* Infos du plat */}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm text-foreground dark:text-foreground/95 line-clamp-2 leading-tight">
                  {dish.name}
                </h3>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-primary dark:text-primary-glow">
                      {formatPrice(dish.price)}
                    </p>
                    {dish.restaurant_name && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/90 truncate">
                        @{dish.restaurant_name}
                      </p>
                    )}
                  </div>

                  {/* Bouton ajout rapide */}
                  <QuickAddButton
                    onAdd={() => onAddToCart(dish)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
