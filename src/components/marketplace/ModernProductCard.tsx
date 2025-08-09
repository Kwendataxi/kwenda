import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useFavorites } from './FavoritesManager';
import { OptimizedImage } from '../optimization/SlowConnectionComponents';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  inStock: boolean;
}

interface ModernProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ModernProductCard: React.FC<ModernProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden bg-card border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] rounded-2xl">
      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`absolute top-3 right-3 z-10 h-8 w-8 p-0 rounded-full transition-all duration-200 ${
          isFavorite(product.id) 
            ? 'bg-destructive/10 text-destructive border border-destructive/20' 
            : 'bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
      >
        <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
      </Button>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <OptimizedImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          priority={false}
          fallback="/placeholder.svg"
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold rounded-lg">
            -{discount}%
          </Badge>
        )}
        
        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="px-3 py-1 font-medium">
              Épuisé
            </Badge>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <Button 
            size="sm" 
            variant="secondary"
            className="rounded-full shadow-lg backdrop-blur-sm border border-border/50"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Détails
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Product Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        
        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg text-foreground">
              {product.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-medium">FC</span>
          </div>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {product.originalPrice.toLocaleString()} FC
            </span>
          )}
        </div>
        
        {/* Seller */}
        <p className="text-xs text-muted-foreground">{product.seller}</p>
        
        {/* Add to Cart Button */}
        <Button 
          className="w-full rounded-xl font-medium"
          disabled={!product.inStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
        </Button>
      </CardContent>
    </Card>
  );
};