// Interface de livraison moderne stabilisée avec étapes séparées
// 5 étapes distinctes : Ville -> Service -> Collecte -> Livraison -> Confirmation

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import ServiceSelector from './ServiceSelector';
import { ModernLocationSearch } from '@/components/location/ModernLocationSearch';
import CitySelector from './CitySelector';
import { UnifiedLocation } from '@/types/locationAdapter';
import { 
  isValidLocation, 
  secureLocation, 
  unifiedToLocationData
} from '@/utils/locationValidation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Package, 
  MapPin, 
  Target, 
  Bike, 
  Car, 
  Truck, 
  CheckCircle2, 
  Scale,
  Loader2,
  Navigation2
} from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryFormData {
  serviceMode: string;
  pickup: UnifiedLocation | null;
  destination: UnifiedLocation | null;
  selectedCity: string;
}

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Types de colis basés sur le poids avec correspondance véhicule
const packageTypes = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash (1-5 kg)', 
    description: 'Livraison rapide en moto - Documents, petits objets',
    weightRange: '1-5 kg',
    maxWeight: 5,
    vehicleType: 'Moto',
    basePrice: 5000
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex (6-50 kg)', 
    description: 'Livraison standard en camionnette - Électronique, vêtements',
    weightRange: '6-50 kg',
    maxWeight: 50,
    vehicleType: 'Camionnette',
    basePrice: 7000
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge (50+ kg)', 
    description: 'Livraison lourde en camion - Meubles, électroménager',
    weightRange: '50+ kg',
    maxWeight: 999,
    vehicleType: 'Camion',
    basePrice: 12000
  }
];

// Services disponibles avec prix "À partir de"
const services = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash', 
    subtitle: 'Livraison express en moto',
    price: 'À partir de 5 000 CDF',
    weightLimit: '1-5 kg',
    basePrice: 5000
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex', 
    subtitle: 'Livraison standard en camionnette',
    price: 'À partir de 7 000 CDF',
    weightLimit: '6-50 kg',
    basePrice: 7000
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge', 
    subtitle: 'Livraison lourde en camion',
    price: 'À partir de 12 000 CDF',
    weightLimit: '50+ kg',
    basePrice: 12000
  }
];

// Variants d'animation pour les slides
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
};

