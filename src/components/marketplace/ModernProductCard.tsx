import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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
  onToggleFavorite: (productId: string) => void;
  isFavorite?: boolean;
}

export const ModernProductCard: React.FC<ModernProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails,
  onToggleFavorite,
  isFavorite = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl">
      {/* Favorite Button - Top Right */}
      <Button
        variant="ghost"
        size="sm"
        className={`absolute top-2 right-2 z-10 h-8 w-8 p-0 rounded-full shadow-sm transition-all duration-200 ${
          isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(product.id);
        }}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </Button>

      {/* Image Container */}
      <div className="relative overflow-hidden bg-muted/30 cursor-pointer" onClick={() => onViewDetails(product)}>
        {!imageLoaded && (
          <Skeleton className="w-full h-40 sm:h-44" />
        )}
        <img 
          src={product.image} 
          alt={product.name}
          className={`w-full h-40 sm:h-44 object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600 text-white font-bold px-2 py-1 text-xs rounded-md shadow-sm">
            -{discount}%
          </Badge>
        )}
        
        {/* Stock Status Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="secondary" className="bg-white/90 text-foreground font-medium">
              Rupture de stock
            </Badge>
          </div>
        )}

        {/* Quick View on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-9 px-3 rounded-full bg-white/90 hover:bg-white font-medium shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Voir détails
          </Button>
        </div>
      </div>
      
      <CardContent className="p-3 space-y-2">
        {/* Product Title */}
        <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem] text-foreground">
          {product.name}
        </h3>
        
        {/* Rating & Reviews */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        
        {/* Price Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              {product.price.toLocaleString()} FC
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {product.originalPrice.toLocaleString()} FC
              </span>
            )}
          </div>
        </div>
        
        {/* Seller */}
        <p className="text-xs text-muted-foreground truncate">{product.seller}</p>
        
        {/* Add to Cart Button */}
        <Button 
          className="w-full h-9 mt-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-200 touch-manipulation"
          disabled={!product.inStock}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          <ShoppingCart className="w-3 h-3 mr-2" />
          {product.inStock ? 'Ajouter' : 'Indisponible'}
        </Button>
      </CardContent>
    </Card>
  );
};