import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Eye, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface CompactProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

export const CompactProductCard: React.FC<CompactProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  userLocation,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    <Card className={cn(
      "group relative overflow-hidden bg-card border border-border/50 rounded-lg",
      "hover:shadow-md transition-all duration-300 touch-scale w-full max-w-[160px]",
      className
    )}>
      {/* Image Container - Compact */}
      <div className="relative aspect-square overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 bg-grey-100" />
        )}
        <img
          src={product.image}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            "group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Overlay Actions - Minimal */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="default"
              className="w-full h-7 text-xs bg-primary hover:bg-primary/90"
              disabled={!product.isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              J'achète
            </Button>
          </div>
        </div>

        {/* Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
              -{product.discount}%
            </Badge>
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

        {/* Distance - Only if close */}
        {distance && distance < 10 && (
          <div className="text-xs text-muted-foreground">
            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
          </div>
        )}
      </div>
    </Card>
  );
};