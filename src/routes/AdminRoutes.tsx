import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSpecificBuild } from '@/config/appConfig';

const AdminApp = lazy(() => import('@/pages/AdminApp'));
const TaxiDashboard = lazy(() => import('@/pages/admin/TaxiDashboard'));
const ProductionConfig = lazy(() => import('@/pages/admin/ProductionConfig'));
const QRCodeManager = lazy(() => import('@/pages/admin/QRCodeManager'));
const QRAnalytics = lazy(() => import('@/pages/admin/QRAnalytics'));
const AdminFoodManagement = lazy(() => import('@/pages/admin/AdminFoodManagement'));
const AdminRentalModerationEnhanced = lazy(() => import('@/pages/AdminRentalModerationEnhanced'));
const AdminNotificationTestPage = lazy(() => import('@/pages/admin/AdminNotificationTestPage'));
const VendorShopTestPage = lazy(() => import('@/pages/admin/VendorShopTestPage'));

export const AdminRoutes = () => {
  if (isSpecificBuild()) {
    return null;
  }

  return (
    <>
      <Route 
        path="/app/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/taxi-dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <TaxiDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/production-config" 
        element={
          <ProtectedRoute requiredRole="admin">
            <ProductionConfig />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/qr-manager" 
        element={
          <ProtectedRoute requiredRole="admin">
            <QRCodeManager />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/qr-analytics" 
        element={
          <ProtectedRoute requiredRole="admin">
            <QRAnalytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/food" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFoodManagement />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/notification-test" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminNotificationTestPage />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/vendor-shop-test" 
        element={
          <ProtectedRoute requiredRole="admin">
            <VendorShopTestPage />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
