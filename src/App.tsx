import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PerformanceOptimizer from "@/components/performance/PerformanceOptimizer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import DynamicTheme from "@/components/theme/DynamicTheme";
import ParticleBackground from "@/components/theme/ParticleBackground";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { APP_CONFIG, isClientApp, isDriverApp, isPartnerApp, isSpecificBuild } from "@/config/appConfig";
import { isMobileApp, isPWA } from "@/services/platformDetection";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MobileSplash from "./pages/MobileSplash";
import { SmartHome } from "./components/navigation/SmartHome";
import AdminAuth from "./pages/AdminAuth";
import PartnerAuth from "./pages/PartnerAuth";
import DriverAuth from "./pages/DriverAuth";
import ClientApp from "./pages/ClientApp";
import DriverApp from "./pages/DriverApp";
import PartnerApp from "./pages/PartnerApp";
import AdminApp from "./pages/AdminApp";
import { EscrowPage } from "./pages/EscrowPage";

import NotFound from "./pages/NotFound";
// Footer Pages
import HelpCenter from "./pages/support/HelpCenter";
import Contact from "./pages/support/Contact";
import FAQ from "./pages/support/FAQ";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Kinshasa from "./pages/locations/Kinshasa";
import Lubumbashi from "./pages/locations/Lubumbashi";
import Kolwezi from "./pages/locations/Kolwezi";
import About from "./pages/about/About";
import TransportVTC from "./pages/services/TransportVTC";
import LivraisonExpress from "./pages/services/LivraisonExpress";
import LocationVehicules from "./pages/services/LocationVehicules";
import DevenirChauffeur from "./pages/partners/DevenirChauffeur";
import LouerVehicule from "./pages/partners/LouerVehicule";
import DevenirLivreur from "./pages/partners/DevenirLivreur";
import VendreEnLigne from "./pages/partners/VendreEnLigne";
import SignalerProbleme from "./pages/support/SignalerProbleme";
import TransportPage from "./pages/Transport";
import Expansion from "./pages/locations/Expansion";
import Demo from "./pages/demo/Demo";
import ProgrammePartenaire from "./pages/partner/ProgrammePartenaire";
import CarteCouverture from "./pages/locations/CarteCouverture";
import Marketplace from "./pages/marketplace/Marketplace";
import AuthSystemTest from "./pages/test/AuthSystemTest";
import TrackingTest from "./pages/test/TrackingTest";
import ModernTrackingTest from "./pages/test/ModernTrackingTest";
import { ModernNavigationTest } from "./pages/test/ModernNavigationTest";
import SmartLocationTest from "./pages/test/SmartLocationTest";
import UniversalLocationTest from "./pages/test/UniversalLocationTest";
import UniversalLocationTestAdvanced from "./pages/test/UniversalLocationTestAdvanced";
import EdgeFunctionTest from "./pages/test/EdgeFunctionTest";
import DispatchSystemTest from "./pages/test/DispatchSystemTest";
import DispatchValidationTest from "./pages/test/DispatchValidationTest";
import MapValidationTest from "./pages/test/MapValidationTest";
import { ComponentsDemo } from "./pages/test/ComponentsDemo";
import ModernMapDemo from "./pages/test/ModernMapDemo";
import ProductionConfig from "./pages/admin/ProductionConfig";
import { ChatProvider } from "@/components/chat/ChatProvider";
import Onboarding from "./pages/Onboarding";
import Install from "./pages/Install";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { UpdateProgress } from "@/components/pwa/UpdateProgress";
import MesAdresses from "./pages/address/MesAdresses";
import ResetPassword from "./pages/ResetPassword";
import RoleSelection from "./pages/RoleSelection";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { StartupExperience } from "@/components/splash/StartupExperience";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ThemeNotification } from "@/components/theme/ThemeNotification";
import { useOrderCleanup } from "@/hooks/useOrderCleanup";
import { DebugHelper } from "@/utils/debugHelper";
import { DriverFindPartner } from "./pages/DriverFindPartner";
import CampaignLanding from "./pages/campaign/CampaignLanding";
import CampaignThankYou from "./pages/campaign/CampaignThankYou";
import PublicPartnerRegistration from "./pages/partner/PublicPartnerRegistration";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import { PartnerRegistrationForm } from "./components/partner/registration/PartnerRegistrationForm";
import UnifiedTracking from "./pages/UnifiedTracking";
import DriverRegistration from "./pages/DriverRegistration";
import VendorShop from "./pages/VendorShop";
import VendorOrders from "./pages/VendorOrders";
import ModernVendorDashboard from "./pages/ModernVendorDashboard";
import MyProducts from "./pages/marketplace/MyProducts";
import QRCodeManager from "./pages/admin/QRCodeManager";
import QRAnalytics from "./pages/admin/QRAnalytics";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import RestaurantMenuManager from "./pages/restaurant/RestaurantMenuManager";
import RestaurantOrders from "./pages/restaurant/RestaurantOrders";
import RestaurantSubscription from "./pages/restaurant/RestaurantSubscription";
import RestaurantAuth from "./pages/RestaurantAuth";
import RestaurantPOS from "./pages/restaurant/RestaurantPOS";
import RestaurantProfile from "./pages/restaurant/RestaurantProfile";
import AdminFoodManagement from "./pages/admin/AdminFoodManagement";
import DriverVerifyEmail from "./pages/DriverVerifyEmail";
import PartnerVerifyEmail from "./pages/PartnerVerifyEmail";
import ClientVerifyEmail from "./pages/ClientVerifyEmail";
import RestaurantVerifyEmail from "./pages/RestaurantVerifyEmail";
import ClientReferralPage from "./pages/ClientReferralPage";
import PromosPage from "./pages/PromosPage";
import { ServiceGuard } from "./components/guards/ServiceGuard";
import { useServiceRealtime } from "./hooks/useServiceRealtime";

