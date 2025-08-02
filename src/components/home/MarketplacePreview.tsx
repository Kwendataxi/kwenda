import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  isPopular?: boolean;
}

interface MarketplacePreviewProps {
  featuredProducts: Product[];
  onProductSelect: (product: Product) => void;
  onViewAll: () => void;
}

export const MarketplacePreview = ({ 
  featuredProducts, 
  onProductSelect, 
  onViewAll 
}: MarketplacePreviewProps) => {
  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl">
            <ShoppingBag className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-heading-md text-foreground">Tendances</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary-glow"
          onClick={onViewAll}
        >
          Voir tout
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {featuredProducts.slice(0, 4).map((product, index) => (
          <Card 
            key={product.id}
            className="min-w-[180px] group cursor-pointer border-0 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in"
            onClick={() => onProductSelect(product)}
            style={{ 
              boxShadow: 'var(--shadow-md)',
              background: 'var(--gradient-card)',
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="aspect-square rounded-t-2xl relative overflow-hidden bg-gradient-to-br from-grey-50 to-grey-100">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}
              {product.isPopular && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-primary to-primary-glow text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                  Populaire
                </div>
              )}
              {product.originalPrice && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-accent to-accent-light text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </div>
              )}
              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm truncate mb-2 group-hover:text-primary transition-colors duration-200">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                {product.originalPrice ? (
                  <>
                    <span className="font-bold text-primary text-base">
                      {product.price.toLocaleString()} FC
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {product.originalPrice.toLocaleString()} FC
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-foreground text-base">
                    {product.price.toLocaleString()} FC
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};