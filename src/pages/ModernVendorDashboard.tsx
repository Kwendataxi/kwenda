import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { useVendorChat } from '@/hooks/useVendorChat';
import { ModernVendorHeader } from '@/components/vendor/modern/ModernVendorHeader';
import { FloatingBottomNav } from '@/components/vendor/modern/FloatingBottomNav';
import { ModernStatCard } from '@/components/vendor/modern/ModernStatCard';
import { QuickActionsBar } from '@/components/vendor/modern/QuickActionsBar';
import { ContextualAlert } from '@/components/vendor/modern/ContextualAlert';
import { ChatVendorModal } from '@/components/vendor/modern/ChatVendorModal';
import { VendorNotificationCenter } from '@/components/vendor/modern/VendorNotificationCenter';
import { VendorProductManager } from '@/components/vendor/VendorProductManager';
import { VendorOrdersList } from '@/components/vendor/VendorOrdersList';
import { VendorProfileSetup } from '@/components/vendor/VendorProfileSetup';
import { VendorVerificationDashboard } from '@/components/vendor/modern/VendorVerificationDashboard';
import { VendorShopSettings } from '@/components/marketplace/VendorShopSettings';
import { Package, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export default function ModernVendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { unreadCount } = useVendorNotifications();
  const { totalUnread: chatUnread } = useVendorChat();
  
  const [activeTab, setActiveTab] = useState('shop');
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  });
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    const { data: products } = await supabase.from('marketplace_products').select('*').eq('seller_id', user.id) as any;
    const { data: orders } = await supabase.from('marketplace_orders').select('*').eq('seller_id', user.id) as any;
    
    setStats({
      totalProducts: products?.length || 0,
      activeProducts: products?.filter((p: any) => p.moderation_status === 'approved').length || 0,
      pendingProducts: products?.filter((p: any) => p.moderation_status === 'pending').length || 0,
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter((o: any) => o.status === 'pending_seller_confirmation').length || 0,
      totalEarnings: orders?.filter((o: any) => o.status === 'completed').reduce((sum: number, o: any) => sum + o.total_amount, 0) || 0,
      pendingEarnings: orders?.filter((o: any) => o.status !== 'completed').reduce((sum: number, o: any) => sum + o.total_amount, 0) || 0
    });
  };

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      <ModernVendorHeader 
        notificationCount={unreadCount}
        onNotificationClick={() => setNotifCenterOpen(true)}
      />
      
      <FloatingBottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersBadge={stats.pendingOrders}
      />

      <div className="container max-w-6xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ModernStatCard icon={Package} iconColor="red" label="Produits" value={`${stats.activeProducts}/${stats.totalProducts}`} />
          <ModernStatCard icon={CheckCircle} iconColor="red" label="Confirmations" value={stats.pendingOrders} />
          <ModernStatCard icon={DollarSign} iconColor="green" label="Revenus effectifs" value={`${stats.totalEarnings} FC`} />
          <ModernStatCard icon={Clock} iconColor="orange" label="En attente" value={`${stats.pendingEarnings} FC`} />
        </div>

        <QuickActionsBar 
          shopCount={stats.activeProducts}
          packageCount={stats.pendingOrders}
          earningsCount={stats.totalEarnings}
          notificationCount={unreadCount}
          onNotificationClick={() => setNotifCenterOpen(true)}
        />

        {stats.pendingProducts > 0 && (
          <ContextualAlert
            icon={Clock}
            iconColor="orange"
            title="Validation en cours"
            message={`${stats.pendingProducts} produits en attente de modération.`}
            description="Ils seront visibles après approbation par un administrateur."
          />
        )}

        {activeTab === 'shop' && <VendorProductManager onUpdate={loadStats} />}
        {activeTab === 'orders' && <VendorOrdersList onRefresh={loadStats} />}
        {activeTab === 'profile' && <VendorProfileSetup />}
        {activeTab === 'verification' && <VendorVerificationDashboard />}
        {activeTab === 'settings' && <VendorShopSettings />}
      </div>

      <ChatVendorModal open={chatModalOpen} onClose={() => setChatModalOpen(false)} />
      <VendorNotificationCenter open={notifCenterOpen} onClose={() => setNotifCenterOpen(false)} />
    </div>
  );
}
