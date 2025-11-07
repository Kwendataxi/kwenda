import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Settings, DollarSign, CreditCard, Users, TrendingUp, FileText, HelpCircle, Shield, Clock, Bell, ChefHat, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RestaurantProfileHeader } from './RestaurantProfileHeader';
import { RestaurantInfoCard } from './RestaurantInfoCard';
import { RestaurantStats } from './RestaurantStats';
import { RestaurantDocuments } from './RestaurantDocuments';
import { RestaurantSettings } from './RestaurantSettings';
import { ImageOnboardingBanner } from './ImageOnboardingBanner';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState as useStateForProfile } from 'react';

export function RestaurantProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useStateForProfile<{ logo_url: string | null; banner_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileImages();
    }
  }, [user]);

  const loadProfileImages = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('restaurant_profiles')
        .select('logo_url, banner_url')
        .eq('user_id', user.id)
        .single();
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile images:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/restaurant/auth');
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const quickActions = [
    { 
      icon: Camera, 
      label: 'Modifier mes images', 
      description: 'Logo et bannière',
      onClick: () => setShowSettings(true)
    },
    { 
      icon: DollarSign, 
      label: 'Revenus & Finances', 
      description: 'Voir mes gains',
      onClick: () => navigate('/restaurant?tab=analytics')
    },
    { 
      icon: CreditCard, 
      label: 'Abonnement', 
      description: 'Gérer mon plan',
      onClick: () => navigate('/restaurant/subscription')
    },
    { 
      icon: Users, 
      label: 'Mon Équipe', 
      description: 'Gérer le personnel',
      onClick: () => toast({ title: 'Bientôt disponible' })
    },
  ];

  const menuSections = [
    {
      title: 'Business',
      items: [
        { icon: TrendingUp, label: 'Statistiques détaillées', onClick: () => navigate('/restaurant?tab=analytics') },
        { icon: ChefHat, label: 'Gérer mon menu', onClick: () => navigate('/restaurant?tab=menu') },
        { icon: Clock, label: 'Horaires d\'ouverture', onClick: () => setShowSettings(true) },
        { icon: Bell, label: 'Mes commandes', onClick: () => navigate('/restaurant?tab=orders') },
      ]
    },
    {
      title: 'Finance',
      items: [
        { icon: DollarSign, label: 'Historique des revenus', onClick: () => navigate('/restaurant?tab=analytics') },
        { icon: CreditCard, label: 'Mon abonnement', onClick: () => navigate('/restaurant/subscription') },
      ]
    },
    {
      title: 'Paramètres',
      items: [
        { icon: Settings, label: 'Images & Paramètres', onClick: () => setShowSettings(true) },
        { icon: Shield, label: 'Sécurité et confidentialité', onClick: () => setShowSettings(true) },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Centre d\'aide', onClick: () => navigate('/help') },
        { icon: FileText, label: 'Conditions générales', onClick: () => navigate('/terms') },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <RestaurantProfileHeader />
        
        {/* Banner d'onboarding pour les nouveaux restaurants */}
        {profile && (
          <ImageOnboardingBanner
            hasLogo={!!profile.logo_url}
            hasBanner={!!profile.banner_url}
            onAddImages={() => setShowSettings(true)}
          />
        )}
        
        <RestaurantStats />

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors"
                  >
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                      <Icon className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <RestaurantInfoCard />

        {/* Menu de navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="flex-1 font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Déconnexion */}
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleLogout}
          size="lg"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Se déconnecter
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <RestaurantDocuments />
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <RestaurantSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}
