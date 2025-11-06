import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { isSpecificBuild } from '@/config/appConfig';

// Pages publiques
const HelpCenter = lazy(() => import('@/pages/support/HelpCenter'));
const Contact = lazy(() => import('@/pages/support/Contact'));
const FAQ = lazy(() => import('@/pages/support/FAQ'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Privacy = lazy(() => import('@/pages/legal/Privacy'));
const Cookies = lazy(() => import('@/pages/legal/Cookies'));
const LegalNotice = lazy(() => import('@/pages/legal/LegalNotice'));
const Kinshasa = lazy(() => import('@/pages/locations/Kinshasa'));
const Lubumbashi = lazy(() => import('@/pages/locations/Lubumbashi'));
const Kolwezi = lazy(() => import('@/pages/locations/Kolwezi'));
const About = lazy(() => import('@/pages/about/About'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const DebugUpdate = lazy(() => import('@/pages/DebugUpdate'));
const TransportVTC = lazy(() => import('@/pages/services/TransportVTC'));
const LivraisonExpress = lazy(() => import('@/pages/services/LivraisonExpress'));
const LocationVehicules = lazy(() => import('@/pages/services/LocationVehicules'));
const DevenirChauffeur = lazy(() => import('@/pages/partners/DevenirChauffeur'));
const LouerVehicule = lazy(() => import('@/pages/partners/LouerVehicule'));
const DevenirLivreur = lazy(() => import('@/pages/partners/DevenirLivreur'));
const VendreEnLigne = lazy(() => import('@/pages/partners/VendreEnLigne'));
const SignalerProbleme = lazy(() => import('@/pages/support/SignalerProbleme'));
const Expansion = lazy(() => import('@/pages/locations/Expansion'));
const Demo = lazy(() => import('@/pages/demo/Demo'));
const ProgrammePartenaire = lazy(() => import('@/pages/partner/ProgrammePartenaire'));
const CarteCouverture = lazy(() => import('@/pages/locations/CarteCouverture'));
const UnifiedTracking = lazy(() => import('@/pages/UnifiedTracking'));
const VendorShop = lazy(() => import('@/pages/VendorShop'));

// Test pages
const AuthSystemTest = lazy(() => import('@/pages/test/AuthSystemTest'));
const TrackingTest = lazy(() => import('@/pages/test/TrackingTest'));
const ModernTrackingTest = lazy(() => import('@/pages/test/ModernTrackingTest'));
const ModernNavigationTest = lazy(() => import('@/pages/test/ModernNavigationTest').then(m => ({ default: m.ModernNavigationTest })));
const SmartLocationTest = lazy(() => import('@/pages/test/SmartLocationTest'));
const UniversalLocationTest = lazy(() => import('@/pages/test/UniversalLocationTest'));
const UniversalLocationTestAdvanced = lazy(() => import('@/pages/test/UniversalLocationTestAdvanced'));
const EdgeFunctionTest = lazy(() => import('@/pages/test/EdgeFunctionTest'));
const DispatchSystemTest = lazy(() => import('@/pages/test/DispatchSystemTest'));
const DispatchValidationTest = lazy(() => import('@/pages/test/DispatchValidationTest'));
const MapValidationTest = lazy(() => import('@/pages/test/MapValidationTest'));
const ModernMapDemo = lazy(() => import('@/pages/test/ModernMapDemo'));
const ComponentsDemo = lazy(() => import('@/pages/test/ComponentsDemo').then(m => ({ default: m.ComponentsDemo })));

export const PublicRoutes = () => {
  if (isSpecificBuild()) {
    return null;
  }

  return (
    <>
      {/* Support & Legal */}
      <Route path="/support/help-center" element={<HelpCenter />} />
      <Route path="/support/contact" element={<Contact />} />
      <Route path="/support/faq" element={<FAQ />} />
      <Route path="/legal/terms" element={<Terms />} />
      <Route path="/legal/privacy" element={<Privacy />} />
      <Route path="/legal/cookies" element={<Cookies />} />
      <Route path="/legal/legal-notice" element={<LegalNotice />} />
      
      {/* Locations */}
      <Route path="/locations/kinshasa" element={<Kinshasa />} />
      <Route path="/locations/lubumbashi" element={<Lubumbashi />} />
      <Route path="/locations/kolwezi" element={<Kolwezi />} />
      <Route path="/locations/expansion" element={<Expansion />} />
      <Route path="/locations/coverage-map" element={<CarteCouverture />} />
      
      {/* Services */}
      <Route path="/services/taxi-vtc" element={<TransportVTC />} />
      <Route path="/services/livraison-express" element={<LivraisonExpress />} />
      <Route path="/services/location-vehicules" element={<LocationVehicules />} />
      
      {/* Partners */}
      <Route path="/partners/devenir-chauffeur" element={<DevenirChauffeur />} />
      <Route path="/partners/louer-vehicule" element={<LouerVehicule />} />
      <Route path="/partners/devenir-livreur" element={<DevenirLivreur />} />
      <Route path="/partners/vendre-en-ligne" element={<VendreEnLigne />} />
      
      {/* About & Misc */}
      <Route path="/about" element={<About />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/debug/update" element={<DebugUpdate />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/partner" element={<ProgrammePartenaire />} />
      <Route path="/support/signaler-probleme" element={<SignalerProbleme />} />
      <Route path="/tracking/:type/:id" element={<UnifiedTracking />} />
      
      {/* ✅ PHASE 1: Route publique pour partage de boutiques */}
      <Route path="/marketplace/shop/:vendorId" element={<VendorShop />} />
      
      {/* Test Routes (dev) */}
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
  );
};
