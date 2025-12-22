import { useState, useRef } from 'react';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantSlider } from './RestaurantSlider';
import { ModernFoodPromoBanner } from './ModernFoodPromoBanner';
import { PopularDishesSection } from './PopularDishesSection';
import { CategoryIconsSection } from './CategoryIconsSection';
import { CategoryDishesPreview } from './CategoryDishesPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
import { cn } from '@/lib/utils';
import type { Restaurant, FoodProduct } from '@/types/food';

interface RestaurantListProps {
  restaurants: Restaurant[];
  loading: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onForceRefresh?: () => void;
  selectedCity: string;
  onAddToCart?: (product: FoodProduct) => void;
  onViewAllDishes?: () => void;
  onViewAllRestaurants?: () => void;
  onRestaurantClick?: (restaurantId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const }
  }
};

const SectionWithParallax = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ y: 40, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const RestaurantList = ({ 
  restaurants, 
  loading, 
  onSelectRestaurant, 
  onForceRefresh,
  selectedCity,
  onAddToCart,
  onViewAllDishes,
  onViewAllRestaurants,
  onRestaurantClick
}: RestaurantListProps) => {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-80 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <p className="text-muted-foreground text-lg font-medium">Aucun restaurant disponible</p>
        <p className="text-sm text-muted-foreground mt-1">Revenez bientôt !</p>
        
        {onForceRefresh && (
          <Button onClick={onForceRefresh} className="mt-4" variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        )}
      </div>
    );
  }

  const topRated = restaurants.filter(r => (r.rating_average || 0) >= 4).slice(0, 8);
  const recentRestaurants = [...restaurants]
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
    .slice(0, 6);
  const fastDelivery = restaurants.filter(r => (r.average_preparation_time || 60) <= 30).slice(0, 6);

  return (
    <motion.div 
      className="space-y-6 pb-24 md:pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Promo Banner */}
      <motion.div variants={itemVariants}>
        <ModernFoodPromoBanner />
      </motion.div>

      {/* Categories */}
      <motion.div variants={itemVariants}>
        <CategoryIconsSection 
          activeCategory={categoryFilter}
          onCategorySelect={setCategoryFilter}
        />
      </motion.div>

      {/* Category Dishes Preview */}
      {categoryFilter && onAddToCart && (
        <SectionWithParallax>
          <CategoryDishesPreview
            category={FOOD_CATEGORIES.find(c => c.id === categoryFilter)!}
            city={selectedCity}
            onAddToCart={onAddToCart}
            onViewAll={() => onViewAllDishes?.()}
            onRestaurantClick={(restaurantId) => {
              const restaurant = restaurants.find(r => r.id === restaurantId);
              if (restaurant) onSelectRestaurant(restaurant);
            }}
          />
        </SectionWithParallax>
      )}

      {/* Popular Dishes */}
      {!categoryFilter && onAddToCart && (
        <SectionWithParallax>
          <PopularDishesSection 
            city={selectedCity}
            onAddToCart={onAddToCart}
            onViewAll={onViewAllDishes}
            onRestaurantClick={(restaurantId) => {
              const restaurant = restaurants.find(r => r.id === restaurantId);
              if (restaurant) onSelectRestaurant(restaurant);
            }}
          />
        </SectionWithParallax>
      )}

      {/* Restaurant Tabs */}
      {!categoryFilter && (
        <SectionWithParallax>
          <div className="px-4 space-y-4">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="w-full h-10 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger 
                  value="new" 
                  className={cn(
                    "flex-1 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  Nouveaux
                </TabsTrigger>
                <TabsTrigger 
                  value="fast"
                  className={cn(
                    "flex-1 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  Express
                </TabsTrigger>
                <TabsTrigger 
                  value="top"
                  className={cn(
                    "flex-1 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  Top noté
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="mt-4">
                {recentRestaurants.length > 0 ? (
                  <RestaurantSlider
                    restaurants={recentRestaurants}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun restaurant récent
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="fast" className="mt-4">
                {fastDelivery.length > 0 ? (
                  <RestaurantSlider
                    restaurants={fastDelivery}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun restaurant express
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="top" className="mt-4">
                {topRated.length > 0 ? (
                  <RestaurantSlider
                    restaurants={topRated}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun restaurant top noté
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SectionWithParallax>
      )}
    </motion.div>
  );
};
