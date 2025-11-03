import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ShoppingCart, Heart, Star, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MarketplaceProduct } from '@/types/marketplace';

type Product = MarketplaceProduct;

interface OptimizedProductCardProps {
  product: Product;
  variant?: 'grid' | 'list' | 'minimal';
  onQuickView?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  cartQuantity?: number;
  showSeller?: boolean;
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number };
}

export const OptimizedProductCard = ({
  product,
  variant = 'grid',
  onQuickView,
  onBuyNow,
  cartQuantity = 0,
  showSeller = true,
  showDistance = false,
  userLocation
}: OptimizedProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const mainImage = product.image || '/placeholder.svg';
  const inStock = product.inStock;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateDistance = () => {
    if (!userLocation || !product.coordinates) return null;
    const R = 6371;
    const dLat = (product.coordinates.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (product.coordinates.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(product.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const distance = calculateDistance();

  // Vue liste (horizontale)
  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="flex gap-4 p-4">
            {/* Image compacte */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">Rupture</span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-1 text-sm">{product.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-medium">{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  {showDistance && distance && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {distance} km
                      </span>
                    </>
                  )}
                </div>
                {showSeller && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {product.seller?.display_name || 'Vendeur'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive text-white font-bold">
                  {formatPrice(product.price)}
                </Badge>
                {cartQuantity > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Au panier ({cartQuantity})
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 justify-center">
              <Button
                size="sm"
                onClick={() => onBuyNow?.(product)}
                disabled={!inStock}
                className="min-w-[100px]"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Acheter
              </Button>
              {onQuickView && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickView(product)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Vue minimal (pour scrolls horizontaux)
  if (variant === 'minimal') {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="w-40 flex-shrink-0"
      >
        <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {cartQuantity > 0 && (
              <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                {cartQuantity}
              </Badge>
            )}
          </div>
          <CardContent className="p-2 space-y-1">
            <h3 className="font-medium text-xs line-clamp-2 min-h-[2rem]">{product.title}</h3>
            <Badge className="w-full bg-destructive text-white text-xs font-bold py-1 justify-center">
              {formatPrice(product.price)}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Vue grille (par défaut) - Design compact optimisé
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <Card className="relative overflow-hidden bg-card hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Image Container - aspect-square pour uniformité */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick View Button (hover only) */}
          {onQuickView && (
            <motion.button
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="bg-white/95 px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Aperçu rapide</span>
              </div>
            </motion.button>
          )}
          
          {/* Wishlist Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
          >
            <Heart className={cn(
              "h-4 w-4 transition-all",
              isWishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"
            )} />
          </Button>

          {/* Stock Badge */}
          {!inStock && (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white backdrop-blur-sm">
              Rupture
            </Badge>
          )}

          {/* Cart Quantity Badge */}
          {cartQuantity > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-2 left-2"
            >
              <Badge className="bg-green-600 text-white font-bold">
                Au panier: {cartQuantity}
              </Badge>
            </motion.div>
          )}
        </div>
        
        {/* Product Info - Compact design */}
        <CardContent className="flex-1 flex flex-col p-3 space-y-2">
          {/* Title - 1 ligne seulement */}
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          {/* Rating compact */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-medium">{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
          
          {/* Prix Badge - grand et visible */}
          <Badge className="w-full bg-destructive hover:bg-destructive text-white text-base font-bold py-2 justify-center shadow-md">
            {formatPrice(product.price)}
          </Badge>
          
          {/* Seller info - compact */}
          {showSeller && (
            <p className="text-xs text-muted-foreground truncate">
              {product.seller?.display_name || 'Vendeur'}
            </p>
          )}
          
          {/* Bouton Acheter principal - Touch optimized */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 font-semibold shadow-md h-10"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow?.(product);
            }}
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {cartQuantity > 0 ? `Au panier (${cartQuantity})` : 'Acheter'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
