import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionDeprecationBanner } from "../subscriptions/CommissionDeprecationBanner";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

export const AdminFinancialDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord Financier</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des finances et revenus de la plateforme
        </p>
      </div>

      {/* Banner de dépréciation des commissions */}
      <CommissionDeprecationBanner />

      {/* KPIs Financiers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450,000 CDF</div>
            <p className="text-xs text-muted-foreground">
              +15% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Abonnements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,850,000 CDF</div>
            <p className="text-xs text-muted-foreground">
              76% des revenus totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Commissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">600,000 CDF</div>
            <p className="text-xs text-muted-foreground">
              ⚠️ En décroissance (-40%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projections Annuelles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29,400,000 CDF</div>
            <p className="text-xs text-muted-foreground">
              Basé sur MRR actuel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="commissions">Commissions (Déprécié)</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Graphiques de Revenus</CardTitle>
              <CardDescription>
                Évolution des revenus par source sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Graphiques en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Abonnements</CardTitle>
              <CardDescription>
                Détail des revenus générés par les abonnements chauffeurs et location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Statistiques détaillées en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Commissions (Système déprécié)</CardTitle>
              <CardDescription>
                Historique et transition vers le système d'abonnements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ce système sera complètement désactivé le 31 décembre 2025.
                Tous les chauffeurs doivent migrer vers le système d'abonnements.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>
                Liste complète des transactions de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Historique des transactions en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
