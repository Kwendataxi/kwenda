import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import InteractiveMap from '@/components/transport/InteractiveMap';
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
  CheckCircle,
  Home,
  ArrowLeft,
  Map,
  Route,
  Award,
  TrendingUp,
  Activity,
  Calendar,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const DriverApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const [rideStatus, setRideStatus] = useState('waiting'); // waiting, accepted, arrived, inProgress, completed
  const [showNavigation, setShowNavigation] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [earnings, setEarnings] = useState({
    today: 45500,
    thisWeek: 186500,
    rides: 12,
    hours: 8,
    rating: 4.9
  });

  // Simulate real-time updates
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => {
        setEarnings(prev => ({
          ...prev,
          today: prev.today + Math.floor(Math.random() * 500),
          rides: prev.rides + (Math.random() > 0.8 ? 1 : 0)
        }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const handleAcceptRide = () => {
    setRideStatus('accepted');
    setHasActiveRide(true);
    setShowNavigation(true);
  };

  const handleArriveAtPickup = () => {
    setRideStatus('arrived');
    setShowNavigation(false);
  };

  const handleStartRide = () => {
    setRideStatus('inProgress');
    setShowNavigation(true);
  };

  const handleCompleteRide = () => {
    setRideStatus('completed');
    setShowNavigation(false);
    setShowRating(true);
  };

  const handleRating = (rating: number) => {
    setCurrentRating(rating);
    // Update earnings
    setEarnings(prev => ({
      ...prev,
      today: prev.today + 2500,
      rides: prev.rides + 1
    }));
    
    // Reset state
    setTimeout(() => {
      setShowRating(false);
      setHasActiveRide(false);
      setRideStatus('waiting');
      setCurrentRating(0);
    }, 2000);
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="card-floating mx-4 mt-4 p-4 flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-elegant">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-heading-sm text-card-foreground">Kouame Paul</p>
            <p className="text-body-sm text-muted-foreground">Chauffeur NTA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isOnline ? "default" : "outline"}
            size="sm"
            onClick={() => setIsOnline(!isOnline)}
            className={`rounded-xl font-semibold transition-all duration-200 ${
              isOnline 
                ? "bg-secondary text-secondary-foreground shadow-md" 
                : "border-grey-300 hover:border-secondary hover:bg-secondary-light"
            }`}
          >
            {isOnline ? "🟢 En ligne" : "⚪ Hors ligne"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="card-floating p-4 text-center animate-scale-in">
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-2">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <p className="text-caption text-muted-foreground mb-1">Gains aujourd'hui</p>
          <p className="text-heading-sm text-card-foreground font-bold">{earnings.today.toLocaleString()} CFA</p>
        </div>
        <div className="card-floating p-4 text-center animate-scale-in">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mx-auto mb-2">
            <Car className="h-5 w-5 text-white" />
          </div>
          <p className="text-caption text-muted-foreground mb-1">Courses</p>
          <p className="text-heading-sm text-card-foreground font-bold">{earnings.rides}</p>
        </div>
        <div className="card-floating p-4 text-center animate-scale-in">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto mb-2">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <p className="text-caption text-muted-foreground mb-1">Temps en ligne</p>
          <p className="text-heading-sm text-card-foreground font-bold">{earnings.hours}h</p>
        </div>
      </div>

      {/* Recent Rides */}
      <div className="flex-1 p-4">
        <h3 className="text-heading-md text-card-foreground mb-4">Courses récentes</h3>
        <div className="space-y-3">
          {[
            { from: "Cocody", to: "Plateau", time: "14:30", amount: "2,500", client: "Jean Kouassi" },
            { from: "Marcory", to: "Yopougon", time: "13:15", amount: "1,800", client: "Marie Diallo" },
            { from: "Treichville", to: "Plateau", time: "12:45", amount: "3,200", client: "Paul Yao" },
          ].map((ride, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-light rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-body-md font-medium text-card-foreground">{ride.from}</span>
                </div>
                <span className="text-caption text-muted-foreground bg-grey-100 px-2 py-1 rounded-md">{ride.time}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-body-md text-card-foreground">{ride.to}</span>
                </div>
                <div className="text-right">
                  <span className="text-body-md font-bold text-secondary">{ride.amount}</span>
                  <span className="text-caption text-muted-foreground ml-1">CFA</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-grey-100">
                <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-body-sm text-muted-foreground">{ride.client}</span>
                <div className="flex items-center gap-1 ml-auto">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span className="text-caption font-medium">5.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-grey-100 px-6 py-3 flex justify-around">
        {[
          { icon: Home, label: "Tableau de bord", view: "dashboard" },
          { icon: DollarSign, label: "Gains", view: "earnings" },
          { icon: Map, label: "Navigation", view: "navigation" },
          { icon: User, label: "Profil", view: "profile" },
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

  const renderRideRequest = () => (
    <div className="min-h-screen bg-background p-4">
      <Card className="card-floating border-0 animate-scale-in">
        <CardHeader className="text-center bg-gradient-primary text-primary-foreground rounded-t-xl">
          <CardTitle className="text-heading-lg">Nouvelle demande de course</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-heading-md text-card-foreground font-bold">Jean Kouassi</h3>
            <div className="flex items-center justify-center mt-2">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="text-body-md font-medium">4.8</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-secondary rounded-full mt-1 shadow-sm"></div>
              <div>
                <p className="text-body-md font-semibold text-card-foreground">Point de départ</p>
                <p className="text-body-sm text-muted-foreground">Cocody, Riviera Golf</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1 shadow-sm"></div>
              <div>
                <p className="text-body-md font-semibold text-card-foreground">Destination</p>
                <p className="text-body-sm text-muted-foreground">Plateau, Immeuble CCIA</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-grey-50 rounded-xl">
              <p className="text-caption text-muted-foreground">Distance</p>
              <p className="text-heading-sm font-bold text-card-foreground">12.5 km</p>
            </div>
            <div className="text-center p-4 bg-grey-50 rounded-xl">
              <p className="text-caption text-muted-foreground">Estimation</p>
              <p className="text-heading-sm font-bold text-card-foreground">2,500 CFA</p>
            </div>
          </div>

          <div className="flex space-x-3 mb-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-grey-300 hover:border-red-400 hover:bg-red-50"
              onClick={() => setIsOnline(false)}
            >
              Refuser
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow"
              onClick={handleAcceptRide}
            >
              Accepter
            </Button>
          </div>

          <div className="flex justify-center space-x-4">
            <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-grey-50 hover:bg-accent-light">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="w-12 h-12 rounded-xl bg-grey-50 hover:bg-accent-light">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEarnings = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Gains</h1>
        </div>

        <Card className="card-floating border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-heading-md">Cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-display-md font-bold text-primary">186,500</p>
              <p className="text-body-sm text-muted-foreground">CFA</p>
              <p className="text-body-sm text-secondary font-medium bg-secondary-light px-2 py-1 rounded-md inline-block mt-2">+15% vs semaine dernière</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-caption text-muted-foreground">Courses</p>
                <p className="text-heading-sm font-bold text-card-foreground">47</p>
              </div>
              <div className="text-center">
                <p className="text-caption text-muted-foreground">Heures</p>
                <p className="text-heading-sm font-bold text-card-foreground">32h</p>
              </div>
              <div className="text-center">
                <p className="text-caption text-muted-foreground">Note moy.</p>
                <p className="text-heading-sm font-bold text-card-foreground">4.9</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-heading-md text-card-foreground">Détail des gains</h3>
          {[
            { date: "Aujourd'hui", amount: "45,500", rides: 12 },
            { date: "Hier", amount: "38,200", rides: 10 },
            { date: "15 Janv", amount: "52,100", rides: 14 },
            { date: "14 Janv", amount: "41,800", rides: 11 },
          ].map((day, index) => (
            <div key={index} className="card-floating p-4 flex items-center justify-between hover:shadow-lg transition-all duration-200">
              <div>
                <p className="text-body-md font-semibold text-card-foreground">{day.date}</p>
                <p className="text-body-sm text-muted-foreground">{day.rides} courses</p>
              </div>
              <div className="text-right">
                <p className="text-heading-sm font-bold text-card-foreground">{day.amount}</p>
                <p className="text-caption text-muted-foreground">CFA</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveRide = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-heading-lg text-card-foreground">Course en cours</h1>
          <Badge 
            variant="outline" 
            className={`
              ${rideStatus === 'accepted' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
              ${rideStatus === 'arrived' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
              ${rideStatus === 'inProgress' ? 'bg-green-100 text-green-800 border-green-300' : ''}
            `}
          >
            {rideStatus === 'accepted' && '🚗 En route vers client'}
            {rideStatus === 'arrived' && '📍 Arrivé au point de départ'}
            {rideStatus === 'inProgress' && '🏁 Course en cours'}
          </Badge>
        </div>

        <Card className="card-floating border-0 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-heading-sm font-bold text-card-foreground">Jean Kouassi</h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-body-sm">4.8</span>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl bg-grey-50">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl bg-grey-50">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="text-body-md">Cocody, Riviera Golf</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-body-md">Plateau, Immeuble CCIA</span>
              </div>
            </div>

            <div className="flex gap-3">
              {rideStatus === 'accepted' && (
                <Button 
                  onClick={handleArriveAtPickup}
                  className="flex-1 bg-gradient-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Je suis arrivé
                </Button>
              )}
              {rideStatus === 'arrived' && (
                <Button 
                  onClick={handleStartRide}
                  className="flex-1 bg-gradient-primary"
                >
                  <Route className="w-4 h-4 mr-2" />
                  Commencer la course
                </Button>
              )}
              {rideStatus === 'inProgress' && (
                <Button 
                  onClick={handleCompleteRide}
                  className="flex-1 bg-secondary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Terminer la course
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowNavigation(!showNavigation)}
                className="px-4"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {showNavigation && (
          <Card className="card-floating border-0 mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation GPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveMap 
                pickup={{
                  address: "Cocody, Riviera Golf",
                  coordinates: [-4.0167, 5.3647]
                }}
                destination={{
                  address: "Plateau, Immeuble CCIA", 
                  coordinates: [-4.0083, 5.3197]
                }}
                driverLocation={[-4.0125, 5.3422]}
                showRoute={true}
                className="h-64"
              />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Temps estimé: 18 min</span>
                <span className="text-muted-foreground">Distance: 12.5 km</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Navigation</h1>
        </div>

        <Card className="card-floating border-0">
          <CardContent className="p-0">
            <InteractiveMap className="h-96 rounded-xl" />
          </CardContent>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="card-floating border-0 p-4 text-center">
            <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-caption text-muted-foreground">Statut</p>
            <p className="text-body-md font-semibold text-card-foreground">
              {isOnline ? "En ligne" : "Hors ligne"}
            </p>
          </Card>
          <Card className="card-floating border-0 p-4 text-center">
            <TrendingUp className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-caption text-muted-foreground">Revenus/h</p>
            <p className="text-body-md font-semibold text-card-foreground">
              {Math.round(earnings.today / earnings.hours).toLocaleString()} CFA
            </p>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderRatingModal = () => {
    if (!showRating) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-sm card-floating border-0 animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-heading-md">Évaluer le client</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <p className="text-body-md font-semibold mb-4">Jean Kouassi</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= currentRating 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-grey-300'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleRating(3)}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Problème
              </Button>
              <Button 
                className="flex-1 bg-gradient-primary"
                onClick={() => handleRating(5)}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Parfait
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading-lg text-card-foreground">Profil</h1>
        </div>

        <Card className="card-floating border-0 mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-heading-lg font-bold text-card-foreground mb-2">Kouame Paul</h2>
            <p className="text-body-md text-muted-foreground mb-4">Chauffeur NTA Premium</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-heading-sm font-bold text-card-foreground">{earnings.rating}</span>
              <span className="text-body-sm text-muted-foreground">(1,247 avis)</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="card-floating border-0 p-4">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <p className="text-body-md font-semibold text-card-foreground">Chauffeur du mois</p>
                <p className="text-body-sm text-muted-foreground">Janvier 2024</p>
              </div>
            </div>
          </Card>

          <Card className="card-floating border-0 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-secondary" />
              <div>
                <p className="text-body-md font-semibold text-card-foreground">Membre depuis</p>
                <p className="text-body-sm text-muted-foreground">Mars 2023</p>
              </div>
            </div>
          </Card>

          <Card className="card-floating border-0 p-4">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-accent" />
              <div>
                <p className="text-body-md font-semibold text-card-foreground">Véhicule</p>
                <p className="text-body-sm text-muted-foreground">Toyota Corolla 2020 - ABC 123 CI</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {(() => {
        if (hasActiveRide) {
          return renderActiveRide();
        }

        if (isOnline && currentView === 'dashboard' && !hasActiveRide) {
          return renderRideRequest();
        }

        switch (currentView) {
          case 'earnings':
            return renderEarnings();
          case 'navigation':
            return renderNavigation();
          case 'profile':
            return renderProfile();
          default:
            return renderDashboard();
        }
      })()}
      {renderRatingModal()}
    </>
  );
};

export default DriverApp;