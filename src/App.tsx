import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PerformanceOptimizer from "@/components/performance/PerformanceOptimizer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/components/marketplace/FavoritesManager";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import DynamicTheme from "@/components/theme/DynamicTheme";
import ParticleBackground from "@/components/theme/ParticleBackground";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import PartnerAuth from "./pages/PartnerAuth";
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
import KwendaTombola from "./pages/services/KwendaTombola";
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
import { ChatProvider } from "@/components/chat/ChatProvider";
import Onboarding from "./pages/Onboarding";
import MesAdresses from "./pages/address/MesAdresses";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { StartupExperience } from "@/components/splash/StartupExperience";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ThemeNotification } from "@/components/theme/ThemeNotification";
import { useOrderCleanup } from "@/hooks/useOrderCleanup";
import { DebugHelper } from "@/utils/debugHelper";
import { DriverFindPartner } from "./pages/DriverFindPartner";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialiser le nettoyage automatique des commandes
  useOrderCleanup();
  
  // Diagnostic de debug en développement
  React.useEffect(() => {
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
      <DynamicTheme>
        <ParticleBackground />
        <ThemeNotification />
        <PerformanceOptimizer>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <StartupExperience />
            <OnboardingRedirect>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/auth" element={
                  <OnboardingRedirect>
                    <Auth />
                  </OnboardingRedirect>
                } />
                <Route path="/admin/auth" element={
                  <OnboardingRedirect>
                    <AdminAuth />
                  </OnboardingRedirect>
                } />
                <Route path="/partner/auth" element={
                  <OnboardingRedirect>
                    <PartnerAuth />
                  </OnboardingRedirect>
                } />
                <Route path="/client" element={
                  <ProtectedRoute>
                    <ClientApp />
                  </ProtectedRoute>
                } />
                <Route path="/chauffeur" element={
                  <ProtectedRoute>
                    <DriverApp />
                  </ProtectedRoute>
                } />
                <Route path="/partenaire" element={
                  <ProtectedRoute>
                    <PartnerApp />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminApp />
                  </ProtectedRoute>
                 } />
                 <Route path="/escrow" element={
                   <ProtectedRoute>
                     <EscrowPage />
                   </ProtectedRoute>
                 } />
                 <Route path="/driver/find-partner" element={
                   <ProtectedRoute>
                     <DriverFindPartner />
                   </ProtectedRoute>
                 } />
                 
                {/* Footer Pages */}
                <Route path="/support/help-center" element={<HelpCenter />} />
                <Route path="/support/contact" element={<Contact />} />
                <Route path="/support/faq" element={<FAQ />} />
                <Route path="/legal/terms" element={<Terms />} />
                <Route path="/legal/privacy" element={<Privacy />} />
                <Route path="/locations/kinshasa" element={<Kinshasa />} />
                <Route path="/locations/lubumbashi" element={<Lubumbashi />} />
                <Route path="/locations/kolwezi" element={<Kolwezi />} />
                <Route path="/about" element={<About />} />
                
                {/* Transport Page */}
                <Route path="/transport" element={
                  <ProtectedRoute>
                    <TransportPage />
                  </ProtectedRoute>
                } />
                
                {/* Services Pages */}
                <Route path="/services/taxi-vtc" element={<TransportVTC />} />
                <Route path="/services/livraison-express" element={<LivraisonExpress />} />
                <Route path="/services/location-vehicules" element={<LocationVehicules />} />
                <Route path="/services/kwenda-tombola" element={<KwendaTombola />} />
                
                {/* Partners Pages */}
                <Route path="/partners/devenir-chauffeur" element={<DevenirChauffeur />} />
                <Route path="/partners/louer-vehicule" element={<LouerVehicule />} />
                <Route path="/partners/devenir-livreur" element={<DevenirLivreur />} />
                <Route path="/partners/vendre-en-ligne" element={<VendreEnLigne />} />
                
                {/* Support Pages */}
                <Route path="/support/signaler-probleme" element={<SignalerProbleme />} />
                
                {/* Locations Pages */}
                <Route path="/locations/expansion" element={<Expansion />} />
                
                {/* New Pages */}
                <Route path="/demo" element={<Demo />} />
                <Route path="/partner" element={<ProgrammePartenaire />} />
                <Route path="/locations/coverage-map" element={<CarteCouverture />} />
                <Route path="/marketplace" element={<Marketplace />} />
                
                {/* Address Pages */}
                <Route path="/mes-adresses" element={<MesAdresses />} />
                
                {/* Test Routes */}
                <Route path="/test/auth-system" element={<AuthSystemTest />} />
                <Route path="/test/tracking" element={<TrackingTest />} />
                <Route path="/test/modern-tracking" element={<ModernTrackingTest />} />
                
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
);

export default App;
