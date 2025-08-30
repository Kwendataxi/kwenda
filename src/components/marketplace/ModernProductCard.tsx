import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Star, ShoppingCart, Heart, Eye, MapPin, Shield } from 'lucide-react';
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
  coordinates?: { lat: number; lng: number };
}

interface ModernProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userCoordinates?: { lat: number; lng: number } | null;
}

export const ModernProductCard: React.FC<ModernProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails,
  userCoordinates 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistance = () => {
    if (!userCoordinates || !product.coordinates) return null;
    return calculateDistance(
      userCoordinates.lat, userCoordinates.lng,
      product.coordinates.lat, product.coordinates.lng
    );
  };

  const distance = getDistance();

  return (
    <Card className="group overflow-hidden transition-all duration-500 hover:shadow-float hover:-translate-y-2 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-0 shadow-lg">
      <div className="relative overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="w-full h-48 md:h-52" />
        )}
        <img 
          src={product.image} 
          alt={product.name}
          className={`w-full h-48 md:h-52 object-cover transition-all duration-700 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <Button 
            size="sm" 
            variant="secondary"
            className="h-12 w-12 p-0 rounded-full bg-white/95 hover:bg-white backdrop-blur-md shadow-lg touch-manipulation"
            onClick={() => onViewDetails(product)}
          >
            <Eye className="w-5 h-5" />
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            className={`h-12 w-12 p-0 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 touch-manipulation ${
              isWishlisted 
                ? 'bg-primary text-white hover:bg-primary/90 scale-110' 
                : 'bg-white/95 hover:bg-white'
            }`}
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={`w-5 h-5 transition-all duration-300 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
          </Button>
        </div>

        {/* Premium Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.originalPrice && product.originalPrice > product.price && (
            <Badge variant="destructive" className="bg-gradient-to-r from-primary to-primary-light text-white font-bold px-3 py-1 text-xs shadow-lg">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </Badge>
          )}
          <Badge className="bg-gradient-to-r from-accent to-accent-light text-foreground font-medium px-2 py-1 text-xs shadow-lg">
            <Shield className="w-3 h-3 mr-1" />
            Escrow
          </Badge>
        </div>

        {/* Distance Badge */}
        {distance && (
          <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 text-foreground font-medium px-2 py-1 text-xs shadow-lg backdrop-blur-sm">
            <MapPin className="w-3 h-3 mr-1" />
            {distance.toFixed(1)}km
          </Badge>
        )}
        
        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md">
            <Badge variant="secondary" className="bg-white/95 text-foreground font-medium px-4 py-2">
              Rupture de stock
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5 space-y-4">
        {/* Product Title */}
        <h3 className="font-bold text-base md:text-lg leading-tight line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>
        
        {/* Rating & Reviews */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="text-sm font-semibold">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
          <Badge variant="outline" className="text-xs bg-muted/30 backdrop-blur-sm">
            {product.category}
          </Badge>
        </div>
        
        {/* Seller */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{product.seller.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{product.seller}</p>
        </div>
        
        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <span className="font-black text-xl text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {product.price.toLocaleString()} FC
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice.toLocaleString()} FC
              </span>
            )}
          </div>
          
          {/* Delivery Info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Livraison rapide • Protection escrow</span>
          </div>
        </div>
        
        {/* Modern Action Button */}
        <Button 
          className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] touch-manipulation"
          disabled={!product.inStock}
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
        </Button>
      </CardContent>
    </Card>
  );
};