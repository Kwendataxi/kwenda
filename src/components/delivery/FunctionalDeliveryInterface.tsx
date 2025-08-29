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
  const { 
    currentLocation, 
    searchLocation, 
    getCurrentLocation, 
    isLoading: locationLoading,
    isLocationEnabled 
  } = useMasterLocation();
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
      const currentPos = await getCurrentLocation();
      if (!currentPos) {
        throw new Error('Position non disponible');
      }
      
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
        title: "Position détectée",
        description: "📍 " + currentPos.address,
      });
    } catch (error) {
      toast({
        title: "Géolocalisation échouée",
        description: "Utilisez la recherche manuelle pour sélectionner une adresse",
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
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Nouvelle livraison
            </h1>
            <div className="w-16" />
          </div>
          
          <Progress value={stepProgress[currentStep]} className="w-full h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Étape {Object.keys(stepProgress).indexOf(currentStep) + 1} sur 3
          </p>
        </div>

        {/* Contenu des étapes */}
        {currentStep === 'locations' && (
          <Card className="glassmorphism animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Adresses de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Point de collecte */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Point de collecte *
                </label>
                
                {/* Bouton de géolocalisation moderne */}
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={useCurrentLocationForPickup}
                    disabled={locationLoading || !isLocationEnabled}
                    className="w-full h-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/20 transition-all duration-300 modern-button"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Target className="h-4 w-4 mr-2 text-primary" />
                    )}
                    {locationLoading ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
                    {currentLocation && (
                      <Check className="h-4 w-4 ml-2 text-green-600" />
                    )}
                  </Button>
                  {!isLocationEnabled && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Géolocalisation non disponible dans ce navigateur
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="text-center text-sm text-muted-foreground mb-3 flex items-center">
                    <div className="flex-1 border-t border-border"></div>
                    <span className="px-3">ou rechercher une adresse</span>
                    <div className="flex-1 border-t border-border"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Saisissez l'adresse de collecte..."
                      value={pickupQuery}
                      onChange={(e) => handlePickupSearch(e.target.value)}
                      className="pl-10 h-12 modern-input"
                    />
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto glassmorphism">
                        <CardContent className="p-2">
                          {pickupSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-3 hover:bg-primary/5 cursor-pointer rounded-md transition-colors"
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

                  {/* Confirmation de l'adresse sélectionnée */}
                  {deliveryData.pickup.location && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                          Point de collecte confirmé
                        </p>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        📍 {deliveryData.pickup.location.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Informations de contact pour la collecte */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom du contact *
                    </label>
                    <Input
                      placeholder="Nom de la personne"
                      value={deliveryData.pickup.contact.name}
                      onChange={(e) => setDeliveryData(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value } }
                      }))}
                      className="modern-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Téléphone *
                    </label>
                    <Input
                      placeholder="+243 xxx xxx xxx"
                      value={deliveryData.pickup.contact.phone}
                      onChange={(e) => setDeliveryData(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value } }
                      }))}
                      className="modern-input"
                    />
                  </div>
                </div>
              </div>

              {/* Point de destination */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-secondary" />
                  Point de livraison *
                </label>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Où livrer le colis?"
                    value={destinationQuery}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    className="pl-10 h-12 modern-input"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto glassmorphism">
                      <CardContent className="p-2">
                        {destinationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-secondary/5 cursor-pointer rounded-md transition-colors"
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

                {/* Confirmation de l'adresse de livraison */}
                {deliveryData.destination.location && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">
                        Point de livraison confirmé
                      </p>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      🎯 {deliveryData.destination.location.address}
                    </p>
                  </div>
                )}

                {/* Informations de contact pour la livraison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom du destinataire *
                    </label>
                    <Input
                      placeholder="Nom du destinataire"
                      value={deliveryData.destination.contact.name}
                      onChange={(e) => setDeliveryData(prev => ({
                        ...prev,
                        destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value } }
                      }))}
                      className="modern-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Téléphone
                    </label>
                    <Input
                      placeholder="+243 xxx xxx xxx"
                      value={deliveryData.destination.contact.phone}
                      onChange={(e) => setDeliveryData(prev => ({
                        ...prev,
                        destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value } }
                      }))}
                      className="modern-input"
                    />
                  </div>
                </div>
              </div>

              {/* Résumé de distance si les deux adresses sont définies */}
              {deliveryData.pickup.location && deliveryData.destination.location && (
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4 animate-fade-in">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Aperçu du trajet
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="ml-2 font-medium">{deliveryData.pricing.distance.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durée estimée:</span>
                      <span className="ml-2 font-medium">{deliveryData.pricing.duration} min</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton continuer */}
              <div className="pt-4">
                <Button
                  onClick={() => setCurrentStep('service')}
                  disabled={!canProceedToService()}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium modern-button"
                >
                  Continuer vers les services
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ... reste du contenu existant pour les autres étapes ... */}
      </div>
    </div>
  );
};

export default FunctionalDeliveryInterface;