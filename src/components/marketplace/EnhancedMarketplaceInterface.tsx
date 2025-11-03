import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon, Shield, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatProvider } from '@/components/chat/ChatProvider';

// Components modernes
import { ModernMarketplaceHeader } from './ModernMarketplaceHeader';
import { ModernProductCard } from './ModernProductCard';
import { OptimizedProductCard } from './OptimizedProductCard';
import { ProductQuickView } from './ProductQuickView';
import { ModernProductGrid } from './ModernProductGrid';
import { FloatingCartIndicator } from './FloatingCartIndicator';
import { useAddToCartFeedback } from './AddToCartFeedback';
import { CategoryScrollBar } from './CategoryScrollBar';
import { QuickFiltersBar } from './QuickFiltersBar';
import { ResponsiveGrid } from '../ui/responsive-grid';
import { PromoSlider } from './MarketplacePromoSlider';
import { KwendaShopHeader } from './KwendaShopHeader';

// Anciens composants (conservés pour compatibilité)
import { ProductGrid } from './ProductGrid';
import { UnifiedShoppingCart } from './cart/UnifiedShoppingCart';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { VendorStoreView } from './VendorStoreView';
import { ClientEscrowDashboard } from '../escrow/ClientEscrowDashboard';
import { HorizontalProductScroll } from './HorizontalProductScroll';
import { WalletBalance } from './WalletBalance';
import { DeliveryCalculator } from './DeliveryCalculator';
import { OrderTracker } from './OrderTracker';
import { AdvancedOrderTracker } from './AdvancedOrderTracker';
import { AdvancedFilters } from './AdvancedFilters';
import { DeliveryFeeApprovalDialog } from './DeliveryFeeApprovalDialog';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';

// Utiliser les types unifiés de marketplace.ts
import { MarketplaceProduct, CartItem as MarketplaceCartItem, HorizontalProduct, productToCartItem } from '@/types/marketplace';

// Alias pour rétro-compatibilité
type Product = MarketplaceProduct;
type CartItem = MarketplaceCartItem;

// Interfaces déplacées vers src/types/marketplace.ts

interface EnhancedMarketplaceInterfaceProps {
  onNavigate: (path: string) => void;
}

export const EnhancedMarketplaceInterface: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  return (
    <ChatProvider>
      <EnhancedMarketplaceContent onNavigate={onNavigate} />
    </ChatProvider>
  );
};

