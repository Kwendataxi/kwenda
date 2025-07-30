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
  Building
} from 'lucide-react';

const AdminApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Administration NTA TECH</h1>
            <p className="text-sm opacity-90">Tableau de bord principal</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="rides">Courses</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</p>
                      <p className="text-2xl font-bold">2,847</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500 ml-1">+12.5%</span>
                    <span className="text-sm text-muted-foreground ml-1">ce mois</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Car className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Courses aujourd'hui</p>
                      <p className="text-2xl font-bold">1,293</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500 ml-1">+8.2%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs hier</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Revenus du jour</p>
                      <p className="text-2xl font-bold">4.2M FCFA</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500 ml-1">+15.3%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs hier</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Incidents</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-red-500">3 non résolus</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activité en temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "new_user", message: "Jean Kouassi s'est inscrit", time: "Il y a 2 min", status: "success" },
                      { type: "ride_completed", message: "Course Cocody → Plateau terminée", time: "Il y a 5 min", status: "success" },
                      { type: "incident", message: "Signalement d'incident signalé", time: "Il y a 8 min", status: "warning" },
                      { type: "payment", message: "Paiement de 2,500 FCFA reçu", time: "Il y a 12 min", status: "success" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chauffeurs en ligne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total en ligne</span>
                      <span className="font-bold text-emerald-500">247 chauffeurs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Kouame Paul", zone: "Cocody", rides: 8, rating: 4.9 },
                        { name: "Traore Sekou", zone: "Plateau", rides: 12, rating: 4.8 },
                        { name: "Diallo Mamadou", zone: "Marcory", rides: 6, rating: 5.0 },
                      ].map((driver, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.zone} • {driver.rides} courses</p>
                          </div>
                          <Badge variant="secondary">{driver.rating}★</Badge>
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
              <h3 className="text-lg font-semibold">Gestion des utilisateurs</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-10 w-64" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Jean Kouassi", email: "jean@email.com", rides: 23, status: "Actif" },
                      { name: "Marie Diallo", email: "marie@email.com", rides: 18, status: "Actif" },
                      { name: "Paul Yao", email: "paul@email.com", rides: 0, status: "Nouveau" },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.rides} courses</p>
                          </div>
                        </div>
                        <Badge variant={user.status === "Actif" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chauffeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Kouame Paul", rides: 156, rating: 4.9, status: "En ligne" },
                      { name: "Traore Sekou", rides: 203, rating: 4.8, status: "En course" },
                      { name: "Diallo Mamadou", rides: 89, rating: 5.0, status: "Hors ligne" },
                    ].map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Car className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.rides} courses • {driver.rating}★</p>
                          </div>
                        </div>
                        <Badge variant={
                          driver.status === "En ligne" ? "default" : 
                          driver.status === "En course" ? "secondary" : "outline"
                        }>
                          {driver.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Partenaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "NTA Tech", employees: 24, rides: 156, status: "Actif" },
                      { name: "Orange CI", employees: 45, rides: 298, status: "Actif" },
                      { name: "MTN CI", employees: 12, rides: 67, status: "Inactif" },
                    ].map((partner, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <Building className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{partner.name}</p>
                            <p className="text-xs text-muted-foreground">{partner.employees} employés • {partner.rides} courses</p>
                          </div>
                        </div>
                        <Badge variant={partner.status === "Actif" ? "default" : "secondary"}>
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
              <h3 className="text-lg font-semibold">Gestion des courses</h3>
              <Button variant="outline">
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
                  amount: "2,500 FCFA", 
                  status: "Terminée",
                  time: "14:30"
                },
                { 
                  id: "CR-2024-002", 
                  client: "Marie Diallo", 
                  driver: "Traore Sekou", 
                  from: "Marcory", 
                  to: "Treichville", 
                  amount: "1,800 FCFA", 
                  status: "En cours",
                  time: "15:45"
                },
                { 
                  id: "CR-2024-003", 
                  client: "Paul Yao", 
                  driver: "Diallo Mamadou", 
                  from: "Plateau", 
                  to: "Cocody", 
                  amount: "3,200 FCFA", 
                  status: "Annulée",
                  time: "16:12"
                },
              ].map((ride, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{ride.id}</Badge>
                        <span className="text-sm text-muted-foreground">{ride.time}</span>
                      </div>
                      <Badge variant={
                        ride.status === "Terminée" ? "default" : 
                        ride.status === "En cours" ? "secondary" : "destructive"
                      }>
                        {ride.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Client</p>
                        <p className="font-medium">{ride.client}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Chauffeur</p>
                        <p className="font-medium">{ride.driver}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trajet</p>
                        <p className="font-medium">{ride.from} → {ride.to}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Montant</p>
                          <p className="font-medium">{ride.amount}</p>
                        </div>
                        <Button variant="ghost" size="sm">
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
            <h3 className="text-lg font-semibold">Gestion financière</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenus aujourd'hui</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">4,235,600 FCFA</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500 ml-1">+15.3% vs hier</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Commission NTA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-500">847,120 FCFA</p>
                  <p className="text-sm text-muted-foreground mt-2">20% des revenus totaux</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paiements en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-500">156,780 FCFA</p>
                  <p className="text-sm text-muted-foreground mt-2">23 transactions</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transactions récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Paiement course", amount: "+2,500 FCFA", user: "Jean Kouassi", time: "Il y a 5 min" },
                    { type: "Commission chauffeur", amount: "-500 FCFA", user: "Kouame Paul", time: "Il y a 8 min" },
                    { type: "Paiement course", amount: "+1,800 FCFA", user: "Marie Diallo", time: "Il y a 12 min" },
                    { type: "Remboursement", amount: "-3,200 FCFA", user: "Paul Yao", time: "Il y a 20 min" },
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{transaction.type}</p>
                        <p className="text-xs text-muted-foreground">{transaction.user} • {transaction.time}</p>
                      </div>
                      <p className={`font-semibold ${
                        transaction.amount.startsWith('+') ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-background border-r hidden lg:block">
        <div className="p-6">
          <h2 className="font-bold text-lg text-primary">NTA ADMIN</h2>
        </div>
        <nav className="space-y-2 px-4">
          {[
            { icon: LayoutDashboard, label: "Tableau de bord", view: "dashboard" },
            { icon: Users, label: "Utilisateurs", view: "users" },
            { icon: Car, label: "Véhicules", view: "vehicles" },
            { icon: DollarSign, label: "Finance", view: "finance" },
            { icon: Settings, label: "Paramètres", view: "settings" },
          ].map((item, index) => (
            <Button
              key={index}
              variant={currentView === item.view ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView(item.view)}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );

  return renderDashboard();
};

export default AdminApp;