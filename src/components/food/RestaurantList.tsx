import { RestaurantCard } from './RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Restaurant } from '@/types/food';

interface RestaurantListProps {
  restaurants: Restaurant[];
  loading: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantList = ({ restaurants, loading, onSelectRestaurant }: RestaurantListProps) => {
  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-lg">Aucun restaurant disponible dans cette ville</p>
        <p className="text-sm text-muted-foreground mt-2">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 gap-4">
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onClick={() => onSelectRestaurant(restaurant)}
        />
      ))}
    </div>
  );
};