const EnhancedMarketplaceContent: React.FC<EnhancedMarketplaceInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, formatCurrency } = useLanguage();
  const location = useLocation();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  const { startConversation } = useMarketplaceChat();
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'orders' | 'escrow'>('shop');

  // Détecter retour depuis l'espace vendeur
  useEffect(() => {
    if (location.state?.returnFromVendor) {
      setCurrentTab('shop');
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Quick View state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  // Feedback visuel
  const { showFeedback } = useAddToCartFeedback({ onOpenCart: () => setIsCartOpen(true) });
  
  // Delivery fee approval
  const [pendingFeeOrder, setPendingFeeOrder] = useState<any | null>(null);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 2000000] as [number, number],
    minRating: 0,
    conditions: [] as string[],
    maxDistance: 50,
    availability: 'all' as 'all' | 'available' | 'unavailable',
    sortBy: 'popularity',
    showOnlyFavorites: false,
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Hooks
  const ordersHook = useMarketplaceOrders();

  // Check for pending fee approval orders
  useEffect(() => {
    if (orders && orders.length > 0) {
      const pendingApproval = orders.find(o => o.status === 'pending_buyer_approval' && !o.delivery_fee_approved_by_buyer);
      if (pendingApproval && pendingApproval.id !== pendingFeeOrder?.id) {
        setPendingFeeOrder(pendingApproval);
        setIsFeeDialogOpen(true);
      }
    }
  }, [orders]);

  // Load products with optimized caching
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // ✅ FILTRE : Uniquement les produits approuvés visibles sur la marketplace
      // Tri par popularité (view_count + sales_count)
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('status', 'active')
        .eq('moderation_status', 'approved')  // ✅ Produits approuvés uniquement
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Handle empty data gracefully
      if (!data || data.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // ✅ PHASE 1.4 : Fonction de normalisation d'images
      const normalizeProductImages = (images: any): string[] => {
        if (!images) return [];
        if (Array.isArray(images)) {
          return images.map(img => typeof img === 'string' ? img : String(img)).filter(Boolean);
        }
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [images];
          } catch {
            return [images];
          }
        }
        return [];
      };

      const transformedProducts = data.map(product => {
        const specsObj = product.specifications && typeof product.specifications === 'object' 
          ? product.specifications as Record<string, any>
          : {};
        
        const normalizedImages = normalizeProductImages(product.images);
        
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          images: normalizedImages,
          image: normalizedImages[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
          category: product.category,
          condition: product.condition || 'new',
          description: product.description || '',
          seller_id: product.seller_id,
          seller: { 
            display_name: t('marketplace.unknown_seller') // Will fetch from seller_profiles later
          },
          location: product.location || 'Kinshasa',
          coordinates: product.coordinates && typeof product.coordinates === 'object' 
            ? product.coordinates as { lat: number; lng: number }
            : undefined,
          inStock: (product.stock_count || 0) > 0,
          stockCount: product.stock_count || 0,
          rating: product.rating_average || 0,
          reviews: product.rating_count || 0,
          brand: product.brand,
          specifications: specsObj,
          viewCount: product.view_count || 0,
          salesCount: product.sales_count || 0,
          popularityScore: product.popularity_score || 0,
          moderation_status: product.moderation_status || 'pending',
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Set empty products on error instead of showing error toast
      setProducts([]);
      
      // Only show toast for network errors, not empty results
      if (error instanceof Error && error.message !== 'No rows found') {
        toast({
          title: t('common.error'),
          description: 'Impossible de charger les produits. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter management functions
  const handleUpdateFilter = <K extends keyof typeof filters>(
    key: K, 
    value: typeof filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'all',
      priceRange: [0, 2000000],
      minRating: 0,
      conditions: [],
      maxDistance: 50,
      availability: 'all',
      sortBy: 'popularity',
      showOnlyFavorites: false,
    });
  };

  const handleApplyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'nearby':
        handleUpdateFilter('maxDistance', 5);
        break;
      case 'cheap':
        handleUpdateFilter('priceRange', [0, 50000]);
        handleUpdateFilter('sortBy', 'price_low');
        break;
      case 'premium':
        handleUpdateFilter('minRating', 4.5);
        handleUpdateFilter('sortBy', 'rating');
        break;
      case 'new':
        handleUpdateFilter('conditions', ['new']);
        break;
      case 'deals':
        handleUpdateFilter('priceRange', [0, 100000]);
        break;
    }
  };

  // Calculate filter stats
  const hasActiveFilters = 
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 2000000 ||
    filters.minRating > 0 ||
    filters.conditions.length > 0 ||
    filters.maxDistance < 50 ||
    filters.availability !== 'all' ||
    filters.showOnlyFavorites;

  const activeFiltersCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000,
    filters.minRating > 0,
    filters.conditions.length > 0,
    filters.maxDistance < 50,
    filters.availability !== 'all',
    filters.showOnlyFavorites,
  ].filter(Boolean).length;

  const calculateAveragePrice = (prods: Product[]) => {
    if (prods.length === 0) return 0;
    return prods.reduce((sum, p) => sum + p.price, 0) / prods.length;
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Category filter
    const categoryMatch = filters.selectedCategory === 'all' || product.category === filters.selectedCategory;
    if (!categoryMatch) return false;

    // Search filter (from filters state + legacy searchQuery)
    const query = filters.searchQuery || searchQuery;
    if (query && !product.title.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    // Price filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Rating filter
    if (filters.minRating > 0 && product.rating < filters.minRating) {
      return false;
    }

    // Condition filter
    if (filters.conditions.length > 0 && !filters.conditions.includes(product.condition)) {
      return false;
    }

    // Availability filter
    if (filters.availability === 'available' && !product.inStock) {
      return false;
    }
    if (filters.availability === 'unavailable' && product.inStock) {
      return false;
    }

    // Distance filter
    if (filters.maxDistance < 50 && coordinates && product.coordinates) {
      const distance = calculateDistance(
        coordinates.lat, coordinates.lng,
        product.coordinates.lat, product.coordinates.lng
      );
      if (distance > filters.maxDistance) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        if (coordinates && a.coordinates && b.coordinates) {
          const distA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates.lat, a.coordinates.lng);
          const distB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates.lat, b.coordinates.lng);
          return distA - distB;
        }
        return 0;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'popularity':
      default:
        return (b.rating * b.reviews) - (a.rating * a.reviews);
    }
  });

  // Cart functions avec feedback visuel
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        product_id: product.id,
        name: product.title,
        price: product.price,
        image: product.image,
        quantity,
        seller: product.seller?.display_name || 'Vendeur',
        seller_id: product.seller_id,
        coordinates: product.coordinates
      }]);
    }

    // Feedback visuel moderne
    showFeedback(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      },
      quantity,
      {
        withAnimation: true,
        withConfetti: false,
        productElementSelector: `[data-product-id="${product.id}"]`,
        cartButtonSelector: '[data-cart-button]'
      }
    );
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    // Vider le panier local
    setCartItems([]);
    
    // Rafraîchir les commandes
    ordersHook.refetch();
    
    // Toast de confirmation
    toast({
      title: "✅ Commande validée",
      description: "Vos commandes ont été créées avec succès",
    });
  };

  // Product filtering and grouping
  const featuredProducts = filteredProducts.slice(0, 8);
  const popularProducts = filteredProducts.filter(p => p.rating >= 4.5).slice(0, 6);
  const nearbyProducts = filteredProducts.filter(p => p.coordinates).slice(0, 6);

  // Calcul des sous-ensembles de produits
  const trendingProducts = filteredProducts
    .filter(p => p.popularityScore && p.popularityScore > 200)
    .slice(0, 10);
  
  const newProducts = filteredProducts
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);
  
  const nearbyCalculated = coordinates
    ? filteredProducts
        .filter(p => p.coordinates)
        .sort((a, b) => {
          const distA = calculateDistance(coordinates.lat, coordinates.lng, a.coordinates!.lat, a.coordinates!.lng);
          const distB = calculateDistance(coordinates.lat, coordinates.lng, b.coordinates!.lat, b.coordinates!.lng);
          return distA - distB;
        })
        .slice(0, 10)
    : [];

  const convertToHorizontalProduct = (product: Product): HorizontalProduct => ({
    id: product.id,
    name: product.title,
    price: product.price,
    image: product.image,
    rating: product.rating || 0,
    reviewCount: product.reviews || 0,
    category: product.category,
    seller: product.seller?.display_name || 'Vendeur',
    sellerId: product.seller_id,
    isAvailable: product.inStock,
    location: product.coordinates,
  });

  const calculatePopularityScore = (product: Product) => {
    const views = product.viewCount || 0;
    const sales = product.salesCount || 0;
    const rating = product.rating || 0;
    return (views * 0.3) + (sales * 0.5) + (rating * 20);
  };

  const handlePromoClick = (action: string) => {
    switch (action) {
      case 'electronics':
        // Filtrer catégorie électronique
        setFilters(prev => ({ ...prev, selectedCategory: 'electronics' }));
        // Scroll vers les produits
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        toast({
          title: "🎉 Promo électronique activée",
          description: "Code TECH30 : -30% sur tous les produits électroniques",
        });
        break;
        
      case 'free_delivery':
        // Afficher un message expliquant la livraison gratuite
        toast({
          title: "🚀 Livraison gratuite",
          description: "Pour toute commande supérieure à 50 000 CDF, profitez de la livraison gratuite !",
          duration: 5000,
        });
        // Filtrer produits >50k
        setFilters(prev => ({ ...prev, priceRange: [50000, 2000000] }));
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
        
      case 'new_vendors':
        // Trier par date de création (nouveaux produits)
        setFilters(prev => ({ ...prev, sortBy: 'newest' }));
        setTimeout(() => {
          document.querySelector('[data-section="all-products"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        toast({
          title: "💎 Nouveaux vendeurs",
          description: "Découvrez les derniers produits de nos nouveaux partenaires",
        });
        break;
        
      case 'become_vendor':
        // Rediriger vers l'espace vendeur
        onNavigate('/app/vendeur-request');
        break;
        
      default:
        console.log('Action non gérée:', action);
    }
  };

  const renderShopTab = () => (
    <div className="space-y-4">
      {/* SLIDER PUBLICITAIRE - Non encombrant */}
      <section className="px-4 pt-2">
        <PromoSlider 
          onPromoClick={handlePromoClick}
          autoplayDelay={5000}
        />
      </section>

      {/* SECTION TENDANCES */}
      {trendingProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <motion.h2 
              className="text-2xl font-bold flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <TrendingUp className="h-6 w-6 text-orange-500" />
              En Tendance
            </motion.h2>
            <Button variant="ghost" size="sm">Voir tout →</Button>
          </div>
          <HorizontalProductScroll
            title="En Tendance"
            products={trendingProducts.map(p => convertToHorizontalProduct(p))}
            onAddToCart={(product) => {
              const originalProduct = trendingProducts.find(p => p.id === product.id);
              if (originalProduct) addToCart(originalProduct);
            }}
            onViewDetails={(product) => {
              const originalProduct = trendingProducts.find(p => p.id === product.id);
              if (originalProduct) {
                setSelectedProduct(originalProduct);
                setIsProductDetailsOpen(true);
              }
            }}
            onViewSeller={setSelectedVendorId}
            userLocation={coordinates}
            autoScroll={true}
          />
        </section>
      )}

      {/* SECTION NOUVEAUTÉS */}
      {newProducts.length > 0 && (
        <section>
          <motion.h2 
            className="text-2xl font-bold flex items-center gap-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Sparkles className="h-6 w-6 text-purple-500" />
            Nouveautés
          </motion.h2>
          <ProductGrid
            products={newProducts.slice(0, 8).map(p => convertToHorizontalProduct(p))}
            onAddToCart={(product) => {
              const originalProduct = newProducts.find(p => p.id === product.id);
              if (originalProduct) addToCart(originalProduct);
            }}
            onViewDetails={(product) => {
              const originalProduct = newProducts.find(p => p.id === product.id);
              if (originalProduct) {
                setSelectedProduct(originalProduct);
                setIsProductDetailsOpen(true);
              }
            }}
            onViewSeller={setSelectedVendorId}
            userLocation={coordinates}
          />
        </section>
      )}

      {/* SECTION PRÈS DE VOUS - seulement si >3 produits */}
      {nearbyCalculated.length > 3 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-green-500" />
            Près de chez vous
          </h2>
          <ResponsiveGrid cols={{ default: 2, md: 4 }} gap="md">
            {nearbyCalculated.slice(0, 4).map(p => (
              <ModernProductCard
                key={p.id}
                product={p}
                onAddToCart={() => addToCart(p)}
                onViewDetails={() => {
                  setSelectedProduct(p);
                  setIsProductDetailsOpen(true);
                }}
              />
            ))}
          </ResponsiveGrid>
        </section>
      )}

      {/* TOUS LES PRODUITS - Grille moderne avec toggle vue */}
      <section data-section="all-products">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Tous les produits</h2>
          
          {/* Tri rapide */}
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
            className="h-8 text-xs border rounded-md px-2 bg-background"
          >
            <option value="popularity">Popularité</option>
            <option value="price_low">Prix croissant</option>
            <option value="price_high">Prix décroissant</option>
            <option value="rating">Meilleures notes</option>
            <option value="newest">Plus récents</option>
          </select>
        </div>
        
        {/* Grille moderne avec toggle vue grille/liste */}
        <ModernProductGrid
          products={filteredProducts}
          onProductClick={(product) => {
            setSelectedProduct(product);
            setIsProductDetailsOpen(true);
          }}
          onQuickView={(product) => {
            setQuickViewProduct(product);
            setIsQuickViewOpen(true);
          }}
          onAddToCart={(product) => addToCart(product)}
          cartItems={cartItems}
          userLocation={coordinates}
          loading={loading}
          emptyMessage="Aucun produit trouvé"
        />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background mobile-safe-layout">
      {/* Kwenda Shop Header moderne */}
      <KwendaShopHeader
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onBack={() => onNavigate('/client')}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      {/* Data attribute pour animations de feedback */}
      <div data-cart-button style={{ display: 'none' }} />

      {/* Content */}
      <div className="p-4 content-scrollable">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="shop" className="flex items-center gap-1 touch-manipulation">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 touch-manipulation">
              <CartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="flex items-center gap-1 touch-manipulation">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Escrow</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4">
            {renderShopTab()}
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <AdvancedOrderTracker />
          </TabsContent>

          <TabsContent value="escrow" className="mt-4">
            <ClientEscrowDashboard />
          </TabsContent>

        </Tabs>
      </div>

      {/* Floating Cart Indicator */}
      <FloatingCartIndicator
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Unified Shopping Cart (Sprint 1) */}
      <UnifiedShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        userCoordinates={coordinates}
      />

      {/* Product Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
        onAddToCart={(product, quantity) => addToCart(product, quantity)}
        onViewFullDetails={(product) => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
          setSelectedProduct(product);
          setIsProductDetailsOpen(true);
        }}
        cartQuantity={quickViewProduct ? cartItems.find(i => i.id === quickViewProduct.id)?.quantity || 0 : 0}
      />

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={{
            id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            image: selectedProduct.image,
            rating: selectedProduct.rating,
            reviewCount: selectedProduct.reviews,
            category: selectedProduct.category,
            seller: selectedProduct.seller.display_name,
            sellerId: selectedProduct.seller_id,
            isAvailable: selectedProduct.inStock,
            description: selectedProduct.description,
            location: selectedProduct.coordinates,
            brand: 'HP', // TODO: Add to product data
            condition: selectedProduct.condition,
            stockCount: selectedProduct.stockCount,
            specifications: {
              'Processeur': 'Intel Core i5',
              'RAM': '8GB DDR4',
              'Stockage': '256GB SSD',
              'Écran': '15.6" Full HD'
            } // TODO: Add to product data
          }}
          isOpen={isProductDetailsOpen}
          onClose={() => {
            setIsProductDetailsOpen(false);
            setSelectedProduct(null);
          }}
          onAddToCart={(product) => {
            if (selectedProduct) addToCart(selectedProduct);
          }}
          onViewSeller={(sellerId) => setSelectedVendorId(sellerId)}
          similarProducts={
            products
              .filter(p => 
                p.category === selectedProduct.category && 
                p.id !== selectedProduct.id &&
                p.seller_id !== selectedProduct.seller_id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          sellerProducts={
            products
              .filter(p => 
                p.seller_id === selectedProduct.seller_id && 
                p.id !== selectedProduct.id
              )
              .slice(0, 10)
              .map(p => ({
                id: p.id,
                name: p.title,
                price: p.price,
                image: p.image,
                rating: p.rating,
                reviewCount: p.reviews,
                category: p.category,
                seller: p.seller.display_name,
                sellerId: p.seller_id,
                isAvailable: p.inStock,
                location: p.coordinates
              }))
          }
          userLocation={coordinates}
        />
      )}

      {/* Vendor Store View */}
      {selectedVendorId && (
        <VendorStoreView
          vendorId={selectedVendorId}
          onClose={() => setSelectedVendorId(null)}
          onAddToCart={(product) => {
            // Find the original product and add to cart
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) addToCart(originalProduct);
          }}
          onViewDetails={(product) => {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
              setSelectedProduct(originalProduct);
              setIsProductDetailsOpen(true);
              setSelectedVendorId(null);
            }
          }}
          userLocation={coordinates}
        />
      )}

      {/* Delivery Fee Approval Dialog */}
      {pendingFeeOrder && (
        <DeliveryFeeApprovalDialog
          order={pendingFeeOrder}
          open={isFeeDialogOpen}
          onOpenChange={setIsFeeDialogOpen}
          onApproved={() => {
            setIsFeeDialogOpen(false);
            setPendingFeeOrder(null);
            refetchOrders();
            toast({ title: "✅ Paiement confirmé", description: "Votre commande sera bientôt livrée" });
          }}
          onOpenChat={async () => {
            const conversationId = await startConversation(pendingFeeOrder.product_id, pendingFeeOrder.seller_id);
            if (conversationId) {
              setIsFeeDialogOpen(false);
              toast({ title: "Chat ouvert", description: "Discutez avec le vendeur" });
            }
          }}
        />
      )}

      {/* Advanced Filters Panel */}
      <AdvancedFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        onApplyQuickFilter={handleApplyQuickFilter}
        hasActiveFilters={hasActiveFilters}
        filterStats={{
          totalProducts: products.length,
          filteredCount: filteredProducts.length,
          averagePrice: calculateAveragePrice(filteredProducts),
        }}
      />

    </div>
  );
};

export default EnhancedMarketplaceInterface;
