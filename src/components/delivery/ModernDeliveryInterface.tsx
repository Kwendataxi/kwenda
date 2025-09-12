/**
 * Interface de livraison moderne et simplifiée - 3 étapes seulement
 * Étape 1: Ville + Service
 * Étape 2: Adresses (pickup + destination simultanées)
 * Étape 3: Confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { SimplifiedLocationSearch } from './SimplifiedLocationSearch';
import CitySelector from './CitySelector';
import { LocationData } from '@/types/location';
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
  Zap
} from 'lucide-react';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryFormData {
  city: string;
  serviceMode: 'flash' | 'flex' | 'maxicharge';
  pickup: LocationData | null;
  destination: LocationData | null;
}

// Services de livraison optimisés
const deliveryServices = [
  {
    id: 'flash' as const,
    name: 'Flash',
    subtitle: 'Express en moto',
    icon: Bike,
    time: '15-30 min',
    basePrice: 5000,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'flex' as const,
    name: 'Flex',
    subtitle: 'Standard en voiture',
    icon: Car,
    time: '30-60 min',
    basePrice: 7000,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'maxicharge' as const,
    name: 'MaxiCharge',
    subtitle: 'Gros volume en camion',
    icon: Truck,
    time: '1-2 heures',
    basePrice: 12000,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
];

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const { toast } = useToast();
  const { createDeliveryOrder, calculateDeliveryPrice, loading } = useEnhancedDeliveryOrders();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DeliveryFormData>({
    city: 'Kinshasa',
    serviceMode: 'flex',
    pickup: null,
    destination: null
  });
  
  const [calculatedPrice, setCalculatedPrice] = useState<{
    price: number;
    distance: number;
    duration: number;
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Validation stricte des LocationData
  const validateLocationData = (location: any): LocationData | null => {
    if (!location) return null;
    
    const address = location.address || location.name || '';
    const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat || '0');
    const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng || '0');
    
    if (!address.trim() || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      console.error('Location invalide:', { address, lat, lng });
      return null;
    }
    
    return {
      address: address.trim(),
      lat,
      lng,
      type: location.type || 'geocoded',
      placeId: location.placeId,
      name: location.name,
      subtitle: location.subtitle
    };
  };

  // Calcul de prix en temps réel
  const calculatePrice = useCallback(async () => {
    if (!formData.pickup || !formData.destination || priceLoading) return;
    
    const validPickup = validateLocationData(formData.pickup);
    const validDestination = validateLocationData(formData.destination);
    
    if (!validPickup || !validDestination) {
      console.error('Données de localisation invalides pour le calcul');
      return;
    }
    
    setPriceLoading(true);
    try {
      const result = await calculateDeliveryPrice(validPickup, validDestination, formData.serviceMode);
      setCalculatedPrice(result);
      console.log('Prix calculé:', result);
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      const service = deliveryServices.find(s => s.id === formData.serviceMode);
      setCalculatedPrice({
        price: service?.basePrice || 7000,
        distance: 5,
        duration: 30
      });
    } finally {
      setPriceLoading(false);
    }
  }, [formData.pickup, formData.destination, formData.serviceMode, calculateDeliveryPrice, priceLoading]);

  // Auto-calcul prix quand les adresses sont complètes
  useEffect(() => {
    if (formData.pickup && formData.destination && currentStep === 3) {
      const timer = setTimeout(calculatePrice, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.pickup, formData.destination, currentStep, calculatePrice]);

  // Gestion sélection location avec validation renforcée
  const handleLocationSelect = (location: any, type: 'pickup' | 'destination') => {
    console.log(`Sélection ${type}:`, location);
    
    const validLocation = validateLocationData(location);
    if (!validLocation) {
      toast({
        title: "Adresse invalide",
        description: "Cette adresse ne peut pas être utilisée. Veuillez en choisir une autre.",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({ ...prev, [type]: validLocation }));
    
    toast({
      title: `${type === 'pickup' ? 'Collecte' : 'Livraison'} définie ✅`,
      description: validLocation.address,
      variant: "default"
    });
  };

  // Navigation entre étapes
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validation pour passer à l'étape suivante
  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.city && formData.serviceMode;
      case 2: return formData.pickup && formData.destination;
      case 3: return true;
      default: return false;
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    const validPickup = validateLocationData(formData.pickup);
    const validDestination = validateLocationData(formData.destination);
    
    if (!validPickup || !validDestination) {
      toast({
        title: "Erreur de validation",
        description: "Les adresses de collecte et de livraison sont requises et doivent être valides.",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        city: formData.city,
        pickup: validPickup,
        destination: validDestination,
        mode: formData.serviceMode,
        packageWeight: 5,
        packageType: 'medium' as const,
        additionalInfo: `Service: ${deliveryServices.find(s => s.id === formData.serviceMode)?.name}`,
        estimatedPrice: calculatedPrice?.price || deliveryServices.find(s => s.id === formData.serviceMode)?.basePrice || 7000,
        distance: calculatedPrice?.distance || 5,
        duration: calculatedPrice?.duration || 30
      };

      console.log('Données de commande:', orderData);
      const result = await createDeliveryOrder(orderData);
      
      if (result) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Erreur création commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Vérifiez vos informations.",
        variant: "destructive"
      });
    }
  };

  // Étape 1: Ville + Service
  const StepOne = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Package className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Configuration</h2>
        <p className="text-muted-foreground">Choisissez votre ville et le type de livraison</p>
      </div>

      {/* Sélection ville */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Ville</label>
        <CitySelector
          selectedCity={formData.city}
          onCityChange={(city) => setFormData(prev => ({ ...prev, city }))}
        />
      </div>

      {/* Sélection service */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Service de livraison</label>
        <div className="grid gap-3">
          {deliveryServices.map((service) => {
            const Icon = service.icon;
            const isSelected = formData.serviceMode === service.id;
            
            return (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, serviceMode: service.id }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${service.bgColor}`}>
                      <Icon className={`h-5 w-5 ${service.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{service.name}</h3>
                        <Badge variant="outline">{service.time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{service.subtitle}</p>
                      <p className="text-sm font-medium text-primary">
                        À partir de {service.basePrice.toLocaleString()} FC
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
    </div>
  );

  // Étape 2: Adresses
  const StepTwo = () => (
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
        <SimplifiedLocationSearch
          placeholder="Où récupérer le colis ?"
          onChange={(location) => handleLocationSelect(location, 'pickup')}
          value={formData.pickup}
          city={formData.city}
          label="Collecte"
          icon={<Package className="w-5 h-5 text-blue-600" />}
        />
        {formData.pickup && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Collecte définie</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formData.pickup.address}</p>
          </div>
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
        <SimplifiedLocationSearch
          placeholder="Où livrer le colis ?"
          onChange={(location) => handleLocationSelect(location, 'destination')}
          value={formData.destination}
          city={formData.city}
          label="Livraison"
          icon={<Target className="w-5 h-5 text-green-600" />}
        />
        {formData.destination && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Livraison définie</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formData.destination.address}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Étape 3: Confirmation
  const StepThree = () => {
    const selectedService = deliveryServices.find(s => s.id === formData.serviceMode);
    const ServiceIcon = selectedService?.icon || Car;
    
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
                    {calculatedPrice.price.toLocaleString()} FC
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
                    {selectedService?.basePrice.toLocaleString()} FC
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
          <span className="text-sm font-medium">Étape {currentStep}/3</span>
        </div>
        <Progress value={(currentStep / 3) * 100} className="h-2" />
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
          {currentStep === 1 && <StepOne />}
          {currentStep === 2 && <StepTwo />}
          {currentStep === 3 && <StepThree />}
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
        
        {currentStep < 3 ? (
          <Button 
            onClick={nextStep} 
            disabled={!canProceed()}
            className="flex-1"
          >
            Continuer
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Confirmer
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModernDeliveryInterface;