import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users, Settings, HelpCircle, LogOut, FileText, Gift, TrendingUp, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartnerProfileHeader } from './PartnerProfileHeader';
import { PartnerStats } from './PartnerStats';
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
      // 🛡️ signOut gère la redirection via ProtectedRoute
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const quickActions = [
    {
      icon: Wallet,
      label: 'Commissions',
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => setShowCommissionHistory(true),
    },
    {
      icon: Gift,
      label: 'Codes',
      gradient: 'from-purple-500 to-fuchsia-500',
      onClick: () => setShowReferralCodes(true),
    },
    {
      icon: Users,
      label: 'Équipe',
      gradient: 'from-blue-500 to-cyan-500',
      onClick: () => setShowTeamManager(true),
    },
    {
      icon: TrendingUp,
      label: 'Fidélité',
      gradient: 'from-orange-500 to-amber-500',
      onClick: () => setShowLoyaltyProgram(true),
    },
  ];

  const menuItems = [
    { icon: Wallet, label: 'Mes commissions', onClick: () => setShowCommissionHistory(true) },
    { icon: FileText, label: 'Documents', onClick: () => setShowDocuments(true) },
    { icon: Settings, label: 'Paramètres', onClick: () => setShowSettings(true) },
    { icon: Shield, label: 'Sécurité', onClick: () => toast.info('Fonctionnalité à venir') },
    { icon: HelpCircle, label: 'Aide', onClick: () => toast.info('Fonctionnalité à venir') },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-5 pb-28"
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

      {/* Actions rapides - Design moderne compact */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg",
                  action.gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Menu simplifié */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.label}>
                  {index > 0 && <Separator className="my-1" />}
                  <motion.button
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 p-3 rounded-xl",
                      "hover:bg-muted/50 active:bg-muted transition-colors text-left group"
                    )}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-muted/80 group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </motion.button>
                </React.Fragment>
              );
            })}

            <Separator className="my-1" />
            
            {/* Déconnexion */}
            <motion.button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-left group"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">Déconnexion</span>
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer légal */}
      <motion.div variants={itemVariants}>
        <LegalFooterLinks />
      </motion.div>

      {/* Dialogs */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Documents légaux</DialogTitle>
          </DialogHeader>
          <PartnerDocuments />
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
          </DialogHeader>
          <PartnerSettings />
        </DialogContent>
      </Dialog>

      <Dialog open={showCommissionHistory} onOpenChange={setShowCommissionHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Historique des commissions</DialogTitle>
          </DialogHeader>
          <PartnerCommissionHistory />
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralCodes} onOpenChange={setShowReferralCodes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Codes Partenaire</DialogTitle>
          </DialogHeader>
          <PartnerReferralCodes />
        </DialogContent>
      </Dialog>

      <Dialog open={showTeamManager} onOpenChange={setShowTeamManager}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Gestion d'Équipe</DialogTitle>
          </DialogHeader>
          <PartnerTeamManager />
        </DialogContent>
      </Dialog>

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
