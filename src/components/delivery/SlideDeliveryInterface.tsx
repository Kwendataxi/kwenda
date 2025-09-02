import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { useMasterLocation } from '@/hooks/useMasterLocation';
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
  Navigation,
  Search,
  Loader2,
  Plus,
  Minus,
  User,
  Phone
} from 'lucide-react';

// Types optimisés
interface SlideProps {
  isActive: boolean;
  direction: number;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryFormData {
  packageType: 'small' | 'medium' | 'large';
  pickup: {
    location: LocationData | null;
    contact: { name: string; phone: string };
  };
  destination: {
    location: LocationData | null;
    contact: { name: string; phone: string };
  };
  serviceMode: 'flash' | 'flex' | 'maxicharge' | null;
  pricing: { price: number; distance: number; duration: number };
}

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Configuration des services
const deliveryServices = [
  {
    id: 'flash' as const,
    name: 'Kwenda Flash',
    subtitle: 'Express - 30-45 min',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    basePrice: 5000,
    pricePerKm: 500,
    description: 'Livraison ultra-rapide par moto'
  },
  {
    id: 'flex' as const,
    name: 'Kwenda Flex', 
    subtitle: 'Standard - 1-2h',
    icon: Package,
    color: 'from-blue-500 to-purple-500',
    basePrice: 3000,
    pricePerKm: 300,
    description: 'Solution économique et fiable'
  },
  {
    id: 'maxicharge' as const,
    name: 'Kwenda MaxiCharge',
    subtitle: 'Gros colis - 2-4h',
    icon: Truck,
    color: 'from-green-500 to-teal-500',
    basePrice: 8000,
    pricePerKm: 800,
    description: 'Pour vos gros volumes'
  }
];

// Animations optimisées - Transition simple
const slideTransition = {
  duration: 0.3
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  })
};

