import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Car, 
  Clock, 
  Star, 
  User, 
  CreditCard, 
  History, 
  Home, 
  Building2, 
  ArrowLeft, 
  Bell, 
  Leaf, 
  Shield,
  Truck,
  Package,
  Store,
  Plus,
  Search,
  Camera,
  Upload,
  Activity,
  Bike
} from 'lucide-react';

// Transport components
import LocationInput from '@/components/transport/LocationInput';
import VehicleSelection from '@/components/transport/VehicleSelection';
import BookingFlow from '@/components/transport/BookingFlow';
import InteractiveMap from '@/components/transport/InteractiveMap';

// Delivery components
import PackageTypeSelector from '@/components/delivery/PackageTypeSelector';
import DeliveryForm, { DeliveryFormData } from '@/components/delivery/DeliveryForm';
import DeliveryTracking from '@/components/delivery/DeliveryTracking';

interface Location {
  address: string;
  coordinates: [number, number];
  type?: 'home' | 'work' | 'other';
}

interface Vehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  estimatedTime: number;
  available: boolean;
  icon: any;
  features: string[];
  capacity: number;
  eco?: boolean;
  multiplier: number;
}

interface PackageType {
  id: string;
  name: string;
  description: string;
  maxWeight: string;
  maxDimensions: string;
  basePrice: number;
  estimatedTime: string;
  icon: string;
  popular?: boolean;
  examples: string[];
}

const ClientApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [serviceType, setServiceType] = useState('transport');
  
  // Transport states
  const [transportStep, setTransportStep] = useState<'search' | 'selection' | 'booking'>('search');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [pickupInput, setPickupInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  // Delivery states  
  const [deliveryStep, setDeliveryStep] = useState<'package' | 'form' | 'tracking'>('package');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  const renderHome = () => (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header - Style Taga */}
      <div className="px-6 pt-safe-top pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground tracking-tight">Bonjour à Kinshasa</p>
              <p className="text-sm text-muted-foreground -mt-0.5">Bienvenue sur Kwenda Taxi</p>
            </div>
          </div>
          <div className="relative p-2">
            <Bell className="h-6 w-6 text-grey-700" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Service Tabs */}
      <div className="px-6 pb-6">
        <Tabs value={serviceType} onValueChange={setServiceType} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-grey-100">
            <TabsTrigger value="transport" className="flex items-center gap-2 data-[state=active]:bg-grey-900 data-[state=active]:text-white rounded-xl">
              <Car className="w-4 h-4" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2 data-[state=active]:bg-grey-900 data-[state=active]:text-white rounded-xl">
              <Truck className="w-4 h-4" />
              Livraison
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2 data-[state=active]:bg-grey-900 data-[state=active]:text-white rounded-xl">
              <Store className="w-4 h-4" />
              Vendre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transport">
            {renderTransportService()}
          </TabsContent>
          
          <TabsContent value="delivery">
            {renderDeliveryService()}
          </TabsContent>
          
          <TabsContent value="marketplace">
            {renderMarketplaceService()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const calculateDistance = (pickup: Location, destination: Location) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (destination.coordinates[1] - pickup.coordinates[1]) * Math.PI / 180;
    const dLon = (destination.coordinates[0] - pickup.coordinates[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickup.coordinates[1] * Math.PI / 180) * Math.cos(destination.coordinates[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocationSelect = (location: Location, type: 'pickup' | 'destination') => {
    if (type === 'pickup') {
      setPickupLocation(location);
      setPickupInput(location.address);
    } else {
      setDestinationLocation(location);
      setDestinationInput(location.address);
    }

    // Automatically move to vehicle selection if both locations are set
    if ((type === 'pickup' && destinationLocation) || (type === 'destination' && pickupLocation)) {
      setTransportStep('selection');
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setTransportStep('booking');
  };

  const handleBookingComplete = () => {
    // Reset state and show success
    setTransportStep('search');
    setPickupLocation(null);
    setDestinationLocation(null);
    setSelectedVehicle(null);
    setPickupInput('');
    setDestinationInput('');
    
    // Could show a success toast here
    console.log('Trajet terminé avec succès!');
  };

  const handleBookingCancel = () => {
    if (transportStep === 'booking') {
      setTransportStep('selection');
    } else {
      setTransportStep('search');
      setSelectedVehicle(null);
    }
  };

  const renderTransportService = () => {
    if (transportStep === 'booking' && pickupLocation && destinationLocation && selectedVehicle) {
      const distance = calculateDistance(pickupLocation, destinationLocation);
      return (
        <BookingFlow
          pickup={pickupLocation}
          destination={destinationLocation}
          selectedVehicle={selectedVehicle}
          distance={distance}
          onBookingComplete={handleBookingComplete}
          onCancel={handleBookingCancel}
        />
      );
    }

    if (transportStep === 'selection' && pickupLocation && destinationLocation) {
      const distance = calculateDistance(pickupLocation, destinationLocation);
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTransportStep('search')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-grey-900">Choisir un véhicule</h2>
          </div>

          <InteractiveMap
            pickup={pickupLocation}
            destination={destinationLocation}
            showRoute={true}
            className="h-[200px]"
          />

          <VehicleSelection
            distance={distance}
            onVehicleSelect={handleVehicleSelect}
            selectedVehicleId={selectedVehicle?.id}
          />
        </div>
      );
    }

    // Default search view
    return (
      <div className="space-y-6">
        {/* Location inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-grey-900 mb-2 block">Lieu de prise en charge</label>
            <LocationInput
              placeholder="D'où partez-vous ?"
              value={pickupInput}
              onChange={(location) => handleLocationSelect(location, 'pickup')}
              onInputChange={setPickupInput}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-grey-900 mb-2 block">Destination</label>
            <LocationInput
              placeholder="Où allez-vous ?"
              value={destinationInput}
              onChange={(location) => handleLocationSelect(location, 'destination')}
              onInputChange={setDestinationInput}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => handleLocationSelect({
              address: "Commune de Kalamu, Kinshasa",
              coordinates: [-15.3094, 4.3076],
              type: 'home'
            }, 'pickup')}
            className="flex-1 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-grey-100 hover:border-grey-200 transition-colors"
          >
            <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-grey-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-grey-900">Domicile</p>
              <p className="text-xs text-grey-500">Kalamu</p>
            </div>
          </button>
          <button 
            onClick={() => handleLocationSelect({
              address: "Commune de Gombe, Kinshasa",
              coordinates: [-15.3094, 4.3276],
              type: 'work'
            }, 'pickup')}
            className="flex-1 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-grey-100 hover:border-grey-200 transition-colors"
          >
            <div className="w-8 h-8 bg-grey-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-grey-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-grey-900">Bureau</p>
              <p className="text-xs text-grey-500">Gombe</p>
            </div>
          </button>
        </div>

        {/* Interactive Map */}
        <InteractiveMap
          pickup={pickupLocation}
          destination={destinationLocation}
          onLocationSelect={(location) => {
            if (!pickupLocation) {
              handleLocationSelect(location, 'pickup');
            } else if (!destinationLocation) {
              handleLocationSelect(location, 'destination');
            }
          }}
          className="h-[240px]"
        />

        {/* Continue button - only show if both locations are selected */}
        {pickupLocation && destinationLocation && (
          <Button 
            onClick={() => setTransportStep('selection')}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-primary hover:shadow-glow text-white transition-all duration-300"
          >
            <Car className="w-5 h-5 mr-2" />
            Voir les véhicules disponibles
          </Button>
        )}

        {/* Info card */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🚖 Kwenda Taxi à Kinshasa</h4>
          <p className="text-sm text-blue-700">
            Service de transport fiable et économique. Tarifs transparents, chauffeurs vérifiés.
          </p>
        </div>
      </div>
    );
  };

  // Delivery handlers
  const handlePackageSelect = (packageType: PackageType) => {
    setSelectedPackage(packageType);
    setDeliveryStep('form');
  };

  const handleDeliverySubmit = (formData: DeliveryFormData) => {
    // Generate delivery ID and start tracking
    const newDeliveryId = 'KWT' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setDeliveryId(newDeliveryId);
    setDeliveryStep('tracking');
    
    console.log('Livraison créée:', { id: newDeliveryId, package: selectedPackage, ...formData });
  };

  const handleDeliveryComplete = () => {
    // Reset delivery state
    setDeliveryStep('package');
    setSelectedPackage(null);
    setDeliveryId(null);
  };

  const handleDeliveryCancel = () => {
    if (deliveryStep === 'form') {
      setDeliveryStep('package');
      setSelectedPackage(null);
    } else {
      setDeliveryStep('package');
    }
  };

  const calculateDeliveryPrice = (packageType: PackageType, pickup: string, destination: string) => {
    // Simple distance calculation simulation
    const baseDistance = 5; // km
    const pricePerKm = 300; // FC per km
    const totalPrice = packageType.basePrice + (baseDistance * pricePerKm);
    return totalPrice;
  };

  const renderDeliveryService = () => {
    if (deliveryStep === 'tracking' && deliveryId) {
      return (
        <DeliveryTracking
          deliveryId={deliveryId}
          onComplete={handleDeliveryComplete}
        />
      );
    }

    if (deliveryStep === 'form' && selectedPackage) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeliveryStep('package')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-grey-900">{selectedPackage.name}</h2>
              <p className="text-sm text-grey-600">Remplissez les informations de livraison</p>
            </div>
          </div>

          <DeliveryForm
            selectedPackage={selectedPackage}
            onSubmit={handleDeliverySubmit}
            onCancel={handleDeliveryCancel}
          />
        </div>
      );
    }

    // Default package selection view
    return (
      <PackageTypeSelector
        onPackageSelect={handlePackageSelect}
        selectedPackageId={selectedPackage?.id}
      />
    );
  };

  const renderMarketplaceService = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-grey-100 p-4 text-center hover:border-grey-200 transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-grey-900 mb-1">Vendre</h4>
          <p className="text-sm text-grey-600">Publier une annonce</p>
        </div>
        
        <div className="bg-white rounded-xl border border-grey-100 p-4 text-center hover:border-grey-200 transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 bg-grey-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-grey-600" />
          </div>
          <h4 className="font-semibold text-grey-900 mb-1">Acheter</h4>
          <p className="text-sm text-grey-600">Rechercher des produits</p>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-grey-900 mb-4">Catégories populaires</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Mode", icon: "👕" },
            { name: "Tech", icon: "📱" },
            { name: "Maison", icon: "🏠" },
            { name: "Auto", icon: "🚗" },
            { name: "Sport", icon: "⚽" },
            { name: "Livres", icon: "📚" },
          ].map((category, index) => (
            <div key={index} className="bg-white rounded-xl border border-grey-100 p-3 text-center hover:border-grey-200 transition-all duration-200 cursor-pointer">
              <div className="text-2xl mb-2">{category.icon}</div>
              <p className="text-sm font-medium text-grey-900">{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <h3 className="text-lg font-semibold text-grey-900 mb-4">Annonces récentes</h3>
        <div className="space-y-3">
          {[
            { name: "iPhone 13 Pro", price: "450,000", location: "Cocody", image: "📱" },
            { name: "Ordinateur portable", price: "320,000", location: "Plateau", image: "💻" },
            { name: "Vélo VTT", price: "85,000", location: "Marcory", image: "🚴" },
          ].map((product, index) => (
            <div key={index} className="bg-white rounded-xl border border-grey-100 p-4 hover:border-grey-200 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-grey-50 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{product.image}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-grey-900">{product.name}</h4>
                  <p className="text-sm text-grey-600">{product.location}</p>
                  <p className="font-bold text-primary mt-1">{product.price} CFA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full h-14 rounded-2xl text-base font-semibold bg-grey-900 hover:bg-grey-800 text-white shadow-lg">
        <Camera className="w-5 h-5 mr-2" />
        Publier une annonce
      </Button>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-background pb-20">
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
    <div className="min-h-screen bg-background pb-20">
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
          <h1 className="text-heading-lg text-card-foreground">Activité</h1>
        </div>

        <div className="space-y-4">
          {[
            { from: "Cocody", to: "Plateau", date: "15 Janv. 2024", time: "14:30", price: "2,500", driver: "Kouame Paul", rating: 4.9, type: "transport" },
            { from: "Marcory", to: "Treichville", date: "14 Janv. 2024", time: "16:45", price: "1,800", driver: "Traore Sekou", rating: 4.8, type: "delivery" },
            { from: "Plateau", to: "Yopougon", date: "13 Janv. 2024", time: "09:20", price: "3,200", driver: "Diallo Mamadou", rating: 5.0, type: "transport" },
          ].map((trip, index) => (
            <div key={index} className="card-floating p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {trip.type === 'delivery' ? (
                      <Package className="h-4 w-4 text-primary" />
                    ) : (
                      <Car className="h-4 w-4 text-primary" />
                    )}
                    <p className="text-body-md font-semibold text-card-foreground">{trip.from} → {trip.to}</p>
                  </div>
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
    <div className="min-h-screen bg-background pb-20">
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

  return (
    <div className="relative">
      {/* Main Content */}
      {(() => {
        switch (currentView) {
          case 'profil':
          case 'profile':
            return renderProfile();
          case 'activity':
          case 'history':
            return renderHistory();
          case 'paiement':
          case 'payment':
            return renderPayment();
          default:
            return renderHome();
        }
      })()}

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-grey-100 z-50">
        <div className="px-6 py-4 flex justify-around max-w-md mx-auto">
          {[
            { icon: Home, label: "Accueil", key: "home" },
            { icon: Activity, label: "Activité", key: "activity" },
            { icon: User, label: "Compte", key: "profil" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                currentView === item.key 
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
  );
};

export default ClientApp;