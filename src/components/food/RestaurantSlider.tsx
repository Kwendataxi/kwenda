import { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { RestaurantCard } from './RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import type { Restaurant } from '@/types/food';

interface RestaurantSliderProps {
  restaurants: Restaurant[];
  loading: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  title?: string;
}

export const RestaurantSlider = ({ 
  restaurants, 
  loading, 
  onSelectRestaurant,
  title = "🍽️ Restaurants populaires"
}: RestaurantSliderProps) => {
  const [autoplay] = useState(() => 
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  if (loading) {
    return (
      <div className="space-y-4 px-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-80 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  return (
    <div className="space-y-4 px-4 py-6">
      {/* Titre avec badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          {title}
        </h2>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold">
          {restaurants.length}
        </span>
      </div>

      {/* Slider avec autoplay */}
      <Carousel
        plugins={[autoplay]}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {restaurants.map((restaurant) => (
            <CarouselItem key={restaurant.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
              <div className="h-full transition-transform hover:scale-[1.02]">
                <RestaurantCard
                  restaurant={restaurant}
                  onClick={() => onSelectRestaurant(restaurant)}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Contrôles de navigation (visible sur desktop uniquement) */}
        <div className="hidden md:block">
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
        </div>
      </Carousel>

      {/* Indicateur de swipe sur mobile */}
      <p className="text-xs text-center text-muted-foreground md:hidden">
        ← Faites glisser pour voir plus →
      </p>
    </div>
  );
};
