import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MapPin, 
  User, 
  ShoppingBag,
  MessageCircle,
  Info,
  Minus,
  Plus,
  FileText,
  Sparkles,
  Store
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProductChatTab } from './ProductChatTab';
import { ProductSpecifications } from './ProductSpecifications';
import { HorizontalProductScroll } from './HorizontalProductScroll';

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
  discount?: number;
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
  brand?: string;
  condition?: string;
  stockCount?: number;
  images?: string[];
  specifications?: Record<string, string>;
}

interface ProductDetailsDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onViewSeller: (sellerId: string) => void;
  userLocation?: { lat: number; lng: number };
  similarProducts?: Product[];
  sellerProducts?: Product[];
}

export const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onViewSeller,
  userLocation,
  similarProducts = [],
  sellerProducts = []
}) => {
  const [quantity, setQuantity] = useState(1);
  const { wallet, topUpWallet } = useWallet();

  if (!product) return null;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} CDF`;
  
  const totalPrice = product.price * quantity;
  const canAfford = wallet && wallet.balance >= totalPrice;

  const handleBuyNow = async () => {
    if (!canAfford) {
      toast.error('Solde insuffisant. Veuillez recharger votre wallet KwendaPay.');
      return;
    }

    try {
      // Add to cart with quantity
      for (let i = 0; i < quantity; i++) {
        onAddToCart(product);
      }
      
      toast.success(`${product.name} ajouté au panier`);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  };

  const handleRecharge = () => {
    // This would open recharge dialog
    toast.info('Fonction de rechargement KwendaPay à implémenter');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-3 sm:p-4 pb-2 border-b">
          <DialogTitle className="text-base sm:text-lg font-semibold line-clamp-2">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="mx-3 sm:mx-4 my-2 grid w-auto grid-cols-2 h-9">
            <TabsTrigger value="details" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Chat vendeur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(90vh-280px)] sm:h-[calc(90vh-260px)] px-3 sm:px-4">
              {/* Product Image */}
              <div className="aspect-video sm:aspect-square w-full overflow-hidden rounded-lg mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Price and Rating Card */}
              <div className="mb-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-xs sm:text-sm text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                          {product.discount && (
                            <Badge variant="destructive" className="text-xs h-5">
                              -{product.discount}%
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background rounded-md px-2.5 py-1.5 w-fit">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{product.rating.toFixed(1)}</span>
                    {product.reviewCount > 0 && (
                      <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller Info Card */}
              <div className="mb-3 p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">{product.seller}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs h-8"
                    onClick={() => {
                      onViewSeller(product.sellerId);
                      onClose();
                    }}
                  >
                    Voir boutique
                  </Button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Description</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Specifications */}
              <div className="mb-3">
                <ProductSpecifications
                  brand={product.brand}
                  condition={product.condition}
                  stockCount={product.stockCount}
                  specifications={product.specifications}
                />
              </div>

              {/* Similar Products Section */}
              {similarProducts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Produits similaires</h4>
                  </div>
                  <HorizontalProductScroll
                    title=""
                    products={similarProducts}
                    onAddToCart={onAddToCart}
                    onViewDetails={(prod) => {
                      onClose();
                      setTimeout(() => {}, 100);
                    }}
                    onViewSeller={onViewSeller}
                    userLocation={userLocation}
                  />
                </div>
              )}

              {/* Seller Other Products Section */}
              {sellerProducts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Autres produits de ce vendeur</h4>
                  </div>
                  <HorizontalProductScroll
                    title=""
                    products={sellerProducts}
                    onAddToCart={onAddToCart}
                    onViewDetails={(prod) => {
                      onClose();
                      setTimeout(() => {}, 100);
                    }}
                    onViewSeller={onViewSeller}
                    userLocation={userLocation}
                  />
                </div>
              )}

            </ScrollArea>

            {/* Sticky Footer Actions */}
            <div className="p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="space-y-2.5">
                {/* Quantity and Total Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-medium text-sm min-w-6 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-primary truncate">
                      {formatCurrency(totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Buy Button */}
                {!canAfford ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      Solde insuffisant. Rechargez votre wallet.
                    </p>
                    <Button 
                      onClick={handleRecharge}
                      className="w-full h-10"
                      variant="secondary"
                      size="sm"
                    >
                      Recharger KwendaPay
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleBuyNow}
                    disabled={!product.isAvailable}
                    className="w-full h-10"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    <span className="text-sm">{product.isAvailable ? 'Acheter maintenant' : 'Produit épuisé'}</span>
                  </Button>
                )}

                {/* Wallet Balance */}
                {wallet && (
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                    <span>Solde KwendaPay</span>
                    <span className={cn(
                      "font-medium",
                      canAfford ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(wallet.balance)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 mt-0 h-[calc(85vh-120px)]">
            <ProductChatTab
              productId={product.id}
              sellerId={product.sellerId}
              productTitle={product.name}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};