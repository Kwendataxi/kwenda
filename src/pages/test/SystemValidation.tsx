import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, MapPin, Package, ShoppingBag, AlertTriangle } from 'lucide-react';

interface ValidationTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  icon: React.ElementType;
}

const SystemValidation = () => {
  const [tests, setTests] = useState<ValidationTest[]>([
    {
      id: 'drivers',
      name: 'Chauffeurs Disponibles',
      description: 'Vérifier la présence de chauffeurs en ligne',
      status: 'pending',
      icon: MapPin,
    },
    {
      id: 'marketplace',
      name: 'Produits Marketplace',
      description: 'Vérifier les produits approuvés',
      status: 'pending',
      icon: ShoppingBag,
    },
    {
      id: 'subscriptions',
      name: 'Plans d\'Abonnement',
      description: 'Vérifier les plans VTC et Livraison',
      status: 'pending',
      icon: Package,
    },
    {
      id: 'wallet',
      name: 'Système Wallet',
      description: 'Tester la création de wallet',
      status: 'pending',
      icon: CheckCircle2,
    },
  ]);

  const updateTestStatus = (id: string, status: ValidationTest['status'], result?: string) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, status, result } : test
    ));
  };

  const testDrivers = async () => {
    updateTestStatus('drivers', 'running');
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('driver_id, latitude, longitude, vehicle_class, is_online, is_available')
        .eq('is_online', true)
        .eq('is_available', true);

      if (error) throw error;

      const count = data?.length || 0;
      if (count > 0) {
        updateTestStatus('drivers', 'success', `✅ ${count} chauffeur(s) trouvé(s) - Positions: ${data?.map(d => `${d.vehicle_class} à (${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)})`).join(', ')}`);
        toast.success(`${count} chauffeurs disponibles`);
      } else {
        updateTestStatus('drivers', 'error', '❌ Aucun chauffeur disponible');
        toast.error('Aucun chauffeur trouvé');
      }
    } catch (err: any) {
      updateTestStatus('drivers', 'error', `❌ Erreur: ${err.message}`);
      toast.error('Erreur lors du test chauffeurs');
    }
  };

  const testMarketplace = async () => {
    updateTestStatus('marketplace', 'running');
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('id, title, price, moderation_status, status, category')
        .eq('status', 'active')
        .eq('moderation_status', 'approved');

      if (error) throw error;

      const count = data?.length || 0;
      if (count > 0) {
        const categories = [...new Set(data?.map(p => p.category))];
        updateTestStatus('marketplace', 'success', `✅ ${count} produit(s) approuvé(s) - Catégories: ${categories.join(', ')}`);
        toast.success(`${count} produits disponibles`);
      } else {
        updateTestStatus('marketplace', 'error', '❌ Aucun produit approuvé');
        toast.error('Aucun produit trouvé');
      }
    } catch (err: any) {
      updateTestStatus('marketplace', 'error', `❌ Erreur: ${err.message}`);
      toast.error('Erreur lors du test marketplace');
    }
  };

  const testSubscriptions = async () => {
    updateTestStatus('subscriptions', 'running');
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, service_type, price, rides_included')
        .eq('is_active', true);

      if (error) throw error;

      const transportPlans = data?.filter(p => p.service_type === 'transport').length || 0;
      const deliveryPlans = data?.filter(p => p.service_type === 'delivery').length || 0;
      const allPlans = data?.filter(p => p.service_type === 'all').length || 0;

      if ((transportPlans + allPlans) > 0 && (deliveryPlans + allPlans) > 0) {
        updateTestStatus('subscriptions', 'success', `✅ Plans: ${transportPlans} VTC + ${deliveryPlans} Livraison + ${allPlans} Mixtes`);
        toast.success('Plans d\'abonnement configurés');
      } else {
        updateTestStatus('subscriptions', 'error', `⚠️ Plans incomplets: VTC=${transportPlans}, Livraison=${deliveryPlans}`);
        toast.warning('Plans d\'abonnement incomplets');
      }
    } catch (err: any) {
      updateTestStatus('subscriptions', 'error', `❌ Erreur: ${err.message}`);
      toast.error('Erreur lors du test subscriptions');
    }
  };

  const testWallet = async () => {
    updateTestStatus('wallet', 'running');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        updateTestStatus('wallet', 'error', '❌ Non authentifié');
        toast.error('Veuillez vous connecter pour tester le wallet');
        return;
      }

      const { data, error } = await supabase
        .from('user_wallets')
        .select('id, balance, currency, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        updateTestStatus('wallet', 'success', `✅ Wallet trouvé - Solde: ${data.balance} ${data.currency}`);
        toast.success('Wallet fonctionnel');
      } else {
        // Créer le wallet
        const { error: createError } = await supabase
          .from('user_wallets')
          .insert({ user_id: user.id, balance: 0, currency: 'CDF', is_active: true });

        if (createError) throw createError;

        updateTestStatus('wallet', 'success', '✅ Wallet créé avec succès');
        toast.success('Wallet créé');
      }
    } catch (err: any) {
      updateTestStatus('wallet', 'error', `❌ Erreur: ${err.message}`);
      toast.error('Erreur lors du test wallet');
    }
  };

  const runAllTests = async () => {
    await testDrivers();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testMarketplace();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testSubscriptions();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testWallet();
  };

  const getStatusBadge = (status: ValidationTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Succès</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échec</Badge>;
      case 'running':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Test...</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  const testFunctions = {
    drivers: testDrivers,
    marketplace: testMarketplace,
    subscriptions: testSubscriptions,
    wallet: testWallet,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">✅ Validation Système Complète</CardTitle>
          <CardDescription>
            Tests automatisés de tous les services Kwenda après migrations Phase 1-5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} size="lg" className="w-full">
            🚀 Lancer Tous les Tests
          </Button>

          <div className="grid gap-4">
            {tests.map((test) => {
              const Icon = test.icon;
              return (
                <Card key={test.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-5 w-5 mt-1 text-primary" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{test.name}</h3>
                            {getStatusBadge(test.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{test.description}</p>
                          {test.result && (
                            <div className={`text-sm mt-2 p-2 rounded ${
                              test.status === 'success' ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100' :
                              test.status === 'error' ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100' :
                              'bg-muted'
                            }`}>
                              {test.result}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => testFunctions[test.id as keyof typeof testFunctions]()}
                        size="sm"
                        variant="outline"
                        disabled={test.status === 'running'}
                      >
                        {test.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tester'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="pt-6">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Tests Manuels Requis
              </h4>
              <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                <li><strong>Transport</strong> : Aller sur /transport → Sélectionner pickup/destination → Vérifier prix calculé</li>
                <li><strong>Livraison</strong> : Aller sur /delivery → Créer une commande → Vérifier matching livreur</li>
                <li><strong>Marketplace</strong> : Aller sur /marketplace → Cliquer sur un produit → Tester ajout panier</li>
                <li><strong>Console</strong> : Ouvrir DevTools → Vérifier absence d'erreurs RLS et "user_id"</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemValidation;
