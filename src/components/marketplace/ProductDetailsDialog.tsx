import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Store,
  Package,
  Eye,
  ShoppingCart as CartIcon,
  TrendingUp,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProductChatTab } from './ProductChatTab';
import { ProductSpecifications } from './ProductSpecifications';
import { HorizontalProductScroll } from './HorizontalProductScroll';
import { TopUpModal } from '@/components/wallet/TopUpModal';

import { getCategoryName, getConditionLabel } from '@/config/marketplaceCategories';

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
  viewCount?: number;
  salesCount?: number;
  popularityScore?: number;
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
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');
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
    setShowTopUpModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto h-[100vh] sm:h-[95vh] sm:max-h-[95vh] p-0 gap-0 sm:rounded-lg">
        {activeTab === 'details' && (
          <DialogHeader className="p-2 sm:p-3 pb-2 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
            <DialogTitle className="text-sm sm:text-base font-semibold line-clamp-1 pr-6">
              {product.name}
            </DialogTitle>
          </DialogHeader>
        )}

        <Tabs 
          defaultValue="chat" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'chat' | 'details')}
          className="flex-1 flex flex-col h-full"
        >
          <TabsList className="mx-2 sm:mx-3 my-1.5 grid grid-cols-2 h-10 sm:h-11 sticky top-0 z-10 bg-background">
            <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Vendeur</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Détails</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 mt-0 h-[calc(85vh-120px)]">
            <ProductChatTab
              productId={product.id}
              sellerId={product.sellerId}
              productTitle={product.name}
              sellerName={product.seller}
              onClose={onClose}
            />
          </TabsContent>

          <TabsContent value="details" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(95vh-220px)] sm:h-[calc(95vh-200px)] px-2 sm:px-3">
              {/* Product Image - optimized loading */}
              <div className="aspect-square sm:aspect-[4/3] w-full max-h-64 sm:max-h-80 overflow-hidden rounded-lg mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info & Price - soft layout */}
              <div className="mb-4 space-y-2">
                {/* Category, Condition & Stock - texte simple */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {getCategoryName(product.category)}
                  </span>
                  {product.condition && (
                    <span>• {getConditionLabel(product.condition)}</span>
                  )}
                  {product.stockCount !== undefined && (
                    <span className="ml-auto text-orange-600 font-medium">
                      Stock: {product.stockCount}
                    </span>
                  )}
                </div>
                
                {/* Prix et note en ligne plate */}
                <div className="flex items-baseline justify-between">
                  <div className="space-y-0.5">
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {formatCurrency(product.price)}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                        {product.discount && (
                          <span className="text-xs text-red-600 font-medium">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                      {product.reviewCount > 0 && (
                        <span className="text-xs">({product.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Info - ligne horizontale */}
              <div className="mb-4 flex items-center justify-between py-2 border-y">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{product.seller}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary hover:text-primary/80"
                  onClick={() => {
                    onViewSeller(product.sellerId);
                    onClose();
                  }}
                >
                  Voir boutique →
                </Button>
              </div>

              {/* Description - simple */}
              {product.description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Specifications - only if exists */}
              {(product.brand || product.specifications) && (
                <div className="mb-3">
                  <ProductSpecifications
                    brand={product.brand}
                    condition={product.condition}
                    stockCount={product.stockCount}
                    specifications={product.specifications}
                  />
                </div>
              )}

              {/* Statistiques de popularité - seulement si significatives (>50 ventes) */}
              {product.salesCount && product.salesCount > 50 && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <h4 className="text-xs sm:text-sm font-semibold">Produit populaire</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-background">
                      <CartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs sm:text-sm font-semibold">{product.salesCount}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Vendus</p>
                    </div>
                    <div className="text-center p-2 rounded bg-background">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400 mx-auto mb-1" />
                      <p className="text-xs sm:text-sm font-semibold">{product.rating.toFixed(1)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Note</p>
                    </div>
                  </div>
                  <div className="mt-2 p-1.5 bg-primary/10 rounded text-center">
                    <p className="text-[10px] sm:text-xs text-primary font-medium">
                      ✅ {product.salesCount}+ clients satisfaits
                    </p>
                  </div>
                </div>
              )}

              {/* Similar Products Section - minimaliste */}
              {similarProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Produits similaires</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {similarProducts.slice(0, 3).map((prod) => (
                      <div 
                        key={prod.id} 
                        className="cursor-pointer group"
                        onClick={() => {
                          onClose();
                          setTimeout(() => {}, 100);
                        }}
                      >
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full aspect-square object-cover rounded-lg mb-1 group-hover:opacity-80 transition-opacity"
                          loading="lazy"
                        />
                        <p className="text-xs line-clamp-1">{prod.name}</p>
                        <p className="text-xs font-bold text-primary">{formatCurrency(prod.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </ScrollArea>

            {/* Sticky Footer Actions - compact */}
            <div className="sticky bottom-0 p-3 border-t bg-background">
              <div className="flex items-center gap-3">
                {/* Quantity selector compact */}
                <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-6 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Bouton d'achat flex-1 avec prix */}
                <Button 
                  size="lg" 
                  className="flex-1 h-12 text-base font-semibold"
                  onClick={canAfford ? handleBuyNow : handleRecharge}
                  disabled={!product.isAvailable && canAfford}
                >
                  {!canAfford ? (
                    <>
                      <Wallet className="h-5 w-5 mr-2" />
                      Recharger
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Acheter • {formatCurrency(totalPrice)}
                    </>
                  )}
                </Button>
              </div>

              {/* Wallet balance inline si insuffisant */}
              {wallet && !canAfford && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Solde KwendaPay</span>
                  <span className="font-medium">{formatCurrency(wallet.balance)}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* TopUp Modal intégré */}
      <TopUpModal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          setShowTopUpModal(false);
          toast.success('Recharge effectuée ! Vous pouvez maintenant acheter.');
        }}
      />
    </Dialog>
  );
};