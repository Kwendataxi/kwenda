import { Routes, Route } from 'react-router-dom';
import { VendorDashboard } from '@/components/vendor/VendorDashboard';
import { VendorProducts } from '@/components/vendor/VendorProducts';
import { VendorOrders } from '@/components/vendor/VendorOrders';
import { VendorEscrow } from '@/components/vendor/VendorEscrow';
import { VendorSettings } from '@/components/vendor/VendorSettings';
import { VendorNavigation } from '@/components/vendor/VendorNavigation';

export const VendorApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <VendorNavigation />
      <Routes>
        <Route path="/" element={<VendorDashboard />} />
        <Route path="/produits" element={<VendorProducts />} />
        <Route path="/commandes" element={<VendorOrders />} />
        <Route path="/revenus" element={<VendorEscrow />} />
        <Route path="/parametres" element={<VendorSettings />} />
      </Routes>
    </div>
  );
};
