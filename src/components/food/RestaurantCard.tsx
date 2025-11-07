import { Card } from '@/components/ui/card';
import { Star, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { Restaurant } from '@/types/food';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard = ({ restaurant, onClick }: RestaurantCardProps) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card 
        className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-card"
        onClick={onClick}
      >
        {/* Image avec overlay gradient */}
        <div className="relative h-48 overflow-hidden group">
          <motion.img
            src={restaurant.banner_url || '/placeholder-food.jpg'}
            alt={restaurant.restaurant_name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Badges flottants */}
          <div className="absolute top-3 right-3 flex gap-2">
            {restaurant.delivery_available && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-success text-white shadow-lg border-0">
                  🚀 Livraison rapide
                </Badge>
              </motion.div>
            )}
            {restaurant.rating_average >= 4.5 && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="bg-[#FFD700] text-black shadow-lg border-0">
                  ⭐ Top noté
                </Badge>
              </motion.div>
            )}
          </div>
          
          {/* Info bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold mb-1 truncate">{restaurant.restaurant_name}</h3>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                    {restaurant.rating_average?.toFixed(1) || '4.0'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {restaurant.average_preparation_time || 25}-{(restaurant.average_preparation_time || 25) + 10} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {restaurant.city}
                  </span>
                </div>
              </div>
              
              {/* Logo circulaire avec animation */}
              {restaurant.logo_url && (
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white ml-3 flex-shrink-0"
                >
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </div>
            
            {/* Types de cuisine */}
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {restaurant.cuisine_types.slice(0, 3).map((type, index) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30"
                    >
                      {type}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Prix minimum & CTA */}
        <div className="p-4 bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Commande minimum</p>
              <p className="text-lg font-bold text-[#FF6347]">
                {restaurant.minimum_order_amount 
                  ? formatPrice(restaurant.minimum_order_amount)
                  : '5 000 FC'
                }
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="sm" 
                className="shadow-md bg-gradient-to-r from-[#FF6347] to-[#FFA500] hover:from-[#FF4500] hover:to-[#FF8C00] text-white border-0"
              >
                Commander 🍽️
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};