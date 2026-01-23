import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTabScrollReset } from '@/hooks/useTabScrollReset';
import { ModernPartnerHeader } from '@/components/partner/navigation/ModernPartnerHeader';
import { PartnerDesktopNav } from '@/components/partner/navigation/PartnerDesktopNav';
import { UniversalBottomNavigation, UniversalTabType } from '@/components/navigation/UniversalBottomNavigation';
import { PartnerKPIGrid } from '@/components/partner/PartnerKPIGrid';
import { PartnerDashboard } from '@/components/partner/PartnerDashboard';
import { PartnerDriverManager } from '@/components/partner/PartnerDriverManager';
import PartnerRentalManager from '@/components/partner/rental/PartnerRentalManager';
import { PartnerAnalyticsDashboard } from '@/components/partner/PartnerAnalyticsDashboard';
import { PartnerProfilePage } from '@/components/partner/PartnerProfilePage';
import { JobsManagerDashboard } from '@/components/job/publisher';
import { usePartnerStats, PartnerStats } from '@/hooks/usePartnerStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

// Types locaux pour les onglets partenaire
type PartnerTab = 'dashboard' | 'fleet' | 'drivers' | 'jobs' | 'analytics' | 'settings';

const PartnerApp = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Déterminer l'onglet par défaut basé sur la route
  const getDefaultTab = (): PartnerTab => {
    if (location.pathname.includes('/partner/profile') || location.pathname.includes('/partner/settings')) {
      return 'settings';
    }
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState<PartnerTab>(getDefaultTab());
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { stats, loading: statsLoading } = usePartnerStats();

  // ✅ Scroll automatique au changement d'onglet
  useTabScrollReset(activeTab);
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
          .from('partenaires')
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
            <div className="px-4">
              <PartnerDashboard onViewChange={(view) => setActiveTab(view as PartnerTab)} />
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
            className="px-4"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Gestion de la Flotte
              </h2>
              <p className="text-muted-foreground">
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
            className="px-4"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Gestion des Chauffeurs
              </h2>
              <p className="text-muted-foreground">
                Suivez et gérez vos chauffeurs
              </p>
            </div>
            <PartnerDriverManager />
          </motion.div>
        );

      case 'jobs':
        return (
          <motion.div
            key="jobs"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Recrutement
              </h2>
              <p className="text-muted-foreground">
                Publiez et gérez vos offres d'emploi
              </p>
            </div>
            <JobsManagerDashboard 
              userType="partner"
              defaultCompanyData={{
                name: partnerProfile?.company_name || '',
                city: partnerProfile?.city || 'Kinshasa'
              }}
            />
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
            className="px-4"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Analytics & Rapports
              </h2>
              <p className="text-muted-foreground">
                Analysez vos performances
              </p>
            </div>
            <PartnerAnalyticsDashboard />
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div
            key="settings"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="px-4"
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
    <div className="min-h-screen bg-background mobile-safe-layout">
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
      <main className="content-scrollable pt-16">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - Unifié avec chauffeur */}
      {isMobile && (
        <UniversalBottomNavigation
          userType="partner"
          activeTab={activeTab as UniversalTabType}
          onTabChange={(tab) => setActiveTab(tab as PartnerTab)}
          showLabels={true}
        />
      )}
    </div>
  );
};

export default PartnerApp;
