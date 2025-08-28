import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdminPartnerManager from './AdminPartnerManager';
import { AdminRentalModeration } from './AdminRentalModeration';
import { Building2, Car, Users, Activity, CheckCircle, Clock, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme Kwenda
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Partenaires actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground">Véhicules en location</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Tabs */}
      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="mt-6">
          <AdminPartnerManager />
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <AdminRentalModeration />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Rapports</CardTitle>
              <CardDescription>
                Statistiques détaillées de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Activité récente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Nouveau partenaire approuvé</p>
                          <p className="text-xs text-muted-foreground">Transport Elite SARL</p>
                        </div>
                      </div>
                      <Badge variant="default">Aujourd'hui</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">Véhicule en attente</p>
                          <p className="text-xs text-muted-foreground">Toyota Corolla 2022</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Il y a 2h</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">Signalement résolu</p>
                          <p className="text-xs text-muted-foreground">Problème technique</p>
                        </div>
                      </div>
                      <Badge variant="outline">Hier</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Métriques clés</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Revenus ce mois</span>
                      <span className="text-lg font-bold text-green-600">2,450,000 CDF</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Nouvelles réservations</span>
                      <span className="text-lg font-bold text-blue-600">+23%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Taux d'occupation</span>
                      <span className="text-lg font-bold text-purple-600">76%</span>
                    </div>
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

export default AdminDashboard;