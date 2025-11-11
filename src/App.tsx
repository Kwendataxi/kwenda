import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PerformanceOptimizer from "@/components/performance/PerformanceOptimizer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SafetyNet } from "@/components/SafetyNet";
import { HealthStatusBar } from "@/components/HealthStatusBar";
import { RecoveryDialog } from "@/components/RecoveryDialog";
import { DegradedModeProvider } from "@/contexts/DegradedModeContext";
import { healthOrchestrator } from "@/services/HealthOrchestrator";
import { sessionRecovery } from "@/services/SessionRecovery";
import { isSpecificBuild } from "@/config/appConfig";
import { isMobileApp, isPWA } from "@/services/platformDetection";
import { PWASplashScreen } from "@/components/PWASplashScreen";
import { useState } from "react";
import { RouteLoadingFallback } from "@/components/loading/RouteLoadingFallback";
import { AppReadyProvider } from "@/contexts/AppReadyContext";
import { SmoothTransitionWrapper } from "@/components/loading/SmoothTransitionWrapper";
import { HelmetProvider } from 'react-helmet-async';
import { ChatProvider } from "@/components/chat/ChatProvider";
import { CartProvider } from '@/context/CartContext';
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { AppDownloadTopBanner } from "@/components/pwa/AppDownloadTopBanner";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { UpdateProgress } from "@/components/pwa/UpdateProgress";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { ThemeNotification } from "@/components/theme/ThemeNotification";
import { useOrderCleanup } from "@/hooks/useOrderCleanup";
import { DebugHelper } from "@/utils/debugHelper";
import { useServiceRealtime } from "./hooks/useServiceRealtime";
import { autoUpdateService } from "@/services/AutoUpdateService";
import { initVersionDebug } from "@/utils/versionDebug";
import { migrateToDefaultLightTheme } from "@/utils/themeMigration";

// Critical imports
import Index from "./pages/Index";
import { SmartHome } from "./components/navigation/SmartHome";
import { PublicHome } from "./components/navigation/PublicHome";

// Route modules
import {
  ClientRoutes,
  DriverRoutes,
  PartnerRoutes,
  AdminRoutes,
  PublicRoutes,
  SharedRoutes
} from "./routes";

const NotFound = lazy(() => import("./pages/NotFound"));

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(isPWA() || isMobileApp());
  const [preloadedSession, setPreloadedSession] = useState<any>(null);
  const [preloadedRole, setPreloadedRole] = useState<string | null>(null);
  
  useOrderCleanup();
  useServiceRealtime();
  
  useEffect(() => {
    // Exécuter la migration du thème en premier
    migrateToDefaultLightTheme();
    
    healthOrchestrator.start();
    sessionRecovery.restoreSession();
    return () => healthOrchestrator.stop();
  }, []);
  
  useEffect(() => {
    if (import.meta.env.DEV) {
      setTimeout(() => DebugHelper.runFullDiagnostic(), 2000);
    }
  }, []);
  
  // Système de mise à jour automatique
  useEffect(() => {
    // Initialiser le service de mise à jour automatique
    autoUpdateService.initialize();
    
    // Initialiser les outils de debug
    if (import.meta.env.DEV) {
      initVersionDebug();
    }
    
    // Écouter les messages du Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_VERSION_ACTIVATED') {
        console.log('🎉 New version activated:', event.data.version);
        // Le rechargement se fait automatiquement via AutoUpdateService
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      autoUpdateService.destroy();
    };
  }, []);
  
  const handleSplashComplete = (session?: any, userRole?: string | null) => {
    setPreloadedSession(session);
    setPreloadedRole(userRole);
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <PWASplashScreen onComplete={handleSplashComplete} />}
      
      <SmoothTransitionWrapper
        isLoading={showSplash}
        loadingComponent={<div />}
      >
        <HelmetProvider>
          <SafetyNet>
            <DegradedModeProvider>
              <AppReadyProvider initialSession={preloadedSession}>
                <HealthStatusBar />
                <RecoveryDialog />
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
                      <AppDownloadTopBanner />
                      <OnboardingRedirect>
                        <Suspense fallback={<RouteLoadingFallback />}>
                          <Routes>
                            {/* Landing page */}
            {!isSpecificBuild() && <Route path="/" element={<PublicHome />} />}
            {!isSpecificBuild() && <Route path="/landing" element={<Index />} />}
                            {!isSpecificBuild() && <Route path="/app" element={<SmartHome />} />}
                            
                            {/* Shared routes */}
                            {SharedRoutes()}
                            
                            {/* Role-specific routes */}
                            {ClientRoutes()}
                            {DriverRoutes()}
                            {PartnerRoutes()}
                            {AdminRoutes()}
                            {PublicRoutes()}
                            
                            {/* 404 - Must be last */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </OnboardingRedirect>
                    </BrowserRouter>
                  </PerformanceOptimizer>
                  <OfflineIndicator />
                  <ClickTracker />
                </DynamicTheme>
              </AppReadyProvider>
            </DegradedModeProvider>
          </SafetyNet>
        </HelmetProvider>
      </SmoothTransitionWrapper>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
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
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
