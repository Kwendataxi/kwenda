import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompactProductCard } from './CompactProductCard';
import { ShopProductCard } from './ShopProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
  discount?: number;
  popularityScore?: number;
  viewCount?: number;
  salesCount?: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  loading?: boolean;
  cardVariant?: 'compact' | 'vertical';
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  userLocation,
  loading = false,
  cardVariant = 'compact'
}) => {
  const gridClasses = cardVariant === 'vertical' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse w-full max-w-[280px]">
            <div className={`bg-muted rounded-lg mb-2 ${cardVariant === 'vertical' ? 'h-[200px]' : 'aspect-square'}`} />
            <div className="h-3 bg-muted rounded mb-1" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={gridClasses}
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: index * 0.05 }
            }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {cardVariant === 'vertical' ? (
              <ShopProductCard
                product={{
                  id: product.id,
                  title: product.name,
                  price: product.price,
                  image: product.image,
                  rating: product.rating,
                  reviews: product.reviewCount,
                  seller: { display_name: product.seller },
                  inStock: product.isAvailable
                }}
                onAddToCart={() => onAddToCart(product)}
                onViewDetails={() => onViewDetails(product)}
              />
            ) : (
              <CompactProductCard
                product={product}
                onAddToCart={() => onAddToCart(product)}
                onViewDetails={() => onViewDetails(product)}
                onViewSeller={onViewSeller}
                userLocation={userLocation}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
