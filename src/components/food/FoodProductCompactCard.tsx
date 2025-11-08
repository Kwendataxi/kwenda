import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FoodProduct } from '@/types/food';

interface FoodProductCompactCardProps {
  product: FoodProduct;
  restaurant?: { 
    id: string; 
    restaurant_name: string; 
    logo_url?: string;
  };
  onAddToCart: (product: FoodProduct) => void;
  onRestaurantClick?: (restaurantId: string) => void;
}

export const FoodProductCompactCard = ({ 
  product, 
  restaurant, 
  onAddToCart, 
  onRestaurantClick
}: FoodProductCompactCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-[200px] flex-shrink-0"
    >
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-3">
          {/* Image */}
          {product.main_image_url && (
            <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden bg-muted">
              <img 
                src={product.main_image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Title and Description */}
          <h4 className="font-semibold text-sm line-clamp-1 mb-1">{product.name}</h4>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          
          {/* Restaurant Link */}
          {restaurant && onRestaurantClick && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRestaurantClick(restaurant.id);
              }}
              className="flex items-center gap-1.5 mt-2 mb-2 text-xs text-primary hover:underline group transition-all"
            >
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.restaurant_name}
                  className="w-4 h-4 rounded-full object-cover" 
                />
              ) : (
                <Store className="w-3.5 h-3.5" />
              )}
              <span className="line-clamp-1 group-hover:text-primary/80">
                {restaurant.restaurant_name}
              </span>
            </button>
          )}
          
          {/* Price and Add Button */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="font-bold text-sm">
              {formatCurrency(product.price, 'CDF')}
            </span>
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
