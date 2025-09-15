/**
 * Interface de livraison en 4 étapes optimisée
 * Étape 1: Villes - Sélection de ville avec géolocalisation automatique
 * Étape 2: Service de livraison - Flash, Flex, MaxiCharge avec prix par ville
 * Étape 3: Adresses - Collecte + Livraison avec géolocalisation améliorée
 * Étape 4: Confirmation - Résumé complet avec calcul prix temps réel
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import ImprovedLocationSearch from './ImprovedLocationSearch';
import { LocationData } from '@/types/location';
import { secureLocation, isValidLocation, calculateBasePrice } from '@/utils/locationValidation';
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
  Clock,
  Route,
  Loader2,
  Zap,
  Building,
  Navigation2
} from 'lucide-react';

interface FourStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryFormData {
  city: string;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  pickup: LocationData | null;
  destination: LocationData | null;
}

// Configuration des villes avec coordonnées et informations
const cities = [
  {
    id: 'Kinshasa',
    name: 'Kinshasa',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -4.3217, lng: 15.3069 },
    currency: 'CDF',
    timezone: 'Africa/Kinshasa',
    population: '17M',
    icon: '🏛️'
  },
  {
    id: 'Lubumbashi',
    name: 'Lubumbashi',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -11.6708, lng: 27.4794 },
    currency: 'CDF',
    timezone: 'Africa/Lubumbashi',
    population: '2.5M',
    icon: '⛏️'
  },
  {
    id: 'Kolwezi',
    name: 'Kolwezi',
    country: 'République Démocratique du Congo',
    coordinates: { lat: -10.7158, lng: 25.4664 },
    currency: 'CDF',
    timezone: 'Africa/Lubumbashi',
    population: '700K',
    icon: '💎'
  },
  {
    id: 'Abidjan',
    name: 'Abidjan',
    country: 'Côte d\'Ivoire',
    coordinates: { lat: 5.3600, lng: -4.0083 },
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    population: '6M',
    icon: '🌴'
  }
];

// Services de livraison avec prix base par ville
const deliveryServices = [
  {
    id: 'flash' as const,
    name: 'Flash',
    subtitle: 'Livraison express en moto',
    icon: Bike,
    time: '15-30 min',
    description: 'Idéal pour documents, petits objets (1-5kg)',
    features: ['Livraison ultra-rapide', 'Suivi temps réel', 'Assurance incluse'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    basePrices: {
      'Kinshasa': 5000,
      'Lubumbashi': 6000,
      'Kolwezi': 5500,
      'Abidjan': 2500 // Prix en XOF
    }
  },
  {
    id: 'flex' as const,
    name: 'Flex',
    subtitle: 'Livraison standard en voiture',
    icon: Car,
    time: '30-60 min',
    description: 'Parfait pour achats moyens (6-50kg)',
    features: ['Livraison sécurisée', 'Capacité optimale', 'Prix avantageux'],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    basePrices: {
      'Kinshasa': 3000,
      'Lubumbashi': 3600,
      'Kolwezi': 3300,
      'Abidjan': 1500 // Prix en XOF
    }
  },
  {
    id: 'maxicharge' as const,
    name: 'MaxiCharge',
    subtitle: 'Livraison lourde en camion',
    icon: Truck,
    time: '1-2 heures',
    description: 'Pour gros volumes et objets lourds (50kg+)',
    features: ['Grande capacité', 'Équipe de manutention', 'Sécurité renforcée'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    basePrices: {
      'Kinshasa': 8000,
      'Lubumbashi': 9600,
      'Kolwezi': 8800,
      'Abidjan': 4000 // Prix en XOF
    }
  }
];

const FourStepDeliveryInterface = ({ onSubmit, onCancel }: FourStepDeliveryInterfaceProps) => {
  const { toast } = useToast();
  const { createDeliveryOrder, calculateDeliveryPrice, loading } = useEnhancedDeliveryOrders();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DeliveryFormData>({
    city: 'Kinshasa',
    serviceType: 'flex',
    pickup: null,
    destination: null
  });
  
  const [calculatedPrice, setCalculatedPrice] = useState<{
    price: number;
    distance: number;
    duration: number;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Calcul de prix en temps réel optimisé
  const calculatePrice = useCallback(async () => {
    if (!formData.pickup || !formData.destination || priceLoading) return;
    
    setPriceLoading(true);
    try {
      const result = await calculateDeliveryPrice(
        formData.pickup,
        formData.destination,
        formData.serviceType
      );
      setCalculatedPrice(result);
      console.log('💰 Prix calculé:', result);
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      // Prix de fallback intelligent basé sur la ville
      const service = deliveryServices.find(s => s.id === formData.serviceType);
      const basePrice = service?.basePrices[formData.city as keyof typeof service.basePrices] || 7000;
      setCalculatedPrice({
        price: basePrice,
        distance: 5,
        duration: 30
      });
    } finally {
      setPriceLoading(false);
    }
  }, [formData.pickup, formData.destination, formData.serviceType, formData.city, calculateDeliveryPrice, priceLoading]);

  // Auto-calcul prix à l'étape 4
  useEffect(() => {
    if (formData.pickup && formData.destination && currentStep === 4) {
      const timer = setTimeout(calculatePrice, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.pickup, formData.destination, currentStep, calculatePrice]);

  // Validation sécurisée des locations
  const handleLocationSelect = (location: any, type: 'pickup' | 'destination') => {
    try {
      if (!location) {
        toast({
          title: "❌ Localisation invalide",
          description: "Veuillez sélectionner une adresse valide",
          variant: "destructive"
        });
        return;
      }

      const secured = secureLocation(location, formData.city);
      
      if (!isValidLocation(secured)) {
        toast({
          title: "⚠️ Coordonnées corrigées",
          description: "Position optimisée pour la livraison",
          variant: "default"
        });
      }

      setFormData(prev => ({ ...prev, [type]: secured }));
      
      toast({
        title: `✅ ${type === 'pickup' ? 'Collecte' : 'Livraison'} définie`,
        description: secured.address,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur sélection location:', error);
      toast({
        title: "Erreur de localisation",
        description: "Impossible de traiter cette adresse",
        variant: "destructive"
      });
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validation pour progression
  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.city !== '';
      case 2: return formData.serviceType !== null && formData.serviceType !== undefined;
      case 3: return formData.pickup !== null && formData.destination !== null;
      case 4: return true;
      default: return false;
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    if (!formData.pickup || !formData.destination) {
      toast({
        title: "❌ Adresses manquantes",
        description: "Veuillez définir les points de collecte et de livraison",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedService = deliveryServices.find(s => s.id === formData.serviceType);
      const estimatedPrice = calculatedPrice?.price || selectedService?.basePrices[formData.city as keyof typeof selectedService.basePrices] || 7000;

      const orderData = {
        city: formData.city,
        pickup: formData.pickup,
        destination: formData.destination,
        mode: formData.serviceType,
        packageWeight: 5,
        packageType: 'medium' as const,
        additionalInfo: `Service: ${selectedService?.name} - Ville: ${formData.city}`,
        estimatedPrice,
        distance: calculatedPrice?.distance || 5,
        duration: calculatedPrice?.duration || 30
      };

      console.log('🚀 Création commande:', orderData);
      const result = await createDeliveryOrder(orderData);
      
      if (result) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Erreur création commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // ÉTAPE 1: Sélection de ville
  const StepCity = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Building className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Votre ville</h2>
        <p className="text-muted-foreground">Sélectionnez votre ville pour des tarifs optimisés</p>
      </div>

      <div className="grid gap-3">
        {cities.map((city) => {
          const isSelected = formData.city === city.id;
          
          return (
            <Card 
              key={city.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, city: city.id }))}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{city.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{city.name}</h3>
                      <Badge variant="outline">{city.population}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{city.country}</p>
                    <p className="text-xs text-muted-foreground">
                      Devise: {city.currency}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ÉTAPE 2: Service de livraison
  const StepService = () => {
    const selectedCity = cities.find(c => c.id === formData.city);
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Truck className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Service de livraison</h2>
          <p className="text-muted-foreground">
            Choisissez le service adapté à vos besoins pour {selectedCity?.name}
          </p>
        </div>

        <div className="space-y-3">
          {deliveryServices.map((service) => {
            const Icon = service.icon;
            const isSelected = formData.serviceType === service.id;
            const basePrice = service.basePrices[formData.city as keyof typeof service.basePrices];
            const currency = selectedCity?.currency || 'CDF';
            
            return (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, serviceType: service.id }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${service.bgColor} flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${service.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <Badge variant="outline">{service.time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{service.subtitle}</p>
                      <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {service.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-primary">
                        À partir de {basePrice?.toLocaleString()} {currency}
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // ÉTAPE 3: Adresses (Collecte + Livraison)
  const StepAddresses = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Route className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Adresses</h2>
        <p className="text-muted-foreground">Définissez les points de collecte et de livraison</p>
      </div>

      {/* Point de collecte */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-full">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <label className="text-sm font-medium">Point de collecte</label>
        </div>
        
        <ImprovedLocationSearch
          placeholder="Où récupérer le colis ?"
          onLocationSelect={(location) => handleLocationSelect(location, 'pickup')}
          city={formData.city}
          showCurrentLocation={true}
        />
        
        {formData.pickup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Collecte définie</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formData.pickup.address}</p>
          </motion.div>
        )}
      </div>

      {/* Point de livraison */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-full">
            <Target className="h-4 w-4 text-green-600" />
          </div>
          <label className="text-sm font-medium">Point de livraison</label>
        </div>
        
        <ImprovedLocationSearch
          placeholder="Où livrer le colis ?"
          onLocationSelect={(location) => handleLocationSelect(location, 'destination')}
          city={formData.city}
          showCurrentLocation={true}
        />
        
        {formData.destination && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Livraison définie</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formData.destination.address}</p>
          </motion.div>
        )}
      </div>
    </div>
  );

  // ÉTAPE 4: Confirmation
  const StepConfirmation = () => {
    const selectedService = deliveryServices.find(s => s.id === formData.serviceType);
    const selectedCity = cities.find(c => c.id === formData.city);
    const ServiceIcon = selectedService?.icon || Car;
    const currency = selectedCity?.currency || 'CDF';
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Confirmation</h2>
          <p className="text-muted-foreground">Vérifiez les détails de votre livraison</p>
        </div>

        {/* Résumé de la commande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServiceIcon className="h-5 w-5" />
              Service {selectedService?.name}
              <Badge variant="outline">{selectedCity?.name}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trajet */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                  <Package className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Collecte</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {formData.pickup?.address}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                  <Target className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Livraison</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {formData.destination?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Prix */}
            <div className="pt-4 border-t">
              {priceLoading ? (
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Calcul du prix...</p>
                </div>
              ) : calculatedPrice ? (
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {calculatedPrice.price.toLocaleString()} {currency}
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <span>{calculatedPrice.distance.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{calculatedPrice.duration} min</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {selectedService?.basePrices[formData.city as keyof typeof selectedService.basePrices]?.toLocaleString()} {currency}
                  </div>
                  <p className="text-sm text-muted-foreground">Prix estimé</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header avec progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Étape {currentStep}/4</span>
        </div>
        <Progress value={(currentStep / 4) * 100} className="h-2" />
      </div>

      {/* Contenu dynamique */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && <StepCity />}
          {currentStep === 2 && <StepService />}
          {currentStep === 3 && <StepAddresses />}
          {currentStep === 4 && <StepConfirmation />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}
        
        {currentStep < 4 ? (
          <Button 
            onClick={nextStep} 
            disabled={!canProceed()} 
            className="flex-1"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !canProceed()} 
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Confirmer la livraison
          </Button>
        )}
      </div>
    </div>
  );
};

export default FourStepDeliveryInterface;