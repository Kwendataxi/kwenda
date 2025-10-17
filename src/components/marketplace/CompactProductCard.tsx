import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Eye, Heart, MessageCircle, TrendingUp, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/components/chat/ChatProvider';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  discount?: number;
  location?: {
    lat: number;
    lng: number;
  };
  isPopular?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  condition?: 'new' | 'used' | 'refurbished';
  tags?: string[];
  viewCount?: number;
  salesCount?: number;
  popularityScore?: number;
}

interface CompactProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
  onStartChat?: (sellerId: string, productId: string) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

export const CompactProductCard: React.FC<CompactProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  onStartChat,
  userLocation,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { openChat } = useChat();

  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  const distance = userLocation && product.location
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        product.location.lat,
        product.location.lng
      )
    : null;

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        rotateY: 5,
        transition: { type: 'spring', stiffness: 300 }
      }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      className={cn("w-full max-w-[160px]", className)}
    >
      <Card className={cn(
        "group relative overflow-hidden bg-card border border-border/50 rounded-lg",
        "hover:shadow-lg transition-all duration-300 touch-scale"
      )}>
        {/* Image Container - Compact */}
        <div className="relative aspect-square overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 bg-grey-100" />
        )}
        <motion.img
          src={product.image}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Overlay Actions - Animated */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
            >
              <Eye className="h-3 w-3 text-grey-700" />
            </Button>
          </div>

          {/* Quick Buy Button */}
          <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90"
              disabled={!product.isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Acheter
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>

        {/* Chat button - Always visible in bottom right */}
        <div className="absolute bottom-12 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openChat({
                contextType: 'marketplace',
                contextId: product.id,
                participantId: product.sellerId,
                title: product.name
              });
            }}
            className="group/chat h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-md hover:shadow-lg border border-border/30 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
            aria-label="Contacter le vendeur"
          >
            <MessageCircle className="h-4 w-4 text-primary group-hover/chat:text-primary/80 transition-colors" />
          </button>
        </div>

        {/* Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
              -{product.discount}%
            </Badge>
          )}
          {product.popularityScore && product.popularityScore > 200 && (
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-1.5 py-0.5 border-0 flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5" />
                Tendance
              </Badge>
            </motion.div>
          )}
          {!product.isAvailable && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-grey-500 text-white">
              Épuisé
            </Badge>
          )}
        </div>
      </div>

      {/* Content - Compact */}
      <div className="p-2 space-y-1">
        {/* Product Name */}
        <h3 className="text-xs font-medium line-clamp-2 text-foreground leading-tight">
          {product.name}
        </h3>

        {/* Rating - Small */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground ml-0.5">
              {product.rating.toFixed(1)}
            </span>
          </div>
          {product.reviewCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          )}
        </div>

        {/* Price */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Seller - Clickable */}
        {onViewSeller && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewSeller(product.sellerId);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block w-full text-left"
          >
            {product.seller}
          </button>
        )}

        {/* Métriques de popularité */}
        {(product.viewCount || product.salesCount) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.viewCount !== undefined && product.viewCount > 0 && (
              <div className="flex items-center gap-0.5">
                <Eye className="h-2.5 w-2.5" />
                <span>{product.viewCount.toLocaleString()}</span>
              </div>
            )}
            {product.salesCount !== undefined && product.salesCount > 0 && (
              <div className="flex items-center gap-0.5">
                <ShoppingCart className="h-2.5 w-2.5" />
                <span>{product.salesCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Distance - Only if close */}
        {distance && distance < 10 && (
          <div className="text-xs text-muted-foreground">
            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
          </div>
        )}
      </div>
      </Card>
    </motion.div>
  );
};