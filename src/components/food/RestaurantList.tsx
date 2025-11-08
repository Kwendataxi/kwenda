import { useState, useRef } from 'react';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantSlider } from './RestaurantSlider';
import { ModernFoodPromoBanner } from './ModernFoodPromoBanner';
import { PopularDishesSection } from './PopularDishesSection';
import { CategoryIconsSection } from './CategoryIconsSection';
import { CategoryDishesPreview } from './CategoryDishesPreview';
import { NewRestaurantsSection } from './NewRestaurantsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
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

// Animation variants pour apparition progressive
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
};

// Composant wrapper pour sections avec parallax
const SectionWithParallax = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ y: 80, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton du slider */}
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
        <div className="text-6xl mb-4">🍽️</div>
        <p className="text-muted-foreground text-lg font-semibold">Aucun restaurant disponible dans cette ville</p>
        <p className="text-sm text-muted-foreground mt-2">Revenez bientôt pour découvrir de nouveaux restaurants !</p>
        
        {onForceRefresh && (
          <Button onClick={onForceRefresh} className="mt-4" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        )}
      </div>
    );
  }

  // Grouper par type de cuisine
  const cuisineTypes = Array.from(new Set(restaurants.flatMap(r => r.cuisine_types || ['Autre'])));
  const topRated = restaurants.filter(r => (r.rating_average || 0) >= 4).slice(0, 8);
  
  // Tri des restaurants par date (plus récents en premier)
  const recentRestaurants = [...restaurants]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0);
      const dateB = new Date(b.updated_at || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 6); // Limiter à 6 restaurants récents
  
  const fastDelivery = restaurants.filter(r => (r.average_preparation_time || 60) <= 30).slice(0, 6);

  const filteredByCategory = categoryFilter
    ? restaurants.filter(r => r.cuisine_types?.includes(categoryFilter))
    : restaurants;

  return (
    <motion.div 
      className="space-y-8 pb-24 md:pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Promo Banner moderne avec animations */}
      <motion.div variants={itemVariants}>
        <ModernFoodPromoBanner />
      </motion.div>

      {/* 2. Catégories avec icônes */}
      <motion.div variants={itemVariants}>
        <CategoryIconsSection 
          activeCategory={categoryFilter}
          onCategorySelect={setCategoryFilter}
        />
      </motion.div>

      {/* 3. Category Dishes Preview - Afficher plats par catégorie si sélectionnée */}
      {categoryFilter && onAddToCart && (
        <SectionWithParallax>
          <CategoryDishesPreview
            category={FOOD_CATEGORIES.find(c => c.id === categoryFilter)!}
            city={selectedCity}
            onAddToCart={onAddToCart}
            onViewAll={(catId) => {
              // Navigate to all dishes view with category filter
              onViewAllDishes?.();
            }}
            onRestaurantClick={(restaurantId) => {
              const restaurant = restaurants.find(r => r.id === restaurantId);
              if (restaurant) {
                onSelectRestaurant(restaurant);
              }
            }}
          />
        </SectionWithParallax>
      )}

      {/* 4. Popular Dishes Section - Seulement si pas de filtre */}
      {!categoryFilter && onAddToCart && (
        <SectionWithParallax>
          <PopularDishesSection 
            city={selectedCity}
            onAddToCart={onAddToCart}
            onViewAll={onViewAllDishes}
            onRestaurantClick={(restaurantId) => {
              const restaurant = restaurants.find(r => r.id === restaurantId);
              if (restaurant) {
                onSelectRestaurant(restaurant);
              }
            }}
          />
        </SectionWithParallax>
      )}

      {/* 5. Restaurants avec Tabs - Fusionner New, Fast, Top Rated */}
      {!categoryFilter && (
        <SectionWithParallax>
          <div className="px-4 space-y-4">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="new" className="text-sm">
                  🆕 Nouveaux
                </TabsTrigger>
                <TabsTrigger value="fast" className="text-sm">
                  ⏱️ Express
                </TabsTrigger>
                <TabsTrigger value="top" className="text-sm">
                  ⭐ Top
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="mt-0">
                {recentRestaurants.length > 0 ? (
                  <RestaurantSlider
                    restaurants={recentRestaurants}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun restaurant récent
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="fast" className="mt-0">
                {fastDelivery.length > 0 ? (
                  <RestaurantSlider
                    restaurants={fastDelivery}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun restaurant express disponible
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="top" className="mt-0">
                {topRated.length > 0 ? (
                  <RestaurantSlider
                    restaurants={topRated}
                    loading={false}
                    onSelectRestaurant={onSelectRestaurant}
                    title=""
                    onViewAll={onViewAllRestaurants}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
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
