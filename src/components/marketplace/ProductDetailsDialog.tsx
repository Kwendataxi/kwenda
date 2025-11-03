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

              {/* Category & Price Card - compact */}
              <div className="mb-3 p-2.5 sm:p-3 rounded-lg border border-primary/20 bg-primary/5">
                {/* Category & Condition Badges */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {getCategoryName(product.category)}
                  </Badge>
                  {product.condition && (
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] sm:text-xs ${
                        product.condition === 'new' ? 'bg-green-100 text-green-800 border-green-300' :
                        product.condition === 'like_new' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        product.condition === 'good' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' :
                        product.condition === 'fair' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-purple-100 text-purple-800 border-purple-300'
                      }`}
                    >
                      {product.condition === 'new' && '✨ '}
                      {product.condition === 'like_new' && '🌟 '}
                      {product.condition === 'good' && '✅ '}
                      {product.condition === 'fair' && '⚠️ '}
                      {product.condition === 'refurbished' && '🔧 '}
                      {getConditionLabel(product.condition)}
                    </Badge>
                  )}
                  {product.stockCount !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] sm:text-xs ml-auto ${
                        product.stockCount === 0 ? 'bg-gray-100 text-gray-800 border-gray-300' :
                        product.stockCount <= 4 ? 'bg-red-100 text-red-800 border-red-300' :
                        product.stockCount <= 20 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-green-100 text-green-800 border-green-300'
                      }`}
                    >
                      {product.stockCount === 0 && '⚫ Rupture'}
                      {product.stockCount > 0 && product.stockCount <= 4 && `🔴 Stock faible (${product.stockCount})`}
                      {product.stockCount > 4 && product.stockCount <= 20 && `🟡 En stock (${product.stockCount})`}
                      {product.stockCount > 20 && `🟢 Disponible (${product.stockCount})`}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                          {product.discount && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                              -{product.discount}%
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-background rounded-md px-2 py-1 w-fit">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-xs sm:text-sm">{product.rating.toFixed(1)}</span>
                    {product.reviewCount > 0 && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">({product.reviewCount})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller Info Card - simplified */}
              <div className="mb-3 p-2.5 sm:p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">{product.seller}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                    onClick={() => {
                      onViewSeller(product.sellerId);
                      onClose();
                    }}
                  >
                    Voir boutique
                  </Button>
                </div>
              </div>

              {/* Description - compact */}
              {product.description && (
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <h4 className="text-xs sm:text-sm font-semibold">Description</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
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

              {/* Statistiques de popularité - seulement si significatives (>10 ventes) */}
              {product.salesCount && product.salesCount > 10 && (
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

              {/* Similar Products Section - limitées à 3 et compactes */}
              {similarProducts.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <h4 className="text-xs sm:text-sm font-semibold">Produits similaires</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {similarProducts.slice(0, 3).map((prod) => (
                      <div 
                        key={prod.id} 
                        className="cursor-pointer p-1.5 sm:p-2 border rounded-lg hover:border-primary/50 transition-colors"
                        onClick={() => {
                          onClose();
                          setTimeout(() => {}, 100);
                        }}
                      >
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-full aspect-square object-cover rounded mb-1"
                          loading="lazy"
                        />
                        <p className="text-[10px] sm:text-xs font-medium line-clamp-1">{prod.name}</p>
                        <p className="text-[10px] sm:text-xs text-primary font-bold">{formatCurrency(prod.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </ScrollArea>

            {/* Sticky Footer Actions - optimized */}
            <div className="sticky bottom-0 p-2.5 sm:p-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="space-y-2">
                {/* Quantity and Total Row - compact */}
                <div className="flex items-center justify-between gap-2">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                    <span className="font-medium text-xs sm:text-sm min-w-5 text-center tabular-nums">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                    <p className="text-base sm:text-lg font-bold text-primary truncate tabular-nums">
                      {formatCurrency(totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Buy Button - touch-optimized */}
                {!canAfford ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
                  >
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm font-semibold">Solde insuffisant</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vous avez besoin de {(totalPrice - (wallet?.balance || 0)).toLocaleString()} CDF de plus pour cet achat
                    </p>
                    <Button 
                      onClick={handleRecharge}
                      className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg"
                      size="sm"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Recharger KwendaPay
                    </Button>
                  </motion.div>
                ) : (
                  <Button 
                    onClick={handleBuyNow}
                    disabled={!product.isAvailable}
                    className="w-full h-10 sm:h-11 text-xs sm:text-sm min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                    <span>{product.isAvailable ? 'Acheter maintenant' : 'Produit épuisé'}</span>
                  </Button>
                )}

                {/* Wallet Balance - compact */}
                {wallet && (
                  <div className="flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground pt-0.5">
                    <span>Solde KwendaPay</span>
                    <span className={cn(
                      "font-medium tabular-nums",
                      canAfford ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(wallet.balance)}
                    </span>
                  </div>
                )}
              </div>
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