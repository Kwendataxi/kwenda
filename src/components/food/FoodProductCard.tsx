import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FoodProduct } from '@/types/food';

interface FoodProductCardProps {
  product: FoodProduct;
  cartQuantity: number;
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
}

export const FoodProductCard = ({ product, cartQuantity, onAddToCart }: FoodProductCardProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex gap-3">
          {/* Image */}
          {product.main_image_url && (
            <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden">
              <img
                src={product.main_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {cartQuantity > 0 && (
                <Badge className="absolute top-1 right-1 bg-orange-500 text-white">
                  {cartQuantity}
                </Badge>
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
            <div>
              <h4 className="font-semibold truncate">{product.name}</h4>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-orange-600">{formatPrice(product.price)}</span>

              {cartQuantity === 0 ? (
                <Button
                  size="sm"
                  onClick={handleAdd}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => {
                      if (quantity > 1) setQuantity(quantity - 1);
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-semibold w-8 text-center">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    className="bg-orange-500 hover:bg-orange-600 h-7"
                  >
                    +{quantity}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
