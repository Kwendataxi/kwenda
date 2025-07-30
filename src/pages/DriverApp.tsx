import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  DollarSign, 
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle
} from 'lucide-react';

const DriverApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(false);

  const renderDashboard = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Tableau de bord</h1>
            <p className="text-sm opacity-90">Bonjour, Kouame Paul</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="p-4">
        <Card className={isOnline ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}>
          <CardContent className="p-4 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isOnline ? 'bg-emerald-500' : 'bg-gray-400'
            }`}>
              <Car className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg">
              {isOnline ? 'Vous êtes en ligne' : 'Vous êtes hors ligne'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isOnline ? 'En attente de demandes de course' : 'Passez en ligne pour recevoir des demandes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Today */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold mb-3">Aujourd'hui</h3>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <p className="font-bold text-lg">45,500</p>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Car className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="font-bold text-lg">12</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-lg">8h</p>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Rides */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Courses récentes</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((ride) => (
            <Card key={ride}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Jean Kouassi</p>
                      <p className="text-sm text-muted-foreground">14:30</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Terminée</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">Cocody → Plateau</p>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">2,500 FCFA</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm">5.0</span>
                    </div>
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
            <Car className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('rides')}>
            <Navigation className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('earnings')}>
            <DollarSign className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('profile')}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRideRequest = () => (
    <div className="min-h-screen bg-background p-4">
      <Card className="border-primary">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle>Nouvelle demande de course</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Jean Kouassi</h3>
            <div className="flex items-center justify-center mt-1">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span>4.8</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Point de départ</p>
                <p className="text-sm text-muted-foreground">Cocody, Riviera Golf</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Destination</p>
                <p className="text-sm text-muted-foreground">Plateau, Immeuble CCIA</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-bold">12.5 km</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Estimation</p>
              <p className="font-bold">2,500 FCFA</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1">
              Refuser
            </Button>
            <Button className="flex-1">
              Accepter
            </Button>
          </div>

          <div className="flex justify-center space-x-4 mt-4">
            <Button variant="ghost" size="sm">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEarnings = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold">Gains</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cette semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">186,500 FCFA</p>
            <p className="text-sm text-muted-foreground">+15% par rapport à la semaine dernière</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Courses</p>
              <p className="font-bold">47</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Heures</p>
              <p className="font-bold">32h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Note moy.</p>
              <p className="font-bold">4.9</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Détail des gains</h3>
        {[
          { date: "Aujourd'hui", amount: "45,500", rides: 12 },
          { date: "Hier", amount: "38,200", rides: 10 },
          { date: "15 Janv", amount: "52,100", rides: 14 },
          { date: "14 Janv", amount: "41,800", rides: 11 },
        ].map((day, index) => (
          <Card key={index}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{day.date}</p>
                <p className="text-sm text-muted-foreground">{day.rides} courses</p>
              </div>
              <p className="font-bold">{day.amount} FCFA</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (!isOnline && currentView === 'dashboard') {
    return renderDashboard();
  }

  if (isOnline && currentView === 'dashboard') {
    // Simulate receiving a ride request
    return renderRideRequest();
  }

  switch (currentView) {
    case 'earnings':
      return renderEarnings();
    default:
      return renderDashboard();
  }
};

export default DriverApp;