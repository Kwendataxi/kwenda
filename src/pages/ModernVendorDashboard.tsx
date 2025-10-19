import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedVendorHeader } from '@/components/vendor/UnifiedVendorHeader';
import { VendorBottomNav } from '@/components/vendor/modern/VendorBottomNav';
import { VendorDesktopSidebar } from '@/components/vendor/modern/VendorDesktopSidebar';
import { ChatVendorModal } from '@/components/vendor/modern/ChatVendorModal';
import { VendorNotificationCenter } from '@/components/vendor/modern/VendorNotificationCenter';
import { VendorProductManager } from '@/components/vendor/VendorProductManager';
import { VendorOrdersList } from '@/components/vendor/VendorOrdersList';
import { VendorProfileSetup } from '@/components/vendor/VendorProfileSetup';
import { VendorVerificationDashboard } from '@/components/vendor/modern/VendorVerificationDashboard';
import { VendorShopSettings } from '@/components/marketplace/VendorShopSettings';
import { VendorSubscriptionManager } from '@/components/vendor/VendorSubscriptionManager';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ModernVendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('shop');
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixe */}
      <UnifiedVendorHeader />
      
      <div className="flex pt-[76px]">
        {/* Sidebar Desktop uniquement */}
        {!isMobile && (
          <VendorDesktopSidebar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Contenu principal */}
        <main className="flex-1 container max-w-6xl mx-auto p-4 space-y-4 pb-24 md:pb-6">
          {/* Contenu dynamique selon activeTab */}
          {activeTab === 'shop' && <VendorProductManager />}
          {activeTab === 'orders' && <VendorOrdersList />}
          {activeTab === 'profile' && <VendorProfileSetup />}
          {activeTab === 'verification' && <VendorVerificationDashboard />}
          {activeTab === 'settings' && <VendorShopSettings />}
          {activeTab === 'subscription' && <VendorSubscriptionManager />}
        </main>
      </div>

      {/* Bottom Nav Mobile uniquement */}
      {isMobile && (
        <VendorBottomNav 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Modales */}
      <ChatVendorModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <VendorNotificationCenter open={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />
    </div>
  );
}
