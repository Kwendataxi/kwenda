import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, Award, Heart, Check, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ShopProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    seller: { display_name: string };
    sellerLogo?: string;
    inStock: boolean;
    created_at?: string;
  };
  topPosition?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToCart: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const ShopProductCard = React.memo<ShopProductCardProps>(({
  product,
  topPosition,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  onViewDetails,
  className
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { triggerHaptic } = useHapticFeedback();

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;

  // Check if product is new (created within last 7 days)
  const isNew = product.created_at && 
    new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding) return;
    
    setIsAdding(true);
    triggerHaptic('medium');
    
    // Simulate ripple effect duration
    await new Promise(resolve => setTimeout(resolve, 200));
    
    onAddToCart();
    setShowSuccess(true);
    
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(false);
    }, 1500);
  }, [onAddToCart, triggerHaptic, isAdding]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onToggleFavorite?.();
  }, [onToggleFavorite, triggerHaptic]);

  return (
    <motion.div
      data-product-id={product.id}
      whileHover={{ y: -12, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn("w-[280px] flex-shrink-0", className)}
      onClick={onViewDetails}
    >
      <Card className={cn(
        "group relative overflow-hidden bg-card border-2 border-border/50",
        "hover:border-orange-300 hover:shadow-[0_20px_50px_-12px_rgba(249,115,22,0.4)]",
        "transition-all duration-500 cursor-pointer h-full rounded-3xl"
      )}>
        {/* Image Container */}
        <div className="relative w-full h-[200px] overflow-hidden rounded-t-3xl bg-gradient-to-br from-orange-50 to-amber-50">
          {/* Shimmer loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/50 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          )}
          
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => setImageLoaded(true)}
          >
            <OptimizedImage
              src={product.image}
              alt={product.title}
              width={280}
              height={200}
              objectFit="cover"
              className="w-full h-full"
              priority={topPosition ? topPosition <= 3 : false}
            />
          </motion.div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Top Position Badge */}
            {topPosition && topPosition <= 3 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <Badge className={cn(
                  "text-xs font-black px-2.5 py-1 flex items-center gap-1 shadow-lg",
                  topPosition === 1 && "bg-gradient-to-r from-yellow-400 to-orange-400 text-white",
                  topPosition === 2 && "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800",
                  topPosition === 3 && "bg-gradient-to-r from-orange-300 to-amber-400 text-white"
                )}>
                  <Award className="h-3.5 w-3.5" />
                  #{topPosition}
                </Badge>
              </motion.div>
            )}
            
            {/* New Badge */}
            {isNew && !topPosition && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-2 py-0.5 shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nouveau
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="absolute top-3 right-3 z-20"
            >
              <Button
                variant="secondary"
                size="icon"
                onClick={handleToggleFavorite}
                className={cn(
                  "w-10 h-10 rounded-full shadow-xl backdrop-blur-md transition-all",
                  isFavorite 
                    ? "bg-gradient-to-br from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white" 
                    : "bg-white/90 hover:bg-white text-gray-500 hover:text-rose-500"
                )}
              >
                <motion.div
                  animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </motion.div>
              </Button>
            </motion.div>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <Badge className="bg-red-500 text-white text-sm px-4 py-2 font-bold">
                Épuisé
              </Badge>
            </div>
          )}

          {/* Add to Cart Button - Premium 3D Style */}
          {product.inStock && (
            <motion.div 
              className="absolute bottom-4 right-4 z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                size="icon"
                onClick={handleAddToCart}
                disabled={isAdding}
                className={cn(
                  "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
                  showSuccess 
                    ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                    : "bg-gradient-to-br from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600",
                  "text-white hover:shadow-orange-500/50"
                )}
              >
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <Plus className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Content - Glassmorphism style */}
        <div className="p-4 space-y-3 bg-gradient-to-b from-card to-card/50">
          {/* Product Name */}
          <h3 className="text-lg font-bold line-clamp-2 text-foreground leading-tight min-h-[3rem] group-hover:text-orange-600 transition-colors">
            {product.title}
          </h3>

          {/* Vendor Info */}
          <div className="flex items-center gap-2">
            {product.sellerLogo ? (
              <img 
                src={product.sellerLogo} 
                alt={product.seller.display_name}
                className="w-8 h-8 rounded-full object-cover border-2 border-orange-200 shadow-md"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {product.seller.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-600 truncate">
                {product.seller.display_name}
              </p>
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviews > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({product.reviews})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price - Orange accent */}
          <div className="pt-3 border-t border-orange-100">
            <p className="text-2xl font-black bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              {formatCurrency(product.price)}
            </p>
          </div>
        </div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.isFavorite === nextProps.isFavorite &&
         prevProps.topPosition === nextProps.topPosition;
});
