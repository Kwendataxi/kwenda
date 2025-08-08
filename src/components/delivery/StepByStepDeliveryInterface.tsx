import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CountryService } from '@/services/countryConfig';
import { GeocodingService } from '@/services/geocoding';
import { usePriceEstimator } from '@/hooks/usePricingRules';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLocationSearch } from '@/components/delivery/EnhancedLocationSearch';
import KwendaDynamicMap from '@/components/maps/KwendaDynamicMap';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  CheckCircle2,
  Navigation2,
  Clock,
  Package,
  Zap,
  Route,
  Building,
  Plane,
  ChevronRight
} from 'lucide-react';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface DeliveryOption {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  time: string;
  description: string;
  features: string[];
  priceEstimator: (distance: number) => number;
}

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type DeliveryStep = 'city' | 'pickup' | 'destination' | 'mode' | 'confirmation';

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('city');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge'>('flash');
  const [distance, setDistance] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { getCurrentPosition, detectCurrentCity } = useGeolocation();
  const { toast } = useToast();
  const { createDeliveryOrder, loading: orderLoading } = useDeliveryOrders();
  
  const { estimate: flashEstimate } = usePriceEstimator('delivery', 'flash');
  const { estimate: flexEstimate } = usePriceEstimator('delivery', 'flex');
  const { estimate: maxichargeEstimate } = usePriceEstimator('delivery', 'maxicharge');

  // Configuration des villes CI-RDC optimisées
  const supportedCities = [
    {
      id: 'kinshasa',
      name: 'Kinshasa',
      country: 'RDC',
      coordinates: [-4.4419, 15.2663] as [number, number],
      zones: ['Gombe', 'Bandalungwa', 'Lemba', 'Ngaliema', 'Matete', 'Masina'],
      currency: 'FC',
      popular: ['Aéroport N\'djili', 'Boulevard du 30 Juin', 'Marché Central'],
    },
    {
      id: 'lubumbashi',
      name: 'Lubumbashi',
      country: 'RDC',
      coordinates: [-11.6792, 27.5053] as [number, number],
      zones: ['Kenya', 'Kampemba', 'Kamalondo', 'Katuba'],
      currency: 'FC',
      popular: ['Aéroport Luano', 'Centre-ville', 'Université de Lubumbashi'],
    },
    {
      id: 'kolwezi',
      name: 'Kolwezi',
      country: 'RDC',
      coordinates: [-10.7148, 25.4665] as [number, number],
      zones: ['Centre-ville', 'Mutanda', 'Dilala'],
      currency: 'FC',
      popular: ['Mines de cuivre', 'Centre commercial'],
    },
    {
      id: 'abidjan',
      name: 'Abidjan',
      country: 'CI',
      coordinates: [5.3600, -4.0083] as [number, number],
      zones: ['Plateau', 'Cocody', 'Yopougon', 'Adjamé', 'Marcory'],
      currency: 'CFA',
      popular: ['Aéroport FHB', 'Plateau', 'Cocody Centre'],
    },
  ];

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'flash',
      name: 'Flash',
      subtitle: 'Moto ultra-rapide',
      icon: Bike,
      time: '15-30 min',
      description: 'Documents, petits colis',
      features: ['Livraison express', 'Jusqu\'à 5kg', 'Étanche'],
      priceEstimator: flashEstimate,
    },
    {
      id: 'flex',
      name: 'Flex',
      subtitle: 'Voiture confort',
      icon: Car,
      time: '30-60 min',
      description: 'Colis moyens, fragiles',
      features: ['Climatisé', 'Jusqu\'à 20kg', 'Manipulation soigneuse'],
      priceEstimator: flexEstimate,
    },
    {
      id: 'maxicharge',
      name: 'MaxiCharge',
      subtitle: 'Camion gros volume',
      icon: Truck,
      time: '1-2h',
      description: 'Électroménager, meubles',
      features: ['Assistant chargement', 'Jusqu\'à 500kg', 'Protection maximale'],
      priceEstimator: maxichargeEstimate,
    },
  ];

  const steps = [
    { id: 'city', label: 'Ville', icon: Building },
    { id: 'pickup', label: 'Départ', icon: Target },
    { id: 'destination', label: 'Arrivée', icon: MapPin },
    { id: 'mode', label: 'Mode', icon: Package },
    { id: 'confirmation', label: 'Confirmer', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Auto-détection de la ville
  useEffect(() => {
    const autoDetectCity = async () => {
      try {
        const currentCity = detectCurrentCity();
        const foundCity = supportedCities.find(city => 
          city.name.toLowerCase().includes(currentCity.toLowerCase())
        );
        
        if (foundCity) {
          setSelectedCity(foundCity.id);
          // Initialiser le pays correspondant
          const countryCode = foundCity.country === 'RDC' ? 'CD' : 'CI';
          CountryService.setCurrentCountry(countryCode);
          
          toast({
            title: `📍 ${foundCity.name} détectée`,
            description: `Interface optimisée pour ${foundCity.name}`,
          });
          
          // Passer directement à l'étape pickup si détection réussie
          setTimeout(() => setCurrentStep('pickup'), 1500);
        }
      } catch (error) {
        console.warn('Auto-detection failed, manual selection required');
      }
    };

    autoDetectCity();
  }, []);

  // Calcul du prix en temps réel
  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistance(pickup.coordinates, destination.coordinates);
      setDistance(dist);
      
      const option = deliveryOptions.find(opt => opt.id === selectedMode);
      if (option) {
        setEstimatedPrice(option.priceEstimator(dist));
      }
    }
  }, [pickup, destination, selectedMode]);

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentCityConfig = () => {
    return supportedCities.find(city => city.id === selectedCity);
  };

  const handleNext = () => {
    const stepOrder: DeliveryStep[] = ['city', 'pickup', 'destination', 'mode', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const stepOrder: DeliveryStep[] = ['city', 'pickup', 'destination', 'mode', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleConfirmOrder = async () => {
    if (!pickup || !destination) return;

    try {
      const orderData = {
        pickupLocation: pickup.address,
        deliveryLocation: destination.address,
        pickupCoordinates: { lat: pickup.coordinates[0], lng: pickup.coordinates[1] },
        deliveryCoordinates: { lat: destination.coordinates[0], lng: destination.coordinates[1] },
        deliveryType: selectedMode as 'flash' | 'cargo',
        estimatedPrice: estimatedPrice,
        city: selectedCity,
      };

      const result = await createDeliveryOrder(orderData);
      if (result) {
        onSubmit({
          orderId: result.id,
          mode: selectedMode,
          pickup,
          destination,
          price: estimatedPrice,
          distance,
          city: selectedCity
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'city': return !!selectedCity;
      case 'pickup': return !!pickup;
      case 'destination': return !!destination;
      case 'mode': return !!selectedMode;
      case 'confirmation': return !!(pickup && destination && selectedMode);
      default: return false;
    }
  };

  const cityConfig = getCurrentCityConfig();

  return (
    <div className="h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex flex-col overflow-hidden">
      {/* Header ultra-moderne avec glassmorphism */}
      <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 p-4 flex-shrink-0 shadow-lg relative">
        {/* Gradient overlay pour effet premium */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={currentStepIndex > 0 ? handlePrevious : onCancel}
                className="p-3 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">✨ Livraison Premium</h1>
                <p className="text-sm text-white/80 font-medium">
                  Étape {currentStepIndex + 1}/5 • {steps[currentStepIndex]?.label}
                </p>
              </div>
            </div>
            {cityConfig && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1 shadow-lg animate-pulse">
                📍 {cityConfig.name}
              </Badge>
            )}
          </div>
          
          {/* Barre de progression animée avec gradient */}
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
          
          {/* Indicateurs d'étapes modernisés */}
          <div className="flex justify-between mt-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-white text-primary shadow-lg scale-110' 
                      : 'bg-white/20 text-white/60 backdrop-blur-sm'
                  }`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal - une seule étape visible */}
      <div className="flex-1 overflow-hidden">
        
        {/* ÉTAPE 1: Sélection de ville - Design ultra-moderne */}
        {currentStep === 'city' && (
          <div className="h-full flex flex-col animate-fade-in">
            {/* En-tête avec animation et gradients */}
            <div className="p-8 text-center flex-shrink-0 bg-gradient-to-b from-white/30 to-transparent backdrop-blur-sm">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Building className="w-20 h-20 mx-auto text-primary relative z-10 drop-shadow-lg animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Choisissez votre ville
              </h2>
              <p className="text-muted-foreground text-lg font-medium">🌍 Interface optimisée pour CI-RDC</p>
            </div>
            
            {/* Cards de villes avec effets 3D */}
            <div className="flex-1 p-6 space-y-4 overflow-auto">
              {supportedCities.map((city, index) => (
                <Card 
                  key={city.id}
                  className={`p-6 cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${
                    selectedCity === city.id 
                      ? 'border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10 shadow-2xl scale-[1.02] ring-2 ring-primary/20' 
                      : 'hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 hover:shadow-xl border border-border/50 bg-white/50 backdrop-blur-sm'
                  }`}
                  onClick={() => setSelectedCity(city.id)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Radio moderne avec animation */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        selectedCity === city.id 
                          ? 'border-primary bg-primary shadow-lg scale-110' 
                          : 'border-muted-foreground hover:border-primary'
                      }`}>
                        {selectedCity === city.id && (
                          <div className="w-3 h-3 bg-white rounded-full animate-scale-in" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground">{city.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">🏳️ {city.country}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {city.zones.slice(0, 3).map(zone => (
                            <Badge 
                              key={zone} 
                              variant="secondary" 
                              className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 hover:scale-105 transition-transform"
                            >
                              {zone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 transition-all duration-300 ${
                      selectedCity === city.id ? 'text-primary scale-110' : 'text-muted-foreground'
                    }`} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Point de départ - Design premium */}
        {currentStep === 'pickup' && cityConfig && (
          <div className="h-full flex flex-col bg-gradient-to-b from-green-50/50 to-background animate-fade-in">
            {/* En-tête glassmorphism avec animation */}
            <div className="p-6 text-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-b border-white/20 flex-shrink-0 shadow-lg">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
                <Target className="w-16 h-16 mx-auto text-green-600 relative z-10 drop-shadow-lg animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🎯 Point de départ
              </h2>
              <p className="text-sm text-muted-foreground font-medium">Où récupérer votre colis à {cityConfig.name} ?</p>
            </div>
            
            {/* Zone de recherche ultra-moderne - 60% de l'écran */}
            <div className="flex-1 p-6 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-sm overflow-auto">
              <EnhancedLocationSearch
                placeholder={`🔍 Rechercher l'adresse de départ à ${cityConfig.name}...`}
                value={pickup ? {
                  address: pickup.address,
                  coordinates: { lat: pickup.coordinates[0], lng: pickup.coordinates[1] }
                } : undefined}
                onChange={(location) => {
                  setPickup({
                    address: location.address,
                    coordinates: [location.coordinates.lat, location.coordinates.lng]
                  });
                }}
                cityContext={{
                  name: cityConfig.name,
                  coordinates: cityConfig.coordinates,
                  popular: cityConfig.popular
                }}
                label="🎯 Point de départ"
                icon={<Target className="w-6 h-6 text-green-600 drop-shadow-sm" />}
              />
            </div>

            {/* Carte avec effet glassmorphism - 30% de l'écran */}
            <div className="h-1/3 p-4 bg-gradient-to-t from-gray-100/80 to-transparent">
              <Card className="h-full overflow-hidden shadow-2xl border-2 border-white/50 bg-white/10 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
                <KwendaDynamicMap
                  onLocationSelect={(coords) => {
                    GeocodingService.reverseGeocode(coords[0], coords[1]).then(address => {
                      setPickup({
                        address: address || 'Position sélectionnée',
                        coordinates: coords
                      });
                    });
                  }}
                  pickupLocation={pickup?.coordinates}
                  center={[cityConfig.coordinates[1], cityConfig.coordinates[0]]}
                  zoom={13}
                  height="100%"
                />
              </Card>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Destination - Design premium */}
        {currentStep === 'destination' && cityConfig && (
          <div className="h-full flex flex-col bg-gradient-to-b from-red-50/50 to-background animate-fade-in">
            {/* En-tête glassmorphism avec animation */}
            <div className="p-6 text-center bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl border-b border-white/20 flex-shrink-0 shadow-lg">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-red-400/30 rounded-full blur-xl animate-pulse" />
                <MapPin className="w-16 h-16 mx-auto text-red-600 relative z-10 drop-shadow-lg animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                📍 Destination
              </h2>
              <p className="text-sm text-muted-foreground font-medium">Où livrer à {cityConfig.name} ?</p>
            </div>
            
            {/* Zone de recherche ultra-moderne - 60% de l'écran */}
            <div className="flex-1 p-6 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-sm overflow-auto">
              <EnhancedLocationSearch
                placeholder={`🔍 Rechercher l'adresse de destination à ${cityConfig.name}...`}
                value={destination ? {
                  address: destination.address,
                  coordinates: { lat: destination.coordinates[0], lng: destination.coordinates[1] }
                } : undefined}
                onChange={(location) => {
                  setDestination({
                    address: location.address,
                    coordinates: [location.coordinates.lat, location.coordinates.lng]
                  });
                }}
                cityContext={{
                  name: cityConfig.name,
                  coordinates: cityConfig.coordinates,
                  popular: cityConfig.popular
                }}
                label="📍 Point de destination"
                icon={<MapPin className="w-6 h-6 text-red-600 drop-shadow-sm" />}
              />
            </div>

            {/* Carte avec effet glassmorphism - 30% de l'écran */}
            <div className="h-1/3 p-4 bg-gradient-to-t from-gray-100/80 to-transparent">
              <Card className="h-full overflow-hidden shadow-2xl border-2 border-white/50 bg-white/10 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
                <KwendaDynamicMap
                  onLocationSelect={(coords) => {
                    GeocodingService.reverseGeocode(coords[0], coords[1]).then(address => {
                      setDestination({
                        address: address || 'Position sélectionnée',
                        coordinates: coords
                      });
                    });
                  }}
                  pickupLocation={pickup?.coordinates}
                  destination={destination?.coordinates}
                  showRouting={!!(pickup && destination)}
                  center={[cityConfig.coordinates[1], cityConfig.coordinates[0]]}
                  zoom={13}
                  height="100%"
                />
              </Card>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Mode de livraison - Design premium */}
        {currentStep === 'mode' && (
          <div className="h-full flex flex-col bg-gradient-to-b from-blue-50/50 to-background animate-fade-in">
            {/* En-tête glassmorphism avec animation */}
            <div className="p-6 text-center bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border-b border-white/20 flex-shrink-0 shadow-lg">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
                <Package className="w-16 h-16 mx-auto text-blue-600 relative z-10 drop-shadow-lg animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🚀 Mode de livraison
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {distance > 0 ? `📏 Distance: ${distance.toFixed(1)} km` : '⚡ Choisissez votre service'}
              </p>
            </div>
            
            {/* Cards de modes avec effet 3D */}
            <div className="flex-1 p-6 space-y-4 overflow-auto">
              {deliveryOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedMode === option.id;
                const price = distance > 0 ? option.priceEstimator(distance) : 0;
                
                return (
                  <Card 
                    key={option.id}
                    className={`p-6 cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${
                      isSelected 
                        ? 'border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10 shadow-2xl scale-[1.02] ring-2 ring-primary/20' 
                        : 'hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 hover:shadow-xl border border-border/50 bg-white/50 backdrop-blur-sm'
                    }`}
                    onClick={() => setSelectedMode(option.id)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icône avec animation */}
                      <div className={`p-4 rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-110' 
                          : 'bg-gradient-to-r from-muted to-muted/80 text-muted-foreground hover:scale-105'
                      }`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-xl text-foreground">{option.name}</h3>
                          <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20">
                            {option.subtitle}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">{option.time}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 font-medium">{option.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {option.features.map(feature => (
                            <Badge 
                              key={feature} 
                              variant="secondary" 
                              className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 hover:scale-105 transition-transform"
                            >
                              ✓ {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {price > 0 && (
                          <div className="mb-2">
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {price.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">{cityConfig?.currency || 'FC'}</p>
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-green-600 animate-scale-in" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Confirmation - Design ultra-premium */}
        {currentStep === 'confirmation' && pickup && destination && (
          <div className="h-full flex flex-col bg-gradient-to-b from-green-50/50 to-background animate-fade-in">
            {/* En-tête glassmorphism avec animation */}
            <div className="p-6 text-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-b border-white/20 flex-shrink-0 shadow-lg">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 relative z-10 drop-shadow-lg animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ✅ Confirmation
              </h2>
              <p className="text-sm text-muted-foreground font-medium">Vérifiez votre commande premium</p>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-auto">
              {/* Carte avec itinéraire - Design premium */}
              <Card className="p-6 shadow-2xl border-2 border-white/50 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Itinéraire de livraison
                </h3>
                <div className="h-40 mb-4 rounded-xl overflow-hidden shadow-lg">
                  <KwendaDynamicMap
                    pickupLocation={pickup.coordinates}
                    destination={destination.coordinates}
                    showRouting={true}
                    center={[cityConfig!.coordinates[1], cityConfig!.coordinates[0]]}
                    zoom={12}
                    height="100%"
                    deliveryMode={selectedMode}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700">🎯 Point de départ</p>
                      <p className="font-semibold text-green-800">{pickup.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">📍 Destination</p>
                      <p className="font-semibold text-red-800">{destination.address}</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Détails service premium */}
              <Card className="p-6 shadow-2xl border-2 border-white/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                    {React.createElement(deliveryOptions.find(o => o.id === selectedMode)?.icon || Package, { 
                      className: "w-6 h-6 text-white" 
                    })}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">
                      {deliveryOptions.find(o => o.id === selectedMode)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {deliveryOptions.find(o => o.id === selectedMode)?.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <p className="text-muted-foreground text-sm font-medium">📏 Distance</p>
                    <p className="font-bold text-lg text-foreground">{distance.toFixed(1)} km</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                    <p className="text-muted-foreground text-sm font-medium">⏱️ Temps estimé</p>
                    <p className="font-bold text-lg text-foreground">
                      {deliveryOptions.find(o => o.id === selectedMode)?.time}
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Prix final avec effet premium */}
              <Card className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/30 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">💰 Total à payer</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {estimatedPrice.toLocaleString()} {cityConfig?.currency || 'FC'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Prix tout compris</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
                    <Zap className="w-12 h-12 text-yellow-500 relative z-10 drop-shadow-lg animate-bounce" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Navigation bottom ultra-moderne */}
      <div className="bg-white/20 backdrop-blur-xl border-t border-white/20 p-4 flex-shrink-0 shadow-lg relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-xl" />
        <div className="relative z-10 flex gap-4">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 h-14 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Précédent
            </Button>
          )}
          
          {currentStep !== 'confirmation' ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="font-semibold">Suivant</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmOrder}
              disabled={!canProceed() || orderLoading}
              className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {orderLoading ? (
                <>
                  <Route className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-semibold">Création...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-semibold">🚀 Confirmer la livraison</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepByStepDeliveryInterface;