import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Car, Clock, Star, User, CreditCard, History, Home, Building2, ArrowLeft, Bell, Leaf, Shield } from 'lucide-react';

const ClientApp = () => {
  const [currentView, setCurrentView] = useState('home');

  const renderHome = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="card-floating mx-4 mt-4 p-4 flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-elegant">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-heading-sm text-card-foreground">Bonjour, Jean</p>
            <p className="text-body-sm text-muted-foreground">Où allez-vous aujourd'hui ?</p>
          </div>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-muted-foreground" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Destination Input */}
      <div className="card-floating mx-4 mt-4 p-4 animate-slide-up">
        <div className="relative">
          <MapPin className="absolute left-4 top-4 h-5 w-5 text-primary" />
          <input
            type="text"
            placeholder="Où souhaitez-vous aller ?"
            className="w-full pl-12 pr-4 py-4 bg-grey-50 border-0 rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl border-grey-200 hover:border-primary hover:bg-primary-light">
            <Home className="h-4 w-4" />
            Domicile
          </Button>
          <Button variant="outline" size="sm" className="flex-1 rounded-xl border-grey-200 hover:border-primary hover:bg-primary-light">
            <Building2 className="h-4 w-4" />
            Bureau
          </Button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 mx-4 mt-4 mb-4 bg-grey-100 rounded-xl relative card-floating">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-elegant">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            <p className="text-heading-sm text-grey-600">Carte interactive</p>
            <p className="text-body-sm text-grey-400 mt-1">Votre position sera affichée ici</p>
          </div>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="card-floating mx-4 mb-4 p-4">
        <h3 className="text-heading-md text-card-foreground mb-4">Choisir un véhicule</h3>
        <div className="space-y-3">
          {[
            { name: "NTA Eco", time: "5 min", price: "1 500", icon: Car, eco: true, color: "bg-secondary" },
            { name: "NTA Standard", time: "8 min", price: "2 000", icon: Car, color: "bg-accent" },
            { name: "NTA Luxe", time: "12 min", price: "3 500", icon: Car, color: "bg-primary" },
          ].map((vehicle) => (
            <div
              key={vehicle.name}
              className="flex items-center justify-between p-4 bg-grey-50 rounded-xl hover:bg-white hover:shadow-md cursor-pointer transition-all duration-200 border border-transparent hover:border-grey-200"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${vehicle.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <vehicle.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-card-foreground flex items-center gap-2">
                    {vehicle.name}
                    {vehicle.eco && <Leaf className="h-4 w-4 text-secondary" />}
                  </p>
                  <p className="text-body-sm text-muted-foreground">{vehicle.time} • Arrivée</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-heading-sm text-card-foreground">{vehicle.price}</p>
                <p className="text-caption text-muted-foreground">CFA</p>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-6 h-12 rounded-xl text-body-md font-semibold" size="lg">
          Commander maintenant
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-grey-100 px-6 py-3 flex justify-around">
        {[
          { icon: Home, label: "Accueil", active: true },
          { icon: Clock, label: "Trajets", active: false },
          { icon: User, label: "Profil", active: false },
          { icon: CreditCard, label: "Paiement", active: false },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setCurrentView(item.label.toLowerCase() as any)}
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

  const renderProfile = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Mon Profil</h1>
        </div>

        <div className="space-y-4">
          <div className="card-floating p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-elegant">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-heading-md text-card-foreground">Jean Kouassi</h2>
                <p className="text-body-sm text-muted-foreground mt-1">+225 07 12 34 56 78</p>
                <p className="text-body-sm text-muted-foreground">jean.kouassi@email.com</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: Star, label: "Note moyenne", value: "4.8/5", color: "text-yellow-500" },
              { icon: Clock, label: "Trajets effectués", value: "23", color: "text-primary" },
              { icon: CreditCard, label: "Moyen de paiement", value: "Orange Money", color: "text-accent" },
              { icon: Shield, label: "Compte vérifié", value: "Oui", color: "text-secondary" },
            ].map((item) => (
              <div key={item.label} className="card-floating p-4 flex items-center justify-between hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-grey-50 rounded-xl flex items-center justify-center">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="text-body-md font-medium text-card-foreground">{item.label}</span>
                </div>
                <span className="text-body-sm font-semibold text-grey-600">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4">
            {[
              { label: "Paramètres", icon: "⚙️" },
              { label: "Centre d'aide", icon: "❓" },
              { label: "Conditions d'utilisation", icon: "📄" },
              { label: "Se déconnecter", icon: "🚪" },
            ].map((item) => (
              <button key={item.label} className="w-full card-floating p-4 text-left hover:shadow-lg transition-all duration-200 flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-body-md font-medium text-card-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Historique</h1>
        </div>

        <div className="space-y-4">
          {[
            { from: "Cocody", to: "Plateau", date: "15 Janv. 2024", time: "14:30", price: "2,500", driver: "Kouame Paul", rating: 4.9 },
            { from: "Marcory", to: "Treichville", date: "14 Janv. 2024", time: "16:45", price: "1,800", driver: "Traore Sekou", rating: 4.8 },
            { from: "Plateau", to: "Yopougon", date: "13 Janv. 2024", time: "09:20", price: "3,200", driver: "Diallo Mamadou", rating: 5.0 },
          ].map((trip, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-card-foreground">{trip.from} → {trip.to}</p>
                  <p className="text-body-sm text-muted-foreground">{trip.date}, {trip.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-heading-sm font-bold text-card-foreground">{trip.price}</p>
                  <p className="text-caption text-muted-foreground">CFA</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-body-sm font-medium text-card-foreground">{trip.driver}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-body-sm font-medium text-card-foreground">{trip.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('home')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Paiements</h1>
        </div>

        <div className="space-y-4">
          <Card className="card-floating border-0">
            <CardHeader>
              <CardTitle className="text-heading-md">Moyens de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Orange Money", primary: true, icon: "🟠" },
                { name: "MTN Money", primary: false, icon: "🟡" },
                { name: "Espèces", primary: false, icon: "💵" },
              ].map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-grey-50 rounded-xl border border-transparent hover:border-grey-200 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-body-md font-medium text-card-foreground">{method.name}</span>
                  </div>
                  {method.primary && (
                    <span className="text-caption font-semibold text-primary bg-primary-light px-2 py-1 rounded-md">Principal</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full h-12 rounded-xl text-body-md font-semibold">
            Ajouter un moyen de paiement
          </Button>
        </div>
      </div>
    </div>
  );

  switch (currentView) {
    case 'profil':
    case 'profile':
      return renderProfile();
    case 'trajets':
    case 'history':
      return renderHistory();
    case 'paiement':
    case 'payment':
      return renderPayment();
    default:
      return renderHome();
  }
};

export default ClientApp;