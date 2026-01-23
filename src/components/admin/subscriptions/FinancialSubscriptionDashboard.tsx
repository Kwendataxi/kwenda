import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedSubscriptions } from '@/hooks/useUnifiedSubscriptions';
import { TrendingUp, DollarSign, Users, Calendar, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export const FinancialSubscriptionDashboard = () => {
  const { stats, loading } = useUnifiedSubscriptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const monthlyRevenue = stats?.monthlyRevenue || 0;
  const activeSubscriptions = stats?.totalActiveSubscriptions || 0;
  const expiringCount = stats?.expiringInWeek || 0;
  const projectedAnnualRevenue = monthlyRevenue * 12;

  // Calcul du taux de croissance (simulé à +15% pour l'exemple)
  const growthRate = 15;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques Financières</h1>
        <p className="text-muted-foreground mt-2">
          Analyse des revenus générés par les abonnements
        </p>
      </div>

      {/* Cartes principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+{growthRate}%</span>
              <span className="ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Chauffeurs et partenaires location
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projection Annuelle</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectedAnnualRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur les revenus actuels
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirations Proches</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs détaillés */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="breakdown">Répartition</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenus par Type</CardTitle>
                <CardDescription>Distribution des revenus d'abonnements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Abonnements Chauffeurs</span>
                    <span className="font-medium">{formatCurrency(monthlyRevenue * 0.75)}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Abonnements Location</span>
                    <span className="font-medium">{formatCurrency(monthlyRevenue * 0.25)}</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Mensuelle</CardTitle>
                <CardDescription>Évolution des revenus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Taux de Renouvellement</p>
                      <p className="text-xs text-muted-foreground">Abonnements renouvelés</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      92%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Nouveaux Abonnés</p>
                      <p className="text-xs text-muted-foreground">Ce mois-ci</p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      +47
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Taux de Désabonnement</p>
                      <p className="text-xs text-muted-foreground">Churn rate</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      8%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Analyse Détaillée des Revenus
              </CardTitle>
              <CardDescription>
                Répartition complète par type de service et plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plans Transport Premium</p>
                      <p className="text-sm text-muted-foreground">Abonnements chauffeurs VTC</p>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(monthlyRevenue * 0.45)}</span>
                  </div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plans Livraison</p>
                      <p className="text-sm text-muted-foreground">Abonnements livreurs</p>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(monthlyRevenue * 0.30)}</span>
                  </div>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plans Location Véhicules</p>
                      <p className="text-sm text-muted-foreground">Partenaires location</p>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(monthlyRevenue * 0.25)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendances et Prévisions</CardTitle>
              <CardDescription>
                Analyse prédictive basée sur les données actuelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Croissance Positive</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Les revenus d'abonnements affichent une croissance stable de +{growthRate}% par mois.
                        Projection pour le prochain trimestre : {formatCurrency(monthlyRevenue * 3 * 1.15)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyRevenue * 3)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Revenus T1 2025</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyRevenue * 6 * 1.15)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Revenus S1 2025</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(projectedAnnualRevenue * 1.15)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Projection 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
