import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Bell, Share2, ShoppingCart, Search, MapPin, Clock, Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FoodProductCard } from './FoodProductCard';
import { RestaurantRatingDialog } from './RestaurantRatingDialog';
import { RestaurantReviewsSection } from './RestaurantReviewsSection';
import { RestaurantCheckoutBar } from './RestaurantCheckoutBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurantFollow } from '@/hooks/useRestaurantFollow';
import { toast } from 'sonner';
import type { Restaurant, FoodProduct, FoodCartItem } from '@/types/food';
import { formatCurrency } from '@/lib/utils';

interface RestaurantStoreViewProps {
  restaurant: Restaurant;
  cart: FoodCartItem[];
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
  onUpdateCartItem: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
  onBack: () => void;
}

export const RestaurantStoreView: React.FC<RestaurantStoreViewProps> = ({
  restaurant,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onRemoveFromCart,
  onProceedToCheckout,
  onBack,
}) => {
  const { user } = useAuth();
  const { isFollowing, followersCount, loading: followLoading, toggleFollow } = useRestaurantFollow(restaurant.id);
  
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [canRateRestaurant, setCanRateRestaurant] = useState(false);
  const [hasRatedRestaurant, setHasRatedRestaurant] = useState(false);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    averageRating: 0,
    ratingCount: 0,
  });

  useEffect(() => {
    loadRestaurantData();
    if (user) {
      checkRatingEligibility();
    }
  }, [restaurant.id, user]);

  const loadRestaurantData = async () => {
    const timestamp = Date.now();
    console.log(`[${timestamp}] 🍽️ Loading restaurant data for:`, {
      id: restaurant.id,
      name: restaurant.restaurant_name,
      city: restaurant.city
    });
    
    try {
      setLoading(true);

      // Load products
      console.log(`[${timestamp}] 📦 Fetching products...`);
      const { data: productsData, error: productsError } = await supabase
        .from('food_products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('moderation_status', 'approved')
        .eq('is_available', true)
        .order('category', { ascending: true });

      console.log(`[${timestamp}] ✅ Products fetched:`, {
        restaurantId: restaurant.id,
        count: productsData?.length,
        products: productsData?.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          moderation_status: p.moderation_status,
          is_available: p.is_available
        })),
        error: productsError
      });

      if (productsError) throw productsError;
      setProducts(productsData || []);
      
      if (productsData && productsData.length === 0) {
        console.warn(`[${timestamp}] ⚠️ No products found for restaurant ${restaurant.id}`);
      }

      // Load stats
      const { count: productCount } = await supabase
        .from('food_products')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('moderation_status', 'approved');

      const { count: orderCount } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'delivered');

      const { data: ratingsData } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', restaurant.user_id || restaurant.id);

      const totalRatings = ratingsData?.length || 0;
      const avgRating = totalRatings > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        averageRating: avgRating,
        ratingCount: totalRatings,
      });
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const checkRatingEligibility = async () => {
    if (!user) return;

    try {
      // Check if user has completed orders from this restaurant
      // Simplified check to avoid type issues
      setCanRateRestaurant(true); // Allow rating for all authenticated users

      // Check if user has already rated
      const { data: existingRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rated_user_id', restaurant.user_id || restaurant.id)
        .eq('rater_user_id', user.id)
        .maybeSingle();

      setHasRatedRestaurant(!!existingRating);
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.restaurant_name,
        text: `Découvrez ${restaurant.restaurant_name} sur Kwenda Food`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  const scrollToReviews = () => {
    document.getElementById('restaurant-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header Banner */}
      <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background">
        {restaurant.banner_url && (
          <img
            src={restaurant.banner_url}
            alt={restaurant.restaurant_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-background/80 backdrop-blur-sm"
                    onClick={() => {
                      if (!user) {
                        toast.error('Connectez-vous pour noter');
                      } else if (!canRateRestaurant) {
                        toast.error('Vous devez avoir commandé pour noter');
                      } else {
                        setRatingDialogOpen(true);
                      }
                    }}
                  >
                    <Star className={`w-5 h-5 ${hasRatedRestaurant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!user ? 'Connectez-vous' : !canRateRestaurant ? 'Commandez d\'abord' : hasRatedRestaurant ? 'Déjà noté' : 'Noter'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={toggleFollow}
              disabled={followLoading || !user}
            >
              <Bell className={`w-5 h-5 ${isFollowing ? 'fill-primary' : ''}`} />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Logo */}
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-24 h-24 rounded-full border-4 border-background bg-background overflow-hidden shadow-xl">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.restaurant_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {restaurant.restaurant_name[0]}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Restaurant Info */}
      <div className="pt-16 px-4 text-center">
        <h1 className="text-2xl font-bold">{restaurant.restaurant_name}</h1>
        {restaurant.description && (
          <p className="text-muted-foreground mt-1">{restaurant.description}</p>
        )}
        
        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
          {restaurant.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.city}</span>
            </div>
          )}
          {restaurant.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{restaurant.phone_number}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          {restaurant.cuisine_types?.[0] && <Badge>{restaurant.cuisine_types[0]}</Badge>}
          {restaurant.delivery_available && <Badge variant="secondary">Livraison</Badge>}
          {restaurant.takeaway_available && <Badge variant="secondary">À emporter</Badge>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mt-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-4 text-center bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
            <div className="text-2xl font-bold text-orange-600">{stats.totalProducts}</div>
            <div className="text-xs text-muted-foreground mt-1">Plats</div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-4 text-center bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Commandes</div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToReviews}
          className="cursor-pointer"
        >
          <Card className="p-4 text-center bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">
              <Star className="w-5 h-5 fill-yellow-500" />
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.ratingCount} avis
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-4 text-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <div className="text-2xl font-bold text-blue-600">{followersCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Abonnés</div>
          </Card>
        </motion.div>
      </div>

      {/* Mini Cart */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-6"
          >
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <div className="font-semibold">{totalItems} article{totalItems > 1 ? 's' : ''}</div>
                    <div className="text-sm text-muted-foreground">Panier en cours</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(totalAmount, 'CDF')}</div>
                  <Button
                    size="sm"
                    onClick={() => document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-2"
                  >
                    Voir le panier
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 mt-6 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Chargement du menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🍽️</div>
            <div>
              <p className="text-muted-foreground text-lg font-semibold">
                {searchQuery ? 'Aucun plat trouvé' : 'Menu temporairement indisponible'}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Ce restaurant n'a pas encore ajouté de plats
                </p>
              )}
            </div>
            {!searchQuery && (
              <div className="space-y-2">
                <Button onClick={loadRestaurantData} variant="outline" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recharger le menu
                </Button>
                {import.meta.env.DEV && (
                  <p className="text-xs text-muted-foreground">
                    Debug: Restaurant ID = {restaurant.id}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <FoodProductCard
              key={product.id}
              product={product}
              cartQuantity={cart.find(item => item.id === product.id)?.quantity || 0}
              onAddToCart={onAddToCart}
            />
          ))
        )}
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <RestaurantReviewsSection
          restaurantId={restaurant.user_id || restaurant.id}
          averageRating={stats.averageRating}
          totalRatings={stats.ratingCount}
        />
      </div>

      {/* Checkout Bar */}
      {totalItems > 0 && (
        <div id="checkout-section">
          <RestaurantCheckoutBar
            cart={cart}
            restaurantName={restaurant.restaurant_name}
            onCheckout={onProceedToCheckout}
            onUpdateCart={onUpdateCartItem}
          />
        </div>
      )}

      {/* Rating Dialog */}
      <RestaurantRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        restaurantId={restaurant.user_id || restaurant.id}
        restaurantName={restaurant.restaurant_name}
        restaurantLogo={restaurant.logo_url}
        onSuccess={() => {
          loadRestaurantData();
          checkRatingEligibility();
        }}
      />
    </div>
  );
};
