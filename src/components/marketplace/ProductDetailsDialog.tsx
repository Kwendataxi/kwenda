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
  Info
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProductChatTab } from './ProductChatTab';

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
}

interface ProductDetailsDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onViewSeller: (sellerId: string) => void;
  userLocation?: { lat: number; lng: number };
}

export const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onViewSeller,
  userLocation
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
      <DialogContent className="max-w-md mx-auto max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold line-clamp-2">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col">
          <TabsList className="mx-4 grid w-auto grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat vendeur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(85vh-180px)] px-4">
          {/* Product Image */}
          <div className="aspect-square w-full overflow-hidden rounded-lg mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              {product.discount && (
                <Badge className="bg-primary text-primary-foreground">
                  -{product.discount}%
                </Badge>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              </div>
              {product.reviewCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} avis)
                </span>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Seller Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{product.seller}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
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
            <>
              <Separator className="my-4" />
              <div className="mb-4">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Quantity */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Quantité</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="font-medium min-w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            
            {/* Wallet Balance */}
            {wallet && (
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-muted-foreground">Solde KwendaPay:</span>
                <span className={cn(
                  "font-medium",
                  canAfford ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(wallet.balance)}
                </span>
              </div>
            )}
          </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t space-y-2">
          {!canAfford ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Solde insuffisant. Rechargez votre wallet KwendaPay.
              </p>
              <Button 
                onClick={handleRecharge}
                className="w-full"
                variant="secondary"
              >
                Recharger KwendaPay
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleBuyNow}
              disabled={!product.isAvailable}
              className="w-full"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {product.isAvailable ? 'Acheter maintenant' : 'Produit épuisé'}
            </Button>
          )}
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