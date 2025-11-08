import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Package, Store, User, Plus, ArrowLeft, ShoppingBag, ShoppingCart as CartIcon, Shield, Filter, Sparkles, TrendingUp, MessageCircle, ChevronRight } from 'lucide-react';
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
import { AutoHideMarketplacePromoSlider } from './AutoHideMarketplacePromoSlider';
import { KwendaShopHeader } from './KwendaShopHeader';
import { TopProductsSection } from './TopProductsSection';
import { AiShopperProductCard } from './AiShopperProductCard';
import { useProductPromotions } from '@/hooks/useProductPromotions';
import { AllMarketplaceProductsView } from './AllMarketplaceProductsView';
import { AllVendorsView } from './AllVendorsView';
import { VendorCard } from './VendorCard';

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
import { MessagesTab } from './MessagesTab';

// Hooks
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserVerification } from '@/hooks/useUserVerification';
import { useWallet } from '@/hooks/useWallet';
import { useUniversalChat } from '@/hooks/useUniversalChat';
import { useCart } from '@/context/CartContext';

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
  const navigate = useNavigate();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useMarketplaceOrders();
  const { verification } = useUserVerification();
  const { wallet } = useWallet();
  const { createOrFindConversation } = useUniversalChat();
  const { calculateDiscount, getOriginalPrice } = useProductPromotions();
  
  // State management
  const [currentTab, setCurrentTab] = useState<'shop' | 'orders' | 'escrow'>('shop');
  const [viewMode, setViewMode] = useState<'home' | 'all-products' | 'all-vendors'>('home');
  const [favorites, setFavorites] = useState<string[]>([]);

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
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Utiliser le panier global du CartContext
  const { cartItems, addToCart: addToCartGlobal } = useCart();
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
      // ✅ FILTRE : Uniquement les produits approuvés avec info vendeurs
      // Tri par popularité (view_count + sales_count)
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          vendor_profiles!inner(
            shop_name,
            shop_logo_url,
            average_rating,
            total_sales,
            follower_count
          )
        `)
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
        const fallbackImage = 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=800&h=800&fit=crop';
        
        // Remplacer placehold.co par fallback Unsplash
        const cleanedImages = normalizedImages.map(img => 
          img.includes('placehold.co') ? fallbackImage : img
        );
        
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          images: cleanedImages,
          image: cleanedImages[0] || fallbackImage,
          category: product.category,
          condition: product.condition || 'new',
          description: product.description || '',
          seller_id: product.seller_id,
          seller: { 
            display_name: (product.vendor_profiles as any)?.shop_name || t('marketplace.unknown_seller')
          },
          sellerLogo: (product.vendor_profiles as any)?.shop_logo_url,
          sellerRating: (product.vendor_profiles as any)?.average_rating || 0,
          sellerTotalSales: (product.vendor_profiles as any)?.total_sales || 0,
          sellerFollowers: (product.vendor_profiles as any)?.follower_count || 0,
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
      
      // Set empty products on error
      setProducts([]);
      
      // Show explicit error toast for critical errors only
      if (error instanceof Error && !error.message.includes('No rows')) {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les produits. Vérifiez votre connexion internet.",
          variant: 'destructive',
          duration: 5000,
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

  // Wrapper pour addToCart avec feedback visuel
  const addToCart = (product: Product, quantity: number = 1) => {
    // Utiliser le addToCart global du CartContext
    addToCartGlobal(product);

    // Feedback visuel moderne avec confetti activé
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
        withConfetti: true,
        productElementSelector: `[data-product-id="${product.id}"]`,
        cartButtonSelector: '[data-cart-button]'
      }
    );
  };

  // Ces fonctions sont maintenant gérées par CartContext
  // On garde juste des références vides pour compatibilité
  const updateCartQuantity = (productId: string, quantity: number) => {
    // Géré par UnifiedShoppingCart qui utilise CartContext
  };

  const removeFromCart = (productId: string) => {
    // Géré par UnifiedShoppingCart qui utilise CartContext
  };

  const handleCheckout = async () => {
    // Le panier est géré par CartContext maintenant
    // Il sera vidé automatiquement après checkout
    
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

  // Calcul des top vendeurs pour la section "Boutiques populaires"
  const topVendors = products
    .reduce((acc, p) => {
      const existing = acc.find(v => v.user_id === p.seller_id);
      if (!existing) {
        // Accéder aux propriétés vendeur directement depuis le product
        const vendorData = (p as any);
        acc.push({
          user_id: p.seller_id,
          shop_name: p.seller.display_name,
          shop_logo_url: vendorData.sellerLogo,
          shop_banner_url: undefined,
          shop_description: undefined,
          average_rating: vendorData.sellerRating || 0,
          total_sales: vendorData.sellerTotalSales || 0,
          product_count: products.filter(prod => prod.seller_id === p.seller_id).length,
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => (b.average_rating * b.total_sales) - (a.average_rating * a.total_sales))
    .slice(0, 10);

  // Gestion des favoris
  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    toast({
      title: favorites.includes(productId) ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris',
      duration: 2000,
    });
  };

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

  // Helper unifié pour ajouter au panier depuis n'importe quel format
  const handleAddToCartUnified = (item: Product | HorizontalProduct | any) => {
    // Si c'est déjà un Product (MarketplaceProduct)
    if ('title' in item && 'inStock' in item) {
      addToCart(item as Product);
      return;
    }
    
    // Si c'est un HorizontalProduct, retrouver l'original
    const originalProduct = filteredProducts.find(p => p.id === item.id);
    if (originalProduct) {
      addToCart(originalProduct);
      return;
    }
    
    // Fallback : construire un Product minimal
    addToCart({
      id: item.id,
      title: item.name || item.title,
      price: item.price,
      image: item.image,
      images: [item.image],
      category: item.category || 'general',
      condition: 'new',
      seller_id: item.sellerId || item.seller_id,
      seller: { display_name: item.seller || 'Vendeur' },
      location: 'Kinshasa',
      inStock: item.isAvailable ?? item.inStock ?? true,
      stockCount: 1,
      rating: item.rating || 0,
      reviews: item.reviewCount || 0,
      moderation_status: 'approved',
      description: ''
    } as Product);
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

  const renderShopTab = () => {
    if (viewMode === 'all-products') {
      return (
        <AllMarketplaceProductsView
          onBack={() => setViewMode('home')}
          onAddToCart={(product) => addToCart(product, 1)}
          onViewDetails={(product) => navigate(`/marketplace/product/${product.id}`)}
          onVisitShop={(id) => navigate(`/marketplace/shop/${id}`)}
        />
      );
    }

    if (viewMode === 'all-vendors') {
      return (
        <AllVendorsView
          onBack={() => setViewMode('home')}
          onSelectVendor={(id) => navigate(`/marketplace/shop/${id}`)}
        />
      );
    }

    return (
    <div className="space-y-8">
      {/* SLIDER PUBLICITAIRE - Auto-hide après 6s */}
      <section className="px-4 pt-2">
        <AutoHideMarketplacePromoSlider 
          onPromoClick={handlePromoClick}
          autoplayDelay={5000}
        />
      </section>

      {/* EMPTY STATE - Aucun produit disponible */}
      {!loading && filteredProducts.length === 0 && (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-md mx-auto">
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Aucun produit disponible</h3>
            <p className="text-muted-foreground mb-6">
              La marketplace est en cours de préparation. 
              Revenez bientôt pour découvrir nos produits !
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  handleResetFilters();
                  loadProducts();
                }}
                variant="default"
              >
                Actualiser
              </Button>
              <Button 
                onClick={() => onNavigate('/vendeur/inscription')}
                variant="outline"
              >
                Devenir vendeur
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* PRODUITS POPULAIRES - Grille 2 colonnes style AiShopper */}
      {!loading && filteredProducts.length > 0 && (
        <section className="px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Produits populaires</h2>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('all-products')} className="text-blue-600">
              Voir tout
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.slice(0, 12).map(product => {
              const discount = calculateDiscount(product);
              const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
              
              return (
                <AiShopperProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    originalPrice,
                    discount,
                    image: product.image,
                    seller: product.seller,
                    seller_id: product.seller_id,
                    inStock: product.inStock,
                    stockCount: product.stockCount,
                    rating: product.rating,
                    reviews: product.reviews,
                    created_at: product.created_at
                  }}
                  cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                  onAddToCart={() => addToCart(product, 1)}
                  onQuickView={() => {
                    setQuickViewProduct(product);
                    setIsQuickViewOpen(true);
                  }}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                  onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                  isFavorite={favorites.includes(product.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* BOUTIQUES POPULAIRES - Section avec slider horizontal */}
      {!loading && filteredProducts.length > 0 && topVendors.length > 0 && (
        <section className="px-4 py-6 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Boutiques populaires
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode('all-vendors')}
              className="text-blue-600"
            >
              Voir toutes les boutiques
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Slider horizontal de vendeurs */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-4">
              {topVendors.slice(0, 8).map((vendor, idx) => (
                <div key={vendor.user_id} className="w-[280px] flex-shrink-0">
                  <VendorCard
                    vendor={vendor}
                    onVisit={(id) => navigate(`/marketplace/shop/${id}`)}
                    badge={idx === 0 ? 'top' : undefined}
                    index={idx}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TABS : TOUS / NOUVEAUTÉS / PROCHE */}
      {!loading && filteredProducts.length > 0 && (
        <section className="px-4">
          <Tabs defaultValue="tous" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="tous" className="text-sm">
                🏪 Tous
              </TabsTrigger>
              <TabsTrigger value="nouveautes" className="text-sm">
                ✨ Nouveautés
              </TabsTrigger>
              <TabsTrigger value="proche" className="text-sm">
                📍 Proche
              </TabsTrigger>
            </TabsList>

            {/* Onglet TOUS */}
            <TabsContent value="tous" className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Tous les produits</h3>
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
              
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.slice(0, 12).map(product => {
                  const discount = calculateDiscount(product);
                  const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
                  
                  return (
                    <AiShopperProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        originalPrice,
                        discount,
                        image: product.image,
                        seller: product.seller,
                        seller_id: product.seller_id,
                        inStock: product.inStock,
                        stockCount: product.stockCount,
                        rating: product.rating,
                        reviews: product.reviews,
                        created_at: product.created_at
                      }}
                      cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                      onAddToCart={() => addToCart(product, 1)}
                      onQuickView={() => {
                        setQuickViewProduct(product);
                        setIsQuickViewOpen(true);
                      }}
                      onToggleFavorite={() => handleToggleFavorite(product.id)}
                      onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                      isFavorite={favorites.includes(product.id)}
                    />
                  );
                })}
              </div>
            </TabsContent>

            {/* Onglet NOUVEAUTÉS */}
            <TabsContent value="nouveautes" className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Dernières nouveautés
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {newProducts.slice(0, 12).map(product => {
                  const discount = calculateDiscount(product);
                  const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
                  
                  return (
                    <AiShopperProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        originalPrice,
                        discount,
                        image: product.image,
                        seller: product.seller,
                        seller_id: product.seller_id,
                        inStock: product.inStock,
                        stockCount: product.stockCount,
                        rating: product.rating,
                        reviews: product.reviews,
                        created_at: product.created_at
                      }}
                      cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                      onAddToCart={() => addToCart(product, 1)}
                      onQuickView={() => {
                        setQuickViewProduct(product);
                        setIsQuickViewOpen(true);
                      }}
                      onToggleFavorite={() => handleToggleFavorite(product.id)}
                      onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                      isFavorite={favorites.includes(product.id)}
                    />
                  );
                })}
              </div>
            </TabsContent>

            {/* Onglet PROCHE */}
            <TabsContent value="proche" className="space-y-4">
              {nearbyCalculated.length > 0 ? (
                <>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Près de chez vous
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {nearbyCalculated.slice(0, 12).map(product => {
                      const discount = calculateDiscount(product);
                      const originalPrice = discount > 0 ? getOriginalPrice(product.price, discount) : undefined;
                      
                      return (
                        <AiShopperProductCard
                          key={product.id}
                          product={{
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            originalPrice,
                            discount,
                            image: product.image,
                            seller: product.seller,
                            seller_id: product.seller_id,
                            inStock: product.inStock,
                            stockCount: product.stockCount,
                            rating: product.rating,
                            reviews: product.reviews,
                            created_at: product.created_at
                          }}
                          cartQuantity={cartItems.find(item => item.id === product.id)?.quantity || 0}
                          onAddToCart={() => addToCart(product, 1)}
                          onQuickView={() => {
                            setQuickViewProduct(product);
                            setIsQuickViewOpen(true);
                          }}
                          onToggleFavorite={() => handleToggleFavorite(product.id)}
                          onVisitShop={(vendorId) => navigate(`/marketplace/shop/${vendorId}`)}
                          isFavorite={favorites.includes(product.id)}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun produit proche trouvé
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      )}
    </div>
    );
  };

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
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="shop" className="flex items-center gap-1 touch-manipulation">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 touch-manipulation">
              <CartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1 touch-manipulation">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
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

          <TabsContent value="messages" className="mt-4">
            <MessagesTab />
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
          navigate(`/marketplace/product/${product.id}`);
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
            const conversation = await createOrFindConversation(
              'marketplace',
              pendingFeeOrder.seller_id,
              pendingFeeOrder.product_id,
              `Chat - Commande #${pendingFeeOrder.id.slice(0, 8)}`
            );
            if (conversation) {
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