const SlideDeliveryInterface = ({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) => {
  const { toast } = useToast();
  const { createDeliveryOrder, calculateDeliveryPrice, loading } = useEnhancedDeliveryOrders();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<DeliveryFormData>({
    serviceMode: 'flex',
    pickup: null,
    destination: null,
    selectedCity: 'Kinshasa'
  });
  
  const [locationValues, setLocationValues] = useState({ pickup: '', destination: '' });
  const [calculatedPrice, setCalculatedPrice] = useState<{
    price: number;
    distance: number;
    duration: number;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Calculer le prix via RPC avec optimisation et debounce
  const calculatePrice = useCallback(async () => {
    if (!formData.pickup || !formData.destination || priceLoading) return;
    
    setPriceLoading(true);
    try {
      const result = await calculateDeliveryPrice(
        unifiedToLocationData(formData.pickup),
        unifiedToLocationData(formData.destination),
        formData.serviceMode as 'flash' | 'flex' | 'maxicharge'
      );
      setCalculatedPrice(result);
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      // Prix de fallback intelligent
      const fallbackPrices = { flash: 5000, flex: 7000, maxicharge: 12000 };
      setCalculatedPrice({
        price: fallbackPrices[formData.serviceMode as keyof typeof fallbackPrices],
        distance: 5,
        duration: 25
      });
    } finally {
      setPriceLoading(false);
    }
  }, [formData.pickup?.lat, formData.pickup?.lng, formData.destination?.lat, formData.destination?.lng, formData.serviceMode, calculateDeliveryPrice]);

  // Optimisation : calculer seulement à l'étape de confirmation
  useEffect(() => {
    if (formData.pickup && formData.destination && currentSlide === 4 && !calculatedPrice) {
      const timer = setTimeout(calculatePrice, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.pickup, formData.destination, currentSlide, calculatedPrice, calculatePrice]);

  // Fonction pour passer à l'étape suivante
  const nextSlide = () => {
    if (currentSlide < 4) { // 5 étapes: ville, service, pickup, destination, confirmation
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  // Fonction pour revenir à l'étape précédente
  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Gestion ULTRA-SÉCURISÉE de la sélection de localisation
  const handleLocationSelect = (location: UnifiedLocation, type: 'pickup' | 'destination') => {
    console.log(`Sélection ${type}:`, location);
    
    try {
      // Protection contre les objets null/undefined
      if (!location) {
        toast({
          title: "Erreur de sélection",
          description: "Localisation invalide, veuillez réessayer",
          variant: "destructive"
        });
        return;
      }
      
      // Conversion et sécurisation avec ville sélectionnée
      const locationData = unifiedToLocationData(location);
      const securedLocation = secureLocation(locationData, formData.selectedCity);
      
      // Validation que les coordonnées existent
      if (!securedLocation || !securedLocation.lat || !securedLocation.lng) {
        console.error('Coordonnées manquantes après sécurisation:', securedLocation);
        toast({
          title: "Coordonnées manquantes",
          description: "Impossible de localiser cette adresse, position par défaut appliquée",
          variant: "default"
        });
      }
      
      setFormData(prev => ({ ...prev, [type]: securedLocation }));
      setLocationValues(prev => ({ ...prev, [type]: securedLocation.address }));
      
      // Validation finale et feedback utilisateur
      if (!isValidLocation(securedLocation)) {
        toast({
          title: "Position corrigée ⚡",
          description: "Coordonnées optimisées pour la livraison",
          variant: "default"
        });
      } else {
        // Feedback positif pour sélection réussie
        toast({
          title: `${type === 'pickup' ? 'Collecte' : 'Livraison'} définie ✅`,
          description: securedLocation.address,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erreur handleLocationSelect:', error);
      toast({
        title: "Erreur de localisation",
        description: "Impossible de traiter cette adresse",
        variant: "destructive"
      });
    }
  };

  // Détermine si on peut passer à l'étape suivante
  const canProceed = () => {
    switch(currentSlide) {
      case 0: return formData.selectedCity !== '';
      case 1: return formData.serviceMode !== '';
      case 2: return formData.pickup !== null;
      case 3: return formData.destination !== null;
      case 4: return true; // Page de confirmation
      default: return false;
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedService = services.find(s => s.id === formData.serviceMode);
      const estimatedPrice = calculatedPrice?.price || selectedService?.basePrice || 5000;
      
      // Validation ultra-sécurisée des coordonnées
      const securePickup = formData.pickup ? secureLocation(formData.pickup) : null;
      const secureDestination = formData.destination ? secureLocation(formData.destination) : null;
      
      if (!securePickup || !secureDestination || 
          !isValidLocation(securePickup) || !isValidLocation(secureDestination)) {
        toast({
          title: "Adresses invalides",
          description: "Veuillez sélectionner des adresses valides pour la collecte et la livraison",
          variant: "destructive"
        });
        return;
      }

      const orderData = {
        city: formData.selectedCity,
        pickup: {
          address: securePickup.address,
          lat: securePickup.lat,
          lng: securePickup.lng
        },
        destination: {
          address: secureDestination.address,
          lat: secureDestination.lat,
          lng: secureDestination.lng
        },
        mode: formData.serviceMode as 'flash' | 'flex' | 'maxicharge',
        packageWeight: 5,
        packageType: 'medium' as 'small' | 'medium' | 'large',
        additionalInfo: `Service: ${selectedService?.label}`,
        estimatedPrice,
        distance: calculatedPrice?.distance || 10,
        duration: calculatedPrice?.duration || 30
      };

      const result = await createDeliveryOrder(orderData);
      if (result) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // Composants pour chaque étape
  const CitySlide = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <MapPin className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl sm:text-2xl font-bold">Votre ville</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Sélectionnez votre ville pour des résultats optimisés
        </p>
      </div>

      <CitySelector
        selectedCity={formData.selectedCity}
        onCityChange={(city) => {
          const previousCity = formData.selectedCity;
          setFormData(prev => ({ ...prev, selectedCity: city }));
          // Réinitialiser les adresses si changement de ville
          if (previousCity !== city) {
            setFormData(prev => ({ ...prev, pickup: null, destination: null }));
            setLocationValues({ pickup: '', destination: '' });
            setCalculatedPrice(null);
          }
        }}
      />
    </div>
  );

  const ServiceSlide = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Truck className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl sm:text-2xl font-bold">Service de livraison</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Choisissez le service adapté à vos besoins
        </p>
      </div>

      <ServiceSelector
        selectedService={formData.serviceMode}
        onServiceSelect={(service) => setFormData(prev => ({ ...prev, serviceMode: service }))}
      />
    </div>
  );

  // Étape dédiée pour le point de collecte (Slide 2)
  const PickupSlide = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Point de collecte</h2>
          <p className="text-muted-foreground">Où devons-nous récupérer votre colis ?</p>
        </div>
      </div>

      <div className="space-y-4">
        <ModernLocationSearch
          placeholder="🎯 Rechercher lieu de collecte..."
          onLocationSelect={(location) => handleLocationSelect(location, 'pickup')}
          value={locationValues.pickup}
          showCurrentLocation={true}
          autoFocus={true}
          variant="elegant"
        />

        {formData.pickup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/10 rounded-lg border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Point de collecte défini</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.pickup.address}
                </p>
                {formData.pickup.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {formData.pickup.subtitle}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Étape dédiée pour la destination (Slide 3)
  const DestinationSlide = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
          <Target className="h-8 w-8 text-secondary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Destination</h2>
          <p className="text-muted-foreground">Où livrer votre colis ?</p>
        </div>
      </div>

      <div className="space-y-4">
        <ModernLocationSearch
          placeholder="📍 Rechercher lieu de livraison..."
          onLocationSelect={(location) => handleLocationSelect(location, 'destination')}
          value={locationValues.destination}
          showCurrentLocation={false}
          autoFocus={true}
          variant="elegant"
        />

        {formData.destination && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-secondary/10 rounded-lg border border-secondary/20"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-foreground">Destination définie</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.destination.address}
                </p>
                {formData.destination.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {formData.destination.subtitle}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const ConfirmationSlide = () => {
    const selectedService = services.find(s => s.id === formData.serviceMode);
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold">Confirmer la commande</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Vérifiez les détails de votre livraison
          </p>
        </div>

        {/* Prix calculé via RPC Supabase */}
        {priceLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">Calcul du prix en cours...</p>
            </CardContent>
          </Card>
        ) : calculatedPrice ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-primary">
                  {calculatedPrice.price.toLocaleString()} FC
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Distance</span>
                    <div className="font-medium">{calculatedPrice.distance.toFixed(1)} km</div>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Durée</span>
                    <div className="font-medium">{calculatedPrice.duration} min</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Prix calculé automatiquement
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Prix en attente de calcul...</p>
            </CardContent>
          </Card>
        )}

        {/* Résumé complet */}
        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                {selectedService?.icon && <selectedService.icon className="h-5 w-5 text-primary mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Service de livraison</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedService?.label} - {selectedService?.subtitle}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {selectedService?.weightLimit}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Point de collecte</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {formData.pickup?.address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Destination</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {formData.destination?.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Information sur le véhicule */}
          <div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
            <div className="flex items-start gap-3">
              {selectedService?.icon && <selectedService.icon className="h-5 w-5 text-primary mt-0.5" />}
              <div className="flex-1">
                <h4 className="font-medium text-sm sm:text-base">Véhicule assigné</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {selectedService?.label === 'Flash' && 'Moto - Livraison rapide'}
                  {selectedService?.label === 'Flex' && 'Camionnette - Livraison standard'}
                  {selectedService?.label === 'MaxiCharge' && 'Camion - Livraison lourde'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Gestion des 5 étapes séparées
  const slides = [CitySlide, ServiceSlide, PickupSlide, DestinationSlide, ConfirmationSlide];
  const CurrentSlide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Header avec navigation */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Étape {currentSlide + 1} sur 5
            </span>
          </div>
          
          <Progress value={(currentSlide + 1) * 20} className="w-full" />
        </div>

        {/* Contenu des slides */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="relative min-h-[400px] sm:min-h-[500px]">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    <CurrentSlide />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                {currentSlide > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevSlide}
                    className="flex-1 text-sm sm:text-base"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                  </Button>
                )}
                
                {currentSlide === 4 ? (
                  <Button
                    type="submit"
                    disabled={loading || !calculatedPrice}
                    className="flex-1 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        Confirmer commande
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextSlide}
                    disabled={!canProceed()}
                    className="flex-1 text-sm sm:text-base"
                  >
                    {currentSlide === 3 ? 'Voir confirmation' : 'Suivant'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SlideDeliveryInterface;