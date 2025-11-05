import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSpecificBuild, isDriverApp } from '@/config/appConfig';
import { isMobileApp } from '@/services/platformDetection';
import Index from '@/pages/Index';
import MobileSplash from '@/pages/MobileSplash';
import Install from '@/pages/Install';

const DriverApp = lazy(() => import('@/pages/DriverApp'));
const DriverRegistration = lazy(() => import('@/pages/DriverRegistration'));
const DriverVerifyEmail = lazy(() => import('@/pages/DriverVerifyEmail'));
const DriverFindPartner = lazy(() => import('@/pages/DriverFindPartner').then(m => ({ default: m.DriverFindPartner })));

export const DriverRoutes = () => {
  if (isSpecificBuild() && !isDriverApp()) {
    return null;
  }

  return (
    <>
      <Route 
        path="/" 
        element={
          isMobileApp() || (isSpecificBuild() && isDriverApp()) 
            ? <MobileSplash /> 
            : <Index />
        } 
      />
      <Route path="/install" element={<Install />} />
      <Route path="/driver/register" element={<DriverRegistration />} />
      <Route path="/driver/verify-email" element={<DriverVerifyEmail />} />
      <Route 
        path="/app/chauffeur" 
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chauffeur" 
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/driver/find-partner" 
        element={
          <ProtectedRoute>
            <DriverFindPartner />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
