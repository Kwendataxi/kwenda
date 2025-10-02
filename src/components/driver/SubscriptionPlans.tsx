import React, { useEffect, useState } from 'react';
import { Check, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  rides_included: number;
  price_per_extra_ride: number;
  is_trial: boolean;
  trial_duration_days: number;
  service_type: string;
  is_active: boolean;
}

interface ActiveSubscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  rides_used: number;
  rides_remaining: number;
  is_trial: boolean;
}

export const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'orange_money' | 'm_pesa' | 'airtel_money'>('orange_money');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les plans disponibles
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Charger l'abonnement actif
      const { data: subscription } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();

      setActiveSubscription(subscription);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.is_trial) {
      toast({
        title: "Essai gratuit",
        description: "L'essai gratuit doit être accordé par un administrateur.",
        variant: "default",
      });
      return;
    }

    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('mobile-money-subscription', {
        body: {
          planId: selectedPlan.id,
          phoneNumber,
          paymentProvider,
          amount: selectedPlan.price,
          currency: selectedPlan.currency
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur de paiement');
      }

      toast({
        title: "✅ Paiement réussi",
        description: `Votre abonnement ${selectedPlan.name} est maintenant actif !`,
      });

      setPaymentDialogOpen(false);
      loadData(); // Recharger les données

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Erreur de paiement",
        description: error.message || 'Le paiement a échoué. Veuillez réessayer.',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des abonnements...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Abonnement actif */}
      {activeSubscription && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Abonnement Actif
              {activeSubscription.is_trial && (
                <Badge variant="secondary">
                  <Gift className="h-3 w-3 mr-1" />
                  Essai Gratuit
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Courses restantes</p>
                <p className="text-2xl font-bold">{activeSubscription.rides_remaining}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Courses utilisées</p>
                <p className="text-2xl font-bold">{activeSubscription.rides_used}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date de fin</p>
                <p className="font-medium">
                  {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Statut</p>
                <Badge variant="default">{activeSubscription.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Plans d'Abonnement</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.is_trial ? 'border-green-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.is_trial && (
                    <Badge variant="default" className="bg-green-600">
                      <Gift className="h-3 w-3 mr-1" />
                      Gratuit
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} ${plan.currency}`}
                  </div>
                  {plan.price > 0 && plan.price_per_extra_ride > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Course supplémentaire: {plan.price_per_extra_ride} {plan.currency}
                    </p>
                  )}
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {plan.rides_included} courses incluses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Valable {plan.trial_duration_days || 30} jours
                  </li>
                  {plan.is_trial && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Période d'essai gratuite
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!activeSubscription || plan.is_trial}
                  variant={plan.is_trial ? 'outline' : 'default'}
                >
                  {plan.is_trial ? 'Contactez un admin' : 'Souscrire'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de paiement Mobile Money */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement Mobile Money</DialogTitle>
            <DialogDescription>
              Plan sélectionné: {selectedPlan?.name} - {selectedPlan?.price} {selectedPlan?.currency}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider de paiement</Label>
              <Select value={paymentProvider} onValueChange={(v: any) => setPaymentProvider(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="m_pesa">M-Pesa</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={processing}>
              Annuler
            </Button>
            <Button onClick={processPayment} disabled={processing}>
              {processing ? 'Traitement...' : `Payer ${selectedPlan?.price} ${selectedPlan?.currency}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};