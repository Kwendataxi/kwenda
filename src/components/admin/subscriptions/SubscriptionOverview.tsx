import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { 
  Users, 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  CreditCard,
  Activity,
  RefreshCw
} from "lucide-react";

export const SubscriptionOverview = () => {
  const { stats, driverSubscriptions, rentalSubscriptions } = useUnifiedSubscriptions();

  if (!stats) {
    return <div>Chargement des statistiques...</div>;
  }

  // Calculate additional metrics
  const totalSubscriptions = driverSubscriptions.length + rentalSubscriptions.length;
  const activeRate = totalSubscriptions > 0 
    ? (stats.totalActiveSubscriptions / totalSubscriptions) * 100 
    : 0;

  const recentDriverSubs = driverSubscriptions
    .filter(sub => {
      const createdDate = new Date(sub.start_date);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdDate >= lastWeek;
    }).length;

  const recentRentalSubs = rentalSubscriptions
    .filter(sub => {
      const createdDate = new Date(sub.start_date);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdDate >= lastWeek;
    }).length;

  const autoRenewDriver = driverSubscriptions.filter(sub => 
    sub.status === 'active' && sub.auto_renew
  ).length;
  
  const autoRenewRental = rentalSubscriptions.filter(sub => 
    sub.status === 'active' && sub.auto_renew
  ).length;

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              sur {totalSubscriptions} total
            </p>
            <Progress value={activeRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyRevenue.toLocaleString()} {stats.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              +{recentDriverSubs + recentRentalSubs} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.driverSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +{recentDriverSubs} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rentalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              +{recentRentalSubs} cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats.expiringInWeek > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alertes d'Expiration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 font-medium">
                  {stats.expiringInWeek} abonnements expirent dans les 7 prochains jours
                </p>
                <p className="text-sm text-orange-600">
                  Contactez les utilisateurs pour le renouvellement
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Voir la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Type</CardTitle>
            <CardDescription>
              Distribution des abonnements actifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Abonnements Chauffeurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.driverSubscriptions}</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.totalActiveSubscriptions > 0 
                    ? Math.round((stats.driverSubscriptions / stats.totalActiveSubscriptions) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-500" />
                <span>Abonnements Location</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.rentalSubscriptions}</Badge>
                <span className="text-sm text-muted-foreground">
                  {stats.totalActiveSubscriptions > 0 
                    ? Math.round((stats.rentalSubscriptions / stats.totalActiveSubscriptions) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renouvellement Automatique</CardTitle>
            <CardDescription>
              Abonnements avec renouvellement auto activé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <span>Chauffeurs (Auto-renew)</span>
              </div>
              <Badge variant="secondary">{autoRenewDriver}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <span>Location (Auto-renew)</span>
              </div>
              <Badge variant="secondary">{autoRenewRental}</Badge>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Taux de renouvellement</span>
                <span className="font-bold">
                  {stats.totalActiveSubscriptions > 0 
                    ? Math.round(((autoRenewDriver + autoRenewRental) / stats.totalActiveSubscriptions) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>
            Nouveaux abonnements et modifications de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDriverSubs > 0 && (
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700">
                  <Users className="h-3 w-3 mr-1" />
                  Chauffeurs
                </Badge>
                <span>{recentDriverSubs} nouveaux abonnements cette semaine</span>
              </div>
            )}
            
            {recentRentalSubs > 0 && (
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700">
                  <Car className="h-3 w-3 mr-1" />
                  Location
                </Badge>
                <span>{recentRentalSubs} nouveaux abonnements cette semaine</span>
              </div>
            )}

            {recentDriverSubs === 0 && recentRentalSubs === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Aucune nouvelle activité cette semaine
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};