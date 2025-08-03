import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DriverValidationManager } from '@/components/partner/DriverValidationManager';
import { PartnerDriverManager } from '@/components/partner/PartnerDriverManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Car, 
  DollarSign, 
  FileText, 
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  CreditCard,
  Settings,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Fuel,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  PieChart,
  Activity,
  Wallet,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PartnerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [companyCredits, setCompanyCredits] = useState(50000);
  const [realTimeData, setRealTimeData] = useState({
    activeDrivers: 18,
    ongoingRides: 7,
    todayRevenue: 245600,
    monthlySpent: 485600,
    totalFleet: 24,
    availableVehicles: 19
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeDrivers: Math.max(1, prev.activeDrivers + (Math.random() > 0.5 ? 1 : -1)),
        ongoingRides: Math.max(0, prev.ongoingRides + (Math.random() > 0.7 ? 1 : -1)),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 5000)
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        {/* Header */}
        <div className="card-floating p-6 mb-6 animate-slide-up">
          <h1 className="text-display-sm text-card-foreground mb-2">Tableau de bord</h1>
          <p className="text-body-lg text-muted-foreground">Entreprise NTA Solutions</p>
        </div>

        {/* Real-time Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Chauffeurs actifs</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">{realTimeData.activeDrivers}</p>
            <p className="text-caption text-secondary font-medium bg-secondary-light px-2 py-1 rounded-md inline-block mt-1">
              <Activity className="w-3 h-3 inline mr-1" />
              En temps réel
            </p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Courses en cours</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">{realTimeData.ongoingRides}</p>
            <p className="text-caption text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12%
            </p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Revenus aujourd'hui</span>
            </div>
            <p className="text-heading-lg text-card-foreground font-bold">{realTimeData.todayRevenue.toLocaleString()}</p>
            <p className="text-caption text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md inline-block mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8% vs hier
            </p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Crédit entreprise</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">{companyCredits.toLocaleString()}</p>
            <p className="text-caption text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md inline-block mt-1">
              CFA disponible
            </p>
          </div>
        </div>

        {/* Fleet Status */}
        <Card className="card-floating border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              État de la flotte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-body-sm text-muted-foreground">Véhicules disponibles</p>
                <p className="text-heading-md font-bold text-card-foreground">
                  {realTimeData.availableVehicles} / {realTimeData.totalFleet}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body-sm text-muted-foreground">Taux d'utilisation</p>
                <p className="text-heading-md font-bold text-primary">
                  {Math.round(((realTimeData.totalFleet - realTimeData.availableVehicles) / realTimeData.totalFleet) * 100)}%
                </p>
              </div>
            </div>
            <Progress 
              value={((realTimeData.totalFleet - realTimeData.availableVehicles) / realTimeData.totalFleet) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-heading-lg text-card-foreground mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-20 flex-col gap-3 rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow transition-all duration-300"
              onClick={() => setCurrentView('fleet')}
            >
              <Car className="h-6 w-6" />
              <span className="text-body-md font-semibold">Gérer flotte</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-3 rounded-xl border-grey-200 hover:border-primary hover:bg-primary-light transition-all duration-300"
              onClick={() => setCurrentView('analytics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-body-md font-semibold">Analytics</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 rounded-xl border-grey-200 hover:border-secondary hover:bg-secondary-light transition-all duration-300"
              onClick={() => setCurrentView('employees')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-body-sm font-semibold">Employés</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 rounded-xl border-grey-200 hover:border-accent hover:bg-accent-light transition-all duration-300"
              onClick={() => setCurrentView('credits')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-body-sm font-semibold">Crédits</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-20">
          <h2 className="text-heading-lg text-card-foreground mb-4">Activité récente</h2>
          <div className="space-y-3">
            {[
              { action: "Nouveau trajet", user: "Jean Baptiste", time: "Il y a 5 min", icon: Car, color: "bg-primary" },
              { action: "Employé ajouté", user: "Marie Kouadio", time: "Il y a 2h", icon: UserPlus, color: "bg-accent" },
              { action: "Facture payée", user: "Facture #FB-001", time: "Hier", icon: CreditCard, color: "bg-secondary" },
            ].map((activity, index) => (
              <div key={index} className="card-floating p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-200">
                <div className={`w-12 h-12 ${activity.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <activity.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-card-foreground">{activity.action}</p>
                  <p className="text-body-sm text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-caption text-muted-foreground bg-grey-100 px-2 py-1 rounded-md">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-grey-100 px-6 py-3 flex justify-around">
        {[
          { icon: BarChart3, label: "Dashboard", view: 'dashboard' },
          { icon: Car, label: "Flotte", view: 'fleet' },
          { icon: Users, label: "Chauffeurs", view: 'drivers' },
          { icon: PieChart, label: "Analytics", view: 'analytics' },
          { icon: CreditCard, label: "Facturation", view: 'billing' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setCurrentView(item.view)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
              currentView === item.view 
                ? 'text-primary bg-primary-light' 
                : 'text-muted-foreground hover:text-primary hover:bg-grey-50'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-caption font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFleetManagement = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center p-4 border-b border-grey-100">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground flex-1">Gestion de flotte</h1>
        <Button size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter véhicule
        </Button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="card-floating border-0 p-4 text-center">
            <Car className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-caption text-muted-foreground">Total</p>
            <p className="text-heading-sm font-bold text-card-foreground">{realTimeData.totalFleet}</p>
          </Card>
          <Card className="card-floating border-0 p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-caption text-muted-foreground">Disponibles</p>
            <p className="text-heading-sm font-bold text-card-foreground">{realTimeData.availableVehicles}</p>
          </Card>
          <Card className="card-floating border-0 p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-caption text-muted-foreground">Maintenance</p>
            <p className="text-heading-sm font-bold text-card-foreground">2</p>
          </Card>
        </div>

        <div className="space-y-3">
          {[
            { 
              id: "VH-001", 
              model: "Toyota Corolla 2022", 
              plate: "ABC 123 CI", 
              driver: "Jean Kouassi",
              status: "En course",
              mileage: "45,230 km",
              fuel: 75,
              color: "bg-blue-500"
            },
            { 
              id: "VH-002", 
              model: "Honda Accord 2021", 
              plate: "DEF 456 CI", 
              driver: "Marie Diallo",
              status: "Disponible",
              mileage: "32,180 km",
              fuel: 90,
              color: "bg-green-500"
            },
            { 
              id: "VH-003", 
              model: "Nissan Sentra 2023", 
              plate: "GHI 789 CI", 
              driver: "Paul Yao",
              status: "Maintenance",
              mileage: "28,940 km",
              fuel: 40,
              color: "bg-yellow-500"
            },
          ].map((vehicle, index) => (
            <Card key={index} className="card-floating border-0 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${vehicle.color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-card-foreground">{vehicle.model}</p>
                      <p className="text-body-sm text-muted-foreground">{vehicle.plate}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      vehicle.status === "Disponible" ? "default" :
                      vehicle.status === "En course" ? "secondary" : "outline"
                    }
                    className="rounded-md"
                  >
                    {vehicle.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-body-sm text-muted-foreground">{vehicle.mileage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-body-sm text-muted-foreground">{vehicle.fuel}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-body-sm text-muted-foreground">{vehicle.driver}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-lg">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-lg">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center p-4 border-b border-grey-100">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground flex-1">Analytics & Rapports</h1>
        <Button size="sm" className="rounded-xl">
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange ? format(dateRange, "PPP") : <span>Sélectionner période</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Courses ce mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-display-lg font-bold text-primary">847</p>
                    <p className="text-body-sm text-muted-foreground mt-2">
                      <TrendingUp className="inline w-4 h-4 mr-1 text-green-500" />
                      +23% vs mois dernier
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Satisfaction client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <p className="text-display-lg font-bold text-card-foreground">4.8</p>
                    </div>
                    <p className="text-body-sm text-muted-foreground">1,247 avis</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-floating border-0">
              <CardHeader>
                <CardTitle className="text-heading-sm">Performance hebdomadaire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { day: "Lun", rides: 120, revenue: 45600 },
                    { day: "Mar", rides: 135, revenue: 52300 },
                    { day: "Mer", rides: 98, revenue: 38900 },
                    { day: "Jeu", rides: 142, revenue: 56800 },
                    { day: "Ven", rides: 156, revenue: 62400 },
                    { day: "Sam", rides: 89, revenue: 34200 },
                    { day: "Dim", rides: 67, revenue: 25800 },
                  ].map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-body-sm font-medium text-card-foreground w-12">{data.day}</span>
                      <div className="flex-1 mx-3">
                        <Progress value={(data.rides / 156) * 100} className="h-2" />
                      </div>
                      <div className="text-right">
                        <p className="text-body-sm font-semibold text-card-foreground">{data.rides}</p>
                        <p className="text-caption text-muted-foreground">{data.revenue.toLocaleString()} CFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Revenus totaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-display-lg font-bold text-secondary">2,450,000</p>
                  <p className="text-caption text-muted-foreground">CFA ce mois</p>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Coûts opérationnels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-display-lg font-bold text-red-500">485,600</p>
                  <p className="text-caption text-muted-foreground">CFA ce mois</p>
                </CardContent>
              </Card>
            </div>

            <Card className="card-floating border-0">
              <CardHeader>
                <CardTitle className="text-heading-sm">Répartition des coûts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: "Carburant", amount: 185600, percentage: 38 },
                    { category: "Maintenance", amount: 125400, percentage: 26 },
                    { category: "Assurance", amount: 95200, percentage: 20 },
                    { category: "Divers", amount: 79400, percentage: 16 },
                  ].map((cost, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-body-sm text-card-foreground">{cost.category}</span>
                        <span className="text-body-sm font-semibold text-card-foreground">
                          {cost.amount.toLocaleString()} CFA ({cost.percentage}%)
                        </span>
                      </div>
                      <Progress value={cost.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Temps de réponse moy.</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-display-lg font-bold text-primary">2.4</p>
                  <p className="text-caption text-muted-foreground">minutes</p>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-sm">Taux d'annulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-display-lg font-bold text-green-500">3.2%</p>
                  <p className="text-caption text-muted-foreground">-0.8% vs mois dernier</p>
                </CardContent>
              </Card>
            </div>

            <Card className="card-floating border-0">
              <CardHeader>
                <CardTitle className="text-heading-sm">Top chauffeurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Jean Kouassi", rides: 89, rating: 4.9, revenue: 234500 },
                    { name: "Marie Diallo", rides: 76, rating: 4.8, revenue: 198300 },
                    { name: "Paul Yao", rides: 65, rating: 4.7, revenue: 176800 },
                  ].map((driver, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-body-md font-semibold text-card-foreground">{driver.name}</p>
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-caption text-muted-foreground">{driver.rating}</span>
                            <span className="text-caption text-muted-foreground">• {driver.rides} courses</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-body-sm font-semibold text-secondary">{driver.revenue.toLocaleString()} CFA</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderCreditsManagement = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center p-4 border-b border-grey-100">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-heading-lg text-card-foreground flex-1">Crédit Entreprise</h1>
        <Button size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" />
          Recharger
        </Button>
      </div>

      <div className="p-4">
        <Card className="card-floating border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-heading-md">Solde actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-display-xl font-bold text-primary">{companyCredits.toLocaleString()}</p>
              <p className="text-body-md text-muted-foreground">CFA disponible</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-caption text-muted-foreground">Utilisé ce mois</p>
                <p className="text-heading-sm font-bold text-card-foreground">485,600 CFA</p>
              </div>
              <div className="text-center">
                <p className="text-caption text-muted-foreground">Économies réalisées</p>
                <p className="text-heading-sm font-bold text-secondary">156,400 CFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-floating border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-heading-md">Options de recharge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { amount: 50000, bonus: 0 },
                { amount: 100000, bonus: 5000 },
                { amount: 250000, bonus: 15000 },
                { amount: 500000, bonus: 35000 },
              ].map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex-col gap-2 rounded-xl border-grey-200 hover:border-primary hover:bg-primary-light transition-all duration-300"
                  onClick={() => setCompanyCredits(prev => prev + option.amount + option.bonus)}
                >
                  <span className="text-heading-sm font-bold text-card-foreground">
                    {option.amount.toLocaleString()} CFA
                  </span>
                  {option.bonus > 0 && (
                    <span className="text-caption text-secondary font-medium">
                      +{option.bonus.toLocaleString()} bonus
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-floating border-0">
          <CardHeader>
            <CardTitle className="text-heading-md">Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Recharge", amount: 100000, date: "15 Jan 2024", id: "TXN-001" },
                { type: "Course", amount: -2500, date: "15 Jan 2024", id: "RIDE-234" },
                { type: "Course", amount: -1800, date: "14 Jan 2024", id: "RIDE-233" },
                { type: "Bonus", amount: 5000, date: "10 Jan 2024", id: "BONUS-01" },
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-grey-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.amount > 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-card-foreground">{transaction.type}</p>
                      <p className="text-body-sm text-muted-foreground">{transaction.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-body-md font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} CFA
                    </p>
                    <p className="text-caption text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center p-4 border-b border-grey-100">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3 rounded-xl">
          ←
        </Button>
        <h1 className="text-heading-lg text-card-foreground flex-1">Employés</h1>
        <Button size="sm" className="rounded-xl">
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un employé..." className="pl-10 rounded-xl" />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {[
            { name: "Jean Kouassi", email: "jean.kouassi@company.com", rides: 23, status: "Actif" },
            { name: "Marie Diallo", email: "marie.diallo@company.com", rides: 18, status: "Actif" },
            { name: "Paul Yao", email: "paul.yao@company.com", rides: 12, status: "Inactif" },
            { name: "Fatou Traore", email: "fatou.traore@company.com", rides: 31, status: "Actif" },
          ].map((employee, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-card-foreground">{employee.name}</p>
                    <p className="text-body-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
                <Badge variant={employee.status === "Actif" ? "default" : "secondary"} className="rounded-md">
                  {employee.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-muted-foreground">{employee.rides} courses ce mois</p>
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center p-4 border-b border-grey-100">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3 rounded-xl">
          ←
        </Button>
        <h1 className="text-heading-lg text-card-foreground flex-1">Facturation</h1>
        <Button size="sm" className="rounded-xl">
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </div>

      <div className="p-4">
        <Card className="card-floating border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-heading-md">Résumé du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-muted-foreground">Total à payer</p>
                <p className="text-display-sm font-bold text-primary">485,600</p>
                <p className="text-caption text-muted-foreground">CFA</p>
              </div>
              <div>
                <p className="text-body-sm text-muted-foreground">Économies vs taxi</p>
                <p className="text-display-sm font-bold text-secondary">-28%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-heading-md text-card-foreground mb-4">Factures</h3>
        <div className="space-y-3">
          {[
            { id: "FAC-2024-001", date: "15 Janv 2024", amount: "125,400", status: "Payée" },
            { id: "FAC-2024-002", date: "10 Janv 2024", amount: "98,200", status: "En attente" },
            { id: "FAC-2024-003", date: "05 Janv 2024", amount: "156,800", status: "Payée" },
            { id: "FAC-2024-004", date: "01 Janv 2024", amount: "105,200", status: "En retard" },
          ].map((invoice, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-body-md font-semibold text-card-foreground">{invoice.id}</p>
                  <p className="text-body-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <Badge 
                  variant={
                    invoice.status === "Payée" ? "default" : 
                    invoice.status === "En retard" ? "destructive" : "secondary"
                  }
                  className="rounded-md"
                >
                  {invoice.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-heading-sm font-bold text-card-foreground">{invoice.amount}</p>
                  <p className="text-caption text-muted-foreground">CFA</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  switch (currentView) {
    case 'fleet':
      return renderFleetManagement();
    case 'analytics':
      return renderAnalytics();
    case 'credits':
      return renderCreditsManagement();
    case 'employees':
      return renderEmployees();
    case 'billing':
      return renderBilling();
      case 'validation':
        return <DriverValidationManager />;
      case 'drivers':
        return <PartnerDriverManager />;
      default:
        return renderDashboard();
    }
  };

export default PartnerApp;