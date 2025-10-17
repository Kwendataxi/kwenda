import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Crown, Zap, Star, Wallet } from 'lucide-react';
import { useRestaurantSubscription } from '@/hooks/useRestaurantSubscription';

export default function RestaurantSubscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const {
    plans,
    activeSubscription,
    fetchPlans,
    fetchActiveSubscription,
    checkWalletBalance,
    subscribe,
    cancelAutoRenew,
    checkExpirationWarning,
  } = useRestaurantSubscription();

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Récupérer profil restaurant
      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
        await Promise.all([
          fetchPlans(),
          fetchActiveSubscription(profile.id),
        ]);
      }

      // Vérifier solde wallet
      const wallet = await checkWalletBalance();
      if (wallet) {
        setWalletBalance(wallet.balance);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planPrice: number) => {
    if (!restaurantId) return;

    if (walletBalance < planPrice) {
      toast({
        title: 'Solde insuffisant',
        description: `Rechargez votre KwendaPay (${planPrice.toLocaleString()} FC requis)`,
        variant: 'destructive',
      });
      return;
    }

    setSubscribing(true);

    const result = await subscribe(planId, restaurantId, 'kwenda_pay', true);

    if (result.success) {
      loadRestaurantData();
    }

    setSubscribing(false);
  };

  const handleCancelAutoRenew = async () => {
    if (!activeSubscription) return;

    const success = await cancelAutoRenew(activeSubscription.id);
    if (success) {
      loadRestaurantData();
    }
  };

  const getPlanIcon = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 0: return Zap;
      case 1: return Star;
      case 2: return Crown;
      default: return Zap;
    }
  };

  const subscriptionWarning = activeSubscription 
    ? checkExpirationWarning(activeSubscription)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Abonnement Restaurant</h1>
          <p className="text-muted-foreground">Gérez votre abonnement Kwenda Food</p>
        </div>

        {/* Solde KwendaPay */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Solde KwendaPay</p>
                  <p className="text-2xl font-bold">{walletBalance.toLocaleString()} FC</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/client')}>
                Recharger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abonnement actif */}
        {activeSubscription && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Abonnement actif
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Plan {activeSubscription.plan.name}
                  </CardDescription>
                </div>
                <Badge variant="default">Actif</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date de fin</p>
                  <p className="font-medium">
                    {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Renouvellement auto</p>
                  <p className="font-medium">
                    {activeSubscription.auto_renew ? 'Activé' : 'Désactivé'}
                  </p>
                </div>
              </div>

              {subscriptionWarning?.isExpiring && (
                <div className="bg-warning/10 border border-warning rounded-lg p-3">
                  <p className="text-sm font-medium text-warning">
                    ⚠️ Expire dans {subscriptionWarning.daysRemaining} jours
                  </p>
                </div>
              )}

              {activeSubscription.auto_renew && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCancelAutoRenew}
                >
                  Désactiver le renouvellement automatique
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plans disponibles */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Plans disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.priority_level);
              const features = Array.isArray(plan.features) ? plan.features : [];
              const isCurrentPlan = activeSubscription?.plan_id === plan.id;

              return (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.is_popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Populaire</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-4xl font-bold">{plan.monthly_price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">FC / mois</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Inclus:</p>
                      {plan.max_products && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{plan.max_products} plats max</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{plan.commission_rate}% de commission</span>
                      </div>
                      {plan.can_feature_products && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Plats mis en avant</span>
                        </div>
                      )}
                      {plan.can_run_promotions && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Promotions</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button className="w-full" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id, plan.monthly_price)}
                        disabled={subscribing}
                      >
                        {subscribing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        S'abonner
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
