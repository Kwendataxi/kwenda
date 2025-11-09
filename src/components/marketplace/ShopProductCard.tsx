import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Plus, Award, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ShopProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    seller: { display_name: string };
    sellerLogo?: string;
    inStock: boolean;
  };
  topPosition?: number; // Position dans le top (1, 2, 3 pour badges)
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({
  product,
  topPosition,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onViewDetails,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onAddToCart();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onToggleFavorite?.();
  };

  return (
    <motion.div
      data-product-id={product.id}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={cn("w-[280px] flex-shrink-0", className)}
      onClick={onViewDetails}
    >
      <Card className={cn(
        "group relative overflow-hidden bg-gradient-to-br from-[#E8F1FF] to-[#F0F4FF] border-none",
        "hover:shadow-2xl transition-all duration-300 cursor-pointer h-full"
      )}>
        {/* Image Container - 280x200px */}
        <div className="relative w-full h-[200px] overflow-hidden rounded-t-2xl">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 bg-muted/20" />
          )}
          <motion.img
            src={product.image}
            alt={product.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Top Badge - Position dans le top */}
          {topPosition && topPosition <= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute top-3 left-3"
            >
              <Badge className={cn(
                "text-xs font-bold px-2 py-1 flex items-center gap-1",
                topPosition === 1 && "bg-gradient-to-r from-yellow-400 to-orange-400 text-white",
                topPosition === 2 && "bg-gradient-to-r from-gray-300 to-gray-400 text-white",
                topPosition === 3 && "bg-gradient-to-r from-orange-300 to-orange-400 text-white"
              )}>
                <Award className="h-3 w-3" />
                Top #{topPosition}
              </Badge>
            </motion.div>
          )}

          {/* Bouton Favoris - Top Right */}
          {onToggleFavorite && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="absolute top-3 right-3 z-20"
            >
              <Button
                variant="secondary"
                size="icon"
                onClick={handleToggleFavorite}
                className={cn(
                  "w-10 h-10 rounded-full shadow-lg transition-all backdrop-blur-sm",
                  isFavorite 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-white/90 hover:bg-white text-gray-600"
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isFavorite && "fill-current"
                  )}
                />
              </Button>
            </motion.div>
          )}

          {/* Overlay si épuisé */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-500 text-white text-sm px-3 py-1">
                Épuisé
              </Badge>
            </div>
          )}

        {/* Bouton Add floating - Plus gros et visible */}
        {product.inStock && (
          <motion.div 
            className="absolute bottom-4 right-4 z-10"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="icon"
              onClick={handleAddToCart}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </motion.div>
        )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="text-xl font-bold line-clamp-2 text-foreground leading-tight min-h-[3.5rem]">
            {product.title}
          </h3>

          {/* Vendor Info */}
          <div className="flex items-center gap-2">
            {product.sellerLogo ? (
              <img 
                src={product.sellerLogo} 
                alt={product.seller.display_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {product.seller.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-600 truncate">
                {product.seller.display_name}
              </p>
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviews > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({product.reviews})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prix - Plus visible */}
          <div className="pt-3 border-t border-blue-200">
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(product.price)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
