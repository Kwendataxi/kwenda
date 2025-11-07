import { lazy, Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RouteLoadingFallback } from '@/components/loading/RouteLoadingFallback';
import { EmailVerificationPage } from '@/pages/EmailVerificationPage';
import Auth from '@/pages/Auth';
import ClientRegister from '@/pages/ClientRegister';
import DriverAuth from '@/pages/DriverAuth';
import PartnerAuth from '@/pages/PartnerAuth';
import AdminAuth from '@/pages/AdminAuth';
import RestaurantAuth from '@/pages/RestaurantAuth';
import MobileSplash from '@/pages/MobileSplash';
import Install from '@/pages/Install';
import ResetPassword from '@/pages/ResetPassword';

const RoleSelection = lazy(() => import('@/pages/RoleSelection'));
const EscrowPage = lazy(() => import('@/pages/EscrowPage').then(m => ({ default: m.EscrowPage })));
const UserVerification = lazy(() => import('@/components/profile/UserVerification').then(m => ({ default: m.UserVerification })));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const CampaignLanding = lazy(() => import('@/pages/campaign/CampaignLanding'));
const CampaignThankYou = lazy(() => import('@/pages/campaign/CampaignThankYou'));
const RestaurantApp = lazy(() => import('@/pages/RestaurantApp'));
const RestaurantVerifyEmail = lazy(() => import('@/pages/RestaurantVerifyEmail'));
const RestaurantMenuManager = lazy(() => import('@/pages/restaurant/RestaurantMenuManager'));
const RestaurantOrders = lazy(() => import('@/pages/restaurant/RestaurantOrders'));
const RestaurantSubscription = lazy(() => import('@/pages/restaurant/RestaurantSubscription'));
const RestaurantPOS = lazy(() => import('@/pages/restaurant/RestaurantPOS'));
const RestaurantProfile = lazy(() => import('@/pages/restaurant/RestaurantProfile'));
const RestaurantWalletPage = lazy(() => import('@/pages/restaurant/RestaurantWalletPage'));
const TestSoundsPage = lazy(() => import('@/pages/TestSoundsPage').then(m => ({ default: m.TestSoundsPage })));

export const SharedRoutes = () => {
  return (
    <>
      {/* Auth routes */}
      <Route path="/app/auth" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/app/register" element={<ClientRegister />} />
      <Route path="/driver/auth" element={<DriverAuth />} />
      <Route path="/partner/auth" element={<PartnerAuth />} />
      <Route path="/operatorx/admin/auth" element={<AdminAuth />} />
      <Route path="/restaurant/auth" element={<RestaurantAuth />} />
      
      {/* Email verification */}
      <Route path="/client/verify-email" element={<EmailVerificationPage type="client" />} />
      <Route path="/driver/verify-email" element={<EmailVerificationPage type="driver" />} />
      <Route path="/partner/verify-email" element={<EmailVerificationPage type="partner" />} />
      <Route path="/restaurant/verify-email" element={<EmailVerificationPage type="restaurant" />} />
      
      {/* Restaurant routes */}
      <Route path="/restaurant/verify-email" element={<RestaurantVerifyEmail />} />
      <Route path="/app/restaurant" element={<ProtectedRoute><RestaurantApp /></ProtectedRoute>} />
      <Route path="/restaurant" element={<ProtectedRoute><RestaurantApp /></ProtectedRoute>} />
      <Route path="/restaurant/menu" element={<ProtectedRoute><RestaurantMenuManager /></ProtectedRoute>} />
      <Route path="/restaurant/orders" element={<ProtectedRoute><RestaurantOrders /></ProtectedRoute>} />
      <Route path="/restaurant/subscription" element={<ProtectedRoute><RestaurantSubscription /></ProtectedRoute>} />
      <Route path="/restaurant/pos" element={<ProtectedRoute><RestaurantPOS /></ProtectedRoute>} />
      <Route path="/restaurant/profile" element={<ProtectedRoute><RestaurantProfile /></ProtectedRoute>} />
      <Route path="/restaurant/wallet" element={<ProtectedRoute><RestaurantWalletPage /></ProtectedRoute>} />
      
      {/* Common protected routes */}
      <Route path="/role-selection" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
      <Route path="/escrow" element={<ProtectedRoute><EscrowPage /></ProtectedRoute>} />
      <Route 
        path="/verification/identity" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <UserVerification />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      
      {/* Misc */}
      <Route path="/splash" element={<MobileSplash />} />
      <Route path="/install" element={<Install />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/campaign/:campaignId" element={<CampaignLanding />} />
      <Route path="/campaign-thank-you" element={<CampaignThankYou />} />
      
      {/* Dev/Test routes */}
      <Route path="/test-sounds" element={<TestSoundsPage />} />
      
      <Route path="/admin/marketplace" element={<Navigate to="/admin?tab=marketplace-management" replace />} />
    </>
  );
};
