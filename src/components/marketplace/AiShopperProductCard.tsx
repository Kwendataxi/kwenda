import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Package, Plus, Check, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export const AiShopperProductCard = React.memo<AiShopperProductCardProps>(({
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
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculer les promos dynamiques si pas fournies
  const actualDiscount = product.discount || calculateDiscount({
    stockCount: product.stockCount,
    created_at: product.created_at,
    rating: product.rating || 0,
  } as any);

  const actualOriginalPrice = product.originalPrice || (actualDiscount > 0 ? getOriginalPrice(product.price, actualDiscount) : undefined);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onToggleFavorite();
  };

  const handleCardClick = () => {
    triggerHaptic('light');
    onQuickView();
  };

  const handleAddToCartButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.inStock) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      triggerHaptic('medium');
      
      onAddToCart();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1200);
    }
  };

  const isNewProduct = (createdAt?: string) => {
    if (!createdAt) return false;
    const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation <= 7;
  };

  // Badge position styling - style sobre comme FoodDishCard
  const getPositionStyle = (isTop: boolean) => {
    return 'bg-amber-500 text-white';
  };

  // Format prix compact (ex: 2.5M au lieu de 2 500 000 CDF)
  const formatCompactPrice = (price: number) => {
    if (price >= 1000000) {
      const val = price / 1000000;
      return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
    }
    if (price >= 1000) {
      const val = price / 1000;
      return val % 1 === 0 ? `${val}K` : `${val.toFixed(0)}K`;
    }
    return formatCurrency(price);
  };

  return (
    <motion.div
      data-product-id={product.id}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className={cn('relative cursor-pointer', className)}
    >
      <div className={cn(
        "relative w-full overflow-hidden rounded-xl bg-card border border-border/20 shadow-sm",
        !product.inStock && "opacity-50"
      )}>
        {/* Image - aspect ratio optimisé */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          {!imageError ? (
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Badge promo ou nouveau */}
          {actualDiscount > 0 ? (
            <Badge className="absolute top-1.5 left-1.5 z-10 bg-rose-500 text-white text-[9px] px-1.5 py-0 h-4 border-0 font-medium">
              -{actualDiscount}%
            </Badge>
          ) : isNewProduct(product.created_at) && (
            <Badge className="absolute top-1.5 left-1.5 z-10 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-4 border-0 font-medium">
              Nouveau
            </Badge>
          )}

          {/* Favoris */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleToggleFavorite}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
              )}
            />
          </motion.button>

          {/* Épuisé */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Épuisé
              </span>
            </div>
          )}
        </div>

        {/* Contenu compact */}
        <div className="p-2 space-y-0.5">
          {/* Titre */}
          <h3 className="font-medium text-xs text-foreground line-clamp-1 leading-tight">
            {product.title}
          </h3>

          {/* Vendeur + Rating inline */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="truncate flex-1">{product.seller.display_name}</span>
            {product.rating !== undefined && product.rating > 0 && (
              <span className="flex items-center gap-0.5 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Footer: Prix + Bouton */}
          <div className="flex items-center justify-between pt-1 border-t border-border/20 mt-1">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-sm font-bold text-primary">
                {formatCompactPrice(product.price)}
              </span>
              {actualOriginalPrice && actualOriginalPrice > product.price && (
                <span className="text-[9px] text-muted-foreground/60 line-through">
                  {formatCompactPrice(actualOriginalPrice)}
                </span>
              )}
            </div>

            {/* Bouton + compact */}
            <Button
              size="icon"
              disabled={!product.inStock}
              onClick={handleAddToCartButton}
              className={cn(
                "w-7 h-7 rounded-lg shadow-sm transition-all active:scale-90 shrink-0",
                showSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-500"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Badge quantité */}
              {cartQuantity > 0 && !showSuccess && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm border border-background"
                >
                  <span className="text-[8px] font-bold text-white">
                    {cartQuantity > 9 ? '9+' : cartQuantity}
                  </span>
                </motion.div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.isFavorite === nextProps.isFavorite &&
         prevProps.cartQuantity === nextProps.cartQuantity;
});