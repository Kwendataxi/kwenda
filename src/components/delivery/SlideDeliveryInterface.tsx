// Interface de livraison moderne avec correspondance colis-véhicule
// Guide l'utilisateur étape par étape basé sur le poids du colis

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import ServiceSelector from './ServiceSelector';
import DynamicPriceCalculator from './DynamicPriceCalculator';
import { RealTimeLocationSearch } from '@/components/location/RealTimeLocationSearch';
import { UnifiedLocation } from '@/types/locationAdapter';
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
  const masterLocation = useMasterLocation();
  const { createDeliveryOrder, loading } = useEnhancedDeliveryOrders();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<DeliveryFormData>({
    serviceMode: 'flex',
    pickup: null,
    destination: null
  });
  
const [locationValues, setLocationValues] = useState({ pickup: '', destination: '' });
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);

  // Fonction pour passer à l'étape suivante
  const nextSlide = () => {
    if (currentSlide < 3) { // 4 étapes: service, pickup, destination, confirmation
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

  // Gestion de la sélection de localisation
  const handleLocationSelect = (location: UnifiedLocation, type: 'pickup' | 'destination') => {
    setFormData(prev => ({ ...prev, [type]: location }));
    setLocationValues(prev => ({ ...prev, [type]: location.address }));
  };

  // Détermine si on peut passer à l'étape suivante
  const canProceed = () => {
    switch(currentSlide) {
      case 0: return formData.serviceMode !== '';
      case 1: return formData.pickup !== null;
      case 2: return formData.destination !== null;
      case 3: return true; // Page de confirmation
      default: return false;
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedService = services.find(s => s.id === formData.serviceMode);
      const estimatedPrice = dynamicPrice || selectedService?.basePrice || 5000;
      
      // Validation stricte des coordonnées pour éviter l'erreur "Cannot read properties of undefined"
      if (!formData.pickup?.lat || !formData.pickup?.lng || 
          !formData.destination?.lat || !formData.destination?.lng) {
        toast({
          title: "Adresses manquantes",
          description: "Veuillez sélectionner les points de collecte et de livraison",
          variant: "destructive"
        });
        return;
      }

      const orderData = {
        city: 'Kinshasa', // TODO: Intégrer la détection de ville
        pickup: {
          address: formData.pickup.address,
          lat: Number(formData.pickup.lat),
          lng: Number(formData.pickup.lng)
        },
        destination: {
          address: formData.destination.address,
          lat: Number(formData.destination.lat),
          lng: Number(formData.destination.lng)
        },
        mode: formData.serviceMode as 'flash' | 'flex' | 'maxicharge',
        packageWeight: 5,
        packageType: 'medium' as 'small' | 'medium' | 'large',
        additionalInfo: `Service: ${selectedService?.label}`,
        estimatedPrice,
        distance: 10,
        duration: 30
      };

      const result = await createDeliveryOrder(orderData);
      if (result) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Composants pour chaque étape
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

  const AddressSlide = () => {
    const isPickup = currentSlide === 1;
    const type = isPickup ? 'pickup' : 'destination';
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          {isPickup ? (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Point de collecte</h2>
                <p className="text-muted-foreground">Où devons-nous récupérer votre colis ?</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Destination</h2>
                <p className="text-muted-foreground">Où livrer votre colis ?</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <RealTimeLocationSearch
            placeholder={isPickup ? 
              "Rechercher lieu de collecte..." : 
              "Rechercher lieu de livraison..."
            }
            onLocationSelect={(location) => handleLocationSelect(location, type)}
            value={locationValues[type]}
            showCurrentLocation={true}
            showCitySelector={true}
            autoFocus={true}
          />

          {formData[type] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 rounded-lg border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">Adresse sélectionnée</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData[type]?.address}
                  </p>
                  {formData[type]?.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {formData[type]?.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

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

        {/* Calcul dynamique du prix */}
        <DynamicPriceCalculator
          pickup={formData.pickup}
          destination={formData.destination}
          serviceType={formData.serviceMode as 'flash' | 'flex' | 'maxicharge'}
          onPriceCalculated={(price) => setDynamicPrice(price)}
        />

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

  // Gestion des étapes
  const slides = [ServiceSlide, AddressSlide, AddressSlide, ConfirmationSlide];
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
              Étape {currentSlide + 1} sur 4
            </span>
          </div>
          
          <Progress value={(currentSlide + 1) * 25} className="w-full" />
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
                
                {currentSlide === 3 ? (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        Confirmer
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
                    Suivant
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