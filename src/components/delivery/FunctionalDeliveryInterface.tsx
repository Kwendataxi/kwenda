import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useDriverAssignment } from '@/hooks/useDriverAssignment';
import { 
  ArrowLeft,
  ArrowRight,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Zap,
  Timer,
  User,
  Phone,
  Navigation,
  Search,
  X,
  Check,
  Loader2
} from 'lucide-react';

// Types
interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryData {
  pickup: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
  };
  destination: {
    location: DeliveryLocation | null;
    contact: ContactInfo;
  };
  serviceMode: 'flash' | 'flex' | 'maxicharge' | null;
  packageDetails: {
    description: string;
    weight: string;
    instructions: string;
  };
  pricing: {
    distance: number;
    duration: number;
    price: number;
  };
}

// Configuration des modes de livraison
const deliveryModes = [
  {
    id: 'flash' as const,
    name: 'Kwenda Flash',
    subtitle: 'Livraison express',
    icon: Zap,
    time: '30-45 min',
    description: 'Livraison ultra-rapide pour vos urgences',
    features: ['Moto-taxi', 'Suivi temps réel', 'Priorité absolue'],
    basePrice: 5000,
    pricePerKm: 500,
    vehicleType: 'moto'
  },
  {
    id: 'flex' as const,
    name: 'Kwenda Flex',
    subtitle: 'Livraison standard',
    icon: Package,
    time: '1-2 heures',
    description: 'Livraison fiable au meilleur prix',
    features: ['Voiture/Moto', 'Suivi temps réel', 'Économique'],
    basePrice: 3000,
    pricePerKm: 300,
    vehicleType: 'car'
  },
  {
    id: 'maxicharge' as const,
    name: 'Kwenda MaxiCharge',
    subtitle: 'Gros colis',
    icon: Truck,
    time: '2-4 heures',
    description: 'Pour vos gros colis et meubles',
    features: ['Camionnette', 'Aide au portage', 'Sécurisé'],
    basePrice: 8000,
    pricePerKm: 800,
    vehicleType: 'truck'
  }
];

interface FunctionalDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type Step = 'locations' | 'service' | 'confirmation';

