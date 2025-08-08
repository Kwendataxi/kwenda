import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/components/marketplace/FavoritesManager";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientApp from "./pages/ClientApp";
import DriverApp from "./pages/DriverApp";
import PartnerApp from "./pages/PartnerApp";
import AdminApp from "./pages/AdminApp";
import MarketplaceApp from "./pages/MarketplaceApp";
import NotFound from "./pages/NotFound";
import { ChatProvider } from "@/components/chat/ChatProvider";
import Onboarding from "./pages/Onboarding";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { StartupExperience } from "@/components/splash/StartupExperience";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <LanguageProvider>
        <TooltipProvider>
          <ChatProvider>
            <StartupExperience />
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auth" element={
                <OnboardingRedirect>
                  <Auth />
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
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <MarketplaceApp />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </ChatProvider>
        </TooltipProvider>
        </LanguageProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
