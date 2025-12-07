import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users, Car, Settings, HelpCircle, LogOut, FileText, Gift, TrendingUp, History, ChevronRight, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartnerProfileHeader } from './PartnerProfileHeader';
import { PartnerStats } from './PartnerStats';
import { PartnerCompanyInfo } from './PartnerCompanyInfo';
import { PartnerDocuments } from './PartnerDocuments';
import { PartnerSettings } from './PartnerSettings';
import { PartnerCommissionHistory } from './PartnerCommissionHistory';
import { PartnerReferralCodes } from './PartnerReferralCodes';
import { PartnerTeamManager } from './PartnerTeamManager';
import { PartnerLoyaltyProgram } from './PartnerLoyaltyProgram';
import { LegalFooterLinks } from '@/components/shared/LegalFooterLinks';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const PartnerProfilePage: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommissionHistory, setShowCommissionHistory] = useState(false);
  const [showReferralCodes, setShowReferralCodes] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showLoyaltyProgram, setShowLoyaltyProgram] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const quickActions = [
    {
      icon: Wallet,
      label: 'Commissions',
      description: 'Voir mes gains',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => setShowCommissionHistory(true),
    },
    {
      icon: Gift,
      label: 'Codes partenaire',
      description: 'Gérer les codes',
      gradient: 'from-purple-500/10 to-fuchsia-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      onClick: () => setShowReferralCodes(true),
    },
    {
      icon: Users,
      label: 'Mon équipe',
      description: 'Gérer les membres',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => setShowTeamManager(true),
    },
    {
      icon: TrendingUp,
      label: 'Fidélité',
      description: 'Programme VIP',
      gradient: 'from-orange-500/10 to-amber-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      onClick: () => setShowLoyaltyProgram(true),
    },
  ];

  const menuSections = [
    {
      title: 'Mon Entreprise',
      items: [
        { icon: Car, label: 'Gestion de flotte', onClick: () => toast.info('Fonctionnalité à venir') },
        { icon: Users, label: 'Gérer les chauffeurs', onClick: () => toast.info('Fonctionnalité à venir') },
        { icon: FileText, label: 'Documents légaux', onClick: () => setShowDocuments(true) },
      ],
    },
    {
      title: 'Finances',
      items: [
        { icon: Wallet, label: 'Mes commissions', onClick: () => setShowCommissionHistory(true) },
        { icon: History, label: 'Historique des paiements', onClick: () => setShowCommissionHistory(true) },
        { icon: CreditCard, label: 'Moyens de paiement', onClick: () => toast.info('Fonctionnalité à venir') },
      ],
    },
    {
      title: 'Compte',
      items: [
        { icon: Settings, label: 'Paramètres', onClick: () => setShowSettings(true) },
        { icon: Shield, label: 'Sécurité', onClick: () => toast.info('Fonctionnalité à venir') },
        { icon: HelpCircle, label: 'Centre d\'aide', onClick: () => toast.info('Fonctionnalité à venir') },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6 pb-32 lg:pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header du profil */}
      <motion.div variants={itemVariants}>
        <PartnerProfileHeader />
      </motion.div>

      {/* Statistiques */}
      <motion.div variants={itemVariants}>
        <PartnerStats />
      </motion.div>

      {/* Actions rapides */}
      <motion.div variants={itemVariants}>
      <Card className="border border-border/10 shadow-lg overflow-hidden bg-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Actions rapides</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "relative overflow-hidden flex flex-col items-center gap-3 p-4 rounded-2xl",
                      "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    )}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br", action.gradient)} />
                    <div className="relative">
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
                        <Icon className={cn("h-6 w-6", action.iconColor)} />
                      </div>
                    </div>
                    <div className="relative text-center">
                      <p className="text-sm font-semibold text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informations de l'entreprise */}
      <motion.div variants={itemVariants}>
        <PartnerCompanyInfo />
      </motion.div>

      {/* Menu de navigation */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/10 shadow-lg overflow-hidden bg-card">
          <CardContent className="p-0 bg-card">
            {menuSections.map((section, sectionIndex) => (
              <div key={section.title}>
                {sectionIndex > 0 && <Separator />}
                <div className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.label}
                          onClick={item.onClick}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 p-3 rounded-xl",
                            "hover:bg-muted/50 active:bg-muted transition-colors text-left group"
                          )}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Déconnexion */}
            <Separator />
            <div className="p-4">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
                >
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Déconnexion</span>
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer légal */}
      <motion.div variants={itemVariants}>
        <LegalFooterLinks />
      </motion.div>

      {/* Dialog Documents */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Documents légaux</DialogTitle>
          </DialogHeader>
          <PartnerDocuments />
        </DialogContent>
      </Dialog>

      {/* Dialog Paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>
          <PartnerSettings />
        </DialogContent>
      </Dialog>

      {/* Dialog Historique Commissions */}
      <Dialog open={showCommissionHistory} onOpenChange={setShowCommissionHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Historique des commissions</DialogTitle>
          </DialogHeader>
          <PartnerCommissionHistory />
        </DialogContent>
      </Dialog>

      {/* Dialog Codes Partenaire */}
      <Dialog open={showReferralCodes} onOpenChange={setShowReferralCodes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Codes Partenaire</DialogTitle>
          </DialogHeader>
          <PartnerReferralCodes />
        </DialogContent>
      </Dialog>

      {/* Dialog Gestion d'Équipe */}
      <Dialog open={showTeamManager} onOpenChange={setShowTeamManager}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Gestion d'Équipe</DialogTitle>
          </DialogHeader>
          <PartnerTeamManager />
        </DialogContent>
      </Dialog>

      {/* Dialog Programme Fidélité */}
      <Dialog open={showLoyaltyProgram} onOpenChange={setShowLoyaltyProgram}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Programme Fidélité VIP</DialogTitle>
          </DialogHeader>
          <PartnerLoyaltyProgram />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};