import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, ShoppingCart } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { toast } from 'sonner';

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  rating_average?: number;
  stock_quantity?: number;
}

interface SimilarProductsCarouselProps {
  products: SimilarProduct[];
  onAddToCart?: (productId: string) => void;
}

export const SimilarProductsCarousel: React.FC<SimilarProductsCarouselProps> = ({
  products,
  onAddToCart
}) => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    dragFree: true 
  });

  if (!products || products.length === 0) {
    return null;
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/marketplace/product/${productId}`);
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(productId);
    } else {
      toast.success('Produit ajouté au panier');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-0 sm:px-0">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Produits similaires
        </h3>
      </div>

      <div className="overflow-hidden -mx-4 sm:mx-0" ref={emblaRef}>
        <div className="flex gap-3 px-4 sm:px-0">
          {products.map(product => {
            const mainImage = Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : '/placeholder.svg';
            const inStock = (product.stock_quantity ?? 1) > 0;
            const rating = product.rating_average || 0;

            return (
              <div 
                key={product.id}
                className="flex-[0_0_75%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    {/* Image */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={mainImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {!inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary">Rupture de stock</Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h4>

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-medium">
                          {rating > 0 ? rating.toFixed(1) : '0.0'}
                        </span>
                      </div>

                      {/* Prix */}
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </p>

                      {/* Action button */}
                      <Button 
                        size="sm"
                        className="w-full"
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={!inStock}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {inStock ? 'Ajouter' : 'Indisponible'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
