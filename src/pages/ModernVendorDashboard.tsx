import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveVendorLayout } from '@/components/vendor/ResponsiveVendorLayout';
import { ChatVendorModal } from '@/components/vendor/modern/ChatVendorModal';
import { VendorNotificationCenter } from '@/components/vendor/modern/VendorNotificationCenter';
import { VendorDashboardOverview } from '@/components/vendor/VendorDashboardOverview';
import { VendorProductManager } from '@/components/vendor/VendorProductManager';
import { VendorOrdersList } from '@/components/vendor/VendorOrdersList';
import { VendorProfilePage } from '@/components/vendor/VendorProfilePage';
import { VendorSubscriptionManager } from '@/components/vendor/VendorSubscriptionManager';
import { useVendorStats } from '@/hooks/useVendorStats';

export default function ModernVendorDashboard() {
  const { user } = useAuth();
  const { stats } = useVendorStats();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  return (
    <ResponsiveVendorLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      stats={stats}
    >
      {/* Contenu dynamique selon activeTab */}
      {activeTab === 'dashboard' && <VendorDashboardOverview />}
      {activeTab === 'shop' && <VendorProductManager />}
      {activeTab === 'orders' && <VendorOrdersList />}
      {activeTab === 'profile' && <VendorProfilePage />}
      {activeTab === 'subscription' && <VendorSubscriptionManager />}

      {/* Modales */}
      <ChatVendorModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <VendorNotificationCenter open={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />
    </ResponsiveVendorLayout>
  );
}
