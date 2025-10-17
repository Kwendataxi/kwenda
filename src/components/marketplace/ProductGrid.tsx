import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompactProductCard } from './CompactProductCard';

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
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  userLocation,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-lg mb-2" />
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
            <CompactProductCard
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onViewDetails={() => onViewDetails(product)}
              onViewSeller={onViewSeller}
              userLocation={userLocation}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
