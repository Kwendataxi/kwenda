import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

export const DriverProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const menuItems = [
    {
      section: 'Activité',
      items: [
        { icon: History, label: 'Historique des courses', href: '#history', color: 'text-blue-600' },
        { icon: Car, label: 'Mes véhicules', href: '#vehicles', color: 'text-orange-600' },
        { icon: MapPin, label: 'Zones de service', href: '#zones', color: 'text-green-600' },
      ]
    },
    {
      section: 'Gestion',
      items: [
        { icon: Bell, label: 'Notifications', href: '#notifications', color: 'text-purple-600' },
        { icon: Settings, label: 'Paramètres', href: '#settings', color: 'text-gray-600' },
        { icon: QrCode, label: 'Code partenaire', href: '#partner-code', color: 'text-indigo-600' },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: Phone, label: 'Support client', href: '#support', color: 'text-teal-600' },
        { icon: Shield, label: 'Sécurité', href: '#security', color: 'text-red-600' },
        { icon: FileText, label: 'Documents', href: '#documents', color: 'text-amber-600' },
      ]
    }
  ];

  const quickActions = [
    { icon: Wallet, label: 'Wallet', color: 'bg-green-50 text-green-700', href: '#wallet' },
    { icon: Gift, label: 'Codes promo', color: 'bg-purple-50 text-purple-700', href: '#promo' },
    { icon: Users, label: 'Parrainage', color: 'bg-blue-50 text-blue-700', href: '#referral' },
    { icon: Trophy, label: 'Badges', color: 'bg-yellow-50 text-yellow-700', href: '#badges' },
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
                  onClick={() => {
                    toast.info(`${action.label} - Bientôt disponible`);
                  }}
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
                      onClick={() => {
                        toast.info(`${item.label} - Bientôt disponible`);
                      }}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
};

export default DriverProfilePage;
