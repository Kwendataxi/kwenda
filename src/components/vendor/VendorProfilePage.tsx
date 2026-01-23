import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, Settings, TrendingUp, 
  LogOut, Users, Package, DollarSign, BarChart3,
  ShoppingBag, Bell, Shield, Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { VendorProfileHeader } from './VendorProfileHeader';
import { VendorStatsCards } from './VendorStatsCards';
import { VendorShopInfoCard } from './VendorShopInfoCard';
import { VendorSettings } from './VendorSettings';
import { VendorSalesHistory } from './VendorSalesHistory';
import { VendorEscrowManager } from './VendorEscrowManager';
import { VendorAnalytics } from './VendorAnalytics';
import { VendorFollowers } from './VendorFollowers';
import { VendorShopSettings } from '@/components/marketplace/VendorShopSettings';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { StaggerContainer, StaggerItem } from './animations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VendorProfilePageProps {
  onTabChange?: (tab: string) => void;
}

export const VendorProfilePage = ({ onTabChange }: VendorProfilePageProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [escrowOpen, setEscrowOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [shopSettingsOpen, setShopSettingsOpen] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: ['vendor-info', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('[VendorProfile] Loaded vendor:', {
        user_id: data?.user_id,
        id: data?.id,
        shop_name: data?.shop_name,
        user_id_length: data?.user_id?.length
      });
      
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "✅ Déconnexion réussie" });
    } catch (error) {
      toast({ title: "❌ Erreur lors de la déconnexion", variant: "destructive" });
    }
  };

  const quickActions = [
    {
      icon: Package,
      label: "Ajouter un produit",
      description: "Nouveau produit en vente",
      onClick: () => navigate('/vendeur/ajouter-produit'),
      color: "text-purple-600"
    },
    {
      icon: ShoppingBag,
      label: "Voir mes commandes",
      description: "Gérer les commandes",
      onClick: () => onTabChange?.('orders'),
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      label: "Mes ventes",
      description: "Historique détaillé",
      onClick: () => setSalesHistoryOpen(true),
      color: "text-green-600"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Performances détaillées",
      onClick: () => setAnalyticsOpen(true),
      color: "text-orange-600"
    }
  ];

  const menuSections = [
    {
      title: "Ma Boutique",
      items: [
        { 
          icon: Store, 
          label: "Informations de la boutique",
          description: "Nom, description, logo",
          onClick: () => setShopSettingsOpen(true)
        },
        { 
          icon: Package, 
          label: "Mes produits",
          description: "Gérer mon catalogue",
          onClick: () => onTabChange?.('shop')
        },
        { 
          icon: ShoppingBag, 
          label: "Mes commandes",
          description: "Suivi des ventes",
          onClick: () => onTabChange?.('orders')
        }
      ]
    },
    {
      title: "Finances",
      items: [
        { 
          icon: DollarSign, 
          label: "Historique des ventes",
          description: "Toutes mes transactions",
          onClick: () => setSalesHistoryOpen(true)
        },
        { 
          icon: TrendingUp, 
          label: "Compte séquestre",
          description: "Fonds en attente",
          onClick: () => setEscrowOpen(true)
        },
        { 
          icon: BarChart3, 
          label: "Analytics détaillées",
          description: "Performances de vente",
          onClick: () => setAnalyticsOpen(true)
        }
      ]
    },
    {
      title: "Paramètres",
      items: [
        { 
          icon: Settings, 
          label: "Paramètres du compte",
          description: "Préférences et sécurité",
          onClick: () => setSettingsOpen(true)
        },
        { 
          icon: Bell, 
          label: "Notifications",
          description: "Gérer les alertes",
          onClick: () => setSettingsOpen(true)
        }
      ]
    },
    {
      title: "Support",
      items: [
        { 
          icon: Users, 
          label: "Mes clients",
          description: "Followers et avis",
          onClick: () => setFollowersOpen(true)
        },
        { 
          icon: Award, 
          label: "Programme fidélité",
          description: "Récompenses vendeur",
          onClick: () => toast({ 
            title: "Programme fidélité", 
            description: "Fonctionnalité en développement - Disponible prochainement"
          })
        },
        { 
          icon: Shield, 
          label: "Aide & Support",
          description: "Centre d'assistance",
          onClick: () => navigate('/support/help-center')
        }
      ]
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      {/* Header avec animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <VendorProfileHeader />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <VendorStatsCards />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <VendorShopInfoCard
          shopName={vendor?.shop_name || 'Ma Boutique'}
          description={vendor?.shop_description || 'Bienvenue dans ma boutique Kwenda Market'}
          email={user?.email || 'Non renseigné'}
          totalSales={vendor?.total_sales || 0}
          rating={vendor?.average_rating || 0.0}
          memberSince={vendor?.created_at ? format(new Date(vendor.created_at), 'dd MMMM yyyy', { locale: fr }) : 'Non renseigné'}
          status="active"
          vendorId={vendor?.user_id || ''}
          onEditClick={() => setShopSettingsOpen(true)}
        />
      </motion.div>

      {/* Quick Actions avec stagger */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions Rapides</h2>
          <StaggerContainer 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            staggerDelay={0.05}
          >
            {quickActions.map((action, idx) => (
              <StaggerItem key={idx}>
                <motion.button
                  onClick={action.onClick}
                  className="flex flex-col items-center p-3 rounded-lg border hover:bg-accent transition-colors text-center w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <action.icon className={`h-6 w-6 mb-2 ${action.color}`} />
                  <span className="font-medium text-sm">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </motion.button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Card>
      </motion.div>

      {/* Menu Sections avec animations */}
      <StaggerContainer className="grid gap-6" staggerDelay={0.08}>
        {menuSections.map((section, idx) => (
          <StaggerItem key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="grid gap-3">
                  {section.items.map((item, itemIdx) => (
                    <motion.button
                      key={itemIdx}
                      onClick={item.onClick}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors text-left w-full"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Déconnexion avec animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <Button 
            onClick={handleSignOut} 
            variant="destructive" 
            className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </Card>
      </motion.div>

      {/* Liens légaux */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <LegalFooterLinks />
      </motion.div>

      {/* Dialogs */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorSettings />
        </DialogContent>
      </Dialog>

      <Dialog open={salesHistoryOpen} onOpenChange={setSalesHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <VendorSalesHistory />
        </DialogContent>
      </Dialog>

      <Dialog open={escrowOpen} onOpenChange={setEscrowOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorEscrowManager />
        </DialogContent>
      </Dialog>

      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <VendorAnalytics />
        </DialogContent>
      </Dialog>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorFollowers />
        </DialogContent>
      </Dialog>

      <Dialog open={shopSettingsOpen} onOpenChange={setShopSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <VendorShopSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};
