import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Zap, Star, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  max_products: number | null;
  commission_rate: number;
  features: string[];
  priority_support: boolean;
  analytics_enabled: boolean;
  verified_badge: boolean;
  is_active: boolean;
}

interface ActiveSubscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  payment_method: string;
}

export const VendorSubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les plans disponibles avec requête brute
      const { data: plansData, error: plansError } = await supabase
        .from('vendor_subscription_plans' as any)
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData as any || []);

      // Charger l'abonnement actif avec requête brute
      const { data: subData, error: subError } = await supabase
        .from('vendor_active_subscriptions' as any)
        .select(`
          id,
          plan_id,
          status,
          start_date,
          end_date,
          payment_method,
          vendor_subscription_plans (*)
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      if (subData) {
        setActiveSubscription(subData as any);
        setCurrentPlan((subData as any).vendor_subscription_plans);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'abonnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;

    // Si plan gratuit, créer directement l'abonnement
    if (selectedPlan.monthly_price === 0) {
      try {
        const { error } = await supabase
          .from('vendor_active_subscriptions' as any)
          .upsert({
            vendor_id: user.id,
            plan_id: planId,
            status: 'active',
            payment_method: 'free',
            start_date: new Date().toISOString()
          }, {
            onConflict: 'vendor_id'
          });

        if (error) throw error;

        toast({
          title: "✅ Abonnement activé",
          description: `Vous êtes maintenant sur le plan ${selectedPlan.name}`,
        });

        loadData();
      } catch (error) {
        console.error('Error upgrading plan:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'activer l'abonnement",
          variant: "destructive"
        });
      }
    } else {
      // Pour les plans payants, afficher une modale de paiement
      toast({
        title: "Paiement requis",
        description: `Pour passer au plan ${selectedPlan.name}, veuillez contacter l'administration pour activer le paiement Mobile Money.`,
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return <Crown className="h-6 w-6" />;
      case 'standard':
        return <Zap className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chargement des abonnements...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      {currentPlan && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {getPlanIcon(currentPlan.name)}
                </div>
                <div>
                  <CardTitle className="text-xl">Votre abonnement actuel</CardTitle>
                  <CardDescription>Plan {currentPlan.name}</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {currentPlan.commission_rate}% de commission
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="font-semibold">
                    {currentPlan.max_products ? `${currentPlan.max_products} max` : 'Illimités'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Support</p>
                  <p className="font-semibold">
                    {currentPlan.priority_support ? 'Prioritaire' : 'Standard'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Analytics</p>
                  <p className="font-semibold">
                    {currentPlan.analytics_enabled ? 'Avancées' : 'Basiques'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Plans disponibles</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const canUpgrade = !isCurrentPlan && (!currentPlan || plan.monthly_price > currentPlan.monthly_price);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={isCurrentPlan ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-full bg-muted">
                        {getPlanIcon(plan.name)}
                      </div>
                      {plan.monthly_price > 0 && (
                        <Badge variant="outline">{plan.monthly_price.toLocaleString()} FC/mois</Badge>
                      )}
                      {plan.monthly_price === 0 && (
                        <Badge variant="secondary">Gratuit</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Commission</span>
                        <span className="font-bold text-lg text-primary">{plan.commission_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Produits</span>
                        <span className="font-semibold">
                          {plan.max_products ? plan.max_products : 'Illimités'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan || !canUpgrade}
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                    >
                      {isCurrentPlan ? 'Plan actuel' : canUpgrade ? 'Passer à ce plan' : 'Plan inférieur'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Bon à savoir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• La commission est automatiquement déduite à chaque vente livrée</p>
          <p>• Vous recevez 85-95% du prix de vente selon votre plan</p>
          <p>• Les paiements sont crédités instantanément dans votre wallet Kwenda</p>
          <p>• Changement de plan disponible à tout moment</p>
        </CardContent>
      </Card>
    </div>
  );
};
