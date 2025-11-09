import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { FloatingChatButton as MarketplaceFloatingChatButton } from '@/components/marketplace/FloatingChatButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { welcomeCarouselUtils } from '@/utils/welcomeCarousel';

import { ConnectionIndicator, OptimizedImage, ProgressiveLoader, useDataCompression } from '@/components/optimization/SlowConnectionComponents';
import CongoVehicleSelection from '@/components/transport/CongoVehicleSelection';
import SimplifiedInterface from '@/components/ui/SimplifiedInterface';
import MobileMoneyPayment from '@/components/advanced/MobileMoneyPayment';
// import { ReferralPanel } from '@/components/profile/ReferralPanel'; // Supprimé
import NotificationCenter from '@/components/advanced/NotificationCenter';
import SimpleTaxiBooking from '@/components/transport/SimpleTaxiBooking';
import OfflineMode from '@/components/advanced/OfflineMode';
import SecurityVerification from '@/components/advanced/SecurityVerification';
import { ResponsiveUserProfile } from '@/components/profile/ResponsiveUserProfile';
import { ClientWalletPanel } from '@/components/client/ClientWalletPanel';
import { QuickTransferPopup } from '@/components/wallet/QuickTransferPopup';
import { ModernHomeScreen } from '@/components/home/ModernHomeScreen';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { MobileOptimizedLayout } from '@/components/layout/MobileOptimizedLayout';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import StepByStepDeliveryInterface from '@/components/delivery/StepByStepDeliveryInterface';
import { FoodOrderInterface } from '@/components/food/FoodOrderInterface';
import { FoodOrderTracking } from '@/components/food/FoodOrderTracking';
import { VerificationDocumentUpload } from '@/components/client/VerificationDocumentUpload';
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
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Transport components - simplified
import TripChat from '@/components/transport/TripChat';

// Delivery components - simplified
import DeliveryTracking from '@/components/delivery/DeliveryTracking';

