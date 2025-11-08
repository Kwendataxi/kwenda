import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Database, Store, UtensilsCrossed, Truck, Car, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  duration?: number;
}

interface TestSuite {
  name: string;
  icon: any;
  results: TestResult[];
}

export default function SystemTestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);

  const addResult = (suiteName: string, result: TestResult) => {
    setTestSuites(prev => {
      const existing = prev.find(s => s.name === suiteName);
      if (existing) {
        return prev.map(s => 
          s.name === suiteName 
            ? { ...s, results: [...s.results, result] }
            : s
        );
      }
      return [...prev, { name: suiteName, icon: Database, results: [result] }];
    });
  };

  const testDatabaseHealth = async () => {
    const startTime = Date.now();
    addResult('Base de données', { name: 'Test Santé DB', status: 'pending', message: 'Vérification en cours...' });

    try {
      // Test connexion Supabase
      const { data: healthCheck, error: healthError } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1);

      if (healthError) throw healthError;

      addResult('Base de données', {
        name: 'Connexion Supabase',
        status: 'success',
        message: '✅ Connexion active',
        duration: Date.now() - startTime
      });

      // Test tables principales
      const tables = ['restaurant_profiles', 'food_products', 'transport_bookings'] as const;

      for (const table of tables) {
        const tableStart = Date.now();
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          addResult('Base de données', {
            name: `Table ${table}`,
            status: 'error',
            message: error.message,
            duration: Date.now() - tableStart
          });
        } else {
          addResult('Base de données', {
            name: `Table ${table}`,
            status: 'success',
            message: `${count || 0} enregistrement(s)`,
            duration: Date.now() - tableStart
          });
        }
      }

      toast.success('Test DB terminé');
    } catch (error: any) {
      addResult('Base de données', {
        name: 'Erreur Test DB',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test DB');
    }
  };

  const testFoodSystem = async () => {
    const startTime = Date.now();
    addResult('Food System', { name: 'Test Système Food', status: 'pending', message: 'Vérification en cours...' });

    try {
      // Restaurants actifs
      const { data: restaurants, error: restError } = await supabase
        .from('restaurant_profiles')
        .select('id, restaurant_name, city, is_active')
        .eq('is_active', true);

      if (restError) throw restError;

      addResult('Food System', {
        name: 'Restaurants Actifs',
        status: restaurants && restaurants.length > 0 ? 'success' : 'warning',
        message: `${restaurants?.length || 0} restaurant(s) actif(s)`,
        data: restaurants,
        duration: Date.now() - startTime
      });

      // Produits approuvés
      const { data: products, error: prodError } = await supabase
        .from('food_products')
        .select('id, name, restaurant_id, moderation_status')
        .eq('moderation_status', 'approved')
        .eq('is_available', true);

      if (prodError) throw prodError;

      addResult('Food System', {
        name: 'Produits Disponibles',
        status: products && products.length > 0 ? 'success' : 'warning',
        message: `${products?.length || 0} produit(s) disponible(s)`,
        data: products,
        duration: Date.now() - startTime
      });

      // Commandes récentes
      const { data: orders, error: ordersError } = await supabase
        .from('food_orders')
        .select('id, order_number, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      addResult('Food System', {
        name: 'Commandes Récentes',
        status: 'success',
        message: `${orders?.length || 0} commande(s) récente(s)`,
        data: orders,
        duration: Date.now() - startTime
      });

      toast.success('Test Food terminé');
    } catch (error: any) {
      addResult('Food System', {
        name: 'Erreur Test Food',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test Food');
    }
  };

  const testMarketplaceSystem = async () => {
    const startTime = Date.now();
    addResult('Marketplace', { name: 'Test Marketplace', status: 'pending', message: 'Vérification en cours...' });

    try {
      // Vendeurs actifs
      const vendorQuery = supabase.from('vendor_profiles').select('user_id, shop_name, average_rating');
      const { data: vendors, error: vendorError } = await vendorQuery;

      if (vendorError) throw vendorError;

      addResult('Marketplace', {
        name: 'Vendeurs',
        status: vendors && vendors.length > 0 ? 'success' : 'warning',
        message: `${vendors?.length || 0} vendeur(s)`,
        duration: Date.now() - startTime
      });

      toast.success('Test Marketplace terminé');
    } catch (error: any) {
      addResult('Marketplace', {
        name: 'Erreur Test Marketplace',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test Marketplace');
    }
  };

  const testTransportSystem = async () => {
    const startTime = Date.now();
    addResult('Transport', { name: 'Test Transport', status: 'pending', message: 'Vérification en cours...' });

    try {
      // Chauffeurs actifs
      const { data: drivers, error: driverError } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom, is_online, ville')
        .eq('is_online', true);

      if (driverError) throw driverError;

      addResult('Transport', {
        name: 'Chauffeurs En Ligne',
        status: 'success',
        message: `${drivers?.length || 0} chauffeur(s) en ligne`,
        data: drivers,
        duration: Date.now() - startTime
      });

      // Courses récentes
      const { data: bookings, error: bookingError } = await supabase
        .from('transport_bookings')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingError) throw bookingError;

      addResult('Transport', {
        name: 'Courses Récentes',
        status: 'success',
        message: `${bookings?.length || 0} course(s) récente(s)`,
        data: bookings,
        duration: Date.now() - startTime
      });

      toast.success('Test Transport terminé');
    } catch (error: any) {
      addResult('Transport', {
        name: 'Erreur Test Transport',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test Transport');
    }
  };

  const testDeliverySystem = async () => {
    const startTime = Date.now();
    addResult('Livraison', { name: 'Test Livraison', status: 'pending', message: 'Vérification en cours...' });

    try {
      // Livraisons récentes
      const { data: deliveries, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('id, delivery_type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (deliveryError) throw deliveryError;

      addResult('Livraison', {
        name: 'Livraisons Récentes',
        status: 'success',
        message: `${deliveries?.length || 0} livraison(s) récente(s)`,
        data: deliveries,
        duration: Date.now() - startTime
      });

      toast.success('Test Livraison terminé');
    } catch (error: any) {
      addResult('Livraison', {
        name: 'Erreur Test Livraison',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test Livraison');
    }
  };

  const testAdminAccess = async () => {
    const startTime = Date.now();
    addResult('Admin', { name: 'Test Admin', status: 'pending', message: 'Vérification en cours...' });

    try {
      if (!user) {
        addResult('Admin', {
          name: 'Authentification',
          status: 'error',
          message: 'Non connecté',
          duration: Date.now() - startTime
        });
        return;
      }

      // Vérifier rôles admin
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, admin_role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (roleError) throw roleError;

      const hasAdmin = roles?.some(r => r.role === 'admin');

      addResult('Admin', {
        name: 'Accès Admin',
        status: hasAdmin ? 'success' : 'error',
        message: hasAdmin 
          ? `✅ Accès admin confirmé (${roles.find(r => r.role === 'admin')?.admin_role})`
          : '❌ Pas de rôle admin',
        data: roles,
        duration: Date.now() - startTime
      });

      toast.success('Test Admin terminé');
    } catch (error: any) {
      addResult('Admin', {
        name: 'Erreur Test Admin',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
      toast.error('Erreur test Admin');
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestSuites([]);
    
    await testDatabaseHealth();
    await testFoodSystem();
    await testMarketplaceSystem();
    await testTransportSystem();
    await testDeliverySystem();
    await testAdminAccess();
    
    setLoading(false);
    toast.success('🎉 Tous les tests terminés !');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    }
  };

  const getSuiteIcon = (suiteName: string) => {
    switch (suiteName) {
      case 'Base de données': return Database;
      case 'Food System': return UtensilsCrossed;
      case 'Marketplace': return Store;
      case 'Transport': return Car;
      case 'Livraison': return Truck;
      case 'Admin': return Shield;
      default: return Database;
    }
  };

  const getSuiteStatus = (suite: TestSuite): TestResult['status'] => {
    const hasError = suite.results.some(r => r.status === 'error');
    const hasWarning = suite.results.some(r => r.status === 'warning');
    const allSuccess = suite.results.every(r => r.status === 'success');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    if (allSuccess) return 'success';
    return 'pending';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            🧪 Test Système Complet Kwenda
          </CardTitle>
          <CardDescription>
            Validation automatique de tous les espaces (Food, Marketplace, Transport, Delivery, Admin)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={runAllTests} disabled={loading} size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              🚀 Lancer tous les tests
            </Button>
            <Button variant="outline" onClick={testDatabaseHealth} disabled={loading}>
              <Database className="h-4 w-4 mr-2" />
              DB Health
            </Button>
            <Button variant="outline" onClick={testFoodSystem} disabled={loading}>
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Food
            </Button>
            <Button variant="outline" onClick={testMarketplaceSystem} disabled={loading}>
              <Store className="h-4 w-4 mr-2" />
              Marketplace
            </Button>
            <Button variant="outline" onClick={testTransportSystem} disabled={loading}>
              <Car className="h-4 w-4 mr-2" />
              Transport
            </Button>
            <Button variant="outline" onClick={testDeliverySystem} disabled={loading}>
              <Truck className="h-4 w-4 mr-2" />
              Livraison
            </Button>
            <Button variant="outline" onClick={testAdminAccess} disabled={loading}>
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Utilisateur connecté: <code className="bg-muted px-2 py-1 rounded">{user?.email || 'Non connecté'}</code></p>
            <p>Total tests: <code className="bg-muted px-2 py-1 rounded">{testSuites.reduce((acc, s) => acc + s.results.length, 0)}</code></p>
          </div>
        </CardContent>
      </Card>

      {testSuites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {testSuites.map((suite, suiteIndex) => {
                const SuiteIcon = getSuiteIcon(suite.name);
                const suiteStatus = getSuiteStatus(suite);
                const suiteValue = `suite-${suiteIndex}`;
                
                return (
                  <AccordionItem key={suiteIndex} value={suiteValue}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <SuiteIcon className="h-5 w-5" />
                        <span className="font-semibold">{suite.name}</span>
                        <Badge variant={suiteStatus === 'success' ? 'default' : 'secondary'} className="ml-auto">
                          {suite.results.length} test(s)
                        </Badge>
                        {getStatusIcon(suiteStatus)}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-4">
                        {suite.results.map((result, resultIndex) => (
                          <div
                            key={resultIndex}
                            className={`flex items-start gap-3 p-4 rounded-lg border ${getStatusColor(result.status)}`}
                          >
                            <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{result.name}</p>
                                {result.duration && (
                                  <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                                )}
                              </div>
                              <p className="text-sm">{result.message}</p>
                              {result.data && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                    Voir les données ({Array.isArray(result.data) ? result.data.length : 1} item(s))
                                  </summary>
                                  <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-60">
                                    {JSON.stringify(result.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                            <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
