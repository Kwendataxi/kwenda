import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConnectionIndicator, OptimizedImage, ProgressiveLoader, useDataCompression } from '@/components/optimization/SlowConnectionComponents';
import CongoVehicleSelection from '@/components/transport/CongoVehicleSelection';
import SimplifiedInterface from '@/components/ui/SimplifiedInterface';
import MobileMoneyPayment from '@/components/advanced/MobileMoneyPayment';
import ReferralSystem from '@/components/advanced/ReferralSystem';
import NotificationCenter from '@/components/advanced/NotificationCenter';
import OfflineMode from '@/components/advanced/OfflineMode';
import SecurityVerification from '@/components/advanced/SecurityVerification';
import { ResponsiveUserProfile } from '@/components/profile/ResponsiveUserProfile';
import { ModernHomeScreen } from '@/components/home/ModernHomeScreen';
import { 
  MapPin, 
  Car, 
  Clock, 
  Star, 
  User, 
  CreditCard, 
  History, 
  Home, 
  Building2, 
  ArrowLeft, 
  Bell, 
  Leaf, 
  Shield,
  Truck,
  Package,
  Store,
  Plus,
  Search,
  Camera,
  Upload,
  Activity,
  Bike,
  Heart
} from 'lucide-react';

// Transport components
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import TripChat from '@/components/transport/TripChat';
import { useEnhancedTransportBooking } from '@/hooks/useEnhancedTransportBooking';

// Delivery components
import ModernDeliveryInterface from '@/components/delivery/ModernDeliveryInterface';
import DeliveryTracking from '@/components/delivery/DeliveryTracking';

// Marketplace components
import { ModernProductCard } from '@/components/marketplace/ModernProductCard';
import { BottomNavigation } from '@/components/marketplace/BottomNavigation';
import { SellProductForm } from '@/components/marketplace/SellProductForm';
import { ModernMarketplaceHeader } from '@/components/marketplace/ModernMarketplaceHeader';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { ShoppingCart as CartComponent } from '@/components/marketplace/ShoppingCart';
import { ProductDetails } from '@/components/marketplace/ProductDetails';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LazyLoadWrapper } from '@/components/performance/LazyLoadWrapper';
import { PerformanceIndicator } from '@/components/performance/PerformanceIndicator';
import { OptimizedGrid } from '@/components/performance/OptimizedGrid';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Chat and order components
import { ChatInterface } from '@/components/marketplace/ChatInterface';
import { OrderManagement } from '@/components/marketplace/OrderManagement';
import { CreateOrderDialog } from '@/components/marketplace/CreateOrderDialog';
import { ActivityTab } from '@/components/marketplace/ActivityTab';

// Testing components
import { TestDataGenerator } from '@/components/testing/TestDataGenerator';

// Hooks
import { useMarketplaceChat } from '@/hooks/useMarketplaceChat';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';

interface Location {
  address: string;
  coordinates: [number, number];
  type?: 'home' | 'work' | 'other' | 'recent' | 'favorite';
}

interface Vehicle {
  id: string;
  name: string;
  type: 'moto' | 'eco' | 'standard' | 'premium' | 'bus';
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  multiplier: number;
  available: boolean;
  capacity: number;
  price?: number;
}

interface PackageType {
  id: string;
  name: string;
  description: string;
  maxWeight: string;
  maxDimensions: string;
  basePrice: number;
  estimatedTime: string;
  icon: string;
  popular?: boolean;
  examples: string[];
}

const ClientApp = () => {
  const { t, language, setLanguage, formatCurrency } = useLanguage();
  const { compressData, decompressData } = useDataCompression();
  const { optimizations, measureLoadTime } = usePerformanceMonitor();
  const [currentView, setCurrentView] = useState('home');
  const [serviceType, setServiceType] = useState('transport');
  const [isLoading, setIsLoading] = useState(false);
  
  // Transport states
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isTripChatOpen, setIsTripChatOpen] = useState(false);
  
  // Enhanced transport booking hook
  const { createBooking, loading: bookingLoading } = useEnhancedTransportBooking();

  // Delivery states  
  const [deliveryStep, setDeliveryStep] = useState<'interface' | 'tracking'>('interface');
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  // Marketplace state
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 500000] as [number, number],
    inStockOnly: false,
    freeShipping: false,
  });
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [marketplaceTab, setMarketplaceTab] = useState('explore');
  const [showingTrends, setShowingTrends] = useState(false);

  // Chat and order states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isOrderManagementOpen, setIsOrderManagementOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<any>(null);

  // Chat and order hooks
  const chatHook = useMarketplaceChat();
  const ordersHook = useMarketplaceOrders();

  // Marketplace data from Supabase
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data: products, error } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des produits:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les produits",
            variant: "destructive",
          });
        } else {
          console.log('Produits chargés:', products);
          
          // Transform products to match our interface
          const transformedProducts = products?.map(product => ({
            id: product.id,
            name: product.title,
            price: product.price,
            image: Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=300&h=300&fit=crop',
            images: Array.isArray(product.images) ? product.images : [],
            rating: 4.5, // Default rating
            reviews: Math.floor(Math.random() * 200) + 10, // Mock reviews
            seller: 'Vendeur Kwenda',
            category: product.category?.toLowerCase() || 'other',
            description: product.description || '',
            specifications: {},
            inStock: true,
            stockCount: Math.floor(Math.random() * 20) + 1,
            isTrending: product.featured || false,
            trendingScore: product.featured ? Math.floor(Math.random() * 30) + 70 : 0,
            condition: product.condition,
            location: product.location,
            coordinates: product.coordinates
          })) || [];
          
          setMarketplaceProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Erreur de connexion:', error);
        toast({
          title: "Erreur de connexion",
          description: "Vérifiez votre connexion internet",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Use either real products or fallback to empty array
  const mockProducts = marketplaceProducts;

  // Filter products based on category, search, and filters
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
    const matchesStock = !filters.inStockOnly || product.inStock;
    const matchesTrending = !showingTrends || product.isTrending;
    
    return matchesCategory && matchesSearch && matchesPrice && matchesStock && matchesTrending;
  });

  // Get trending products sorted by score
  const trendingProducts = mockProducts
    .filter(product => product.isTrending)
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));

  // Get product counts per category
  const productCounts = mockProducts.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    acc.all = mockProducts.length;
    return acc;
  }, {} as Record<string, number>);

  const handleServiceSelect = (service: string) => {
    setServiceType(service);
    setCurrentView('service');
    if (service === 'delivery') {
      setDeliveryStep('interface');
    } else if (service === 'marketplace') {
      setMarketplaceTab('explore');
    }
  };

  const handleUniversalSearch = (query: string) => {
    setSearchQuery(query);
    // For now, default to marketplace search
    setServiceType('marketplace');
    setMarketplaceTab('explore');
  };

  const handleMarketplaceViewAll = () => {
    setServiceType('marketplace');
    setMarketplaceTab('explore');
    setShowingTrends(true);
  };

  const handleBackFromTrends = () => {
    setShowingTrends(false);
  };

  const renderHome = () => (
    <ModernHomeScreen
      onServiceSelect={handleServiceSelect}
      onSearch={handleUniversalSearch}
      featuredProducts={mockProducts.slice(0, 4).map(p => ({ ...p, isPopular: Math.random() > 0.5 }))}
      onProductSelect={(product) => {
        setSelectedProduct(product);
        setIsProductDetailsOpen(true);
      }}
      onMarketplaceViewAll={handleMarketplaceViewAll}
      onNavigateToTestData={() => setCurrentView('test-data')}
    />
  );

  const handleBookingRequest = async (bookingData: any) => {
    try {
      setIsLoading(true);
      console.log('Données de réservation reçues:', bookingData);
      
      const booking = await createBooking(bookingData);
      console.log('Résultat de création:', booking);
      
      if (booking) {
        setActiveBooking(booking);
        setIsTripChatOpen(true);
        toast({
          title: "Réservation créée",
          description: "Recherche d'un chauffeur en cours...",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la réservation. Vérifiez votre connexion.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: `Impossible de créer la réservation: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransportService = () => {
    return (
      <div className="space-y-4">
        <ModernTaxiInterface onBookingRequest={handleBookingRequest} />
        
        {/* Trip Chat Modal */}
        {isTripChatOpen && activeBooking && (
          <TripChat
            bookingId={activeBooking.id}
            driverInfo={activeBooking.driver}
            userType="client"
            onClose={() => setIsTripChatOpen(false)}
          />
        )}
      </div>
    );
  };

  // Delivery handlers
  const handleModernDeliverySubmit = (data: any) => {
    // Generate delivery ID and start tracking
    const newDeliveryId = 'KWT' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setDeliveryId(newDeliveryId);
    setDeliveryStep('tracking');
    
    toast({
      title: "Livraison confirmée",
      description: `Votre colis sera récupéré dans 15 minutes`,
    });
    
    console.log('Livraison créée:', { id: newDeliveryId, ...data });
  };

  const handleDeliveryComplete = () => {
    // Reset delivery state
    setDeliveryStep('interface');
    setDeliveryId(null);
  };

  const calculateDeliveryPrice = (packageType: PackageType, pickup: string, destination: string) => {
    // Simple distance calculation simulation
    const baseDistance = 5; // km
    const pricePerKm = 300; // FC per km
    const totalPrice = packageType.basePrice + (baseDistance * pricePerKm);
    return totalPrice;
  };

  // Marketplace functions
  const handleAddToCart = (product: any, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(items =>
        items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems(items => [...items, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0],
        quantity,
        seller: product.seller
      }]);
    }

    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à votre panier`,
    });
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveFromCart(id);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast({
      title: "Produit retiré",
      description: "Le produit a été retiré de votre panier",
    });
  };

  const handleViewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleSearch = () => {
    // Search is already handled by the filter effect
    toast({
      title: "Recherche effectuée",
      description: `${filteredProducts.length} produit(s) trouvé(s)`,
    });
  };

  const handleCheckout = () => {
    toast({
      title: "Commande en cours",
      description: "Redirection vers le paiement...",
    });
    // Here you would integrate with a payment system
    setIsCartOpen(false);
  };

  // Chat and order handlers
  const handleContactSeller = async (product: any) => {
    try {
      const conversation = await chatHook.startConversation(product.id, 'seller-id');
      if (conversation) {
        setSelectedConversationId('conv-' + Math.random().toString(36).substr(2, 9));
      }
      setIsChatOpen(true);
      setIsProductDetailsOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de contacter le vendeur",
        variant: "destructive",
      });
    }
  };

  const handleStartOrder = (productId: string, sellerId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (product) {
      setOrderProduct(product);
      setIsCreateOrderDialogOpen(true);
      setIsChatOpen(false);
    }
  };

  const handleOrderSuccess = () => {
    toast({
      title: "Commande créée",
      description: "Votre commande a été créée avec succès",
    });
    setIsCreateOrderDialogOpen(false);
    setOrderProduct(null);
    ordersHook.refetch?.();
  };

  const renderDeliveryService = () => {
    if (deliveryStep === 'tracking' && deliveryId) {
      return (
        <DeliveryTracking
          deliveryId={deliveryId}
          onComplete={handleDeliveryComplete}
        />
      );
    }

    // Default to modern interface
    return (
      <ModernDeliveryInterface
        onSubmit={handleModernDeliverySubmit}
        onCancel={() => setServiceType('transport')}
      />
    );
  };


  const handleSellProduct = (formData: any) => {
    console.log('New product to sell:', formData);
    toast({
      title: "Produit publié",
      description: "Votre produit est maintenant en vente!",
    });
    setMarketplaceTab('explore');
  };

  const renderMarketplaceService = () => {
    if (marketplaceTab === 'sell') {
      return (
        <SellProductForm
          onBack={() => setMarketplaceTab('explore')}
          onSubmit={handleSellProduct}
        />
      );
    }

    if (marketplaceTab === 'activity') {
      return (
        <div className="min-h-screen bg-background pb-20">
          <ModernMarketplaceHeader
            cartItemsCount={cartItems.length}
            onCartClick={() => setIsCartOpen(true)}
          />
          <ActivityTab />
          <BottomNavigation
            activeTab={marketplaceTab}
            onTabChange={setMarketplaceTab}
            cartItemsCount={cartItems.length}
            favoritesCount={0}
          />
        </div>
      );
    }

    if (marketplaceTab === 'favorites') {
      const favoriteProducts = mockProducts.filter(product => 
        // This will be replaced by real favorites from FavoritesManager
        false // Temporary placeholder
      );
      
      return (
        <div className="min-h-screen bg-background pb-20">
          <ModernMarketplaceHeader
            cartItemsCount={cartItems.length}
            onCartClick={() => setIsCartOpen(true)}
          />
          
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Mes Favoris</h2>
            
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun favori</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez des produits à vos favoris en appuyant sur le cœur
                </p>
                <Button onClick={() => setMarketplaceTab('explore')}>
                  Explorer les produits
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {favoriteProducts.map((product) => (
                   <ModernProductCard
                     key={product.id}
                     product={product}
                     onAddToCart={handleAddToCart}
                     onViewDetails={handleViewProductDetails}
                   />
                ))}
              </div>
            )}
          </div>

          <BottomNavigation
            activeTab={marketplaceTab}
            onTabChange={setMarketplaceTab}
            cartItemsCount={cartItems.length}
            favoritesCount={0} // Will be updated with real favorites count
          />
        </div>
      );
    }

    // Default explore view
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModernMarketplaceHeader
          cartItemsCount={cartItems.length}
          onCartClick={() => setIsCartOpen(true)}
        />
        
        <div className="space-y-4">
          {showingTrends ? (
            // Vue "Toutes les tendances"
            <div className="px-4">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackFromTrends}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{t('marketplace.trending_products')}</h1>
                  <p className="text-sm text-muted-foreground">{trendingProducts.length} produits tendances</p>
                </div>
              </div>
              
              {trendingProducts.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun produit tendance</h3>
                  <p className="text-muted-foreground">
                    Aucun produit n'est actuellement en tendance
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {trendingProducts.map((product) => (
                     <div key={product.id} className="relative">
                       <ModernProductCard
                         product={product}
                         onAddToCart={handleAddToCart}
                         onViewDetails={handleViewProductDetails}
                       />
                       {/* Badge de score de tendance */}
                       <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                         🔥 #{trendingProducts.findIndex(p => p.id === product.id) + 1}
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Vue normale du marketplace
            <>
              <div className="px-4">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearch={handleSearch}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
              
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                productCounts={productCounts}
              />
              
              <div className="px-4 pb-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
                    <p className="text-muted-foreground">
                      Essayez de modifier vos filtres de recherche
                    </p>
                  </div>
                ) : (
                  <OptimizedGrid 
                    className="grid-cols-2"
                    itemsPerPage={20}
                    enableVirtualization={true}
                  >
                    {filteredProducts.map((product) => (
                       <ModernProductCard
                         key={product.id}
                         product={product}
                         onAddToCart={handleAddToCart}
                         onViewDetails={handleViewProductDetails}
                       />
                    ))}
                  </OptimizedGrid>
                )}
              </div>
            </>
          )}
        </div>

        <BottomNavigation
          activeTab={marketplaceTab}
          onTabChange={setMarketplaceTab}
          cartItemsCount={cartItems.length}
          favoritesCount={0} // Will be updated with real favorites count
        />
      </div>
    );
  };

  const renderProfile = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center gap-4 p-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('home')}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground">Mon Profil</h1>
      </div>
      <ResponsiveUserProfile userType="client" />
    </div>
  );

  const renderHistory = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Activité</h1>
        </div>

        <div className="space-y-4">
          {[
            { from: "Cocody", to: "Plateau", date: "15 Janv. 2024", time: "14:30", price: "2,500", driver: "Kouame Paul", rating: 4.9, type: "transport" },
            { from: "Marcory", to: "Treichville", date: "14 Janv. 2024", time: "16:45", price: "1,800", driver: "Traore Sekou", rating: 4.8, type: "delivery" },
            { from: "Plateau", to: "Yopougon", date: "13 Janv. 2024", time: "09:20", price: "3,200", driver: "Diallo Mamadou", rating: 5.0, type: "transport" },
          ].map((trip, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {trip.type === 'delivery' ? (
                      <Package className="h-4 w-4 text-primary" />
                    ) : (
                      <Car className="h-4 w-4 text-primary" />
                    )}
                    <p className="text-body-md font-semibold text-card-foreground">{trip.from} → {trip.to}</p>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{trip.date}, {trip.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-heading-sm font-bold text-card-foreground">{trip.price}</p>
                  <p className="text-caption text-muted-foreground">CFA</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-body-sm font-medium text-card-foreground">{trip.driver}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-body-sm font-medium text-card-foreground">{trip.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Paiements</h1>
        </div>

        <div className="space-y-4">
          <Card className="card-floating border-0">
            <CardHeader>
              <CardTitle className="text-heading-md">Moyens de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Orange Money", primary: true, icon: "🟠" },
                { name: "MTN Money", primary: false, icon: "🟡" },
                { name: "Espèces", primary: false, icon: "💵" },
              ].map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-grey-50 rounded-xl border border-transparent hover:border-grey-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-body-md font-medium text-card-foreground">{method.name}</span>
                  </div>
                  {method.primary && (
                    <span className="text-caption font-semibold text-primary bg-primary-light px-2 py-1 rounded-md">Principal</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full h-12 rounded-xl text-body-md font-semibold">
            Ajouter un moyen de paiement
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${optimizations.reducedAnimations ? 'reduce-animations' : ''} ${optimizations.cacheEnabled ? 'memory-efficient' : ''}`}>
      {/* Connection Indicator - Hidden */}
      {/* <ConnectionIndicator /> */}
      
      {/* Performance Indicator */}
      <PerformanceIndicator showDetails={false} />
      
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <ProgressiveLoader message="Chargement optimisé..." />
        </div>
      )}
      {/* Main Content */}
      {(() => {
        // Show service content when service view is active
        if (currentView === 'service') {
          switch (serviceType) {
            case 'transport':
              return (
                <div className="min-h-screen bg-background pb-20">
                  <div className="p-4">
                    <div className="flex items-center gap-4 mb-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentView('home')}
                        className="rounded-xl"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <h1 className="text-lg font-semibold text-gray-900">Transport</h1>
                    </div>
                    {renderTransportService()}
                  </div>
                </div>
              );
            case 'delivery':
              return renderDeliveryService();
            case 'marketplace':
              return renderMarketplaceService();
            default:
              return renderHome();
          }
        }

        switch (currentView) {
          case 'profil':
          case 'profile':
            return renderProfile();
          case 'activity':
          case 'history':
            return renderHistory();
          case 'paiement':
          case 'payment':
            return renderPayment();
          case 'notifications':
            return <NotificationCenter />;
          case 'referral':
            return <ReferralSystem />;
          case 'offline':
            return <OfflineMode />;
          case 'security':
            return <SecurityVerification />;
          case 'simplified':
            return <SimplifiedInterface />;
          case 'mobile-money':
            return (
              <MobileMoneyPayment
                amount={3500}
                onSuccess={(transactionId) => {
                  console.log('Payment success:', transactionId);
                  setCurrentView('home');
                }}
                onCancel={() => setCurrentView('payment')}
              />
            );
          case 'test-data':
            return (
              <div className="p-4">
                <Button 
                  onClick={() => setCurrentView('home')} 
                  variant="outline" 
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <TestDataGenerator />
              </div>
            );
          default:
            return renderHome();
        }
      })()}

      {/* Marketplace Components */}
      <CartComponent
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
      
      <ProductDetails
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onClose={() => setIsProductDetailsOpen(false)}
        onAddToCart={handleAddToCart}
        onContactSeller={handleContactSeller}
        onStartOrder={() => {
          if (selectedProduct) {
            setOrderProduct(selectedProduct);
            setIsCreateOrderDialogOpen(true);
            setIsProductDetailsOpen(false);
          }
        }}
      />

      {/* Chat Interface */}
      <ChatInterface
        conversationId={selectedConversationId}
        onBack={() => setIsChatOpen(false)}
        onStartOrder={handleStartOrder}
      />

      {/* Order Management */}
      <OrderManagement
        isOpen={isOrderManagementOpen}
        onClose={() => setIsOrderManagementOpen(false)}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        product={orderProduct}
        isOpen={isCreateOrderDialogOpen}
        onClose={() => {
          setIsCreateOrderDialogOpen(false);
          setOrderProduct(null);
        }}
        onSuccess={handleOrderSuccess}
      />
      

      {/* Fixed Bottom Navigation - Only show for non-marketplace */}
      {serviceType !== 'marketplace' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-grey-100 z-50">
          <div className="px-6 py-4 flex justify-around max-w-md mx-auto">
            {[
              { icon: Home, label: "Accueil", key: "home" },
              { icon: Activity, label: "Activité", key: "activity" },
              { icon: User, label: "Compte", key: "profil" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                  currentView === item.key 
                    ? 'text-grey-900 bg-grey-100' 
                    : 'text-grey-500 hover:text-grey-700 hover:bg-grey-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      <div id="toast-container" />
    </div>
  );
};

export default ClientApp;