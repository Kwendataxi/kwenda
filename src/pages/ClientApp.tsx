import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Car, Clock, Star, User, CreditCard, History, Home, Building2, ArrowLeft, Bell, Leaf, Shield } from 'lucide-react';

const ClientApp = () => {
  const [currentView, setCurrentView] = useState('home');

  const renderHome = () => (
    <div className="min-h-screen bg-grey-25 flex flex-col">
      {/* Header - Style Yango/Uber */}
      <div className="px-6 pt-safe-top pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-grey-900 tracking-tight">Bonjour, Jean</p>
              <p className="text-sm text-grey-600 -mt-0.5">Comment puis-je vous aider ?</p>
            </div>
          </div>
          <div className="relative p-2">
            <Bell className="h-6 w-6 text-grey-700" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Destination Search - Style moderne */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-grey-100 p-1">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <input
              type="text"
              placeholder="Où allez-vous ?"
              className="flex-1 text-base text-grey-900 placeholder-grey-500 bg-transparent border-0 focus:outline-none"
            />
            <MapPin className="h-5 w-5 text-grey-400" />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-grey-100 hover:border-grey-200 transition-colors">
            <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-grey-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-grey-900">Domicile</p>
              <p className="text-xs text-grey-500">Cocody</p>
            </div>
          </button>
          <button className="flex-1 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-grey-100 hover:border-grey-200 transition-colors">
            <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-grey-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-grey-900">Bureau</p>
              <p className="text-xs text-grey-500">Plateau</p>
            </div>
          </button>
        </div>
      </div>

      {/* Map Area - Plus réaliste */}
      <div className="flex-1 mx-6 mb-6 bg-white rounded-2xl shadow-sm border border-grey-100 relative overflow-hidden min-h-[240px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-primary rounded-full shadow-lg border-4 border-white animate-pulse"></div>
          </div>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg">
            <p className="text-xs font-medium text-grey-900">Votre position</p>
          </div>
        </div>
      </div>

      {/* Vehicle Selection - Style Yango */}
      <div className="pb-safe-bottom">
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold text-grey-900 mb-4">Choisir un véhicule</h3>
          <div className="space-y-2">
            {[
              { name: "NTA Eco", time: "5", price: "1,500", icon: Car, eco: true, selected: true, description: "Option économique" },
              { name: "NTA Standard", time: "8", price: "2,000", icon: Car, selected: false, description: "Confort standard" },
              { name: "NTA Luxe", time: "12", price: "3,500", icon: Car, selected: false, description: "Véhicule premium" },
            ].map((vehicle) => (
              <div
                key={vehicle.name}
                className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  vehicle.selected ? 'border-primary bg-primary/5' : 'border-grey-100 hover:border-grey-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    vehicle.selected ? 'bg-primary' : 'bg-grey-100'
                  }`}>
                    <vehicle.icon className={`h-6 w-6 ${vehicle.selected ? 'text-white' : 'text-grey-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-grey-900">{vehicle.name}</p>
                      {vehicle.eco && <Leaf className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-grey-600">{vehicle.description}</p>
                    <p className="text-xs text-grey-500">{vehicle.time} min • Arrivée</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-grey-900">{vehicle.price}</p>
                  <p className="text-xs text-grey-500">CFA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button - Style premium */}
        <div className="px-6 pb-6">
          <Button className="w-full h-14 rounded-2xl text-base font-semibold bg-grey-900 hover:bg-grey-800 text-white shadow-lg">
            Commander NTA Eco
          </Button>
        </div>

        {/* Bottom Navigation - Style épuré */}
        <div className="bg-white border-t border-grey-100">
          <div className="px-6 py-4 flex justify-around">
            {[
              { icon: Home, label: "Accueil", key: "home", active: true },
              { icon: Clock, label: "Activité", key: "trajets", active: false },
              { icon: User, label: "Compte", key: "profil", active: false },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as any)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                  item.active 
                    ? 'text-grey-900 bg-grey-100' 
                    : 'text-grey-500 hover:text-grey-700 hover:bg-grey-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
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