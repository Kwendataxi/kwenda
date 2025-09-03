import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { FloatingChatButton as MarketplaceFloatingChatButton } from '@/components/marketplace/FloatingChatButton';
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
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
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
  Heart,
  Zap,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Transport components
import { AdvancedTaxiInterface } from '@/components/transport/AdvancedTaxiInterface';
import TripChat from '@/components/transport/TripChat';

// Delivery components
import ModernDeliveryOrderInterface from '@/components/delivery/ModernDeliveryOrderInterface';
import DeliveryTracking from '@/components/delivery/DeliveryTracking';
import EnhancedDeliveryInterface from '@/components/delivery/EnhancedDeliveryInterface';

// Rental components
import FluidRentalInterface from '@/components/rental/FluidRentalInterface';

  // Marketplace components
  import { EnhancedMarketplaceInterface } from '@/components/marketplace/EnhancedMarketplaceInterface';
  import { Badge } from '@/components/ui/badge';
  import { ShoppingCart, ShoppingBag } from 'lucide-react';
  import { useToast } from '@/hooks/use-toast';
  import { LazyLoadWrapper } from '@/components/performance/LazyLoadWrapper';
  import { PerformanceIndicator } from '@/components/performance/PerformanceIndicator';
  import { OptimizedGrid } from '@/components/performance/OptimizedGrid';
  import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

  // Chat and order components
  import { ModernChatInterface } from '@/components/marketplace/ModernChatInterface';
  import { OrderManagement } from '@/components/marketplace/OrderManagement';
  import { CreateOrderDialog } from '@/components/marketplace/CreateOrderDialog';
  import { ActivityTab } from '@/components/marketplace/ActivityTab';
  import { EditProductForm } from '@/components/marketplace/EditProductForm';

// Testing components
import { TestDataGenerator } from '@/components/testing/TestDataGenerator';

