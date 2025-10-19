import { Routes, Route } from 'react-router-dom';
import { VendorDashboard } from '@/components/vendor/VendorDashboard';
import { VendorProducts } from '@/components/vendor/VendorProducts';
import { VendorOrders } from '@/components/vendor/VendorOrders';
import { VendorEscrow } from '@/components/vendor/VendorEscrow';
import { VendorSettings } from '@/components/vendor/VendorSettings';
import { VendorNavigation } from '@/components/vendor/VendorNavigation';
import { AppSwitcherSheet } from '@/components/navigation/AppSwitcherSheet';
import { UserAvatarButton } from '@/components/navigation/UserAvatarButton';
import { useAppSwitcher } from '@/hooks/useAppSwitcher';

export const VendorApp = () => {
  const appSwitcher = useAppSwitcher();

  return (
    <>
      <UserAvatarButton 
        onClick={appSwitcher.open} 
        position="top-right" 
      />

      <AppSwitcherSheet 
        open={appSwitcher.isOpen}
        onOpenChange={appSwitcher.toggle}
      />

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
    </>
  );
};
