import { useState } from 'react';
import { RestaurantCard } from './RestaurantCard';
import { RestaurantSlider } from './RestaurantSlider';
import { FoodPromoBanner } from './FoodPromoBanner';
import { PopularDishesSection } from './PopularDishesSection';
import { CategoryIconsSection } from './CategoryIconsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
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
}

export const RestaurantList = ({ 
  restaurants, 
  loading, 
  onSelectRestaurant, 
  onForceRefresh,
  selectedCity,
  onAddToCart,
  onViewAllDishes,
  onViewAllRestaurants
}: RestaurantListProps) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('');

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
  const newRestaurants = restaurants.slice(0, 8);
  const fastDelivery = restaurants.filter(r => (r.average_preparation_time || 60) <= 30).slice(0, 6);

  const filteredByCategory = categoryFilter
    ? restaurants.filter(r => r.cuisine_types?.includes(categoryFilter))
    : restaurants;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* 1. Promo Banner avec slide accueil */}
      <FoodPromoBanner />

      {/* 2. Catégories avec icônes */}
      <CategoryIconsSection 
        activeCategory={categoryFilter}
        onCategorySelect={setCategoryFilter}
      />

      {/* 3. Popular Dishes Section */}
      {onAddToCart && (
        <PopularDishesSection 
          city={selectedCity}
          onAddToCart={onAddToCart}
          onViewAll={onViewAllDishes}
        />
      )}

      {/* 4. New Restaurants */}
      <RestaurantSlider
        restaurants={newRestaurants}
        loading={false}
        onSelectRestaurant={onSelectRestaurant}
        title="🆕 Nouveautés"
        onViewAll={onViewAllRestaurants}
      />

      {/* 5. Fast Delivery (< 30 min) */}
      {fastDelivery.length > 0 && (
        <RestaurantSlider
          restaurants={fastDelivery}
          loading={false}
          onSelectRestaurant={onSelectRestaurant}
          title="⏱️ Livrés en -30 min"
          onViewAll={onViewAllRestaurants}
        />
      )}

      {/* 6. Top Rated Restaurants */}
      {topRated.length > 0 && (
        <RestaurantSlider
          restaurants={topRated}
          loading={false}
          onSelectRestaurant={onSelectRestaurant}
          title="⭐ Top Resto"
          onViewAll={onViewAllRestaurants}
        />
      )}

      {/* 7. Restaurants by Category (tabs - option avancée) */}
      {categoryFilter === '' && (
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4 text-foreground">📂 Par Cuisine</h2>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Tous ({restaurants.length})
              </TabsTrigger>
              {cuisineTypes.slice(0, 5).map(cuisine => {
                const count = restaurants.filter(r => r.cuisine_types?.includes(cuisine)).length;
                return (
                  <TabsTrigger key={cuisine} value={cuisine} className="flex items-center gap-2 capitalize">
                    {cuisine} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="all" className="grid grid-cols-1 gap-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => onSelectRestaurant(restaurant)}
                />
              ))}
            </TabsContent>

            {cuisineTypes.map(cuisine => (
              <TabsContent key={cuisine} value={cuisine} className="grid grid-cols-1 gap-4">
                {restaurants
                  .filter(r => r.cuisine_types?.includes(cuisine))
                  .map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onClick={() => onSelectRestaurant(restaurant)}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* 8. Filtered restaurants (when category filter is active) */}
      {categoryFilter !== '' && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Résultats ({filteredByCategory.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter('')}
              className="text-primary"
            >
              Effacer le filtre
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredByCategory.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
