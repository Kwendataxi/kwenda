import { ShoppingBag, ArrowRight, TrendingUp, Star, Clock, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{t('home.marketplace.trending')}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary"
          onClick={onViewAll}
        >
          {t('home.marketplace.view_all')}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {featuredProducts.slice(0, 4).map((product) => (
          <Card 
            key={product.id}
            className="min-w-[160px] cursor-pointer border-0 rounded-xl hover:shadow-md transition-all duration-200"
            onClick={() => onProductSelect(product)}
          >
            <div className="aspect-square rounded-t-xl relative overflow-hidden bg-grey-50">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {product.isPopular && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                  {t('home.marketplace.popular')}
                </div>
              )}

              {product.originalPrice && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-foreground text-sm truncate mb-1">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {product.price.toLocaleString()} FC
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};