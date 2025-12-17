import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Wallet, Gift, Users, Trophy, History, Car,
  MapPin, Bell, Settings, QrCode, Phone,
  Shield, LogOut, FileText, AlertCircle
} from 'lucide-react';
import { DriverProfileHeader } from './DriverProfileHeader';
import { DriverStats } from './DriverStats';
import { DriverOrderHistory } from './DriverOrderHistory';
import { DriverDocuments } from './DriverDocuments';
import { DriverSettings } from './DriverSettings';
import { WalletPanel } from './modals/WalletPanel';
import { PromoCodePanel } from './modals/PromoCodePanel';
import { ReferralPanel } from './modals/ReferralPanel';
import { BadgesPanel } from './modals/BadgesPanel';
import { VehiclesModal } from './modals/VehiclesModal';
import { ServiceZonesModal } from './modals/ServiceZonesModal';
import { NotificationsPanel } from './modals/NotificationsPanel';
import { PartnerCodeModal } from './modals/PartnerCodeModal';
import { SupportPanel } from './modals/SupportPanel';
import { SecurityPanel } from './modals/SecurityPanel';

type DialogView = 'wallet' | 'promo' | 'referral' | 'badges' | 'history' | 'vehicles' | 'zones' | 'notifications' | 'settings' | 'partner-code' | 'support' | 'security' | 'documents' | null;

export const DriverProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogView, setDialogView] = useState<DialogView>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      // 🛡️ signOut gère la redirection via ProtectedRoute
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const menuItems = [
    {
      section: 'Activité',
      items: [
        { icon: History, label: 'Historique des courses', action: 'history' as DialogView, color: 'text-blue-600' },
        { icon: Car, label: 'Mes véhicules', action: 'vehicles' as DialogView, color: 'text-orange-600' },
        { icon: MapPin, label: 'Zones de service', action: 'zones' as DialogView, color: 'text-green-600' },
      ]
    },
    {
      section: 'Gestion',
      items: [
        { icon: Bell, label: 'Notifications', action: 'notifications' as DialogView, color: 'text-purple-600' },
        { icon: Settings, label: 'Paramètres', action: 'settings' as DialogView, color: 'text-gray-600' },
        { icon: QrCode, label: 'Code partenaire', action: 'partner-code' as DialogView, color: 'text-indigo-600' },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: Phone, label: 'Support client', action: 'support' as DialogView, color: 'text-teal-600' },
        { icon: Shield, label: 'Sécurité', action: 'security' as DialogView, color: 'text-red-600' },
        { icon: FileText, label: 'Documents', action: 'documents' as DialogView, color: 'text-amber-600' },
      ]
    }
  ];

  const quickActions = [
    { icon: Wallet, label: 'Wallet', color: 'bg-green-50 text-green-700', action: 'wallet' as DialogView },
    { icon: Gift, label: 'Codes promo', color: 'bg-purple-50 text-purple-700', action: 'promo' as DialogView },
    { icon: Users, label: 'Parrainage', color: 'bg-blue-50 text-blue-700', action: 'referral' as DialogView },
    { icon: Trophy, label: 'Badges', color: 'bg-yellow-50 text-yellow-700', action: 'badges' as DialogView },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header avec photo et infos principales */}
      <DriverProfileHeader />

      {/* Statistiques clés */}
      <DriverStats />

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setDialogView(action.action)}
                >
                  <div className={`p-3 rounded-full ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Menu principal */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {menuItems.map((section, idx) => (
            <div key={section.section}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                      onClick={() => setDialogView(item.action)}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {idx < menuItems.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bouton de déconnexion */}
      <Card>
        <CardContent className="p-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs pour afficher les différentes sections */}
      <Dialog open={dialogView !== null} onOpenChange={(open) => !open && setDialogView(null)}>
        <DialogContent className="max-w-screen-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogView === 'wallet' && 'Mon Wallet'}
              {dialogView === 'promo' && 'Codes Promo'}
              {dialogView === 'referral' && 'Parrainage'}
              {dialogView === 'badges' && 'Mes Badges'}
              {dialogView === 'history' && 'Historique des courses'}
              {dialogView === 'vehicles' && 'Mes véhicules'}
              {dialogView === 'zones' && 'Zones de service'}
              {dialogView === 'notifications' && 'Notifications'}
              {dialogView === 'settings' && 'Paramètres'}
              {dialogView === 'partner-code' && 'Code Partenaire'}
              {dialogView === 'support' && 'Support Client'}
              {dialogView === 'security' && 'Sécurité'}
              {dialogView === 'documents' && 'Mes documents'}
            </DialogTitle>
          </DialogHeader>

          {dialogView === 'wallet' && <WalletPanel />}
          {dialogView === 'promo' && <PromoCodePanel />}
          {dialogView === 'referral' && <ReferralPanel />}
          {dialogView === 'badges' && <BadgesPanel />}
          {dialogView === 'history' && <DriverOrderHistory />}
          {dialogView === 'vehicles' && <VehiclesModal />}
          {dialogView === 'zones' && <ServiceZonesModal />}
          {dialogView === 'notifications' && <NotificationsPanel />}
          {dialogView === 'settings' && <DriverSettings />}
          {dialogView === 'partner-code' && <PartnerCodeModal />}
          {dialogView === 'support' && <SupportPanel />}
          {dialogView === 'security' && <SecurityPanel />}
          {dialogView === 'documents' && <DriverDocuments />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverProfilePage;
