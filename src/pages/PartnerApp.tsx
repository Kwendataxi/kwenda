import { useState } from 'react';
import { PartnerDriverManager } from '@/components/partner/PartnerDriverManager';
import PartnerRentalManager from '@/components/partner/rental/PartnerRentalManager';
import { ResponsivePartnerLayout } from '@/components/partner/ResponsivePartnerLayout';
import { RentalSubscriptionManager } from '@/components/partner/rental/RentalSubscriptionManager';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { usePartnerActivity } from '@/hooks/usePartnerActivity';
import { PartnerEarningsCard } from '@/components/partner/PartnerEarningsCard';
import { PartnerDashboard } from '@/components/partner/PartnerDashboard';
import { PartnerAnalyticsDashboard } from '@/components/partner/PartnerAnalyticsDashboard';
import { PartnerNotificationCenter } from '@/components/partner/PartnerNotificationCenter';
import { PartnerSubscriptionEarnings } from '@/components/partner/PartnerSubscriptionEarnings';
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarIcon, Download, Eye, Filter, Plus, Search, Star, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useIsMobile } from '@/hooks/use-mobile';

const PartnerApp = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'vehicles' | 'drivers' | 'subscriptions' | 'analytics' | 'notifications' | 'subscription-earnings'>('dashboard');
  
  // Use real data hooks
  const { stats, loading: statsLoading } = usePartnerStats();
  const { activities, loading: activitiesLoading } = usePartnerActivity();

  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();

  const renderDashboard = () => (
    <PartnerDashboard onViewChange={(view: string) => setCurrentView(view as any)} />
  );

  const renderFleetManagement = () => (
    <div className="space-y-6">
      <PartnerRentalManager />
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


  const renderSubscriptions = () => (
    <div className="min-h-screen bg-background pb-20">
      {isMobile && (
        <div className="sticky top-0 bg-background border-b border-grey-100 px-4 py-3 z-10">
          <h1 className="text-heading-lg text-card-foreground">Abonnements</h1>
        </div>
      )}
      {!isMobile && (
        <div className="flex items-center mb-6">
          <h1 className="text-display-sm text-card-foreground">Abonnements</h1>
        </div>
      )}
      <div className={`${isMobile ? 'px-4' : ''} space-y-6`}>
        <RentalSubscriptionManager />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'vehicles':
        return renderFleetManagement();
      case 'drivers':
        return <PartnerDriverManager />;
      case 'subscriptions':
        return renderSubscriptions();
      case 'subscription-earnings':
        return <PartnerSubscriptionEarnings />;
      case 'analytics':
        return <PartnerAnalyticsDashboard />;
      case 'notifications':
        return <PartnerNotificationCenter />;
      default:
        return renderDashboard();
    }
  };
  const getViewTitle = () => {
    switch (currentView) {
      case 'vehicles': 
        return 'Mes véhicules';
      case 'drivers': 
        return 'Chauffeurs';
      case 'subscription-earnings':
        return 'Gains Abonnements';
      case 'subscriptions':
        return 'Abonnements';
      case 'analytics':
        return 'Analytiques';
      case 'notifications':
        return 'Notifications';
      default: 
        return 'Tableau de bord';
    }
  };
  return (
    <ResponsivePartnerLayout
      stats={stats}
      currentView={currentView}
      onViewChange={(view: string) => setCurrentView(view as any)}
      title={getViewTitle()}
      subtitle="Kwenda Taxi Partner"
    >
      {renderContent()}
    </ResponsivePartnerLayout>
  );
};

export default PartnerApp;
