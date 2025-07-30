import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Car, Clock, Star, User, CreditCard, History } from 'lucide-react';

const ClientApp = () => {
  const [currentView, setCurrentView] = useState('home');

  const renderHome = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Bonjour !</h1>
            <p className="text-sm opacity-90">Où allons-nous aujourd'hui ?</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView('profile')}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Destination Input */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Où voulez-vous aller ?" className="pl-10" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start">
            <MapPin className="h-4 w-4 mr-2" />
            Domicile
          </Button>
          <Button variant="outline" className="justify-start">
            <MapPin className="h-4 w-4 mr-2" />
            Bureau
          </Button>
        </div>
      </div>

      {/* Vehicle Types */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">Types de véhicules</h3>
        <div className="space-y-3">
          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">NTA Standard</h4>
                  <p className="text-sm text-muted-foreground">Confortable et économique</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">1500 FCFA</p>
                <p className="text-sm text-muted-foreground">5 min</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-emerald-500" />
                <div>
                  <h4 className="font-medium">NTA Eco</h4>
                  <p className="text-sm text-muted-foreground">Véhicule écologique</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">1800 FCFA</p>
                <p className="text-sm text-muted-foreground">7 min</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-amber-500" />
                <div>
                  <h4 className="font-medium">NTA Luxe</h4>
                  <p className="text-sm text-muted-foreground">Véhicule haut de gamme</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">3500 FCFA</p>
                <p className="text-sm text-muted-foreground">10 min</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('home')}>
            <MapPin className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('history')}>
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('payment')}>
            <CreditCard className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('profile')}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setCurrentView('home')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Jean Kouassi</h3>
            <p className="text-muted-foreground">jean.kouassi@email.com</p>
            <div className="flex items-center justify-center mt-2">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-medium">4.8</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Téléphone</label>
              <p className="font-medium">+225 07 12 34 56 78</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Adresse</label>
              <p className="font-medium">Cocody, Abidjan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setCurrentView('home')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold">Historique</h1>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((trip) => (
          <Card key={trip}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium">Cocody → Plateau</p>
                  <p className="text-sm text-muted-foreground">15 Janv. 2024, 14:30</p>
                </div>
                <p className="font-semibold">2,500 FCFA</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">Kouame Paul</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm">4.9</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setCurrentView('home')} className="mr-3">
          ←
        </Button>
        <h1 className="text-xl font-bold">Paiements</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Moyens de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-primary" />
                <span>Orange Money</span>
              </div>
              <span className="text-primary">Principal</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3" />
                <span>MTN Money</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3" />
                <span>Espèces</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full">Ajouter un moyen de paiement</Button>
      </div>
    </div>
  );

  switch (currentView) {
    case 'profile':
      return renderProfile();
    case 'history':
      return renderHistory();
    case 'payment':
      return renderPayment();
    default:
      return renderHome();
  }
};

export default ClientApp;