import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  CreditCard
} from 'lucide-react';

const PartnerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        {/* Header */}
        <div className="card-floating p-6 mb-6 animate-slide-up">
          <h1 className="text-display-sm text-card-foreground mb-2">Tableau de bord</h1>
          <p className="text-body-lg text-muted-foreground">Entreprise NTA Solutions</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Employés</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">24</p>
            <p className="text-caption text-secondary font-medium bg-secondary-light px-2 py-1 rounded-md inline-block mt-1">+2 ce mois</p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Courses</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">156</p>
            <p className="text-caption text-secondary font-medium bg-secondary-light px-2 py-1 rounded-md inline-block mt-1">+12%</p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">Dépenses</span>
            </div>
            <p className="text-heading-lg text-card-foreground font-bold">245,000</p>
            <p className="text-caption text-red-500 font-medium bg-red-50 px-2 py-1 rounded-md inline-block mt-1">+5% vs mois dernier</p>
          </div>
          
          <div className="card-floating p-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <span className="text-body-md font-semibold text-card-foreground">En attente</span>
            </div>
            <p className="text-display-sm text-card-foreground font-bold">3</p>
            <p className="text-caption text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md inline-block mt-1">À régler</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-heading-lg text-card-foreground mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-20 flex-col gap-3 rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow transition-all duration-300"
              onClick={() => setCurrentView('employees')}
            >
              <UserPlus className="h-6 w-6" />
              <span className="text-body-md font-semibold">Ajouter employé</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-3 rounded-xl border-grey-200 hover:border-primary hover:bg-primary-light transition-all duration-300"
              onClick={() => setCurrentView('billing')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-body-md font-semibold">Voir facturation</span>
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
          { icon: BarChart3, label: "Tableau de bord", active: true, view: 'dashboard' },
          { icon: Users, label: "Employés", active: false, view: 'employees' },
          { icon: CreditCard, label: "Facturation", active: false, view: 'billing' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setCurrentView(item.view as any)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
              item.active 
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

  const renderEmployees = () => (
    <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
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
    case 'employees':
      return renderEmployees();
    case 'billing':
      return renderBilling();
    default:
      return renderDashboard();
  }
};

export default PartnerApp;