import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, MessageCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  description: string;
  specifications: Record<string, string>;
  inStock: boolean;
  stockCount: number;
}

interface MarketplaceProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: () => void;
  onStartChat: () => void;
  onCreateOrder: () => void;
}

export const MarketplaceProductDetails: React.FC<MarketplaceProductDetailsProps> = ({
  product,
  onBack,
  onAddToCart,
  onStartChat,
  onCreateOrder
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">{product.name}</h1>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Image */}
        <Card>
          <CardContent className="p-0">
            <div className="aspect-square relative overflow-hidden rounded-lg">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                className={`absolute top-4 right-4 rounded-full ${
                  isWishlisted ? 'text-red-500' : 'text-white'
                }`}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
              <Badge variant="secondary" className="mt-2">
                {product.category}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews} avis)
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {product.price.toLocaleString()} FC
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={product.inStock ? 'default' : 'destructive'}>
                {product.inStock ? 'En stock' : 'Rupture de stock'}
              </Badge>
              {product.inStock && (
                <span className="text-sm text-muted-foreground">
                  {product.stockCount} disponibles
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>

        {/* Seller Info */}
        <Card>
          <CardHeader>
            <CardTitle>Vendeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.seller}</p>
                <p className="text-sm text-muted-foreground">Vendeur vérifié</p>
              </div>
              <Button variant="outline" onClick={onStartChat}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Selector */}
        {product.inStock && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Quantité</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="font-medium px-4">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    disabled={quantity >= product.stockCount}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={onCreateOrder}
                  disabled={!product.inStock}
                >
                  Commander maintenant
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};