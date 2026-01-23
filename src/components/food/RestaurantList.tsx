import { useState, useRef } from 'react';
import { RestaurantSlider } from './RestaurantSlider';
import { ModernFoodPromoBanner } from './ModernFoodPromoBanner';
import { PopularDishesSection } from './PopularDishesSection';
import { CategoryIconsSection } from './CategoryIconsSection';
import { CategoryDishesPreview } from './CategoryDishesPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, Zap, Star } from 'lucide-react';
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
      staggerChildren: 0.06,
      delayChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut' as const }
  }
};

const SectionWithParallax = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ y: 30, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
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
      <div className="space-y-5">
        <div className="px-4">
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <div className="flex gap-2 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="px-4">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-48 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-4xl mb-3">🍽️</div>
        <p className="text-muted-foreground font-medium">Aucun restaurant disponible</p>
        <p className="text-sm text-muted-foreground/70 mt-0.5">Revenez bientôt !</p>
        
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

  const tabConfig = [
    { value: 'new', label: 'Nouveaux', icon: Clock, data: recentRestaurants },
    { value: 'fast', label: 'Express', icon: Zap, data: fastDelivery },
    { value: 'top', label: 'Top noté', icon: Star, data: topRated },
  ];

  return (
    <motion.div 
      className="space-y-5 pb-24 md:pb-6"
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

      {/* Restaurant Tabs - Modernisé */}
      {!categoryFilter && (
        <SectionWithParallax>
          <div className="space-y-4">
            <Tabs defaultValue="new" className="w-full">
              {/* TabsList pill-shaped avec icônes */}
              <div className="px-4">
                <TabsList className="w-full h-10 p-1 bg-muted/40 backdrop-blur-sm rounded-full border border-border/10">
                  {tabConfig.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="flex-1 gap-1.5 text-xs font-medium rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {/* Contenu des onglets */}
              {tabConfig.map(({ value, data }) => (
                <TabsContent key={value} value={value} className="mt-3">
                  {data.length > 0 ? (
                    <RestaurantSlider
                      restaurants={data}
                      loading={false}
                      onSelectRestaurant={onSelectRestaurant}
                      title=""
                      onViewAll={onViewAllRestaurants}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground/70 text-sm">
                      Aucun restaurant dans cette catégorie
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </SectionWithParallax>
      )}
    </motion.div>
  );
};