const SlideDeliveryInterface: React.FC<SlideDeliveryInterfaceProps> = ({ onSubmit, onCancel }) => {
  // États principaux
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<DeliveryFormData>({
    packageType: 'medium',
    pickup: { location: null, contact: { name: '', phone: '' } },
    destination: { location: null, contact: { name: '', phone: '' } },
    serviceMode: null,
    pricing: { price: 0, distance: 0, duration: 0 }
  });

  // États de recherche avec debouncing
  const [pickupQuery, setPickupQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationData[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationData[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Hooks
  const { toast } = useToast();
  const { searchLocation, getCurrentPosition, loading: locationLoading } = useMasterLocation();
  const { calculateDeliveryPrice, createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();

  // Refs pour optimisation
  const pickupTimeoutRef = useRef<NodeJS.Timeout>();
  const destinationTimeoutRef = useRef<NodeJS.Timeout>();

  // Navigation entre slides
  const nextSlide = () => {
    if (currentSlide < 3) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Géolocalisation optimisée
  const useCurrentLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      if (position) {
        const location: LocationData = {
          address: position.address,
          lat: position.lat,
          lng: position.lng
        };
        
        setFormData(prev => ({
          ...prev,
          pickup: { ...prev.pickup, location }
        }));
        
        setPickupQuery(position.address);
        
        toast({
          title: "Position détectée",
          description: `📍 ${position.address.substring(0, 50)}...`
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Veuillez saisir l'adresse manuellement",
        variant: "destructive"
      });
    }
  }, [getCurrentPosition, toast]);

  // Recherche d'adresses avec debouncing
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
        // Fallback avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setPickupSuggestions(fallbackResults);
        setShowPickupSuggestions(true);
      }
    }, 400);
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
        // Fallback avec suggestions locales
        const fallbackResults = [
          { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167 },
          { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069 },
          { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833 }
        ];
        setDestinationSuggestions(fallbackResults);
        setShowDestinationSuggestions(true);
      }
    }, 400);
  }, [searchLocation]);

  // Calcul automatique des prix
  const calculatePricing = useCallback(async () => {
    if (!formData.pickup.location || !formData.destination.location || !formData.serviceMode) return;

    try {
      const pricing = await calculateDeliveryPrice(
        formData.pickup.location,
        formData.destination.location,
        formData.serviceMode
      );
      
      setFormData(prev => ({
        ...prev,
        pricing
      }));
    } catch (error) {
      console.error('Erreur calcul prix:', error);
    }
  }, [formData.pickup.location, formData.destination.location, formData.serviceMode, calculateDeliveryPrice]);

  // Effet pour recalculer les prix
  React.useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  // Validation des étapes
  const canProceedToSlide = useMemo(() => ({
    1: formData.packageType !== null,
    2: formData.pickup.location && formData.destination.location,
    3: formData.serviceMode && formData.pickup.contact.name && formData.destination.contact.name
  }), [formData]);

  // Soumission finale
  const handleSubmit = async () => {
    if (!formData.pickup.location || !formData.destination.location || !formData.serviceMode) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        city: 'kinshasa',
        pickup: formData.pickup.location,
        destination: formData.destination.location,
        mode: formData.serviceMode,
        estimatedPrice: formData.pricing.price,
        distance: formData.pricing.distance,
        duration: formData.pricing.duration
      };

      const orderId = await createDeliveryOrder(orderData);
      
      toast({
        title: "Commande créée !",
        description: "Recherche d'un chauffeur en cours...",
      });
      
      onSubmit({ ...orderData, id: orderId });
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  // Slides components
  const PackageTypeSlide = () => (
    <motion.div
      key="package-type"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Quel type de colis ?</h2>
        <p className="text-muted-foreground">Sélectionnez la taille approximative</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'small', name: 'Petit colis', subtitle: 'Documents, téléphone, bijoux', icon: Package, size: 'h-8 w-8' },
          { id: 'medium', name: 'Colis moyen', subtitle: 'Sac, vêtements, nourriture', icon: Package, size: 'h-10 w-10' },
          { id: 'large', name: 'Gros colis', subtitle: 'Électroménager, meubles', icon: Package, size: 'h-12 w-12' }
        ].map((type) => (
          <motion.div
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.packageType === type.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, packageType: type.id as any }))}
            >
              <div className="flex items-center gap-4">
                <type.icon className={`${type.size} text-primary`} />
                <div className="flex-1">
                  <h3 className="font-semibold">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.subtitle}</p>
                </div>
                {formData.packageType === type.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const AddressesSlide = () => (
    <motion.div
      key="addresses"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Adresses</h2>
        <p className="text-muted-foreground">Où récupérer et livrer ?</p>
      </div>

      {/* Point de collecte */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Point de collecte</h3>
        </div>

        <Button
          variant="outline"
          onClick={useCurrentLocation}
          disabled={locationLoading}
          className="w-full h-12 justify-start gap-3"
        >
          {locationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4 text-primary" />
          )}
          Ma position actuelle
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ou saisir une adresse..."
            value={pickupQuery}
            onChange={(e) => handlePickupSearch(e.target.value)}
            className="pl-10 h-12"
          />
          
          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
              <div className="p-2">
                {pickupSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, location: suggestion }
                      }));
                      setPickupQuery(suggestion.address);
                      setShowPickupSuggestions(false);
                    }}
                  >
                    <p className="font-medium text-sm">{suggestion.address}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Contact pickup */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Nom contact"
            value={formData.pickup.contact.name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, name: e.target.value } }
            }))}
          />
          <Input
            placeholder="Téléphone"
            value={formData.pickup.contact.phone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pickup: { ...prev.pickup, contact: { ...prev.pickup.contact, phone: e.target.value } }
            }))}
          />
        </div>

        {formData.pickup.location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                📍 {formData.pickup.location.address.substring(0, 50)}...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Point de livraison */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-secondary" />
          <h3 className="font-semibold">Point de livraison</h3>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Adresse de livraison..."
            value={destinationQuery}
            onChange={(e) => handleDestinationSearch(e.target.value)}
            className="pl-10 h-12"
          />
          
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
              <div className="p-2">
                {destinationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        destination: { ...prev.destination, location: suggestion }
                      }));
                      setDestinationQuery(suggestion.address);
                      setShowDestinationSuggestions(false);
                    }}
                  >
                    <p className="font-medium text-sm">{suggestion.address}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Contact destination */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Nom destinataire"
            value={formData.destination.contact.name}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, contact: { ...prev.destination.contact, name: e.target.value } }
            }))}
          />
          <Input
            placeholder="Téléphone"
            value={formData.destination.contact.phone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              destination: { ...prev.destination, contact: { ...prev.destination.contact, phone: e.target.value } }
            }))}
          />
        </div>

        {formData.destination.location && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">
                📍 {formData.destination.location.address.substring(0, 50)}...
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const ServiceSlide = () => (
    <motion.div
      key="service"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Mode de livraison</h2>
        <p className="text-muted-foreground">Choisissez votre vitesse</p>
      </div>

      <div className="space-y-4">
        {deliveryServices.map((service) => (
          <motion.div
            key={service.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.serviceMode === service.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, serviceMode: service.id }))}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${service.color}`}>
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                </div>
                <div className="text-right">
                  {formData.pricing.price > 0 && formData.serviceMode === service.id && (
                    <p className="font-bold text-primary">{formData.pricing.price} CDF</p>
                  )}
                  {formData.serviceMode === service.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {formData.pricing.distance > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold">Détails du trajet</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-medium">{formData.pricing.distance.toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-muted-foreground">Durée</p>
              <p className="font-medium">{formData.pricing.duration} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prix</p>
              <p className="font-bold text-primary">{formData.pricing.price} CDF</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const ConfirmationSlide = () => (
    <motion.div
      key="confirmation"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Confirmation</h2>
        <p className="text-muted-foreground">Vérifiez les détails</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Collecte</p>
              <p className="text-sm text-muted-foreground">{formData.pickup.location?.address}</p>
              <p className="text-xs text-muted-foreground">{formData.pickup.contact.name} - {formData.pickup.contact.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-secondary mt-0.5" />
            <div>
              <p className="font-medium">Livraison</p>
              <p className="text-sm text-muted-foreground">{formData.destination.location?.address}</p>
              <p className="text-xs text-muted-foreground">{formData.destination.contact.name} - {formData.destination.contact.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium">Service</p>
              <p className="text-sm text-muted-foreground">
                {deliveryServices.find(s => s.id === formData.serviceMode)?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Total à payer</p>
            <p className="text-2xl font-bold text-primary">{formData.pricing.price} CDF</p>
          </div>
        </div>
      </Card>

      <Button 
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-12 text-lg"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Création en cours...
          </>
        ) : (
          'Confirmer la commande'
        )}
      </Button>
    </motion.div>
  );

  const slides = [PackageTypeSlide, AddressesSlide, ServiceSlide, ConfirmationSlide];
  const CurrentSlideComponent = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={currentSlide === 0 ? onCancel : prevSlide}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentSlide === 0 ? 'Annuler' : 'Retour'}
            </Button>
            
            <h1 className="text-lg font-bold">Kwenda Livraison</h1>
            
            {currentSlide < 3 && (
              <Button
                variant="ghost"
                onClick={nextSlide}
                disabled={!canProceedToSlide[currentSlide as keyof typeof canProceedToSlide]}
                className="flex items-center gap-2"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {currentSlide === 3 && <div className="w-16" />}
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  index <= currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slides container */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <CurrentSlideComponent />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SlideDeliveryInterface;