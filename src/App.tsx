import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PerformanceOptimizer from "@/components/performance/PerformanceOptimizer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { ABTestProvider } from "@/contexts/ABTestContext";
import { ClickTracker } from "@/components/tracking/ClickTracker";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import DynamicTheme from "@/components/theme/DynamicTheme";
import ParticleBackground from "@/components/theme/ParticleBackground";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { APP_CONFIG, isClientApp, isDriverApp, isPartnerApp, isSpecificBuild } from "@/config/appConfig";
import { isMobileApp, isPWA } from "@/services/platformDetection";
import { PWASplashScreen } from "@/components/PWASplashScreen";
import { useState } from "react";
import { RouteLoadingFallback } from "@/components/loading/RouteLoadingFallback";

// ✅ Critical imports - loaded immediately (auth, landing, core)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MobileSplash from "./pages/MobileSplash";
import { SmartHome } from "./components/navigation/SmartHome";
import AdminAuth from "./pages/AdminAuth";
import PartnerAuth from "./pages/PartnerAuth";
import DriverAuth from "./pages/DriverAuth";
import RestaurantAuth from "./pages/RestaurantAuth";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import Install from "./pages/Install";
import ResetPassword from "./pages/ResetPassword";

// 🔄 Lazy-loaded imports - loaded on demand
const ClientApp = lazy(() => import("./pages/ClientApp"));
const DriverApp = lazy(() => import("./pages/DriverApp"));
const PartnerApp = lazy(() => import("./pages/PartnerApp"));
const AdminApp = lazy(() => import("./pages/AdminApp"));
const RestaurantApp = lazy(() => import("./pages/RestaurantApp"));

