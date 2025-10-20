import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserBehaviorAnalytics } from '@/components/analytics/UserBehaviorAnalytics';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function AdminAnalyticsDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analysez le comportement utilisateur et optimisez l'expérience Kwenda
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12.5% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128M CDF</div>
            <p className="text-xs text-muted-foreground">+8.2% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de rétention</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.3%</div>
            <p className="text-xs text-muted-foreground">+3.1% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,562</div>
            <p className="text-xs text-muted-foreground">+18.7% vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="behavior" className="space-y-4">
        <TabsList>
          <TabsTrigger value="behavior">Comportement Utilisateur</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="retention">Rétention</TabsTrigger>
          <TabsTrigger value="geography">Géographie</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-4">
          <UserBehaviorAnalytics />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funnel de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>1. Visite homepage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-64 h-8 bg-primary rounded-lg" />
                    <span className="font-semibold">100%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>2. Sélection service</span>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-8 bg-blue-500 rounded-lg" />
                    <span className="font-semibold">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>3. Formulaire rempli</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 h-8 bg-indigo-500 rounded-lg" />
                    <span className="font-semibold">62%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>4. Paiement initié</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-8 bg-purple-500 rounded-lg" />
                    <span className="font-semibold">50%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>5. Commande confirmée</span>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-8 bg-green-500 rounded-lg" />
                    <span className="font-semibold">44%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse de Rétention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-12">
                Données de rétention par cohorte en cours de développement
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Kinshasa</span>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-6 bg-primary rounded" />
                    <span className="font-semibold">62%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lubumbashi</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-6 bg-blue-500 rounded" />
                    <span className="font-semibold">28%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kolwezi</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-6 bg-indigo-500 rounded" />
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
