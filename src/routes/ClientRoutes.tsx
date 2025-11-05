import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ServiceGuard } from '@/components/guards/ServiceGuard';
import { VendorGuard } from '@/components/guards/VendorGuard';
import { isSpecificBuild, isClientApp } from '@/config/appConfig';

// Lazy imports
const ClientApp = lazy(() => import('@/pages/ClientApp'));
const Food = lazy(() => import('@/pages/Food'));
const TransportPage = lazy(() => import('@/pages/Transport'));
const Marketplace = lazy(() => import('@/pages/marketplace/Marketplace'));
const VendorShop = lazy(() => import('@/pages/VendorShop'));
const ModernVendorDashboard = lazy(() => import('@/pages/ModernVendorDashboard'));
const VendorRegistration = lazy(() => import('@/pages/VendorRegistration'));
const VendorAddProduct = lazy(() => import('@/pages/VendorAddProduct'));
const VendorEditProduct = lazy(() => import('@/pages/VendorEditProduct'));
const VendorChatConversation = lazy(() => import('@/pages/VendorChatConversation'));
const ClientRentalInterface = lazy(() => import('@/pages/ClientRentalInterface'));
const RentalVehicleDetails = lazy(() => import('@/pages/RentalVehicleDetails'));
const ModernRentalBooking = lazy(() => import('@/components/rental/ModernRentalBooking'));
const ClientRentalBookings = lazy(() => import('@/pages/rental/ClientRentalBookings'));
const ClientReferralPage = lazy(() => import('@/pages/ClientReferralPage'));
const PromosPage = lazy(() => import('@/pages/PromosPage'));
const MesAdresses = lazy(() => import('@/pages/address/MesAdresses'));
const ClientVerifyEmail = lazy(() => import('@/pages/ClientVerifyEmail'));

export const ClientRoutes = () => {
  if (isSpecificBuild() && !isClientApp()) {
    return null;
  }

  return (
    <>
      {/* Routes Client principales */}
      <Route path="/client/verify-email" element={<ClientVerifyEmail />} />
      <Route 
        path="/app/client" 
        element={
          <ProtectedRoute>
            <ClientApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client" 
        element={
          <ProtectedRoute>
            <ClientApp />
          </ProtectedRoute>
        } 
      />

      {/* Transport */}
      <Route 
        path="/transport" 
        element={
          <ServiceGuard serviceCategory="taxi">
            <ProtectedRoute>
              <TransportPage />
            </ProtectedRoute>
          </ServiceGuard>
        } 
      />

      {/* Food */}
      <Route 
        path="/food" 
        element={
          <ServiceGuard serviceCategory="food">
            <Food />
          </ServiceGuard>
        } 
      />

      {/* Marketplace */}
      <Route 
        path="/marketplace" 
        element={
          <ServiceGuard serviceCategory="marketplace">
            <Marketplace />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/marketplace/shop/:vendorId" 
        element={
          <ServiceGuard serviceCategory="marketplace">
            <VendorShop />
          </ServiceGuard>
        } 
      />

      {/* Vendeur */}
      <Route 
        path="/vendeur/inscription" 
        element={
          <ProtectedRoute>
            <VendorRegistration />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vendeur" 
        element={
          <VendorGuard>
            <ModernVendorDashboard />
          </VendorGuard>
        } 
      />
      <Route 
        path="/vendeur/ajouter-produit" 
        element={
          <VendorGuard>
            <VendorAddProduct />
          </VendorGuard>
        } 
      />
      <Route 
        path="/vendeur/modifier-produit/:id" 
        element={
          <VendorGuard>
            <VendorEditProduct />
          </VendorGuard>
        } 
      />
      <Route 
        path="/marketplace/vendor/chat/:conversationId" 
        element={
          <VendorGuard>
            <VendorChatConversation />
          </VendorGuard>
        } 
      />

      {/* Location de véhicules */}
      <Route 
        path="/rental" 
        element={
          <ServiceGuard serviceCategory="rental">
            <ClientRentalInterface />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/rental/:vehicleId/details" 
        element={
          <ServiceGuard serviceCategory="rental">
            <RentalVehicleDetails />
          </ServiceGuard>
        } 
      />
      <Route 
        path="/rental-booking/:vehicleId" 
        element={
          <ProtectedRoute>
            <ModernRentalBooking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rental/bookings" 
        element={
          <ProtectedRoute>
            <ClientRentalBookings />
          </ProtectedRoute>
        } 
      />

      {/* Autres pages client */}
      <Route path="/mes-adresses" element={<MesAdresses />} />
      <Route 
        path="/referral" 
        element={
          <ProtectedRoute>
            <ClientReferralPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/promos" element={<PromosPage />} />
    </>
  );
};
