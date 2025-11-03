import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SetupStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface VendorSetupProgressProps {
  onActionClick?: (action: string) => void;
}

export const VendorSetupProgress = ({ onActionClick }: VendorSetupProgressProps) => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSetupProgress();
    }
  }, [user]);

  const checkSetupProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Vérifier profil vendeur
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const hasProfile = !!(profile?.display_name);

      // Vérifier produits
      const { count: productsCount } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);

      const hasProducts = (productsCount || 0) > 0;

      // Vérifier produits approuvés
      const { count: approvedCount } = await supabase
        .from('marketplace_products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .in('moderation_status', ['approved', 'active']);

      const hasApprovedProducts = (approvedCount || 0) > 0;

      // Vérifier commandes
      const { count: ordersCount } = await supabase
        .from('marketplace_orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);

      const hasOrders = (ordersCount || 0) > 0;

      // Vérifier abonnement
      const { data: subscription } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('vendor_id', user.id)
        .single();

      const hasSubscription = !!subscription;

      const setupSteps: SetupStep[] = [
        {
          id: 'profile',
          label: 'Compléter le profil',
          description: 'Nom de la boutique et informations',
          completed: hasProfile,
          action: () => onActionClick?.('profile')
        },
        {
          id: 'product',
          label: 'Ajouter un produit',
          description: 'Au moins 1 produit dans le catalogue',
          completed: hasProducts,
          action: () => onActionClick?.('add-product')
        },
        {
          id: 'approved',
          label: 'Produit approuvé',
          description: 'Au moins 1 produit validé par modération',
          completed: hasApprovedProducts
        },
        {
          id: 'order',
          label: 'Première vente',
          description: 'Recevoir et traiter votre première commande',
          completed: hasOrders
        },
        {
          id: 'subscription',
          label: 'Choisir un abonnement',
          description: 'Sélectionner un plan pour plus de fonctionnalités',
          completed: hasSubscription,
          action: () => onActionClick?.('subscription')
        }
      ];

      setSteps(setupSteps);

      const completedCount = setupSteps.filter(s => s.completed).length;
      const progressPercent = (completedCount / setupSteps.length) * 100;
      setProgress(progressPercent);

    } catch (error) {
      console.error('Error checking setup progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted/60 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full bg-muted/60 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-full bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = steps.filter(s => s.completed).length;
  const isComplete = completedSteps === steps.length;

  return (
    <Card className={isComplete ? "bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Configuration de la boutique
            {isComplete && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complète
              </Badge>
            )}
          </CardTitle>
          <span className="text-2xl font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                step.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {index + 1}. {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {!step.completed && step.action && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={step.action}
                      className="flex-shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isComplete && (
          <div className="mt-4 p-4 bg-green-500/10 rounded-lg text-center">
            <p className="text-sm font-medium text-green-600">
              🎉 Félicitations ! Votre boutique est entièrement configurée !
            </p>
          </div>
        )}

        {!isComplete && (
          <p className="text-xs text-muted-foreground text-center">
            Complétez toutes les étapes pour débloquer le potentiel complet de votre boutique
          </p>
        )}
      </CardContent>
    </Card>
  );
};
