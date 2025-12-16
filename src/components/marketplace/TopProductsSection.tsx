import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import { ShopProductCard } from './ShopProductCard';
import { MarketplaceProduct } from '@/types/marketplace';
import { Button } from '@/components/ui/button';

interface TopProductsSectionProps {
  products: MarketplaceProduct[];
  onAddToCart: (product: MarketplaceProduct) => void;
  onViewDetails: (product: MarketplaceProduct) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: (productId: string) => boolean;
  onViewAll?: () => void;
}

export const TopProductsSection: React.FC<TopProductsSectionProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  isFavorite,
  onViewAll
}) => {
  // Calculer un score dynamique pour chaque produit
  const topProducts = products
    .filter(p => p.inStock)
    .map(p => ({
      ...p,
      calculatedScore: (p.popularityScore || 0) + (p.salesCount || 0) * 10 + (p.viewCount || 0) * 2 + (p.rating || 0) * 5
    }))
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, 8);

  if (topProducts.length === 0) return null;

  return (
    <section className="py-6 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 via-transparent to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 pointer-events-none" />
      
      <div className="relative">
        {/* Header - Premium style */}
        <motion.div 
          className="flex items-center justify-between gap-3 mb-6 px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 shadow-xl shadow-orange-500/30"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Flame className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  🔥
                </motion.span>
                Top Produits
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Les plus vendus cette semaine
              </p>
            </div>
          </div>
          
          {onViewAll && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onViewAll}
                className="font-bold border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Horizontal Scrollable Carousel */}
        <div 
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {topProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ShopProductCard
                product={product}
                topPosition={index < 3 ? index + 1 : undefined}
                isFavorite={isFavorite?.(product.id)}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(product.id) : undefined}
                onAddToCart={() => onAddToCart(product)}
                onViewDetails={() => onViewDetails(product)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