const FunctionalDeliveryInterface: React.FC<FunctionalDeliveryInterfaceProps> = ({ onSubmit, onCancel }) => {
  // État principal
  const [currentStep, setCurrentStep] = useState<Step>('locations');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickup: { location: null, contact: { name: '', phone: '' } },
    destination: { location: null, contact: { name: '', phone: '' } },
    serviceMode: null,
    packageDetails: { description: '', weight: '', instructions: '' },
    pricing: { distance: 0, duration: 0, price: 0 }
  });

  // Hooks
  const { toast } = useToast();
  const { location, searchLocation, getCurrentPosition, loading: locationLoading } = useMasterLocation({
    autoDetectLocation: false, // CRITIQUE: Désactiver l'auto-détection bloquante
    timeout: 3000,
    enableHighAccuracy: false
  });
  const { findAvailableDrivers, assignDriverToDelivery, loading: driverLoading } = useDriverAssignment();

  // États de recherche
  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // États de recherche de chauffeur
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [driversFound, setDriversFound] = useState<any[]>([]);

  // Refs pour les timeouts
  const pickupTimeoutRef = useRef<NodeJS.Timeout>();
  const destinationTimeoutRef = useRef<NodeJS.Timeout>();
  const driverSearchTimeoutRef = useRef<NodeJS.Timeout>();

  // ============ FONCTIONS DE RECHERCHE D'ADRESSES ============

  const handlePickupSearch = useCallback(async (query: string) => {
    setPickupQuery(query);
    
    if (pickupTimeoutRef.current) {
      clearTimeout(pickupTimeoutRef.current);
    }

    if (query.length < 2) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      return;
    }

    pickupTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(query);
        setPickupSuggestions(results);
        setShowPickupSuggestions(results.length > 0);
      } catch (error) {
        console.error('Pickup search error:', error);
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      }
    }, 300);
  }, [searchLocation]);

  const handleDestinationSearch = useCallback(async (query: string) => {
    setDestinationQuery(query);
    
    if (destinationTimeoutRef.current) {
      clearTimeout(destinationTimeoutRef.current);
    }

    if (query.length < 2) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    destinationTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(query);
        setDestinationSuggestions(results);
        setShowDestinationSuggestions(results.length > 0);
      } catch (error) {
        console.error('Destination search error:', error);
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
    }, 300);
  }, [searchLocation]);

  // ============ SÉLECTION DE LIEUX ============

  const selectPickupLocation = (suggestion: any) => {
    const location: DeliveryLocation = {
      address: suggestion.address,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      pickup: { ...prev.pickup, location }
    }));
    
    setPickupQuery(suggestion.address);
    setShowPickupSuggestions(false);
    
    // Calculer automatiquement le prix si les deux adresses sont définies
    if (deliveryData.destination.location) {
      calculatePricing(location, deliveryData.destination.location);
    }
  };

  const selectDestinationLocation = (suggestion: any) => {
    const location: DeliveryLocation = {
      address: suggestion.address,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng }
    };
    
    setDeliveryData(prev => ({
      ...prev,
      destination: { ...prev.destination, location }
    }));
    
    setDestinationQuery(suggestion.address);
    setShowDestinationSuggestions(false);
    
    // Calculer automatiquement le prix si les deux adresses sont définies
    if (deliveryData.pickup.location) {
      calculatePricing(deliveryData.pickup.location, location);
    }
  };

  // ============ GÉOLOCALISATION ACTUELLE ============

  const useCurrentLocationForPickup = async () => {
    try {
      const currentPos = await getCurrentPosition();
      const location: DeliveryLocation = {
        address: currentPos.address,
        coordinates: { lat: currentPos.lat, lng: currentPos.lng }
      };
      
      setDeliveryData(prev => ({
        ...prev,
        pickup: { ...prev.pickup, location }
      }));
      
      setPickupQuery(currentPos.address);
      
      toast({
        title: "Position actuelle utilisée",
        description: "Votre position a été définie comme point de collecte",
      });
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible d'obtenir votre position actuelle",
        variant: "destructive",
      });
    }
  };

  // ============ CALCUL DE PRIX ============

  const calculatePricing = (pickup: DeliveryLocation, destination: DeliveryLocation) => {
    const distance = calculateDistance(
      pickup.coordinates.lat,
      pickup.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );
    
    const duration = Math.round(distance * 2.5); // Estimation: 2.5 minutes par km
    
    setDeliveryData(prev => ({
      ...prev,
      pricing: { distance, duration, price: 0 }
    }));
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ============ SÉLECTION DE SERVICE ============

  const selectServiceMode = (mode: typeof deliveryModes[0]) => {
    const price = mode.basePrice + (deliveryData.pricing.distance * mode.pricePerKm);
    
    setDeliveryData(prev => ({
      ...prev,
      serviceMode: mode.id,
      pricing: { ...prev.pricing, price }
    }));
  };

  // ============ RECHERCHE DE CHAUFFEUR ============

  const startDriverSearch = async () => {
    if (!deliveryData.pickup.location || !deliveryData.destination.location || !deliveryData.serviceMode) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter toutes les informations",
        variant: "destructive",
      });
      return;
    }

    setSearchingDriver(true);
    setSearchTimer(120); // 2 minutes

    // Timer de recherche
    driverSearchTimeoutRef.current = setInterval(() => {
      setSearchTimer(prev => {
        if (prev <= 1) {
          setSearchingDriver(false);
          toast({
            title: "Délai dépassé",
            description: "Aucun chauffeur trouvé, veuillez réessayer",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // Simuler la recherche de chauffeurs
      const assignmentRequest = {
        pickup_location: deliveryData.pickup.location.address,
        pickup_coordinates: deliveryData.pickup.location.coordinates,
        destination: deliveryData.destination.location.address,
        destination_coordinates: deliveryData.destination.location.coordinates,
        service_type: deliveryData.serviceMode as 'flash' | 'flex' | 'maxicharge',
        vehicle_class: deliveryModes.find(m => m.id === deliveryData.serviceMode)?.vehicleType || 'car',
        priority: (deliveryData.serviceMode === 'flash' ? 'high' : 'normal') as 'normal' | 'high' | 'urgent'
      };

      const drivers = await findAvailableDrivers(assignmentRequest);
      
      if (drivers.length > 0) {
        setDriversFound(drivers);
        clearInterval(driverSearchTimeoutRef.current);
        setSearchingDriver(false);
        
        toast({
          title: "Chauffeur trouvé!",
          description: `${drivers.length} chauffeur(s) disponible(s)`,
        });
        
        // Auto-assigner le premier chauffeur
        handleConfirmOrder(drivers[0]);
      }
    } catch (error) {
      console.error('Driver search error:', error);
      setSearchingDriver(false);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de trouver un chauffeur",
        variant: "destructive",
      });
    }
  };

  // ============ CONFIRMATION DE COMMANDE ============

  const handleConfirmOrder = async (selectedDriver?: any) => {
    const finalData = {
      ...deliveryData,
      driver: selectedDriver,
      orderTime: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + deliveryData.pricing.duration * 60000).toISOString()
    };
    
    toast({
      title: "Commande confirmée!",
      description: "Votre livraison a été programmée",
    });
    
    onSubmit(finalData);
  };

  // ============ NAVIGATION ENTRE ÉTAPES ============

  const canProceedToService = () => {
    return deliveryData.pickup.location && 
           deliveryData.destination.location && 
           deliveryData.pickup.contact.name && 
           deliveryData.pickup.contact.phone &&
           deliveryData.destination.contact.name;
  };

  const canProceedToConfirmation = () => {
    return canProceedToService() && 
           deliveryData.serviceMode &&
           deliveryData.packageDetails.description;
  };

  // ============ NETTOYAGE ============

  useEffect(() => {
    return () => {
      if (pickupTimeoutRef.current) clearTimeout(pickupTimeoutRef.current);
      if (destinationTimeoutRef.current) clearTimeout(destinationTimeoutRef.current);
      if (driverSearchTimeoutRef.current) clearInterval(driverSearchTimeoutRef.current);
    };
  }, []);

  // ============ RENDU ============

  const stepProgress = {
    locations: 33,
    service: 66,
    confirmation: 100
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold">Nouvelle livraison</h1>
            <div className="w-16" />
          </div>
          
          <Progress value={stepProgress[currentStep]} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Étape {Object.keys(stepProgress).indexOf(currentStep) + 1} sur 3
          </p>
        </div>

        {/* Contenu des étapes */}
        {currentStep === 'locations' && (
          <Card className="glassmorphism animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresses de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Point de collecte */}
              <div>
                <label className="block text-sm font-medium mb-2">Point de collecte *</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Où récupérer le colis?"
                      value={pickupQuery}
                      onChange={(e) => handlePickupSearch(e.target.value)}
                      className="pl-10"
                    />
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
                        <CardContent className="p-2">
                          {pickupSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 hover:bg-muted cursor-pointer rounded"
                              onClick={() => selectPickupLocation(suggestion)}
                            >
                              <p className="font-medium">{suggestion.title || suggestion.address}</p>
                              <p className="text-sm text-muted-foreground">{suggestion.subtitle || suggestion.address}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={useCurrentLocationForPickup}
                    disabled={locationLoading}
                    className="w-full"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Target className="h-4 w-4 mr-2" />
                    )}
                    Utiliser ma position actuelle
                  </Button>
                </div>
                
                {/* Contact collecte */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    placeholder="Nom contact *"
                    value={deliveryData.pickup.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value } }
                    }))}
                  />
                  <Input
                    placeholder="Téléphone *"
                    value={deliveryData.pickup.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value } }
                    }))}
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium mb-2">Destination *</label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Où livrer le colis?"
                    value={destinationQuery}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    className="pl-10"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
                      <CardContent className="p-2">
                        {destinationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-muted cursor-pointer rounded"
                            onClick={() => selectDestinationLocation(suggestion)}
                          >
                            <p className="font-medium">{suggestion.title || suggestion.address}</p>
                            <p className="text-sm text-muted-foreground">{suggestion.subtitle || suggestion.address}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Contact destination */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    placeholder="Nom destinataire *"
                    value={deliveryData.destination.contact.name}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value } }
                    }))}
                  />
                  <Input
                    placeholder="Téléphone"
                    value={deliveryData.destination.contact.phone}
                    onChange={(e) => setDeliveryData(prev => ({
                      ...prev,
                      destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value } }
                    }))}
                  />
                </div>
              </div>

              {/* Distance et durée estimée */}
              {deliveryData.pricing.distance > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Distance: {deliveryData.pricing.distance.toFixed(1)} km</span>
                    <span>Durée estimée: {deliveryData.pricing.duration} min</span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setCurrentStep('service')}
                disabled={!canProceedToService()}
                className="w-full"
              >
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 'service' && (
          <Card className="glassmorphism animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Mode de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modes de livraison */}
              <div className="space-y-4">
                {deliveryModes.map((mode) => {
                  const price = mode.basePrice + (deliveryData.pricing.distance * mode.pricePerKm);
                  const isSelected = deliveryData.serviceMode === mode.id;
                  
                  return (
                    <Card
                      key={mode.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectServiceMode(mode)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <mode.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{mode.name}</h3>
                              <p className="text-sm text-muted-foreground">{mode.subtitle}</p>
                              <p className="text-xs text-muted-foreground mt-1">{mode.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{price.toLocaleString()} CDF</p>
                            {isSelected && <Check className="h-5 w-5 text-primary ml-auto mt-1" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Détails du colis */}
              <div className="space-y-4">
                <h3 className="font-semibold">Détails du colis</h3>
                <Textarea
                  placeholder="Description du colis *"
                  value={deliveryData.packageDetails.description}
                  onChange={(e) => setDeliveryData(prev => ({
                    ...prev,
                    packageDetails: { ...prev.packageDetails, description: e.target.value }
                  }))}
                />
                <Input
                  placeholder="Poids approximatif"
                  value={deliveryData.packageDetails.weight}
                  onChange={(e) => setDeliveryData(prev => ({
                    ...prev,
                    packageDetails: { ...prev.packageDetails, weight: e.target.value }
                  }))}
                />
                <Textarea
                  placeholder="Instructions spéciales"
                  value={deliveryData.packageDetails.instructions}
                  onChange={(e) => setDeliveryData(prev => ({
                    ...prev,
                    packageDetails: { ...prev.packageDetails, instructions: e.target.value }
                  }))}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('locations')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={!canProceedToConfirmation()}
                  className="flex-1"
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'confirmation' && (
          <Card className="glassmorphism animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Confirmation de commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Résumé */}
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Service:</span>
                    <span>{deliveryModes.find(m => m.id === deliveryData.serviceMode)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Distance:</span>
                    <span>{deliveryData.pricing.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Durée estimée:</span>
                    <span>{deliveryData.pricing.duration} min</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{deliveryData.pricing.price.toLocaleString()} CDF</span>
                  </div>
                </div>
              </div>

              {/* Recherche de chauffeur */}
              {searchingDriver ? (
                <div className="text-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Recherche de chauffeur...</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nous cherchons le chauffeur le plus proche
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-mono">
                      {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('service')}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={startDriverSearch}
                    disabled={driverLoading}
                    className="flex-1"
                  >
                    {driverLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Confirmer la commande
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FunctionalDeliveryInterface;