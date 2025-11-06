import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSpecificBuild, isPartnerApp } from '@/config/appConfig';
import { isMobileApp } from '@/services/platformDetection';
import Index from '@/pages/Index';
import MobileSplash from '@/pages/MobileSplash';
import Install from '@/pages/Install';

const PartnerApp = lazy(() => import('@/pages/PartnerApp'));
const PartnerVerifyEmail = lazy(() => import('@/pages/PartnerVerifyEmail'));
const PartnerRegistrationForm = lazy(() => import('@/components/partner/registration/PartnerRegistrationForm').then(m => ({ default: m.PartnerRegistrationForm })));
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard'));
const PartnerRentalSubscriptionManagement = lazy(() => import('@/pages/partner/PartnerRentalSubscriptionManagement'));

export const PartnerRoutes = () => {
  if (isSpecificBuild() && !isPartnerApp()) {
    return null;
  }

  return (
    <>
      <Route 
        path="/" 
        element={
          isMobileApp() || (isSpecificBuild() && isPartnerApp()) 
            ? <MobileSplash /> 
            : <Index />
        } 
      />
      <Route path="/install" element={<Install />} />
      <Route path="/partner/verify-email" element={<PartnerVerifyEmail />} />
      <Route 
        path="/app/partenaire" 
        element={
          <ProtectedRoute>
            <PartnerApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partenaire" 
        element={
          <ProtectedRoute>
            <PartnerApp />
          </ProtectedRoute>
        } 
      />
      <Route path="/partner/register" element={<PartnerRegistrationForm />} />
      <Route 
        path="/partner/dashboard" 
        element={
          <ProtectedRoute>
            <PartnerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/partner/rental/subscription" 
        element={
          <ProtectedRoute>
            <PartnerRentalSubscriptionManagement />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
