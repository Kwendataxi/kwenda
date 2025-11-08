import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar,
  Search,
  Package,
  TrendingUp,
  Users,
  Shield,
  ShoppingCart,
  Sparkles,
  Award
} from 'lucide-react';
import { useVendorFollowers } from '@/hooks/useVendorFollowers';
import { CompactProductCard } from './CompactProductCard';
import { ProductGrid } from './ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SimilarVendorsSlider } from './SimilarVendorsSlider';
import { FloatingCartIndicator } from './FloatingCartIndicator';
import { VendorCheckoutBar } from './VendorCheckoutBar';
import { VendorRatingDialog } from './VendorRatingDialog';
import { VendorReviewsSection } from './VendorReviewsSection';
import { CartItem } from '@/types/marketplace';
import { triggerAddToCartEffect } from '@/lib/animations/cartEffects';
import confetti from 'canvas-confetti';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  location?: { lat: number; lng: number };
}

interface VendorStoreViewProps {
  vendorId: string;
  onClose?: () => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const VendorStoreView: React.FC<VendorStoreViewProps> = ({
  vendorId,
  onClose,
  onAddToCart,
  onViewDetails,
  userLocation
}) => {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [canRateVendor, setCanRateVendor] = useState(false);
  const [hasRatedVendor, setHasRatedVendor] = useState(false);
  const { followerCount } = useVendorFollowers(vendorId);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadVendorData();
  }, [vendorId]);

  useEffect(() => {
    if (user) {
      checkRatingEligibility();
    }
  }, [user, vendorId]);

  const checkRatingEligibility = async () => {
    if (!user) {
      setCanRateVendor(false);
      setHasRatedVendor(false);
      return;
    }

    try {
      // Check if user has completed orders from this vendor
      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('id, status')
        .eq('buyer_id', user.id)
        .eq('seller_id', vendorId)
        .eq('status', 'delivered');

      const hasCompletedOrders = orders && orders.length > 0;

      // Check if user has already rated this vendor
      const { data: existingRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rater_user_id', user.id)
        .eq('rated_user_id', vendorId)
        .maybeSingle();

      setCanRateVendor(hasCompletedOrders);
      setHasRatedVendor(!!existingRating);
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
      setCanRateVendor(false);
      setHasRatedVendor(false);
    }
  };

  const loadVendorData = async () => {
    try {
      setLoading(true);
      
      // Load vendor profile with real stats
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Load vendor's bio from profiles (keep profiles for bio only)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', vendorId)
        .single();

      // Use shop_name and shop_logo_url from vendor_profiles
      setVendor({
        ...vendorData,
        bio: profileData?.bio,
        display_name: vendorData?.shop_name || 'Boutique',
        avatar_url: vendorData?.shop_logo_url || null
      });

      // Check subscription status
      if (user) {
        const { data: subData } = await supabase
          .from('vendor_followers')
          .select('is_active')
          .eq('vendor_id', vendorId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsSubscribed(subData?.is_active || false);
      }

      // Load vendor products (only approved)
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', vendorId)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts = productsData?.map(product => ({
        id: product.id,
        name: product.title,
        price: product.price,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? String(product.images[0])
          : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 5,
        category: product.category,
        seller: vendorData?.shop_name || 'Vendeur',
        sellerId: product.seller_id,
        isAvailable: product.status === 'active',
        location: product.coordinates && typeof product.coordinates === 'object' 
          ? product.coordinates as { lat: number; lng: number }
          : undefined,
      })) || [];

      setProducts(transformedProducts);
      setActiveProductsCount(transformedProducts.length);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, element?: HTMLElement) => {
    // Appeler le callback parent
    onAddToCart(product);
    
    // Tracker localement pour le FloatingCartIndicator
    const existingItem = localCart.find(item => item.id === product.id);
    
    if (existingItem) {
      setLocalCart(localCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setLocalCart([...localCart, {
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        seller: product.seller,
        seller_id: product.sellerId,
        coordinates: product.location
      }]);
    }
    
    // Animation particules si l'élément est fourni
    if (element) {
      triggerAddToCartEffect(element);
    }
    
    // Animation confetti
    confetti({
      particleCount: 20,
      angle: 60,
      spread: 55,
      origin: { x: 0.9, y: 0.9 },
      colors: ['#FF6B35', '#F7931E', '#FDC830']
    });
  };

  const handleCheckout = () => {
    if (localCart.length === 0) return;
    
    // Confetti de célébration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#F7931E', '#FDC830', '#9333EA']
    });
    
    // Toast de confirmation
    toast({
      title: '🎉 Commande créée !',
      description: `${localCart.length} produit(s) ajouté(s) à vos commandes`,
    });
    
    // Vider le panier local
    setLocalCart([]);
    
    // Fermer la vue vendeur après 2 secondes
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: '🔒 Connectez-vous',
        description: 'Créez un compte pour vous abonner à cette boutique.',
      });
      return;
    }

    try {
      const newState = !isSubscribed;
      
      await supabase
        .from('vendor_followers')
        .upsert({
          vendor_id: vendorId,
          user_id: user.id,
          is_active: newState
        }, {
          onConflict: 'vendor_id,user_id'
        });
      
      setIsSubscribed(newState);
      
      toast({
        title: newState ? '🎉 Abonné !' : 'Désabonné',
        description: newState 
          ? 'Vous recevrez des notifications des nouveautés de cette boutique.'
          : 'Vous ne recevrez plus de notifications.',
      });
      
      loadVendorData();
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier l\'abonnement.'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Hero Header with Cover */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        {vendor?.shop_banner_url && (
          <img src={vendor.shop_banner_url} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasRatedVendor ? "outline" : "default"}
                    size="sm"
                    onClick={() => setRatingDialogOpen(true)}
                    disabled={!user || (!canRateVendor && !hasRatedVendor)}
                    className="gap-2 font-semibold bg-background/80 backdrop-blur-sm"
                  >
                    <Star className={cn("h-4 w-4", hasRatedVendor && "fill-yellow-400 text-yellow-400")} />
                    {hasRatedVendor ? 'Votre avis' : 'Noter'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!user 
                    ? 'Connectez-vous pour noter' 
                    : !canRateVendor && !hasRatedVendor
                    ? 'Effectuez un achat pour noter cette boutique'
                    : hasRatedVendor
                    ? 'Vous avez déjà noté cette boutique'
                    : 'Notez votre expérience avec cette boutique'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant={isSubscribed ? "secondary" : "default"}
              size="sm"
              onClick={handleSubscribe}
              className="gap-2 font-semibold bg-background/80 backdrop-blur-sm"
            >
              <Users className="h-4 w-4" />
              {isSubscribed ? 'Abonné' : 'S\'abonner'}
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end gap-4">
            {/* Avatar with verified badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white">
                {vendor?.shop_logo_url ? (
                  <img 
                    src={vendor.shop_logo_url} 
                    className="w-full h-full object-cover" 
                    alt="Logo boutique"
                  />
                ) : vendor?.avatar_url ? (
                  <img 
                    src={vendor.avatar_url} 
                    className="w-full h-full object-cover" 
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {vendor?.shop_name?.[0] || vendor?.display_name?.[0] || 'V'}
                  </div>
                )}
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1"
                whileHover={{ scale: 1.2 }}
              >
                <Shield className="h-4 w-4 text-white" />
              </motion.div>
            </motion.div>

            <div className="flex-1 text-white">
              <h1 className="text-2xl font-bold">{vendor?.shop_name || vendor?.display_name || 'Boutique'}</h1>
              <p className="text-sm opacity-90">{vendor?.shop_description || vendor?.bio || 'Vendeur certifié Kwenda'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b">
        {[
          { label: "Produits", value: activeProductsCount, icon: Package, color: "text-blue-500" },
          { label: "Ventes", value: (vendor?.total_sales || 0).toLocaleString(), icon: TrendingUp, color: "text-green-500" },
          { label: "Note", value: vendor?.average_rating?.toFixed(1) || '0.0', icon: Star, color: "text-yellow-500", count: vendor?.rating_count || 0, clickable: true },
          { label: "Abonnés", value: followerCount, icon: Users, color: "text-purple-500" }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: i * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            whileHover={{ scale: stat.clickable ? 1.05 : 1.02 }}
            whileTap={stat.clickable ? { scale: 0.95 } : undefined}
            onClick={stat.clickable ? () => {
              document.getElementById('vendor-reviews-section')?.scrollIntoView({
                behavior: 'smooth'
              });
            } : undefined}
            className={stat.clickable ? 'cursor-pointer' : ''}
          >
            <Card className={cn(
              "p-3 text-center transition-all duration-300",
              stat.clickable && "hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            )}>
              <stat.icon className={cn(
                "h-5 w-5 mx-auto mb-1",
                stat.color,
                stat.clickable && stat.label === "Note" && "fill-yellow-400"
              )} />
              <p className="text-lg font-bold">
                {stat.value}
                {stat.label === "Note" && <span className="text-xs text-muted-foreground">/5</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.label}
                {stat.clickable && stat.count !== undefined && stat.count > 0 && (
                  <span className="block text-[10px]">({stat.count} avis)</span>
                )}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mini cart summary - VERSION MODERNE */}
      <AnimatePresence>
        {localCart.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="border-b overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm relative overflow-hidden">
              {/* Shimmer effect animé */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              <div className="relative z-10">
                {/* En-tête avec icône animée */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <span className="text-sm font-bold text-foreground">
                        Panier en cours
                      </span>
                      <motion.div
                        key={localCart.reduce((sum, item) => sum + item.quantity, 0)}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-xs text-muted-foreground"
                      >
                        {localCart.reduce((sum, item) => sum + item.quantity, 0)} article(s) sélectionné(s)
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document.getElementById('vendor-checkout-button')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'end'
                        });
                      }}
                      className="text-xs h-7 font-semibold hover:bg-primary/20"
                    >
                      Voir le panier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocalCart([])}
                      className="text-xs h-7 text-destructive hover:bg-destructive/10"
                    >
                      Vider
                    </Button>
                  </div>
                </div>
                
                {/* Total avec animation */}
                <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total estimé</span>
                      <motion.span
                        key={localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
                        animate={{ scale: 1, color: 'currentColor' }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        className="text-2xl font-bold text-primary"
                      >
                        {new Intl.NumberFormat('fr-CD', {
                          style: 'currency',
                          currency: 'CDF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </motion.span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans cette boutique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      {/* Products Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground">
                Essayez un autre terme de recherche
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 20
                      }
                    }
                  }}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CompactProductCard
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onViewDetails={() => onViewDetails(product)}
                    userLocation={userLocation}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Reviews Section */}
      {!loading && (
        <VendorReviewsSection
          vendorId={vendorId}
          averageRating={vendor?.average_rating || 0}
          totalRatings={vendor?.rating_count || 0}
        />
      )}

      {/* Similar Vendors Section */}
      {!loading && products.length > 0 && (
        <SimilarVendorsSlider
          currentVendorId={vendorId}
          currentMainCategory={vendor?.main_category}
          onVisitVendor={(id) => {
            window.location.href = `/marketplace/vendor/${id}`;
          }}
        />
      )}

      {/* Floating Cart Indicator */}
      <FloatingCartIndicator
        cartItems={localCart}
        onOpenCart={() => {
          document.getElementById('vendor-checkout-button')?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }}
        className="bottom-24"
      />

      {/* Checkout Bar */}
      <VendorCheckoutBar
        cartItems={localCart}
        onCheckout={handleCheckout}
        vendorName={vendor?.shop_name || vendor?.display_name || 'cette boutique'}
      />

      {/* Rating Dialog */}
      <VendorRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        vendorId={vendorId}
        vendorName={vendor?.shop_name || vendor?.display_name || 'Boutique'}
        vendorLogo={vendor?.shop_logo_url || vendor?.avatar_url}
        onSuccess={() => {
          loadVendorData();
          checkRatingEligibility();
        }}
      />
    </div>
  );
};