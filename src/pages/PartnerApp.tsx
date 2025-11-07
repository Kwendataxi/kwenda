import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabScrollReset } from '@/hooks/useTabScrollReset';
import { ModernPartnerHeader } from '@/components/partner/navigation/ModernPartnerHeader';
import { PartnerBottomNav, PartnerNavTab } from '@/components/partner/navigation/PartnerBottomNav';
import { PartnerDesktopNav } from '@/components/partner/navigation/PartnerDesktopNav';
import { PartnerKPIGrid } from '@/components/partner/PartnerKPIGrid';
import { PartnerDashboard } from '@/components/partner/PartnerDashboard';
import { PartnerDriverManager } from '@/components/partner/PartnerDriverManager';
import PartnerRentalManager from '@/components/partner/rental/PartnerRentalManager';
import PartnerDeliveryManager from '@/components/partner/delivery/PartnerDeliveryManager';
import { PartnerAnalyticsDashboard } from '@/components/partner/PartnerAnalyticsDashboard';
import { PartnerProfilePage } from '@/components/partner/PartnerProfilePage';
import { ModernPartnerWallet } from '@/components/partner/wallet/ModernPartnerWallet';
import { usePartnerStats, PartnerStats } from '@/hooks/usePartnerStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

const PartnerApp = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<PartnerNavTab>('dashboard');
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { stats, loading: statsLoading } = usePartnerStats();

  // ✅ Scroll automatique au changement d'onglet
  useTabScrollReset(activeTab, { 
    behavior: 'smooth',
    delay: 50
  });

  // Fetch partner profile
  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setPartnerProfile(data);
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProfile();
  }, [user]);

  const renderContent = () => {
    const fadeVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <PartnerKPIGrid stats={stats} />
            <div className="px-4 pb-20 lg:pb-6">
              <PartnerDashboard onViewChange={(view) => setActiveTab(view as PartnerNavTab)} />
            </div>
          </motion.div>
        );

      case 'fleet':
        return (
          <motion.div
            key="fleet"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Gestion de la Flotte
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos véhicules et locations
              </p>
            </div>
            <PartnerRentalManager />
          </motion.div>
        );

      case 'drivers':
        return (
          <motion.div
            key="drivers"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Gestion des Chauffeurs
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Suivez et gérez vos chauffeurs
              </p>
            </div>
            <PartnerDriverManager />
          </motion.div>
        );

      case 'deliveries':
        return (
          <motion.div
            key="deliveries"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Gestion des Livraisons
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Suivez vos commandes de livraison
              </p>
            </div>
            <PartnerDeliveryManager />
          </motion.div>
        );

      case 'wallet':
        return (
          <motion.div
            key="wallet"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Finances
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos revenus et transactions
              </p>
            </div>
            <ModernPartnerWallet />
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div
            key="analytics"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics & Rapports
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Analysez vos performances
              </p>
            </div>
            <PartnerAnalyticsDashboard />
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div
            key="profile"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4 pb-20 lg:pb-6"
          >
            <PartnerProfilePage />
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading || !partnerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <ModernPartnerHeader
        partnerName={partnerProfile?.contact_name || 'Partenaire'}
        companyName={partnerProfile?.company_name}
        notificationCount={3}
      />

      {/* Desktop Navigation */}
      {!isMobile && (
        <PartnerDesktopNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Main Content */}
      <main className="relative">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <PartnerBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
};

export default PartnerApp;
