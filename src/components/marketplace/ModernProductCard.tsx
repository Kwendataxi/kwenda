import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingCart, Heart, Star, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  moderation_status: string;
  seller_id: string;
  seller?: {
    display_name: string;
  };
  rating_average?: number;
  review_count?: number;
  discount_percentage?: number;
  stock_quantity?: number;
}

interface ModernProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  userLocation?: { lat: number; lng: number };
}

export const ModernProductCard = ({
  product,
  onViewDetails,
  onAddToCart,
  userLocation
}: ModernProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Normalisation des images
  const mainImage = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder.svg';
  
  const discount = product.discount_percentage || 0;
  const inStock = (product.stock_quantity ?? 1) > 0;
  const rating = product.rating_average || 0;
  const reviewCount = product.review_count || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const originalPrice = discount > 0 ? product.price / (1 - discount / 100) : null;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group h-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-card/50 backdrop-blur-sm h-full flex flex-col">
        {/* Image avec overlay gradient */}
        <div className="relative overflow-hidden aspect-square">
          <img 
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient overlay au hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick actions (visible au hover) */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
            <Button 
              size="sm" 
              className="rounded-full bg-white/90 text-foreground hover:bg-white"
              onClick={() => onViewDetails(product)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir
            </Button>
            {inStock && (
              <Button 
                size="sm"
                className="rounded-full bg-primary text-white"
                onClick={() => onAddToCart(product)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
          
          {/* Badges */}
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-[hsl(0,80%,50%)] text-white font-bold shadow-lg">
              -{discount}%
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Rupture de stock
              </Badge>
            </div>
          )}
          
          {/* Wishlist button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-full p-2 shadow-lg"
            onClick={handleToggleWishlist}
          >
            <Heart className={cn(
              "h-5 w-5 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-foreground"
            )} />
          </motion.button>
        </div>
        
        {/* Content */}
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          {/* Rating + Reviews */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < Math.floor(rating)
                        ? "fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}
          
          {/* Seller */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="h-3 w-3" />
            <span className="truncate">{product.seller?.display_name || 'Vendeur'}</span>
          </div>
          
          {/* Price - pushed to bottom */}
          <div className="flex items-end justify-between pt-2 border-t mt-auto">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
