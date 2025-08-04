import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ZoneManagementDashboard } from '@/components/admin/ZoneManagementDashboard';
import { DriverFinancialManager } from '@/components/admin/DriverFinancialManager';
import { AdvancedSupportCenter } from '@/components/admin/AdvancedSupportCenter';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ADMIN_NAVIGATION, ADMIN_ROLE_LABELS } from '@/types/roles';
import { 
  LayoutDashboard,
  Users,
  Car, 
  DollarSign, 
  Settings,
  TrendingUp,
  TrendingDown,
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
  Building2,
  ShoppingBag,
  Flag,
  MessageSquare,
  Ban,
  UserCheck,
  Percent,
  Star,
  Calendar as CalendarIcon,
  Send,
  Bell,
  Shield,
  Activity,
  PieChart,
  BarChart3,
  Archive,
  Trash2,
  Plus,
  ArrowLeft,
  HeadphonesIcon,
  HelpCircle,
  RefreshCw,
  CreditCard,
  Globe,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AdminApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  const { adminRole, hasPermission, hasAnyPermission, loading: rolesLoading } = useUserRoles();
  
  const [realTimeStats, setRealTimeStats] = useState({
    totalUsers: 15420,
    activeDrivers: 342,
    todayRevenue: 2850000,
    activeRides: 89,
    marketplaceOrders: 156,
    activeUsers: 2847,
    todayRides: 1293,
    incidents: 12,
    onlineDrivers: 247,
    pendingModeration: 8,
    supportTickets: 23
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + (Math.random() > 0.5 ? 1 : -1),
        todayRides: prev.todayRides + (Math.random() > 0.8 ? 1 : 0),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 10000),
        onlineDrivers: Math.max(100, prev.onlineDrivers + (Math.random() > 0.5 ? 1 : -1))
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer la navigation selon les permissions
  const allowedNavItems = ADMIN_NAVIGATION.filter(item => 
    hasAnyPermission(item.requiredPermissions)
  );

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">{/* Content will be here */}

          <TabsContent value="overview" className="space-y-6">
            <PermissionGuard requiredPermissions={['analytics_read']}>
              {/* Header avec rôle utilisateur */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Dashboard Admin</h2>
                      <p className="text-muted-foreground">
                        Connecté en tant que: {adminRole ? ADMIN_ROLE_LABELS[adminRole] : 'Administrateur'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {adminRole ? ADMIN_ROLE_LABELS[adminRole] : 'Admin'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

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
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.activeUsers.toLocaleString()}</p>
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
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.todayRides.toLocaleString()}</p>
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
                      <p className="text-heading-lg font-bold text-card-foreground">{(realTimeStats.todayRevenue / 1000000).toFixed(1)}M CFA</p>
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
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.incidents}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-red-500 font-medium bg-red-50 px-2 py-1 rounded-md">3 non résolus</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Annonces marketplace</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.pendingModeration}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md">En attente de modération</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <HeadphonesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Tickets support</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.supportTickets}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">5 résolus aujourd'hui</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Chauffeurs en ligne</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.onlineDrivers}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-body-sm text-green-600 ml-1 font-medium">Temps réel</span>
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
                      <span className="text-heading-sm font-bold text-secondary">{realTimeStats.onlineDrivers} chauffeurs</span>
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
            </PermissionGuard>
          </TabsContent>

          
        <TabsContent value="zones" className="space-y-4">
          <PermissionGuard requiredPermissions={['transport_admin']} showError>
            <ZoneManagementDashboard />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <PermissionGuard requiredPermissions={['drivers_read']} showError>
            <DriverFinancialManager />
          </PermissionGuard>
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

          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-lg text-card-foreground">Modération Marketplace</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="card-floating border-0 text-center p-4">
                <ShoppingBag className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-caption text-muted-foreground">En attente</p>
                <p className="text-heading-lg font-bold text-card-foreground">8</p>
              </Card>
              <Card className="card-floating border-0 text-center p-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-caption text-muted-foreground">Approuvées</p>
                <p className="text-heading-lg font-bold text-card-foreground">156</p>
              </Card>
              <Card className="card-floating border-0 text-center p-4">
                <Ban className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-caption text-muted-foreground">Rejetées</p>
                <p className="text-heading-lg font-bold text-card-foreground">23</p>
              </Card>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "ANN-001",
                  title: "iPhone 13 Pro Max 256GB",
                  seller: "Jean Kouassi",
                  price: "450,000 CFA",
                  category: "Électronique",
                  status: "pending",
                  date: "Il y a 2h",
                  reports: 0,
                  image: "📱"
                },
                {
                  id: "ANN-002", 
                  title: "Véhicule Toyota Corolla 2020",
                  seller: "Marie Diallo",
                  price: "8,500,000 CFA",
                  category: "Automobile",
                  status: "pending",
                  date: "Il y a 4h",
                  reports: 2,
                  image: "🚗"
                },
                {
                  id: "ANN-003",
                  title: "Appartement 3 pièces Cocody",
                  seller: "Paul Yao",
                  price: "85,000 CFA/mois",
                  category: "Immobilier",
                  status: "flagged",
                  date: "Il y a 1j",
                  reports: 5,
                  image: "🏠"
                }
              ].map((listing, index) => (
                <Card key={index} className="card-floating border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-grey-100 rounded-xl flex items-center justify-center text-2xl">
                          {listing.image}
                        </div>
                        <div>
                          <p className="text-body-md font-semibold text-card-foreground">{listing.title}</p>
                          <p className="text-body-sm text-muted-foreground">{listing.seller} • {listing.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.reports > 0 && (
                          <Badge variant="destructive" className="rounded-md">
                            <Flag className="w-3 h-3 mr-1" />
                            {listing.reports}
                          </Badge>
                        )}
                        <Badge 
                          variant={
                            listing.status === "pending" ? "outline" :
                            listing.status === "flagged" ? "destructive" : "default"
                          }
                          className="rounded-md"
                        >
                          {listing.status === "pending" ? "En attente" :
                           listing.status === "flagged" ? "Signalée" : "Approuvée"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-heading-sm font-bold text-primary">{listing.price}</p>
                        <p className="text-caption text-muted-foreground">{listing.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="rounded-lg bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-lg">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-lg text-card-foreground">Gestion financière & Tarifs</h3>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange ? format(dateRange, "PPP") : "Période"}
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
                <Button variant="outline" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Revenus totaux</p>
                  <p className="text-heading-lg font-bold text-card-foreground">125.2M CFA</p>
                  <p className="text-caption text-green-600 font-medium">+15.3% ce mois</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Percent className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Commission</p>
                  <p className="text-heading-lg font-bold text-card-foreground">12.5M CFA</p>
                  <p className="text-caption text-muted-foreground">10% de commission</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">En attente</p>
                  <p className="text-heading-lg font-bold text-card-foreground">2.8M CFA</p>
                  <p className="text-caption text-yellow-600 font-medium">À verser</p>
                </CardContent>
              </Card>
              
              <Card className="card-floating border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-caption text-muted-foreground">Litiges</p>
                  <p className="text-heading-lg font-bold text-card-foreground">145K CFA</p>
                  <p className="text-caption text-red-600 font-medium">3 en cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Management */}
            <Card className="card-floating border-0">
              <CardHeader>
                <CardTitle className="text-heading-md">Gestion des tarifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { service: "Transport", basePrice: "500", commission: "10", currency: "CFA" },
                    { service: "Livraison", basePrice: "300", commission: "15", currency: "CFA" },
                    { service: "Marketplace", basePrice: "0", commission: "5", currency: "%" },
                  ].map((pricing, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-grey-50 rounded-xl">
                      <div>
                        <p className="text-body-md font-semibold text-card-foreground">{pricing.service}</p>
                        <p className="text-body-sm text-muted-foreground">Prix de base: {pricing.basePrice} {pricing.currency}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-body-sm text-muted-foreground">Commission</p>
                          <p className="text-heading-sm font-bold text-primary">{pricing.commission}%</p>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <PermissionGuard requiredPermissions={['support_read']} showError>
            <AdvancedSupportCenter />
          </PermissionGuard>
        </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h3 className="text-heading-lg text-card-foreground">Paramètres système</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Paramètres généraux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Mode maintenance</p>
                      <p className="text-body-sm text-muted-foreground">Désactiver temporairement l'application</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Nouvelles inscriptions</p>
                      <p className="text-body-sm text-muted-foreground">Autoriser les nouveaux utilisateurs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Notifications push</p>
                      <p className="text-body-sm text-muted-foreground">Envoyer des notifications automatiques</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Modération automatique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Auto-approbation annonces</p>
                      <p className="text-body-sm text-muted-foreground">Approuver automatiquement les annonces</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Filtres de contenu</p>
                      <p className="text-body-sm text-muted-foreground">Détecter le contenu inapproprié</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Validation des chauffeurs</p>
                      <p className="text-body-sm text-muted-foreground">Vérification manuelle obligatoire</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
  );

  return (
    <ResponsiveAdminLayout
      realTimeStats={realTimeStats}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </ResponsiveAdminLayout>
  );
};

export default AdminApp;