// Interface de livraison moderne avec correspondance colis-véhicule
// Guide l'utilisateur étape par étape basé sur le poids du colis

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import WeightBasedPackageSelector from './WeightBasedPackageSelector';
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
  Search,
  Loader2,
  Navigation2
} from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface DeliveryFormData {
  packageType: string;
  pickup: LocationData | null;
  destination: LocationData | null;
  serviceMode: string;
  packageWeight: number;
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

// Services disponibles - automatiquement déterminés par le poids
const services = [
  { 
    id: 'flash', 
    icon: Bike, 
    label: 'Flash', 
    subtitle: 'Livraison express en moto',
    price: '5 000 CDF',
    weightLimit: '1-5 kg'
  },
  { 
    id: 'flex', 
    icon: Car, 
    label: 'Flex', 
    subtitle: 'Livraison standard en camionnette',
    price: '7 000 CDF',
    weightLimit: '6-50 kg'
  },
  { 
    id: 'maxicharge', 
    icon: Truck, 
    label: 'MaxiCharge', 
    subtitle: 'Livraison lourde en camion',
    price: '12 000 CDF',
    weightLimit: '50+ kg'
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
    packageType: '',
    pickup: null,
    destination: null,
    serviceMode: 'flex',
    packageWeight: 0
  });
  
  const [queries, setQueries] = useState({ pickup: '', destination: '' });
  const [suggestions, setSuggestions] = useState({ pickup: [], destination: [] });

  // Fonction pour passer à l'étape suivante
  const nextSlide = () => {
    if (currentSlide < 3) { // Maintenant 4 étapes: poids, pickup, destination, confirmation
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

  // Géolocalisation actuelle
  const useCurrentLocation = async (type: 'pickup' | 'destination') => {
    try {
      const location = { address: "Position actuelle", lat: -4.3217, lng: 15.3069 };
      if (location) {
        setFormData(prev => ({
          ...prev,
          [type]: {
            address: location.address,
            lat: location.lat,
            lng: location.lng
          }
        }));
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  // Recherche d'adresses
  const handleSearch = async (query: string, type: 'pickup' | 'destination') => {
    setQueries(prev => ({ ...prev, [type]: query }));
    
    if (query.length > 2) {
      try {
        const results = []; // Placeholder pour la recherche
        setSuggestions(prev => ({ ...prev, [type]: results }));
      } catch (error) {
        console.error('Erreur de recherche:', error);
      }
    } else {
      setSuggestions(prev => ({ ...prev, [type]: [] }));
    }
  };

  // Sélection d'une adresse
  const selectLocation = (location: LocationData, type: 'pickup' | 'destination') => {
    setFormData(prev => ({ ...prev, [type]: location }));
    setQueries(prev => ({ ...prev, [type]: location.address }));
    setSuggestions(prev => ({ ...prev, [type]: [] }));
  };

  // Détermine si on peut passer à l'étape suivante
  const canProceed = () => {
    switch(currentSlide) {
      case 0: return formData.packageType !== '' && formData.packageWeight > 0;
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
      const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
      const estimatedPrice = selectedPackage?.basePrice || 5000;
      
      const orderData = {
        city: 'Kinshasa',
        pickup: formData.pickup || { address: '', lat: 0, lng: 0 },
        destination: formData.destination || { address: '', lat: 0, lng: 0 },
        mode: formData.serviceMode as 'flash' | 'flex' | 'maxicharge',
        packageWeight: formData.packageWeight,
        packageType: formData.packageType as 'small' | 'medium' | 'large',
        additionalInfo: `Poids: ${formData.packageWeight}kg`,
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
  const PackageSlide = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Scale className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Informations du colis</h2>
        <p className="text-muted-foreground">Indiquez le poids pour déterminer le service approprié</p>
      </div>

      <WeightBasedPackageSelector
        selectedType={formData.packageType}
        packageWeight={formData.packageWeight}
        onTypeSelect={(type) => setFormData(prev => ({ ...prev, packageType: type, serviceMode: type }))}
        onWeightChange={(weight) => setFormData(prev => ({ ...prev, packageWeight: weight }))}
      />
    </div>
  );

  const AddressSlide = () => {
    const isPickup = currentSlide === 1;
    const type = isPickup ? 'pickup' : 'destination';
    const query = queries[type];
    const suggestionList = suggestions[type];
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          {isPickup ? (
            <>
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Point de collecte</h2>
              <p className="text-muted-foreground">Où devons-nous récupérer votre colis ?</p>
            </>
          ) : (
            <>
              <Target className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Destination</h2>
              <p className="text-muted-foreground">Où livrer votre colis ?</p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={isPickup ? "Adresse de collecte..." : "Adresse de livraison..."}
                value={query}
                onChange={(e) => handleSearch(e.target.value, type)}
                className="pl-10"
              />
            </div>
            
            {suggestionList.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestionList.map((location: LocationData, index: number) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => selectLocation(location, type)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{location.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => useCurrentLocation(type)}
            className="w-full"
          >
            <Navigation2 className="mr-2 h-4 w-4" />
            Utiliser ma position actuelle
          </Button>

          {formData[type] && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Adresse sélectionnée :</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formData[type]?.address}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ConfirmationSlide = () => {
    const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
    const selectedService = services.find(s => s.id === formData.serviceMode);
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Confirmer la commande</h2>
          <p className="text-muted-foreground">Vérifiez les détails de votre livraison</p>
        </div>

        {/* Résumé complet */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Colis</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackage?.label} - {formData.packageWeight}kg
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Point de collecte</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.pickup?.address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Destination</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.destination?.address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedService?.icon && <selectedService.icon className="h-5 w-5 text-primary" />}
                <div>
                  <h3 className="font-semibold">Service de livraison</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedService?.label} - {selectedService?.subtitle}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    Prix estimé: {selectedService?.price}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Information sur le véhicule */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-3">
              {selectedPackage?.icon && <selectedPackage.icon className="h-5 w-5 text-primary" />}
              <div>
                <h4 className="font-medium">Véhicule assigné</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPackage?.vehicleType} - Adapté pour {selectedPackage?.weightRange}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Gestion des étapes
  const slides = [PackageSlide, AddressSlide, AddressSlide, ConfirmationSlide];
  const CurrentSlide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec navigation */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <span className="text-sm text-muted-foreground">
              Étape {currentSlide + 1} sur 4
            </span>
          </div>
          
          <Progress value={(currentSlide + 1) * 25} className="w-full" />
        </div>

        {/* Contenu des slides */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="relative h-[500px]">
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
                    className="absolute inset-0"
                  >
                    <CurrentSlide />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {currentSlide > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevSlide}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                  </Button>
                )}
                
                {currentSlide === 3 ? (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        Confirmer la commande
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextSlide}
                    disabled={!canProceed()}
                    className="flex-1"
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