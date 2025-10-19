import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, ShoppingBag, Star } from 'lucide-react';
import { useRestaurantAnalytics } from '@/hooks/useRestaurantAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface RestaurantAnalyticsProps {
  restaurantId: string;
}

export function RestaurantAnalytics({ restaurantId }: RestaurantAnalyticsProps) {
  const { analytics, loading } = useRestaurantAnalytics(restaurantId);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Commandes totales',
      value: analytics.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      trend: '+12%',
      color: 'text-blue-600',
    },
    {
      title: 'Revenus du mois',
      value: `${analytics.monthlyRevenue.toLocaleString()} FC`,
      icon: DollarSign,
      trend: '+8%',
      color: 'text-green-600',
    },
    {
      title: 'Satisfaction client',
      value: `${analytics.satisfactionRate}%`,
      icon: Star,
      trend: '+2%',
      color: 'text-yellow-600',
    },
    {
      title: 'Croissance',
      value: '+15%',
      icon: TrendingUp,
      trend: '+3%',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Insights détaillés de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  {kpi.title}
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-green-600 mt-1">{kpi.trend} vs mois dernier</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs pour détails */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="dishes">Top plats</TabsTrigger>
          <TabsTrigger value="hours">Heures de pointe</TabsTrigger>
          <TabsTrigger value="reviews">Avis clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé mensuel</CardTitle>
              <CardDescription>Performance du mois en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Commandes traitées</span>
                  <span className="font-bold">{analytics.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenus générés</span>
                  <span className="font-bold">{analytics.monthlyRevenue.toLocaleString()} FC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de satisfaction</span>
                  <span className="font-bold">{analytics.satisfactionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dishes">
          <Card>
            <CardHeader>
              <CardTitle>Plats les plus commandés</CardTitle>
              <CardDescription>Top 5 des meilleures ventes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Données en cours de chargement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Heures de pointe</CardTitle>
              <CardDescription>Distribution des commandes par heure</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Données en cours de chargement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Avis clients</CardTitle>
              <CardDescription>Derniers commentaires</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Aucun avis pour le moment
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
