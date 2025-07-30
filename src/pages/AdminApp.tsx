import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard,
  Users, 
  Car, 
  DollarSign, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Building2
} from 'lucide-react';

const AdminApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground p-6 border-b shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-lg text-white mb-2">Administration NTA TECH</h1>
            <p className="text-body-lg text-primary-foreground/90">Plateforme de gestion centralisée</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-grey-50">
            <TabsTrigger value="overview" className="rounded-lg">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg">Utilisateurs</TabsTrigger>
            <TabsTrigger value="rides" className="rounded-lg">Courses</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-lg">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-elegant">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Utilisateurs actifs</p>
                      <p className="text-display-sm font-bold text-card-foreground">2,847</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="text-body-sm text-secondary ml-1 font-medium">+12.5%</span>
                    <span className="text-body-sm text-muted-foreground ml-1">ce mois</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-elegant">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Courses aujourd'hui</p>
                      <p className="text-display-sm font-bold text-card-foreground">1,293</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="text-body-sm text-secondary ml-1 font-medium">+8.2%</span>
                    <span className="text-body-sm text-muted-foreground ml-1">vs hier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-elegant">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Revenus du jour</p>
                      <p className="text-heading-lg font-bold text-card-foreground">4.2M CFA</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="text-body-sm text-secondary ml-1 font-medium">+15.3%</span>
                    <span className="text-body-sm text-muted-foreground ml-1">vs hier</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Incidents</p>
                      <p className="text-display-sm font-bold text-card-foreground">12</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-red-500 font-medium bg-red-50 px-2 py-1 rounded-md">3 non résolus</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Activité en temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "new_user", message: "Jean Kouassi s'est inscrit", time: "Il y a 2 min", status: "success" },
                      { type: "ride_completed", message: "Course Cocody → Plateau terminée", time: "Il y a 5 min", status: "success" },
                      { type: "incident", message: "Signalement d'incident", time: "Il y a 8 min", status: "warning" },
                      { type: "payment", message: "Paiement de 2,500 FCFA reçu", time: "Il y a 12 min", status: "success" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.status === 'success' ? 'bg-secondary' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-card-foreground">{activity.message}</p>
                          <p className="text-caption text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Chauffeurs en ligne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-muted-foreground">Total en ligne</span>
                      <span className="text-heading-sm font-bold text-secondary">247 chauffeurs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Kouame Paul", zone: "Cocody", rides: 8, rating: 4.9 },
                        { name: "Traore Sekou", zone: "Plateau", rides: 12, rating: 4.8 },
                        { name: "Diallo Mamadou", zone: "Marcory", rides: 6, rating: 5.0 },
                      ].map((driver, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                          <div>
                            <p className="text-body-sm font-medium text-card-foreground">{driver.name}</p>
                            <p className="text-caption text-muted-foreground">{driver.zone} • {driver.rides} courses</p>
                          </div>
                          <Badge variant="secondary" className="rounded-md">{driver.rating}★</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-lg text-card-foreground">Gestion des utilisateurs</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-10 w-64 rounded-xl" />
                </div>
                <Button variant="outline" className="rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Jean Kouassi", email: "jean@email.com", rides: 23, status: "Actif" },
                      { name: "Marie Diallo", email: "marie@email.com", rides: 18, status: "Actif" },
                      { name: "Paul Yao", email: "paul@email.com", rides: 0, status: "Nouveau" },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-card-foreground">{user.name}</p>
                            <p className="text-caption text-muted-foreground">{user.rides} courses</p>
                          </div>
                        </div>
                        <Badge variant={user.status === "Actif" ? "default" : "secondary"} className="rounded-md">
                          {user.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Chauffeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Kouame Paul", rides: 156, rating: 4.9, status: "En ligne" },
                      { name: "Traore Sekou", rides: 203, rating: 4.8, status: "En course" },
                      { name: "Diallo Mamadou", rides: 89, rating: 5.0, status: "Hors ligne" },
                    ].map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-secondary-light rounded-lg flex items-center justify-center">
                            <Car className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-card-foreground">{driver.name}</p>
                            <p className="text-caption text-muted-foreground">{driver.rides} courses • {driver.rating}★</p>
                          </div>
                        </div>
                        <Badge variant={
                          driver.status === "En ligne" ? "default" : 
                          driver.status === "En course" ? "secondary" : "outline"
                        } className="rounded-md">
                          {driver.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Partenaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "NTA Tech", employees: 24, rides: 156, status: "Actif" },
                      { name: "Orange CI", employees: 45, rides: 298, status: "Actif" },
                      { name: "MTN CI", employees: 12, rides: 67, status: "Inactif" },
                    ].map((partner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-card-foreground">{partner.name}</p>
                            <p className="text-caption text-muted-foreground">{partner.employees} employés • {partner.rides} courses</p>
                          </div>
                        </div>
                        <Badge variant={partner.status === "Actif" ? "default" : "secondary"} className="rounded-md">
                          {partner.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rides" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-lg text-card-foreground">Gestion des courses</h3>
              <Button variant="outline" className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>

            <div className="space-y-4">
              {[
                { 
                  id: "CR-2024-001", 
                  client: "Jean Kouassi", 
                  driver: "Kouame Paul", 
                  from: "Cocody", 
                  to: "Plateau", 
                  amount: "2,500 CFA", 
                  status: "Terminée",
                  time: "14:30"
                },
                { 
                  id: "CR-2024-002", 
                  client: "Marie Diallo", 
                  driver: "Traore Sekou", 
                  from: "Marcory", 
                  to: "Treichville", 
                  amount: "1,800 CFA", 
                  status: "En cours",
                  time: "15:45"
                },
                { 
                  id: "CR-2024-003", 
                  client: "Paul Yao", 
                  driver: "Diallo Mamadou", 
                  from: "Plateau", 
                  to: "Cocody", 
                  amount: "3,200 CFA", 
                  status: "Annulée",
                  time: "16:12"
                },
              ].map((ride, index) => (
                <Card key={index} className="card-floating border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="rounded-md">{ride.id}</Badge>
                        <span className="text-body-sm text-muted-foreground">{ride.time}</span>
                      </div>
                      <Badge variant={
                        ride.status === "Terminée" ? "default" : 
                        ride.status === "En cours" ? "secondary" : "destructive"
                      } className="rounded-md">
                        {ride.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-caption text-muted-foreground">Client</p>
                        <p className="text-body-md font-medium text-card-foreground">{ride.client}</p>
                      </div>
                      <div>
                        <p className="text-caption text-muted-foreground">Chauffeur</p>
                        <p className="text-body-md font-medium text-card-foreground">{ride.driver}</p>
                      </div>
                      <div>
                        <p className="text-caption text-muted-foreground">Trajet</p>
                        <p className="text-body-md font-medium text-card-foreground">{ride.from} → {ride.to}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-caption text-muted-foreground">Montant</p>
                          <p className="text-body-md font-medium text-card-foreground">{ride.amount}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <h3 className="text-heading-lg text-card-foreground">Gestion financière</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Revenus totaux</p>
                  <p className="text-heading-lg font-bold text-card-foreground">125.2M CFA</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Commission</p>
                  <p className="text-heading-lg font-bold text-card-foreground">12.5M CFA</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">En attente</p>
                  <p className="text-heading-lg font-bold text-card-foreground">2.8M CFA</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Litiges</p>
                  <p className="text-heading-lg font-bold text-card-foreground">145K CFA</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return renderDashboard();
};

export default AdminApp;