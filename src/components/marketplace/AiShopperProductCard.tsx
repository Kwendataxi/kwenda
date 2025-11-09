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
      <Card className="overflow-hidden border-border/40 bg-card hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative group">
        {/* Image Container - Ratio carré */}
        <div className="relative aspect-square overflow-hidden bg-muted rounded-t-lg">
          {/* Discount Badge - Plus compact avec animation */}
          {actualDiscount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 left-2 z-10"
            >
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm px-2.5 py-1 shadow-lg border-2 border-white/30">
                -{actualDiscount}%
              </Badge>
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

          {/* Product Image */}
          {!imageError ? (
            <img
              src={product.image}
              alt={product.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110",
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

        {/* Product Info - NOUVELLE STRUCTURE */}
        <div className="p-3 space-y-2.5">
          {/* 1. Titre Produit */}
          <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug min-h-[36px]">
            {product.title}
          </h3>

          {/* 2. Vendeur + Rating sur la même ligne */}
          <div className="flex items-center justify-between text-xs">
            {/* Vendeur */}
            {onVisitShop && (
              <button
                onClick={handleVisitShop}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <Store className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{product.seller.display_name}</span>
              </button>
            )}

            {/* Rating ou Badge Nouveau */}
            {product.rating && product.rating > 0 ? (
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
              </div>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Nouveau
              </Badge>
            )}
          </div>

          {/* 3. Section Prix - Plus visible et moderne */}
          <div className="space-y-1 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-2.5 border border-border/40">
            {/* Prix avec promo */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                {/* Prix actuel */}
                <span className="text-xl font-black text-foreground">
                  {formatCurrency(product.price)}
                </span>
                
                {/* Prix barré si promo */}
                {actualOriginalPrice && actualOriginalPrice > product.price && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(actualOriginalPrice)}
                  </span>
                )}
              </div>

              {/* Badge économie */}
              {actualDiscount > 0 && actualOriginalPrice && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 font-bold">
                  -{formatCurrency(actualOriginalPrice - product.price)}
                </Badge>
              )}
            </div>

            {/* Stock indicator */}
            {product.inStock && product.stockCount <= 5 && (
              <div className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400">
                <Package className="h-3 w-3" />
                <span className="font-semibold">Plus que {product.stockCount} en stock</span>
              </div>
            )}
          </div>

          {/* 4. Bouton Ajouter - Nouvelle position */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full pt-1"
          >
            <Button
              disabled={!product.inStock}
              onClick={handleAddToCart}
              className={cn(
                "w-full font-bold shadow-md transition-all h-11",
                product.inStock 
                  ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white hover:shadow-lg"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartQuantity > 0 ? (
                <>
                  Au panier
                  <Badge className="ml-2 bg-white/20 text-white border-white/30">
                    {cartQuantity}
                  </Badge>
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </motion.div>

          {/* Quick View - Dans le coin en bas */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickView}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-3 w-3 mr-1" />
            Aperçu rapide
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