const queryClient = new QueryClient();

const AppContent = () => {
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
      <UpdateNotification />
      <UpdateProgress />
      <DynamicTheme>
        <ParticleBackground />
        <ThemeNotification />
        <PerformanceOptimizer>
          <Toaster />
          <Sonner />
          <InstallBanner />
          <BrowserRouter>
            <ScrollToTop />
            {/* <StartupExperience /> */}
            <OnboardingRedirect>
              <Routes>
                {/* Route Splash pour mobile/PWA */}
                <Route path="/splash" element={<MobileSplash />} />
                
                {/* Routes communes à toutes les apps */}
                {!isSpecificBuild() && <Route path="/" element={<SmartHome />} />}
                {!isSpecificBuild() && (
                  <Route path="/client" element={
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
                <Route path="/restaurant" element={
                  <ProtectedRoute>
                    <RestaurantDashboard />
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
                    <Route path="/auth" element={
                      <OnboardingRedirect>
                        <Auth />
                      </OnboardingRedirect>
                    } />
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
                    <Route path="/marketplace/my-products" element={
                      <ProtectedRoute>
                        <MyProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/dashboard" element={
                      <ProtectedRoute>
                        <ModernVendorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/vendor/orders" element={
                      <ProtectedRoute>
                        <VendorOrders />
                      </ProtectedRoute>
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
                    <Route path="/driver/auth" element={
                      <OnboardingRedirect>
                        <DriverAuth />
                      </OnboardingRedirect>
                    } />
                    <Route path="/driver/register" element={<DriverRegistration />} />
                    <Route path="/driver/verify-email" element={<DriverVerifyEmail />} />
                    <Route path="/chauffeur" element={
                      <ProtectedRoute>
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
                    <Route path="/partner/auth" element={
                      <OnboardingRedirect>
                        <PartnerAuth />
                      </OnboardingRedirect>
                    } />
                    <Route path="/partner/verify-email" element={<PartnerVerifyEmail />} />
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
                    <Route path="/admin/auth" element={
                      <OnboardingRedirect>
                        <AdminAuth />
                      </OnboardingRedirect>
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
            </OnboardingRedirect>
          </BrowserRouter>
        </PerformanceOptimizer>
      </DynamicTheme>
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
              <TooltipProvider>
                <ChatProvider>
                  <AppContent />
                </ChatProvider>
              </TooltipProvider>
            </LanguageProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
