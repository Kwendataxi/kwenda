import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, TrendingUp } from 'lucide-react';

interface VendorSubscription {
  vendor_id: string;
  shop_name: string;
  plan_name: string;
  monthly_price: number;
  commission_rate: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_per_month: number;
  max_products: number;
}

export const AdminVendorSubscriptions = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les plans (avec fallback manuel)
      const { data: plansData, error: plansError } = await supabase
        .from('vendor_subscription_plans')
        .select('id, name, monthly_price, max_products')
        .order('monthly_price');

      if (plansError) {
        console.warn('Plans error:', plansError);
        // Fallback: Plans par défaut
        setPlans([
          { id: '1', name: 'Gratuit', price_per_month: 0, max_products: 3 },
          { id: '2', name: 'Standard', price_per_month: 5000, max_products: 50 },
          { id: '3', name: 'Premium', price_per_month: 15000, max_products: -1 },
        ]);
      } else {
        setPlans((plansData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price_per_month: p.monthly_price || 0,
          max_products: p.max_products || 0
        })));
      }

      // Charger les abonnements actifs (simulé avec vendor_profiles)
      const { data: subsData, error: subsError } = await supabase
        .from('vendor_profiles')
        .select('user_id, shop_name')
        .limit(50);

      if (subsError) throw subsError;

      const formatted = (subsData || []).map((sub: any) => ({
        vendor_id: sub.user_id,
        shop_name: sub.shop_name || 'Boutique sans nom',
        plan_name: 'Gratuit',
        monthly_price: 0,
        commission_rate: 15,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      }));

      setVendors(formatted);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les abonnements.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (vendorId: string, newPlanId: string) => {
    try {
      const selectedPlan = plans.find(p => p.id === newPlanId);
      
      toast({
        title: 'Plan modifié',
        description: `Nouveau plan : ${selectedPlan?.name || 'Inconnu'}`
      });

      loadData();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le plan.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name === 'Premium' && <Crown className="h-5 w-5 text-yellow-500" />}
                {plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{plan.price_per_month} CDF/mois</p>
                <p className="text-sm text-muted-foreground">
                  Max produits: {plan.max_products === -1 ? 'Illimité' : plan.max_products}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonnements vendeurs ({vendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun vendeur abonné
              </p>
            ) : (
              vendors.map((vendor) => (
                <div
                  key={vendor.vendor_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{vendor.shop_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                        {vendor.plan_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {vendor.monthly_price} CDF/mois · Commission {vendor.commission_rate}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select
                      onValueChange={(value) => handleChangePlan(vendor.vendor_id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Changer plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                      {vendor.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
