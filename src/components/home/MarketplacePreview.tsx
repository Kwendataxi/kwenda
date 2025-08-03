import { ShoppingBag, ArrowRight, TrendingUp, Star, Clock, Flame } from 'lucide-react';
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
          <div className="relative p-3 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl">
            <TrendingUp className="h-5 w-5 text-accent" />
            {/* Animation des tendances */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse">
              <Flame className="h-2 w-2 text-white m-0.5" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Tendances</h3>
            <p className="text-xs text-muted-foreground">Produits populaires</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary-glow hover:bg-primary/5 px-4 py-2 rounded-xl font-medium"
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
            className="min-w-[200px] group cursor-pointer border-0 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 animate-fade-in"
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
              
              {/* Badges améliorés */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isPopular && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-primary-glow text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                    <Flame className="h-3 w-3" />
                    Populaire
                  </div>
                )}
                {product.rating >= 4.5 && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Top noté
                  </div>
                )}
              </div>

              {product.originalPrice && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg animate-pulse">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </div>
              )}
              
              {/* Quick actions overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <Clock className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm truncate mb-2 group-hover:text-primary transition-colors duration-200">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
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
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Call to action */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground mb-3">
          Plus de 1000+ produits disponibles
        </p>
        <button 
          onClick={onViewAll}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-200 shadow-lg"
        >
          <ShoppingBag className="h-4 w-4" />
          Explorer le marketplace
        </button>
      </div>
    </div>
  );
};