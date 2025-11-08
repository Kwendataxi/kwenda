import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Eye, Store, Package, Sparkles, Star, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { cn } from '@/lib/utils';

interface AiShopperProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    seller: { display_name: string };
    seller_id: string;
    inStock: boolean;
    stockCount: number;
    rating?: number;
    reviews?: number;
    created_at?: string;
  };
  cartQuantity?: number;
  onAddToCart: () => void;
  onQuickView: () => void;
  onToggleFavorite: () => void;
  onVisitShop?: (vendorId: string) => void;
  isFavorite: boolean;
  className?: string;
}

export const AiShopperProductCard: React.FC<AiShopperProductCardProps> = ({
  product,
  cartQuantity = 0,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  onVisitShop,
  isFavorite,
  className
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const { formatCurrency } = useLanguage();
  const { calculateDiscount, getOriginalPrice, getPromotionLabel } = useProductPromotions();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculer les promos dynamiques si pas fournies
  const actualDiscount = product.discount || calculateDiscount({
    stockCount: product.stockCount,
    created_at: product.created_at,
    rating: product.rating || 0,
  } as any);

  const actualOriginalPrice = product.originalPrice || (actualDiscount > 0 ? getOriginalPrice(product.price, actualDiscount) : undefined);
  const promoLabel = getPromotionLabel(actualDiscount);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    triggerHaptic('medium');
    onAddToCart();
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onQuickView();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onToggleFavorite();
  };

  const handleVisitShop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVisitShop) {
      triggerHaptic('light');
      onVisitShop(product.seller_id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      <Card className="overflow-hidden border-border/40 bg-card hover:shadow-lg transition-all duration-300 relative group">
        {/* Image Container avec ratio 3/4 */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {/* Discount Badge - En haut à gauche avec label promo */}
          {actualDiscount > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-2 left-2 z-10"
            >
              <div className="relative">
                <Badge className="bg-gradient-to-r from-red-500 to-yellow-500 text-white font-black text-xs px-3 py-1.5 shadow-lg">
                  -{actualDiscount}%
                </Badge>
                {promoLabel && (
                  <div className="absolute -bottom-6 left-0 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {promoLabel}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Heart Icon - En haut à droite */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </motion.button>

          {/* Quick View Button - En bas à gauche sur l'image */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleQuickView}
            className="absolute bottom-2 left-2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-blue-500 text-blue-500 flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </motion.button>

          {/* Product Image */}
          {!imageError ? (
            <img
              src={product.image}
              alt={product.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                !imageLoaded && "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Overlay Épuisé */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold text-sm">
                Épuisé
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Product Name */}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[40px]">
            {product.title}
          </h3>

          {/* Rating ou Nouveau Produit */}
          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
              {product.reviews && product.reviews > 0 && (
                <span className="text-xs text-muted-foreground">({product.reviews})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              <span>Nouveau produit</span>
            </div>
          )}

          {/* Seller Info - Cliquable */}
          {onVisitShop && (
            <button
              onClick={handleVisitShop}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Store className="h-3 w-3" />
              {product.seller.display_name}
            </button>
          )}

          {/* Price Section */}
          <div className="flex items-center gap-2 pt-1">
            {/* Current Price */}
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>

            {/* Original Price (barré) */}
            {actualOriginalPrice && actualOriginalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(actualOriginalPrice)}
              </span>
            )}
          </div>

          {/* Bouton FAB moderne - Positionné sur l'image */}
          <motion.button
            disabled={!product.inStock}
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
            whileHover={{ 
              scale: 1.15,
              rotate: [0, -5, 5, 0],
              transition: { rotate: { duration: 0.5 } }
            }}
            whileTap={{ scale: 0.9 }}
          >
            <ShoppingCart className="h-5 w-5" />
            
            {/* Badge quantité au panier */}
            {cartQuantity > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white"
              >
                <span className="text-[10px] font-bold text-white">
                  {cartQuantity}
                </span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
};
