import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionOverview } from "./SubscriptionOverview";
import { DriverSubscriptionAdmin } from "./DriverSubscriptionAdmin";
import { RentalSubscriptionAdmin } from "./RentalSubscriptionAdmin";
import { SubscriptionAnalytics } from "./SubscriptionAnalytics";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { Loader2, Users, Car, AlertTriangle, TrendingUp } from "lucide-react";

export const UnifiedSubscriptionManager = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, loading } = useUnifiedSubscriptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des abonnements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Abonnements</h1>
          <p className="text-muted-foreground">
            Interface unifiée pour gérer tous les types d'abonnements
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenus mensuels</p>
                  <p className="text-lg font-semibold">
                    {stats.monthlyRevenue.toLocaleString()} {stats.currency}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Abonnements actifs</p>
                  <p className="text-lg font-semibold">{stats.totalActiveSubscriptions}</p>
                </div>
              </div>
            </Card>
            
            {stats.expiringInWeek > 0 && (
              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-orange-700">Expirent cette semaine</p>
                    <p className="text-lg font-semibold text-orange-700">{stats.expiringInWeek}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Chauffeurs
            {stats && stats.driverSubscriptions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.driverSubscriptions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rentals" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Location
            {stats && stats.rentalSubscriptions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.rentalSubscriptions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            📊 Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            Plans & Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionOverview />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <DriverSubscriptionAdmin />
        </TabsContent>

        <TabsContent value="rentals" className="space-y-6">
          <RentalSubscriptionAdmin />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SubscriptionAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Plans</CardTitle>
              <CardDescription>
                Gestion des plans d'abonnement et paramètres avancés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuration des plans d'abonnement (à implémenter)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};