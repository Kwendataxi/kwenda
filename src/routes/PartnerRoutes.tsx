import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PartnerGuard } from '@/components/guards/PartnerGuard';
import { isSpecificBuild, isPartnerApp } from '@/config/appConfig';
import { isMobileApp } from '@/services/platformDetection';
import Index from '@/pages/Index';
import MobileSplash from '@/pages/MobileSplash';
import Install from '@/pages/Install';

const PartnerApp = lazy(() => import('@/pages/PartnerApp'));
const PartnerAuth = lazy(() => import('@/pages/PartnerAuth'));
const PartnerVerifyEmail = lazy(() => import('@/pages/PartnerVerifyEmail'));
const ModernRegistrationWizard = lazy(() => import('@/components/partner/registration/ModernRegistrationWizard'));
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard'));
const PartnerRentalSubscriptionManagement = lazy(() => import('@/pages/partner/PartnerRentalSubscriptionManagement'));

export const PartnerRoutes = () => {
  if (isSpecificBuild() && !isPartnerApp()) {
    return null;
  }

  return (
    <>
      <Route path="/" 
        element={
          isMobileApp() || (isSpecificBuild() && isPartnerApp()) 
            ? <MobileSplash /> 
            : <Index />
        } 
      />
      <Route path="/install" element={<Install />} />
      <Route path="/partner/auth" element={<PartnerAuth />} />
      <Route path="/partner/verify-email" element={<PartnerVerifyEmail />} />
      <Route 
        path="/app/partenaire" 
        element={
          <ProtectedRoute>
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partenaire" 
        element={
          <ProtectedRoute>
            <PartnerGuard>
              <PartnerApp />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route path="/partner/register" element={<ModernRegistrationWizard />} />
      <Route 
        path="/partner/dashboard" 
        element={
          <ProtectedRoute>
            <PartnerGuard>
              <PartnerDashboard />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partner/rental/subscription" 
        element={
          <ProtectedRoute>
            <PartnerGuard>
              <PartnerRentalSubscriptionManagement />
            </PartnerGuard>
          </ProtectedRoute>
        } 
      />
    </>
  );
};
