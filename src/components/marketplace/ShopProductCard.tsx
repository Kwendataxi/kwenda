import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Plus, Award } from 'lucide-react';
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
  onAddToCart: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({
  product,
  topPosition,
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

          {/* Overlay si épuisé */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-500 text-white text-sm px-3 py-1">
                Épuisé
              </Badge>
            </div>
          )}

          {/* Floating Add Button - Bleu */}
          {product.inStock && (
            <motion.div
              className="absolute bottom-4 right-4"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                size="icon"
                onClick={handleAddToCart}
                className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="text-lg font-bold line-clamp-2 text-foreground leading-tight min-h-[3rem]">
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

          {/* Price */}
          <div className="pt-2 border-t border-blue-100">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
