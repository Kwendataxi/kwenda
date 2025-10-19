import React, { useState } from 'react';
import { Wallet, Users, Car, Settings, HelpCircle, LogOut, FileText, Gift, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartnerProfileHeader } from './PartnerProfileHeader';
import { PartnerStats } from './PartnerStats';
import { PartnerCompanyInfo } from './PartnerCompanyInfo';
import { PartnerDocuments } from './PartnerDocuments';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const PartnerProfilePage: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDocuments, setShowDocuments] = useState(false);

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
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => toast.info('Fonctionnalité à venir'),
    },
    {
      icon: Gift,
      label: 'Codes partenaire',
      description: 'Gérer les codes',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => toast.info('Fonctionnalité à venir'),
    },
    {
      icon: Users,
      label: 'Mon équipe',
      description: 'Gérer les membres',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => toast.info('Fonctionnalité à venir'),
    },
    {
      icon: TrendingUp,
      label: 'Fidélité',
      description: 'Programme partenaire',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => toast.info('Fonctionnalité à venir'),
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
        { icon: Wallet, label: 'Mes commissions', onClick: () => toast.info('Fonctionnalité à venir') },
        { icon: TrendingUp, label: 'Gains abonnements', onClick: () => toast.info('Fonctionnalité à venir') },
      ],
    },
    {
      title: 'Paramètres',
      items: [
        { icon: Settings, label: 'Paramètres du compte', onClick: () => toast.info('Fonctionnalité à venir') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Centre d\'aide', onClick: () => toast.info('Fonctionnalité à venir') },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header du profil */}
      <PartnerProfileHeader />

      {/* Statistiques */}
      <PartnerStats />

      {/* Actions rapides */}
      <Card className="card-floating border-0">
        <CardContent className="p-6">
          <h3 className="text-heading-sm font-semibold mb-4 text-card-foreground">Actions rapides</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-grey-50 transition-colors"
                >
                  <div className={`p-3 rounded-xl ${action.bgColor}`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-body-sm font-medium text-card-foreground">{action.label}</p>
                    <p className="text-caption text-muted-foreground">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informations de l'entreprise */}
      <PartnerCompanyInfo />

      {/* Menu de navigation */}
      <Card className="card-floating border-0">
        <CardContent className="p-6 space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && <Separator className="mb-6" />}
              <h3 className="text-heading-sm font-semibold mb-3 text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-grey-50 transition-colors text-left"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-body-md text-card-foreground">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Déconnexion */}
          <div>
            <Separator className="mb-6" />
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Documents */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents légaux</DialogTitle>
          </DialogHeader>
          <PartnerDocuments />
        </DialogContent>
      </Dialog>
    </div>
  );
};
