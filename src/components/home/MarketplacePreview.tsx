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
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Tendances</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-purple-500"
          onClick={onViewAll}
        >
          Voir tout
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {featuredProducts.slice(0, 4).map((product) => (
          <Card 
            key={product.id}
            className="min-w-[140px] cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
            onClick={() => onProductSelect(product)}
          >
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-24 object-cover rounded-t-lg"
              />
              {product.isPopular && (
                <Badge className="absolute top-1 left-1 h-5 px-2 text-xs bg-red-500 text-white">
                  Populaire
                </Badge>
              )}
              {product.originalPrice && (
                <Badge className="absolute top-1 right-1 h-5 px-2 text-xs bg-green-500 text-white">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              )}
            </div>
            
            <div className="p-3">
              <p className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </p>
              <div className="flex items-center gap-1">
                <span className="font-bold text-purple-600 text-sm">
                  {product.price.toLocaleString()} FC
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()}
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