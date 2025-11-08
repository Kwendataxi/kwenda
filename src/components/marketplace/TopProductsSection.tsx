import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { ShopProductCard } from './ShopProductCard';
import { MarketplaceProduct } from '@/types/marketplace';

interface TopProductsSectionProps {
  products: MarketplaceProduct[];
  onAddToCart: (product: MarketplaceProduct) => void;
  onViewDetails: (product: MarketplaceProduct) => void;
}

export const TopProductsSection: React.FC<TopProductsSectionProps> = ({
  products,
  onAddToCart,
  onViewDetails
}) => {
  // Calculer un score dynamique pour chaque produit
  const topProducts = products
    .filter(p => p.inStock) // Seulement produits en stock
    .map(p => ({
      ...p,
      calculatedScore: (p.popularityScore || 0) + (p.salesCount || 0) * 10 + (p.viewCount || 0) * 2 + (p.rating || 0) * 5
    }))
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, 8);

  if (topProducts.length === 0) return null;

  return (
    <section className="px-4 py-6">
      {/* Header */}
      <motion.div 
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
          <Star className="h-6 w-6 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            ⭐ Top Produits
          </h2>
          <p className="text-sm text-muted-foreground">Les plus populaires du moment</p>
        </div>
      </motion.div>

      {/* Horizontal Scrollable Carousel */}
      <div 
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
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
            transition={{ delay: index * 0.1 }}
            style={{ scrollSnapAlign: 'start' }}
          >
            <ShopProductCard
              product={product}
              topPosition={index < 3 ? index + 1 : undefined}
              onAddToCart={() => onAddToCart(product)}
              onViewDetails={() => onViewDetails(product)}
            />
          </motion.div>
        ))}
      </div>

      {/* Gradient fade at edges for visual effect */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};