// Rental components
import FluidRentalInterface from '@/components/rental/FluidRentalInterface';
import ModernRentalScreen from '@/components/rental/ModernRentalScreen';
import ModernRentalBooking from '@/components/rental/ModernRentalBooking';

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
import { useTabScrollReset } from '@/hooks/useTabScrollReset';
import { LotteryDashboard } from '@/components/lottery/LotteryDashboard';
import { useLotteryTickets } from '@/hooks/useLotteryTickets';
import { UnifiedActivityScreen } from '@/components/activity/UnifiedActivityScreen';
import { CancellationNotification } from '@/components/notifications/CancellationNotification';
import { ServiceWelcomeCarousel } from '@/components/onboarding/ServiceWelcomeCarousel';
import { serviceWelcomeSlides } from '@/data/serviceWelcome';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, formatCurrency } = useLanguage();
  const { compressData, decompressData } = useDataCompression();
  const { optimizations, measureLoadTime } = usePerformanceMonitor();
  const { transitionToView } = useViewTransition();
  const [currentView, setCurrentView] = useState('home');
  const [serviceType, setServiceType] = useState<'transport' | 'delivery' | 'marketplace' | 'rental' | 'food'>('transport');
  const [isLoading, setIsLoading] = useState(false);
  
  // Bottom navigation state
  const [activeTab, setActiveTab] = useState('home');
  
  // ✅ Scroll automatique au changement d'onglet
  useTabScrollReset(activeTab, { 
    behavior: 'smooth',
    delay: 50
  });

  // ✅ Scroll aussi au changement de vue (service, profil, etc.)
  useTabScrollReset(currentView, { 
    behavior: 'smooth',
    delay: 50
  });
  
  // Wallet top-up modal control
  const [shouldOpenWalletTopUp, setShouldOpenWalletTopUp] = useState(false);
  
  // Quick transfer popup state
  const [showQuickTransfer, setShowQuickTransfer] = useState(false);
  
  // Transport states
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isTripChatOpen, setIsTripChatOpen] = useState(false);
  
  // Cancellation notification state
  const [showCancellationPrompt, setShowCancellationPrompt] = useState(false);

  // Welcome carousel state
  const [showWelcomeCarousel, setShowWelcomeCarousel] = useState(false);

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

  // Simplified marketplace data for home preview only
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Auto-attribution des tickets de connexion quotidienne
  useEffect(() => {
    if (user) {
      lotteryTickets.awardDailyLoginTickets();
    }
  }, [user]);

  // ✅ Afficher le carrousel de bienvenue une fois par jour
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // En dev, toujours afficher pour faciliter les tests
    // En prod, vérifier si 24h se sont écoulées
    if (welcomeCarouselUtils.shouldShow() || isDev) {
      const timer = setTimeout(() => {
        setShowWelcomeCarousel(true);
        // Sauvegarder le timestamp (sauf en dev pour pouvoir tester)
        if (!isDev) {
          welcomeCarouselUtils.markAsShown();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Gérer l'ouverture du modal de rechargement depuis la navigation
  useEffect(() => {
    if (location.state?.openWalletTopUp) {
      setCurrentView('wallet');
      setActiveTab('wallet');
      setShouldOpenWalletTopUp(true);
      // Nettoyer le state pour éviter réouverture
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch products from Supabase - ✅ Inclure tous les produits du vendeur
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        // ✅ Récupérer les produits publics (approved + active)
        const { data: publicProducts, error: publicError } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('status', 'active')
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false });

        // ✅ Si l'utilisateur est connecté, récupérer aussi ses propres produits (tous statuts)
        let sellerProducts: any[] = [];
        if (user) {
          const { data: myProducts } = await supabase
            .from('marketplace_products')
            .select('*')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });
          
          if (myProducts) {
            sellerProducts = myProducts;
          }
        }
        
        // ✅ Fusionner sans doublons (priorité aux produits vendeur pour afficher le bon statut)
        const allProducts = [
          ...sellerProducts,
          ...(publicProducts || []).filter(
            p => !sellerProducts.some(sp => sp.id === p.id)
          )
        ];

        if (publicError) {
          console.error('Erreur lors du chargement des produits:', publicError);
          toast({
            title: t('common.error'),
            description: t('client.error_load_products'),
            variant: "destructive",
          });
        } else {
          console.log(`Produits chargés: ${allProducts.length} (${sellerProducts.length} vendeur + ${publicProducts?.length || 0} publics)`);
          
          // Transform products to match our interface
          const transformedProducts = allProducts.map(product => ({
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
            inStock: product.status === 'active',
            stockCount: Math.floor(Math.random() * 20) + 1,
            isTrending: product.featured || false,
            trendingScore: product.featured ? Math.floor(Math.random() * 30) + 70 : 0,
            condition: product.condition,
            location: product.location,
            coordinates: product.coordinates,
            // ✅ Ajouter les statuts pour affichage vendeur
            moderationStatus: product.moderation_status,
            productStatus: product.status,
            isOwnProduct: user?.id === product.seller_id
          })) || [];
          
          setMarketplaceProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Erreur de connexion:', error);
        toast({
          title: t('client.connection_error'),
          description: t('client.check_connection'),
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [user?.id]);

  // Use either real products or fallback to empty array
  const mockProducts = marketplaceProducts;

  // Products available for home preview
  const homeProducts = marketplaceProducts.slice(0, 4).map(p => ({ ...p, isPopular: Math.random() > 0.5 }));

  const handleServiceSelect = (service: string) => {
    // ✅ Gestion activité/historique
    if (service === 'history' || service === 'activity') {
      setCurrentView('history');
      setActiveTab('activity');
      return;
    }
    
    // ✅ Gestion wallet
    if (service === 'wallet') {
      setCurrentView('wallet');
      setActiveTab('profil');
      return;
    }
    
    // ✅ Gestion settings/paramètres
    if (service === 'settings' || service === 'parametres') {
      setCurrentView('profil');
      setActiveTab('profil');
      return;
    }
    
    // ✅ Gestion support
    if (service === 'support' || service === 'help') {
      toast({
        title: "Support client",
        description: "Notre équipe est disponible 24/7 pour vous aider",
      });
      // TODO: Ouvrir chat support ou page dédiée
      return;
    }
    
    // ✅ Gestion rental avec retour
    if (service === 'rental') {
      navigate('/rental', { state: { returnTo: '/app/client' } });
      return;
    }
    
    // ✅ Gestion lottery
    if (service === 'lottery' || service === 'tombola') {
      setCurrentView('lottery');
      return;
    }
    
    // ✅ Gestion transfert rapide
    if (service === 'transfer') {
      setShowQuickTransfer(true);
      return;
    }
    
    // ✅ Gestion profil
    if (service === 'profil' || service === 'profile') {
      setCurrentView('profil');
      setActiveTab('profil');
      return;
    }
    
    // ✅ Gestion food
    if (service === 'food') {
      setServiceType('food');
      setCurrentView('service');
      setActiveTab('home');
      return;
    }
    
    // ✅ Services principaux (transport, delivery, marketplace)
    setServiceType(service as any);
    setCurrentView('service');
    setActiveTab('home');
    if (service === 'delivery') {
      setDeliveryStep('interface');
    } else if (service === 'marketplace') {
      // Marketplace handled by EnhancedMarketplaceInterface
    } else if (service === 'rental') {
      setRentalStep('interface');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        setCurrentView('home');
        break;
      case 'activity':
        setCurrentView('history');
        break;
      case 'profil':
        setCurrentView('profil');
        break;
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

  const renderHome = () => {
    console.log('Rendu de la vue home');
    return (
      <div className="content-with-bottom-nav">
        <ModernHomeScreen
          onServiceSelect={handleServiceSelect}
          onSearch={handleUniversalSearch}
          onNavigateToTestData={() => setCurrentView('test-data')}
        />
      </div>
    );
  };

  // Transport handlers
  const handleTransportSubmit = async (data: any) => {
    try {
      console.log('=== Création de réservation transport ===', data);
      
      // Set transport tracking state
      setActiveBooking(data);
      
      // Award lottery tickets for transport
      await lotteryTickets.awardTransportTickets(data.bookingId);
      
      // Only show success toast if a driver is actually assigned
      if (data.status === 'driver_assigned' && data.driverAssigned) {
      toast({
        title: t('client.booking_confirmed'),
        description: t('client.driver_arriving', { minutes: data.driverAssigned.estimatedArrival || 5 }),
      });
      }
      
      console.log('Transport réservé:', data);
    } catch (error) {
      console.error('Erreur création transport:', error);
    }
  };

  const renderTaxiService = () => {
    return (
      <div className="content-with-bottom-nav space-y-4">
        <ModernTaxiInterface
          onSubmit={handleTransportSubmit}
          onCancel={() => setCurrentView('home')}
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
        title: t('client.delivery_confirmed'),
        description: t('client.package_pickup_soon'),
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
        title: t('client.booking_confirmed'),
        description: t('client.rental_confirmed', { vehicle: booking.vehicle.name }),
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
              <h2 className="text-xl font-bold text-foreground">{t('client.booking_confirmed')}</h2>
              <p className="text-muted-foreground">{t('client.vehicle_reserved')}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{rentalBooking.vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{rentalBooking.vehicle.brand} {rentalBooking.vehicle.model}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('client.start_date')}</p>
                    <p className="font-medium">{format(rentalBooking.startDate, 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('client.end_date')}</p>
                    <p className="font-medium">{format(rentalBooking.endDate, 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm">Prix total</p>
                  <p className="text-2xl font-bold text-primary">{rentalBooking.totalPrice.toLocaleString()} CDF</p>
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

    // Check if we're in booking mode via URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('rental-booking')) {
      return <ModernRentalBooking />;
    }

    return <ModernRentalScreen />;
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
        <StepByStepDeliveryInterface
          onSubmit={handleModernDeliverySubmit}
          onCancel={() => setCurrentView('home')}
        />
      </div>
    );
  };

  // Marketplace now handled by EnhancedMarketplaceInterface

  const [profileError, setProfileError] = useState<string | null>(null);

  const renderProfile = () => (
    <div className="min-h-screen bg-background content-with-bottom-nav-scrollable safe-area-inset">
      <div className="flex items-center gap-4 p-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentView('home');
            setProfileError(null);
          }}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground">Mon Profil</h1>
      </div>
      
      {/* ✅ Message erreur si échec chargement profil */}
      {profileError && (
        <div className="px-4 mb-4">
          <div className={`p-4 rounded-lg border ${
            profileError.includes('permission') || profileError.includes('Accès refusé')
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                profileError.includes('permission') 
                  ? 'bg-yellow-100 dark:bg-yellow-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  profileError.includes('permission') 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  profileError.includes('permission') 
                    ? 'text-yellow-800 dark:text-yellow-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {profileError}
                </p>
                {!profileError.includes('permission') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProfileError(null);
                      window.location.reload();
                    }}
                    className="mt-2"
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="px-4 space-y-4">
        <ResponsiveUserProfile 
          userType="client" 
          onWalletAccess={() => {
            console.log('🚀 [ClientApp] onWalletAccess déclenché, changement vers wallet...');
            setCurrentView('wallet');
            console.log('✅ [ClientApp] setCurrentView("wallet") exécuté');
          }}
          onViewChange={(view) => {
            console.log('🔄 [ClientApp] onViewChange vers:', view);
            setCurrentView(view);
          }}
          onClose={() => {
            console.log('🚪 [ClientApp] onClose - retour à home');
            setCurrentView('home');
          }}
        />
        
        {/* Section Vérification d'Identité */}
        <div className="pb-safe-area-inset">
          <VerificationDocumentUpload />
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <UnifiedActivityScreen onBack={() => setCurrentView('home')} />
  );

  const renderWallet = () => (
    <div className="min-h-screen bg-background content-with-bottom-nav-scrollable safe-area-inset">
      <div className="flex items-center gap-4 p-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('home')}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground">KwendaPay</h1>
      </div>
      <ClientWalletPanel 
        initialTopUpOpen={shouldOpenWalletTopUp}
        onTopUpModalChange={(open) => {
          if (!open) setShouldOpenWalletTopUp(false);
        }}
      />
    </div>
  );

  const renderPayment = () => (
    <div className="min-h-screen bg-background content-with-bottom-nav-scrollable safe-area-inset">
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
    <>
      <ChatProvider>
        <div className="h-screen grid grid-rows-[1fr_auto] bg-background">
          {/* Contenu scrollable */}
          <main className="overflow-y-auto overflow-x-hidden scrollbar-hide pb-[90px]">
        {/* Connection Indicator - Hidden */}
        {/* <ConnectionIndicator /> */}
        
        {/* Performance Indicator hidden on client for a cleaner UI */}
      
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
                <div className="min-h-screen bg-background glassmorphism">
                  {renderTaxiService()}
                </div>
              );
            case 'delivery':
              return (
                <div className="min-h-screen bg-background glassmorphism">
                  {renderDeliveryService()}
                </div>
              );
            case 'rental':
              return renderRentalService();
            case 'marketplace':
              return (
                <EnhancedMarketplaceInterface 
                  onNavigate={(path) => setCurrentView('home')}
                />
              );
            case 'food':
              return (
                <FoodOrderInterface
                  onOrderComplete={(orderId) => {
      toast({
        title: t('client.order_placed'),
        description: t('client.order_confirmed')
      });
                  }}
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
          case 'wallet':
            return renderWallet();
          case 'notifications':
            return <NotificationCenter />;
          // Referral route is handled by /referral page via navigation
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
              <div className="min-h-screen bg-background content-with-bottom-nav-scrollable">
                {/* Header unique avec retour */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                  <div className="flex items-center gap-3 p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('home')}
                      className="rounded-full"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h1 className="text-lg font-semibold text-gray-900">Tombola Kwenda</h1>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard sans son propre header */}
                <LotteryDashboard hideHeader={true} />
              </div>
            );
          default:
            // Force l'affichage de home pour toute vue non reconnue
            if (currentView !== 'home') {
              console.log('Vue non reconnue:', currentView, '- Redirection vers home');
              // Petit délai pour éviter le clignotement
              setTimeout(() => setCurrentView('home'), 0);
            }
            return renderHome();
        }
      })()}

      {/* Marketplace components now handled by EnhancedMarketplaceInterface */}
      
      {/* Lottery Notifications */}
      {/* Notifications gérées par NotificationCenter dans le header */}
      
        </main>
        
        {/* Footer de navigation fixe global */}
        <ModernBottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notificationCount={0}
          favoritesCount={0}
        />
        
        {/* Toast notifications */}
        <div id="toast-container" />
        
        {/* Quick Transfer Popup */}
        <QuickTransferPopup 
          open={showQuickTransfer}
          onClose={() => setShowQuickTransfer(false)}
          onTransferSuccess={() => {
            setShowQuickTransfer(false);
            toast({
              title: "Transfert réussi",
              description: "L'argent a été envoyé avec succès",
            });
          }}
        />
        
        {/* Cancellation notification */}
        <CancellationNotification 
          isOpen={showCancellationPrompt}
          onClose={() => setShowCancellationPrompt(false)}
          onNewRide={() => {
            setShowCancellationPrompt(false);
            setCurrentView('transport');
          }}
        />
        
        {/* Welcome Carousel - Présentation des services au premier lancement */}
        <ServiceWelcomeCarousel
          open={showWelcomeCarousel}
          onOpenChange={setShowWelcomeCarousel}
          slides={serviceWelcomeSlides}
          onNavigate={(path) => {
            setShowWelcomeCarousel(false);
            // Navigation selon le service
            if (path === '/food') {
              handleServiceSelect('food');
            } else if (path === '/marketplace') {
              handleServiceSelect('marketplace');
            } else if (path === '/transport') {
              handleServiceSelect('transport');
            } else if (path === '/lottery') {
              handleServiceSelect('lottery');
            }
          }}
        />
      </div>
    </ChatProvider>
    </>
  );
};

export default ClientApp;