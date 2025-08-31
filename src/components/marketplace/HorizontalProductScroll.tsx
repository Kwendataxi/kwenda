import React from 'react';
import { ModernProductCard } from './ModernProductCard';
import { Skeleton } from '../ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Product {
  id: string;
  title: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  inStock: boolean;
  coordinates?: { lat: number; lng: number };
}

interface HorizontalProductScrollProps {
  title: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userCoordinates?: { lat: number; lng: number } | null;
  loading?: boolean;
}

export const HorizontalProductScroll: React.FC<HorizontalProductScrollProps> = ({
  title,
  products,
  onAddToCart,
  onViewDetails,
  userCoordinates,
  loading = false
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of card + gap
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 rounded-full border-border/50 hover:bg-muted"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 rounded-full border-border/50 hover:bg-muted"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto horizontal-scroll scrollbar-hide pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-72"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ModernProductCard
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              userCoordinates={userCoordinates}
            />
          </div>
        ))}
      </div>
    </div>
  );
};