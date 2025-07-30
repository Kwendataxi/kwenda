import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building, 
  Users, 
  Car, 
  DollarSign, 
  FileText, 
  Plus,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';

const PartnerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">NTA Tech Entreprise</h1>
            <p className="text-sm opacity-90">Tableau de bord partenaire</p>
          </div>
          <Button variant="ghost" size="sm">
            <Building className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-bold text-xl">24</p>
            <p className="text-sm text-muted-foreground">Employés actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-xl">156</p>
            <p className="text-sm text-muted-foreground">Courses ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-xl">485K</p>
            <p className="text-sm text-muted-foreground">FCFA dépensés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="font-bold text-xl">12</p>
            <p className="text-sm text-muted-foreground">Factures en attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold mb-3">Actions rapides</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => setCurrentView('employees')}
          >
            <Plus className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Ajouter employé</p>
              <p className="text-xs text-muted-foreground">Nouveau compte</p>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => setCurrentView('billing')}
          >
            <FileText className="h-5 w-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Voir factures</p>
              <p className="text-xs text-muted-foreground">Gestion billing</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Activité récente</h3>
        <div className="space-y-3">
          {[
            { user: "Jean Kouassi", action: "Course vers Plateau", amount: "2,500", time: "Il y a 2h" },
            { user: "Marie Diallo", action: "Course vers Cocody", amount: "3,200", time: "Il y a 4h" },
            { user: "Paul Yao", action: "Course vers Marcory", amount: "1,800", time: "Il y a 6h" },
          ].map((activity, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{activity.amount} FCFA</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('dashboard')}>
            <Building className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('employees')}>
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('billing')}>
            <FileText className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('reports')}>
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="min-h-screen bg-background">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold flex-1">Employés</h1>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un employé..." className="pl-10" />
          </div>
          <Button variant="outline" size="icon">
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
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <Badge variant={employee.status === "Actif" ? "default" : "secondary"}>
                    {employee.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{employee.rides} courses ce mois</p>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="min-h-screen bg-background">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold flex-1">Facturation</h1>
        <Button size="sm">
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </div>

      <div className="p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Résumé du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total à payer</p>
                <p className="text-2xl font-bold text-primary">485,600 FCFA</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Économies vs taxi</p>
                <p className="text-2xl font-bold text-emerald-500">-28%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="font-semibold mb-3">Factures</h3>
        <div className="space-y-3">
          {[
            { id: "FAC-2024-001", date: "15 Janv 2024", amount: "125,400", status: "Payée" },
            { id: "FAC-2024-002", date: "10 Janv 2024", amount: "98,200", status: "En attente" },
            { id: "FAC-2024-003", date: "05 Janv 2024", amount: "156,800", status: "Payée" },
            { id: "FAC-2024-004", date: "01 Janv 2024", amount: "105,200", status: "En retard" },
          ].map((invoice, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <Badge 
                    variant={
                      invoice.status === "Payée" ? "default" : 
                      invoice.status === "En retard" ? "destructive" : "secondary"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{invoice.amount} FCFA</p>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
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