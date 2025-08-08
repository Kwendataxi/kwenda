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
    <div className="h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col overflow-hidden">
      {/* Header avec progression */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-border/50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentStepIndex > 0 ? handlePrevious : onCancel}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Livraison Step-by-Step</h1>
              <p className="text-sm text-muted-foreground">
                Étape {currentStepIndex + 1}/5 • {steps[currentStepIndex]?.label}
              </p>
            </div>
          </div>
          {cityConfig && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {cityConfig.name}
            </Badge>
          )}
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex justify-between mt-2 text-xs">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex items-center gap-1">
                <StepIcon className={`w-3 h-3 ${
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={index <= currentStepIndex ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu principal - une seule étape visible */}
      <div className="flex-1 overflow-hidden">
        
        {/* ÉTAPE 1: Sélection de ville */}
        {currentStep === 'city' && (
          <div className="h-full flex flex-col">
            <div className="p-6 text-center flex-shrink-0">
              <Building className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Choisissez votre ville</h2>
              <p className="text-muted-foreground">Interface optimisée pour CI-RDC</p>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-auto">
              {supportedCities.map((city) => (
                <Card 
                  key={city.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedCity === city.id 
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                      : 'hover:border-primary/30 hover:bg-primary/5'
                  }`}
                  onClick={() => setSelectedCity(city.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedCity === city.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedCity === city.id && <CheckCircle2 className="w-2 h-2 text-white" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{city.name}</h3>
                        <p className="text-sm text-muted-foreground">{city.country}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {city.zones.slice(0, 3).map(zone => (
                            <Badge key={zone} variant="secondary" className="text-xs">{zone}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Point de départ */}
        {currentStep === 'pickup' && cityConfig && (
          <div className="h-full flex flex-col">
            <div className="p-4 text-center flex-shrink-0">
              <Target className="w-12 h-12 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-bold mb-1">Point de départ</h2>
              <p className="text-sm text-muted-foreground">Où récupérer votre colis à {cityConfig.name} ?</p>
            </div>
            
            {/* Interface de recherche optimisée */}
            <div className="flex-1 p-4">
              <div className="h-2/5 mb-4">
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
              </div>
              
              <EnhancedLocationSearch
                placeholder={`Rechercher l'adresse de départ à ${cityConfig.name}...`}
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
                label="Point de départ"
                icon={<Target className="w-5 h-5 text-primary" />}
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Destination */}
        {currentStep === 'destination' && cityConfig && (
          <div className="h-full flex flex-col">
            <div className="p-4 text-center flex-shrink-0">
              <MapPin className="w-12 h-12 mx-auto text-secondary mb-3" />
              <h2 className="text-xl font-bold mb-1">Destination</h2>
              <p className="text-sm text-muted-foreground">Où livrer à {cityConfig.name} ?</p>
            </div>
            
            <div className="flex-1 p-4">
              <div className="h-2/5 mb-4">
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
              </div>
              
              <EnhancedLocationSearch
                placeholder={`Rechercher l'adresse de destination à ${cityConfig.name}...`}
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
                label="Point de destination"
                icon={<MapPin className="w-5 h-5 text-secondary" />}
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Mode de livraison */}
        {currentStep === 'mode' && (
          <div className="h-full flex flex-col">
            <div className="p-4 text-center flex-shrink-0">
              <Package className="w-12 h-12 mx-auto text-accent mb-3" />
              <h2 className="text-xl font-bold mb-1">Mode de livraison</h2>
              <p className="text-sm text-muted-foreground">
                {distance > 0 ? `Distance: ${distance.toFixed(1)} km` : 'Choisissez votre service'}
              </p>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              {deliveryOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedMode === option.id;
                const price = distance > 0 ? option.priceEstimator(distance) : 0;
                
                return (
                  <Card 
                    key={option.id}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                        : 'hover:border-primary/30 hover:bg-primary/5'
                    }`}
                    onClick={() => setSelectedMode(option.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        isSelected ? 'bg-primary text-white' : 'bg-muted'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{option.name}</h3>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{option.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {option.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {price > 0 && (
                          <p className="text-xl font-bold text-primary">
                            {price.toLocaleString()} {cityConfig?.currency || 'FC'}
                          </p>
                        )}
                        {isSelected && <CheckCircle2 className="w-6 h-6 text-primary mx-auto mt-1" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Confirmation */}
        {currentStep === 'confirmation' && pickup && destination && (
          <div className="h-full flex flex-col">
            <div className="p-4 text-center flex-shrink-0">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h2 className="text-xl font-bold mb-1">Confirmation</h2>
              <p className="text-sm text-muted-foreground">Vérifiez votre commande</p>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              {/* Résumé avec carte mini */}
              <Card className="p-4">
                <div className="h-32 mb-4 rounded-lg overflow-hidden">
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
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Départ</p>
                      <p className="font-medium">{pickup.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{destination.address}</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Détails service */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {React.createElement(deliveryOptions.find(o => o.id === selectedMode)?.icon || Package, { 
                    className: "w-6 h-6 text-primary" 
                  })}
                  <div>
                    <h3 className="font-bold">
                      {deliveryOptions.find(o => o.id === selectedMode)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {deliveryOptions.find(o => o.id === selectedMode)?.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Distance</p>
                    <p className="font-medium">{distance.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temps estimé</p>
                    <p className="font-medium">
                      {deliveryOptions.find(o => o.id === selectedMode)?.time}
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Prix final */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total à payer</p>
                    <p className="text-2xl font-bold text-primary">
                      {estimatedPrice.toLocaleString()} {cityConfig?.currency || 'FC'}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Navigation bottom fixe */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-border/50 p-4 flex-shrink-0">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
          
          {currentStep !== 'confirmation' ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmOrder}
              disabled={!canProceed() || orderLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {orderLoading ? (
                <>
                  <Route className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmer la livraison
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