// Hooks
import { useViewTransition } from '@/hooks/useViewTransition';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { LotteryDashboard } from '@/components/lottery/LotteryDashboard';
import { useLotteryTickets } from '@/hooks/useLotteryTickets';
import { useLotteryNotifications } from '@/hooks/useLotteryNotifications';
import { LotteryNotification } from '@/components/transport/LotteryNotification';
import { LotteryTicketFloater } from '@/components/lottery/LotteryTicketFloater';
import { UnifiedActivityScreen } from '@/components/activity/UnifiedActivityScreen';

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
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
  const { user } = useAuth();
  const { t, language, setLanguage, formatCurrency } = useLanguage();
  const { compressData, decompressData } = useDataCompression();
  const { optimizations, measureLoadTime } = usePerformanceMonitor();
  const { transitionToView } = useViewTransition();
  const [currentView, setCurrentView] = useState('home');
  const [serviceType, setServiceType] = useState('transport');
  const [isLoading, setIsLoading] = useState(false);
  
  // Transport states
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isTripChatOpen, setIsTripChatOpen] = useState(false);

  // Prefill for taxi when coming from home search
  type TaxiPrefill = {
    pickup?: Location;
    destination?: Location;
  };
  const [taxiPrefill, setTaxiPrefill] = useState<TaxiPrefill>({});

  // Remove old transport booking hook since it's now integrated

  // Delivery states  
  const [deliveryStep, setDeliveryStep] = useState<'interface' | 'tracking'>('interface');
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [deliveryOrderData, setDeliveryOrderData] = useState<any | null>(null);

  // Rental states
  const [rentalStep, setRentalStep] = useState<'interface' | 'confirmation'>('interface');
  const [rentalBooking, setRentalBooking] = useState<any>(null);

  // Marketplace state - simplified as it's now handled by EnhancedMarketplaceInterface
  const { toast } = useToast();

  // Chat and order hooks
  const ordersHook = useMarketplaceOrders();
  const { createDeliveryOrder } = useEnhancedDeliveryOrders();
  
  // Lottery hooks
  const lotteryTickets = useLotteryTickets();
  const { notifications, showNotification, hideNotification } = useLotteryNotifications();
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);

  // Simplified marketplace data for home preview only
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Auto-attribution des tickets de connexion quotidienne
  useEffect(() => {
    if (user) {
      lotteryTickets.awardDailyLoginTickets();
    }
  }, [user]);

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

  // Products available for home preview
  const homeProducts = marketplaceProducts.slice(0, 4).map(p => ({ ...p, isPopular: Math.random() > 0.5 }));

  const handleServiceSelect = (service: string) => {
    if (service === 'history' || service === 'activity') {
      setCurrentView('history');
      return;
    }
    if (service === 'lottery' || service === 'tombola') {
      setCurrentView('lottery');
      return;
    }
    setServiceType(service);
    setCurrentView('service');
    if (service === 'delivery') {
      setDeliveryStep('interface');
    } else if (service === 'marketplace') {
      // Marketplace handled by EnhancedMarketplaceInterface
    } else if (service === 'rental') {
      setRentalStep('interface');
    }
  };

  const handleUniversalSearch = (query: string, coordinates?: { lat: number; lng: number }) => {
    // Prefill taxi and navigate to transport
    setServiceType('transport');
    setCurrentView('service');
    setTaxiPrefill({
      destination: { 
        address: query, 
        coordinates: coordinates || { lat: 0, lng: 0 }
      }
    });
  };

  const handleMarketplaceViewAll = () => {
    setServiceType('marketplace');
    setCurrentView('service');
  };

  const renderHome = () => (
    <div className="pb-24">
      <ModernHomeScreen
        onServiceSelect={handleServiceSelect}
        onSearch={handleUniversalSearch}
        featuredProducts={homeProducts}
        onProductSelect={(product) => {
          setServiceType('marketplace');
          setCurrentView('service');
        }}
        onMarketplaceViewAll={handleMarketplaceViewAll}
        onNavigateToTestData={() => setCurrentView('test-data')}
      />
    </div>
  );

  // Remove old booking handler since AdvancedTaxiInterface is self-contained

  const renderTransportService = () => {
    return (
      <div className="space-y-4 pb-24">
        <AdvancedTaxiInterface 
          initialPickup={taxiPrefill.pickup}
          initialDestination={taxiPrefill.destination}
        />
        
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
  const handleModernDeliverySubmit = async (data: any) => {
    try {
      console.log('=== Création de commande de livraison ===', data);
      
      // Utiliser le hook pour créer une vraie commande avec UUID
      const orderId = await createDeliveryOrder(data);
      console.log('Commande créée avec ID:', orderId);
      
      // Définir l'ID réel pour le tracking
      setDeliveryId(orderId);
      setDeliveryStep('tracking');
      
      // Attribuer des tickets pour la livraison
      await lotteryTickets.awardDeliveryTickets(orderId);
      
      toast({
        title: "Livraison confirmée",
        description: `Votre colis sera récupéré dans 15 minutes`,
      });
      
      console.log('Livraison créée:', { id: orderId, ...data });
    } catch (error) {
      console.error('Erreur création livraison:', error);
    }
  };

  const handleDeliveryComplete = () => {
    // Reset delivery state
    setDeliveryStep('interface');
    setDeliveryId(null);
  };

  // Rental handlers
  const handleRentalBookingComplete = (booking: any) => {
    setRentalBooking(booking);
    setRentalStep('confirmation');
    
    toast({
      title: "Réservation confirmée",
      description: `Votre location de ${booking.vehicle.name} a été confirmée`,
    });
  };

  const handleRentalComplete = () => {
    setRentalStep('interface');
    setRentalBooking(null);
  };

  const renderRentalService = () => {
    if (rentalStep === 'confirmation' && rentalBooking) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Réservation confirmée</h2>
                <p className="text-muted-foreground">Votre véhicule est réservé</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{rentalBooking.vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{rentalBooking.vehicle.brand} {rentalBooking.vehicle.model}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date de début</p>
                    <p className="font-medium">{format(rentalBooking.startDate, 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de fin</p>
                    <p className="font-medium">{format(rentalBooking.endDate, 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm">Prix total</p>
                  <p className="text-2xl font-bold text-primary">{rentalBooking.totalPrice.toLocaleString()} FC</p>
                </div>
              </div>
              
              <Button
                onClick={handleRentalComplete}
                className="w-full mt-6"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pb-24">
        <FluidRentalInterface
          onCancel={() => setCurrentView('home')}
          onBookingComplete={handleRentalBookingComplete}
        />
      </div>
    );
  };


  const calculateDeliveryPrice = (packageType: PackageType, pickup: string, destination: string) => {
    // Simple distance calculation simulation
    const baseDistance = 5; // km
    const pricePerKm = 300; // FC per km
    const totalPrice = packageType.basePrice + (baseDistance * pricePerKm);
    return totalPrice;
  };

  // Marketplace now handled by EnhancedMarketplaceInterface

  const renderDeliveryService = () => {
    if (deliveryStep === 'tracking' && deliveryId) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDeliveryStep('interface'); setDeliveryId(null); }}
                className="rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Suivi de livraison</h1>
            </div>
            <DeliveryTracking
              orderId={deliveryId}
              orderData={deliveryOrderData}
              onBack={() => { setDeliveryStep('interface'); setDeliveryId(null); setCurrentView('home'); }}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="pb-24">
        <EnhancedDeliveryInterface
          onSubmit={handleModernDeliverySubmit}
          onCancel={() => setCurrentView('home')}
        />
      </div>
    );
  };

  // Marketplace now handled by EnhancedMarketplaceInterface

  const renderProfile = () => (
    <div className="min-h-screen bg-background pb-24 safe-area-inset">
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
      <div className="px-4">
        <ResponsiveUserProfile userType="client" />
      </div>
    </div>
  );

  const renderHistory = () => (
    <UnifiedActivityScreen onBack={() => setCurrentView('home')} />
  );

  const renderPayment = () => (
    <div className="min-h-screen bg-background pb-24 safe-area-inset">
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
    <ChatProvider>
      <div className={`relative ${optimizations.reducedAnimations ? 'reduce-animations' : ''} ${optimizations.cacheEnabled ? 'memory-efficient' : ''}`}>
        {/* Connection Indicator - Hidden */}
        {/* <ConnectionIndicator /> */}
        
        {/* Performance Indicator hidden on client for a cleaner UI */}
        
        {/* Floating Chat Button - Marketplace only */}
        {serviceType === 'marketplace' && (
          <MarketplaceFloatingChatButton />
        )}
      
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
            case 'rental':
              return renderRentalService();
            case 'marketplace':
              return (
                <EnhancedMarketplaceInterface 
                  onBack={() => setCurrentView('home')}
                />
              );
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
          case 'lottery':
          case 'tombola':
            return (
              <div className="min-h-screen bg-background">
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
                    <h1 className="text-lg font-semibold text-gray-900">Tombola Kwenda</h1>
                  </div>
                  <LotteryDashboard />
                </div>
              </div>
            );
          default:
            return renderHome();
        }
      })()}

      {/* Marketplace components now handled by EnhancedMarketplaceInterface */}
      

      {/* Modern Bottom Navigation - Always visible */}
      <ModernBottomNavigation
        activeTab={currentView === 'home' ? 'home' : currentView === 'history' || currentView === 'activity' ? 'activity' : 'profil'}
        onTabChange={(tab) => {
          const preserveScroll = serviceType === 'marketplace';
          
          if (tab === 'home') {
            transitionToView(setCurrentView, 'home', { preserveScroll });
          } else if (tab === 'activity') {
            transitionToView(setCurrentView, 'history', { preserveScroll });
          } else if (tab === 'profil') {
            transitionToView(setCurrentView, 'profil', { preserveScroll });
          }
        }}
        notificationCount={0} // TODO: Connect to real notifications
        favoritesCount={0} // TODO: Connect to favorites count
      />
      
      {/* Lottery Ticket Floater - Omniprésent et discret */}
      <LotteryTicketFloater 
        onOpenLottery={() => setIsLotteryOpen(true)}
      />
        
      {/* Lottery Dashboard Modal */}
      {isLotteryOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsLotteryOpen(false)}
          />
          {/* Modal Content */}
          <div className="relative w-full h-[85vh] sm:h-[80vh] sm:max-w-md sm:mx-auto bg-background sm:rounded-2xl overflow-hidden shadow-xl sm:mt-0 rounded-t-2xl">
            <div className="h-full flex flex-col">
              {/* Header avec bouton fermer */}
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Tombola Kwenda</h2>
                </div>
                <button
                  onClick={() => setIsLotteryOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/50 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <LotteryDashboard />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lottery Notifications */}
      {notifications.map((notification) => (
        <LotteryNotification
          key={notification.id}
          show={notification.show}
          ticketCount={notification.ticketCount}
          sourceType={notification.sourceType}
          multiplier={notification.multiplier}
          onClose={() => hideNotification(notification.id)}
          onViewLottery={() => {
            setCurrentView('lottery');
            hideNotification(notification.id);
          }}
        />
      ))}
      
      {/* Toast notifications */}
      <div id="toast-container" />
      </div>
    </ChatProvider>
  );
};

export default ClientApp;