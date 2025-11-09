import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Package, ShoppingCart, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  const { user } = useAuth();
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

  const handleContactSeller = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    try {
      const { useUniversalChat } = await import('@/hooks/useUniversalChat');
      const hook = useUniversalChat();
      await hook.createOrFindConversation(
        'marketplace',
        product.seller_id,
        product.id,
        `Discussion sur : ${product.title}`
      );
      window.location.href = '/marketplace?tab=messages';
    } catch (error) {
      console.error('Error creating conversation:', error);
      if ((error as Error).message?.includes('vous-même')) {
        toast.error('Vous ne pouvez pas contacter votre propre boutique');
      } else {
        toast.error('Erreur lors de la création de la conversation');
      }
    }
  };

  const handleCardClick = () => {
    console.log('🖱️ [ProductCard] Click sur carte:', product.title);
    triggerHaptic('light');
    onQuickView();
  };

  const handleAddToCartButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🛒 [ProductCard] Click bouton panier:', product.title);
    if (product.inStock) {
      triggerHaptic('light');
      onAddToCart();
    }
  };

  const isNewProduct = (createdAt?: string) => {
    if (!createdAt) return false;
    const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation <= 7;
  };

  return (
    <motion.div
      data-product-id={product.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.01 }}
      className={cn("w-full", className)}
    >
      <Card 
        onClick={handleCardClick}
        className="overflow-hidden bg-card border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-2xl group cursor-pointer"
      >
        {/* Image Container - Ratio carré */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {/* Discount Badge OU Badge Nouveauté */}
          {actualDiscount > 0 ? (
            <Badge className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-white font-black text-base px-3 py-1.5 rounded-lg shadow-lg">
              {actualDiscount}%
            </Badge>
          ) : isNewProduct(product.created_at) && (
            <Badge className="absolute top-2.5 left-2.5 z-10 bg-white text-red-600 font-bold text-xs px-2.5 py-1 rounded-md shadow-md">
              NOUVEAUTÉ
            </Badge>
          )}

          {/* Bouton Ajouter - Toujours visible mobile, hover desktop */}
          {product.inStock && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCartButton}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
              
              {/* Badge quantité au panier */}
              {cartQuantity > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                >
                  <span className="text-[10px] font-bold text-white">
                    {cartQuantity}
                  </span>
                </motion.div>
              )}
            </motion.button>
          )}

          {/* Bouton Contacter - Toujours visible mobile, hover desktop */}
          {user && user.id !== product.seller_id && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContactSeller}
              className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-white text-primary shadow-lg flex items-center justify-center z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
              title="Contacter le vendeur"
            >
              <MessageCircle className="h-5 w-5" />
            </motion.button>
          )}

          {/* Heart Icon - Top Right */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleFavorite}
            className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              )}
            />
          </motion.button>

          {/* Product Image */}
          {!imageError ? (
            <img
              src={product.image}
              alt={product.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                !imageLoaded && "opacity-0"
              )}
              onLoad={() => {
                console.log('✅ [ProductCard] Image loaded:', product.title);
                setImageLoaded(true);
              }}
              onError={() => {
                console.error('❌ [ProductCard] Image failed:', product.image);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Overlay Épuisé - Plus discret */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <Badge variant="destructive" className="text-xs px-3 py-1">
                Épuisé
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info - ULTRA MINIMALISTE */}
        <div className="p-2.5 space-y-1.5">
          {/* 1. PRIX (grand, gras, rouge) */}
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">
              {formatCurrency(product.price)}
            </div>
            {/* Prix barré si promo */}
            {actualOriginalPrice && actualOriginalPrice > product.price && (
              <div className="text-sm text-gray-400 dark:text-gray-500 line-through font-normal">
                {formatCurrency(actualOriginalPrice)}
              </div>
            )}
          </div>

          {/* 2. TITRE (simple, compact) */}
          <h3 className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight font-normal">
            {product.title}
          </h3>
        </div>
      </Card>
    </motion.div>
  );
};