const NotFound = lazy(() => import("./pages/NotFound"));
const HelpCenter = lazy(() => import("./pages/support/HelpCenter"));
const Contact = lazy(() => import("./pages/support/Contact"));
const FAQ = lazy(() => import("./pages/support/FAQ"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Kinshasa = lazy(() => import("./pages/locations/Kinshasa"));
const Lubumbashi = lazy(() => import("./pages/locations/Lubumbashi"));
const Kolwezi = lazy(() => import("./pages/locations/Kolwezi"));
const About = lazy(() => import("./pages/about/About"));
const TransportVTC = lazy(() => import("./pages/services/TransportVTC"));
const LivraisonExpress = lazy(() => import("./pages/services/LivraisonExpress"));
const LocationVehicules = lazy(() => import("./pages/services/LocationVehicules"));
const DevenirChauffeur = lazy(() => import("./pages/partners/DevenirChauffeur"));
const LouerVehicule = lazy(() => import("./pages/partners/LouerVehicule"));
const DevenirLivreur = lazy(() => import("./pages/partners/DevenirLivreur"));
const VendreEnLigne = lazy(() => import("./pages/partners/VendreEnLigne"));
const SignalerProbleme = lazy(() => import("./pages/support/SignalerProbleme"));
const TransportPage = lazy(() => import("./pages/Transport"));
const Expansion = lazy(() => import("./pages/locations/Expansion"));
const Demo = lazy(() => import("./pages/demo/Demo"));
const ProgrammePartenaire = lazy(() => import("./pages/partner/ProgrammePartenaire"));
const CarteCouverture = lazy(() => import("./pages/locations/CarteCouverture"));
const Marketplace = lazy(() => import("./pages/marketplace/Marketplace"));
const VendorShop = lazy(() => import("./pages/VendorShop"));
const ModernVendorDashboard = lazy(() => import("./pages/ModernVendorDashboard"));
const VendorRegistration = lazy(() => import("./pages/VendorRegistration"));
const VendorAddProduct = lazy(() => import("./pages/VendorAddProduct"));
const VendorEditProduct = lazy(() => import("./pages/VendorEditProduct"));
const MyProducts = lazy(() => import("./pages/marketplace/MyProducts"));
const RestaurantDashboard = lazy(() => import("./pages/restaurant/RestaurantDashboard"));
const RestaurantMenuManager = lazy(() => import("./pages/restaurant/RestaurantMenuManager"));
const RestaurantOrders = lazy(() => import("./pages/restaurant/RestaurantOrders"));
const RestaurantSubscription = lazy(() => import("./pages/restaurant/RestaurantSubscription"));
const RestaurantPOS = lazy(() => import("./pages/restaurant/RestaurantPOS"));
const RestaurantProfile = lazy(() => import("./pages/restaurant/RestaurantProfile"));
const QRCodeManager = lazy(() => import("./pages/admin/QRCodeManager"));
const QRAnalytics = lazy(() => import("./pages/admin/QRAnalytics"));
const AdminFoodManagement = lazy(() => import("./pages/admin/AdminFoodManagement"));
const ProductionConfig = lazy(() => import("./pages/admin/ProductionConfig"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const MesAdresses = lazy(() => import("./pages/address/MesAdresses"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const DriverFindPartner = lazy(() => import("./pages/DriverFindPartner").then(m => ({ default: m.DriverFindPartner })));
const CampaignLanding = lazy(() => import("./pages/campaign/CampaignLanding"));
const CampaignThankYou = lazy(() => import("./pages/campaign/CampaignThankYou"));
const PublicPartnerRegistration = lazy(() => import("./pages/partner/PublicPartnerRegistration"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerRegistrationForm = lazy(() => import("./components/partner/registration/PartnerRegistrationForm").then(m => ({ default: m.PartnerRegistrationForm })));
const UnifiedTracking = lazy(() => import("./pages/UnifiedTracking"));
const DriverRegistration = lazy(() => import("./pages/DriverRegistration"));
const DriverVerifyEmail = lazy(() => import("./pages/DriverVerifyEmail"));
const PartnerVerifyEmail = lazy(() => import("./pages/PartnerVerifyEmail"));
const ClientVerifyEmail = lazy(() => import("./pages/ClientVerifyEmail"));
const RestaurantVerifyEmail = lazy(() => import("./pages/RestaurantVerifyEmail"));
const ClientReferralPage = lazy(() => import("./pages/ClientReferralPage"));
const PromosPage = lazy(() => import("./pages/PromosPage"));
const EscrowPage = lazy(() => import("./pages/EscrowPage").then(m => ({ default: m.EscrowPage })));

// Test pages - lazy loaded
const AuthSystemTest = lazy(() => import("./pages/test/AuthSystemTest"));
const TrackingTest = lazy(() => import("./pages/test/TrackingTest"));
const ModernTrackingTest = lazy(() => import("./pages/test/ModernTrackingTest"));
const ModernNavigationTest = lazy(() => import("./pages/test/ModernNavigationTest").then(m => ({ default: m.ModernNavigationTest })));
const SmartLocationTest = lazy(() => import("./pages/test/SmartLocationTest"));
const UniversalLocationTest = lazy(() => import("./pages/test/UniversalLocationTest"));
const UniversalLocationTestAdvanced = lazy(() => import("./pages/test/UniversalLocationTestAdvanced"));
const EdgeFunctionTest = lazy(() => import("./pages/test/EdgeFunctionTest"));
const DispatchSystemTest = lazy(() => import("./pages/test/DispatchSystemTest"));
const DispatchValidationTest = lazy(() => import("./pages/test/DispatchValidationTest"));
const MapValidationTest = lazy(() => import("./pages/test/MapValidationTest"));
const ComponentsDemo = lazy(() => import("./pages/test/ComponentsDemo").then(m => ({ default: m.ComponentsDemo })));
const ModernMapDemo = lazy(() => import("./pages/test/ModernMapDemo"));

// Guards and other components
import { ChatProvider } from "@/components/chat/ChatProvider";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { UpdateProgress } from "@/components/pwa/UpdateProgress";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { StartupExperience } from "@/components/splash/StartupExperience";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ThemeNotification } from "@/components/theme/ThemeNotification";
import { useOrderCleanup } from "@/hooks/useOrderCleanup";
import { DebugHelper } from "@/utils/debugHelper";
import { ServiceGuard } from "./components/guards/ServiceGuard";
import { useServiceRealtime } from "./hooks/useServiceRealtime";
import { VendorGuard } from "./components/guards/VendorGuard";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(isPWA() || isMobileApp());
  
  // Initialiser le nettoyage automatique des commandes
  useOrderCleanup();
  
  // Initialiser le système de mise à jour temps réel des services
  useServiceRealtime();
  
  // Diagnostic de debug en développement
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [Debug] Mode développement - Diagnostic disponible');
      console.log('🔍 [Debug] Utilise window.debugKwenda.runFullDiagnostic() pour un diagnostic complet');
      
      // Diagnostic automatique au démarrage
      setTimeout(() => {
        DebugHelper.runFullDiagnostic();
      }, 2000);
    }
  }, []);
  
  return (
    <>
      {showSplash && (
        <PWASplashScreen onComplete={() => setShowSplash(false)} />
      )}
      {!showSplash && (
        <>
          <UpdateNotification />
          <UpdateProgress />
          <DynamicTheme>
            <ParticleBackground />
            <ThemeNotification />
            <PerformanceOptimizer>
              <Toaster />
              <Sonner />
              <PushNotificationManager />
              <InstallBanner />
              <BrowserRouter>
            <ScrollToTop />
            {/* <StartupExperience /> */}
            <OnboardingRedirect>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                {/* ✅ ROUTES AUTH GLOBALES - TOUJOURS ACCESSIBLES */}
                <Route path="/app/auth" element={<Auth />} />
                <Route path="/driver/auth" element={<DriverAuth />} />
                <Route path="/partner/auth" element={<PartnerAuth />} />
                <Route path="/operatorx/admin/auth" element={<AdminAuth />} />
                <Route path="/restaurant/auth" element={<RestaurantAuth />} />
                
                {/* Routes de vérification email */}
                <Route path="/client/verify-email" element={<EmailVerificationPage type="client" />} />
                <Route path="/driver/verify-email" element={<EmailVerificationPage type="driver" />} />
                <Route path="/partner/verify-email" element={<EmailVerificationPage type="partner" />} />
                <Route path="/restaurant/verify-email" element={<EmailVerificationPage type="restaurant" />} />
                
                {/* Route Splash pour mobile/PWA */}
                <Route path="/splash" element={<MobileSplash />} />
                
                {/* Route publique - Landing page toujours accessible */}
                {!isSpecificBuild() && <Route path="/" element={<Index />} />}
                
                {/* Routes apps sous /app/* */}
                {!isSpecificBuild() && <Route path="/app" element={<SmartHome />} />}
                {!isSpecificBuild() && (
                  <Route path="/app/client" element={
                    <ProtectedRoute>
                      <ClientApp />
                    </ProtectedRoute>
                  } />
                )}
                {!isSpecificBuild() && <Route path="/onboarding" element={<Onboarding />} />}
                <Route path="/install" element={<Install />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/campaign/:campaignId" element={<CampaignLanding />} />
                <Route path="/campaign-thank-you" element={<CampaignThankYou />} />
                
                {/* Routes RESTAURANT */}
                <Route path="/restaurant/auth" element={<RestaurantAuth />} />
                <Route path="/restaurant/verify-email" element={<RestaurantVerifyEmail />} />
                <Route path="/app/restaurant" element={
                  <ProtectedRoute>
                    <RestaurantApp />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant" element={
                  <ProtectedRoute>
                    <RestaurantApp />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/menu" element={
                  <ProtectedRoute>
                    <RestaurantMenuManager />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/orders" element={
                  <ProtectedRoute>
                    <RestaurantOrders />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/subscription" element={
                  <ProtectedRoute>
                    <RestaurantSubscription />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/pos" element={
                  <ProtectedRoute>
                    <RestaurantPOS />
                  </ProtectedRoute>
                } />
                <Route path="/restaurant/profile" element={
                  <ProtectedRoute>
                    <RestaurantProfile />
                  </ProtectedRoute>
                } />

                {/* Routes CLIENT uniquement */}
                {(!isSpecificBuild() || isClientApp()) && (
                  <>
                    <Route path="/install" element={<Install />} />
                    <Route path="/client/verify-email" element={<ClientVerifyEmail />} />
                    <Route path="/client" element={
                      <ProtectedRoute>
                        <ClientApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/marketplace" element={
                      <ServiceGuard serviceCategory="marketplace">
                        <Marketplace />
                      </ServiceGuard>
                    } />
                    <Route path="/marketplace/shop/:vendorId" element={
                      <ServiceGuard serviceCategory="marketplace">
                        <VendorShop />
                      </ServiceGuard>
                    } />
                    
                    {/* Routes VENDEUR */}
                    <Route path="/vendeur/inscription" element={
                      <ProtectedRoute>
                        <VendorRegistration />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendeur" element={
                      <VendorGuard>
                        <ModernVendorDashboard />
                      </VendorGuard>
                    } />
                    <Route path="/vendeur/ajouter-produit" element={
                      <VendorGuard>
                        <VendorAddProduct />
                      </VendorGuard>
                    } />
                    <Route path="/vendeur/modifier-produit/:id" element={
                      <VendorGuard>
                        <VendorEditProduct />
                      </VendorGuard>
                    } />
                    <Route path="/mes-adresses" element={<MesAdresses />} />
                    <Route path="/transport" element={
                      <ServiceGuard serviceCategory="taxi">
                        <ProtectedRoute>
                          <TransportPage />
                        </ProtectedRoute>
                      </ServiceGuard>
                    } />
                    <Route path="/rental-booking/:vehicleId" element={
                      <ProtectedRoute>
                        <ClientApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/referral" element={
                      <ProtectedRoute>
                        <ClientReferralPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/promos" element={<PromosPage />} />
                  </>
                )}
                
                {/* Routes DRIVER uniquement */}
                {(!isSpecificBuild() || isDriverApp()) && (
                  <>
                    <Route path="/" element={isMobileApp() || (isSpecificBuild() && isDriverApp()) ? <MobileSplash /> : <Index />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="/driver/register" element={<DriverRegistration />} />
                    <Route path="/driver/verify-email" element={<DriverVerifyEmail />} />
                    <Route path="/app/chauffeur" element={
                      <ProtectedRoute requiredRole="driver">
                        <DriverApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/chauffeur" element={
                      <ProtectedRoute requiredRole="driver">
                        <DriverApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/driver/find-partner" element={
                      <ProtectedRoute>
                        <DriverFindPartner />
                      </ProtectedRoute>
                    } />
                  </>
                )}
                
                {/* Routes PARTNER uniquement */}
                {(!isSpecificBuild() || isPartnerApp()) && (
                  <>
                    <Route path="/" element={isMobileApp() || (isSpecificBuild() && isPartnerApp()) ? <MobileSplash /> : <Index />} />
                    <Route path="/install" element={<Install />} />
                    <Route path="/partner/verify-email" element={<PartnerVerifyEmail />} />
                    <Route path="/app/partenaire" element={
                      <ProtectedRoute>
                        <PartnerApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/partenaire" element={
                      <ProtectedRoute>
                        <PartnerApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/partner/register" element={<PartnerRegistrationForm />} />
                    <Route path="/partner/dashboard" element={
                      <ProtectedRoute>
                        <PartnerDashboard />
                      </ProtectedRoute>
                    } />
                  </>
                )}
                
                {/* Routes ADMIN (jamais dans les builds mobiles) */}
                {!isSpecificBuild() && (
                  <>
                    <Route path="/app/admin" element={
                      <ProtectedRoute>
                        <AdminApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminApp />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/production-config" element={
                      <ProtectedRoute>
                        <ProductionConfig />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/qr-manager" element={
                      <ProtectedRoute>
                        <QRCodeManager />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/qr-analytics" element={
                      <ProtectedRoute>
                        <QRAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/food" element={
                      <ProtectedRoute>
                        <AdminFoodManagement />
                      </ProtectedRoute>
                    } />
                  </>
                )}
                
                {/* Routes communes avec protection */}
                <Route path="/role-selection" element={
                  <ProtectedRoute>
                    <RoleSelection />
                  </ProtectedRoute>
                } />
                <Route path="/escrow" element={
                  <ProtectedRoute>
                    <EscrowPage />
                  </ProtectedRoute>
                } />
                
                {/* Pages publiques (toujours disponibles) */}
                {!isSpecificBuild() && (
                  <>
                    <Route path="/support/help-center" element={<HelpCenter />} />
                    <Route path="/support/contact" element={<Contact />} />
                    <Route path="/support/faq" element={<FAQ />} />
                    <Route path="/legal/terms" element={<Terms />} />
                    <Route path="/legal/privacy" element={<Privacy />} />
                    <Route path="/locations/kinshasa" element={<Kinshasa />} />
                    <Route path="/locations/lubumbashi" element={<Lubumbashi />} />
                    <Route path="/locations/kolwezi" element={<Kolwezi />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/services/taxi-vtc" element={<TransportVTC />} />
                    <Route path="/services/livraison-express" element={<LivraisonExpress />} />
                    <Route path="/services/location-vehicules" element={<LocationVehicules />} />
                    <Route path="/partners/devenir-chauffeur" element={<DevenirChauffeur />} />
                    <Route path="/partners/louer-vehicule" element={<LouerVehicule />} />
                    <Route path="/partners/devenir-livreur" element={<DevenirLivreur />} />
                    <Route path="/partners/vendre-en-ligne" element={<VendreEnLigne />} />
                    <Route path="/support/signaler-probleme" element={<SignalerProbleme />} />
                    <Route path="/locations/expansion" element={<Expansion />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/partner" element={<ProgrammePartenaire />} />
                    <Route path="/locations/coverage-map" element={<CarteCouverture />} />
                    <Route path="/tracking/:type/:id" element={<UnifiedTracking />} />
                    
                    {/* Test Routes (dev uniquement) */}
                    <Route path="/test/auth-system" element={<AuthSystemTest />} />
                    <Route path="/test/tracking" element={<TrackingTest />} />
                    <Route path="/test/modern-tracking" element={<ModernTrackingTest />} />
                    <Route path="/test/modern-navigation" element={<ModernNavigationTest />} />
                    <Route path="/test/intelligent-location" element={<SmartLocationTest />} />
                    <Route path="/test/universal-location" element={<UniversalLocationTest />} />
                    <Route path="/test/universal-location-advanced" element={<UniversalLocationTestAdvanced />} />
          <Route path="/test/edge-functions" element={<EdgeFunctionTest />} />
          <Route path="/test/dispatch-system" element={<DispatchSystemTest />} />
          <Route path="/test/dispatch-validation" element={<DispatchValidationTest />} />
                    <Route path="/test/map-validation" element={<MapValidationTest />} />
                    <Route path="/test/modern-map" element={<ModernMapDemo />} />
                    <Route path="/test/components" element={<ComponentsDemo />} />
                  </>
                )}
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </OnboardingRedirect>
          </BrowserRouter>
        </PerformanceOptimizer>
      </DynamicTheme>
      <OfflineIndicator />
      <ClickTracker />
        </>
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <LanguageProvider>
              <ABTestProvider>
                <TooltipProvider>
                  <ChatProvider>
                    <AppContent />
                  </ChatProvider>
                </TooltipProvider>
              </ABTestProvider>
            </LanguageProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
