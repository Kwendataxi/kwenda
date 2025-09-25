/**
 * Interface de livraison moderne avec navigation par slides
 * Basée sur le même principe que ModernTaxiInterface.tsx
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { LocationData } from '@/types/location';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryData {
  pickupLocation: LocationData | null;
  deliveryLocation: LocationData | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  packageType: string;
  estimatedPrice: number;
}

const SERVICE_TYPES = {
  flash: { 
    name: 'Flash', 
    icon: '⚡', 
    description: 'Livraison express (1-2h)',
    basePrice: 5000,
    color: 'text-red-500',
    gradient: 'from-red-500 to-orange-500'
  },
  flex: { 
    name: 'Flex', 
    icon: '📦', 
    description: 'Livraison standard (2-4h)',
    basePrice: 3000,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500'
  },
  maxicharge: { 
    name: 'MaxiCharge', 
    icon: '🚚', 
    description: 'Gros colis (4-6h)',
    basePrice: 8000,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500'
  }
};

const PACKAGE_TYPES = [
  'Documents', 'Électronique', 'Vêtements', 'Nourriture', 
  'Médicaments', 'Mobilier', 'Équipement', 'Autre'
];

type Step = 'pickup' | 'destination' | 'service' | 'confirm';

export default function SlideDeliveryInterface({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: 'Documents',
    estimatedPrice: 3000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer distance entre deux points
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Formater distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Calculer le prix quand les locations changent
  useEffect(() => {
    if (deliveryData.pickupLocation && deliveryData.deliveryLocation) {
      const distance = calculateDistance(
        deliveryData.pickupLocation,
        deliveryData.deliveryLocation
      );
      
      const basePrice = SERVICE_TYPES[deliveryData.serviceType].basePrice;
      const distancePrice = Math.max(0, (distance / 1000 - 1)) * 500; // 500 CDF par km après le premier
      const estimatedPrice = Math.round(basePrice + distancePrice);
      
      setDeliveryData(prev => ({ ...prev, estimatedPrice }));
    }
  }, [deliveryData.pickupLocation, deliveryData.deliveryLocation, deliveryData.serviceType, calculateDistance]);

  const handleLocationSelect = (location: LocationData, type: 'pickup' | 'delivery') => {
    // Validation améliorée avec vérification des coordonnées
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || !location.address) {
      toast({
        title: "Adresse invalide",
        description: "Veuillez sélectionner une adresse valide avec des coordonnées précises",
        variant: "destructive"
      });
      return;
    }

    if (type === 'pickup') {
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
      setCurrentStep('destination');
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
      setCurrentStep('service');
    }
  };


  const handleNext = () => {
    switch (currentStep) {
      case 'pickup':
        if (!deliveryData.pickupLocation) {
          toast({
            title: "Adresse de collecte requise",
            description: "Veuillez sélectionner une adresse de collecte valide",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep('destination');
        break;
      case 'destination':
        if (!deliveryData.deliveryLocation) {
          toast({
            title: "Adresse de livraison requise",
            description: "Veuillez sélectionner une adresse de livraison valide",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep('service');
        break;
      case 'service':
        setCurrentStep('confirm');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'destination':
        setCurrentStep('pickup');
        break;
      case 'service':
        setCurrentStep('destination');
        break;
      case 'confirm':
        setCurrentStep('service');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!deliveryData.pickupLocation || !deliveryData.deliveryLocation) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner les adresses de collecte et de livraison",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Conversion vers le format attendu par OrderConfirmationStep/useEnhancedDeliveryOrders
      const adaptedOrderData = {
        pickup: {
          location: {
            address: deliveryData.pickupLocation.address,
            coordinates: {
              lat: deliveryData.pickupLocation.lat,
              lng: deliveryData.pickupLocation.lng
            }
          }
        },
        destination: {
          location: {
            address: deliveryData.deliveryLocation.address,
            coordinates: {
              lat: deliveryData.deliveryLocation.lat,
              lng: deliveryData.deliveryLocation.lng
            }
          }
        },
        service: {
          mode: deliveryData.serviceType,
          name: SERVICE_TYPES[deliveryData.serviceType].name,
          description: SERVICE_TYPES[deliveryData.serviceType].description
        },
        pricing: {
          price: deliveryData.estimatedPrice,
          mode: deliveryData.serviceType
        },
        packageDetails: {
          type: deliveryData.packageType,
          description: `Colis de type ${deliveryData.packageType}`
        }
      };

      console.log('🔄 Données formatées pour OrderConfirmationStep:', adaptedOrderData);

      // Passer les données au parent qui utilisera OrderConfirmationStep
      onSubmit(adaptedOrderData);
      
    } catch (error) {
      console.error('Erreur lors de la préparation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de préparer la commande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['pickup', 'destination', 'service', 'confirm'];
    return steps.indexOf(step) + 1;
  };

  const isStepCompleted = (step: Step): boolean => {
    switch (step) {
      case 'pickup':
        return !!deliveryData.pickupLocation;
      case 'destination':
        return !!deliveryData.deliveryLocation;
      case 'service':
        return !!deliveryData.serviceType;
      case 'confirm':
        return false; // Never completed until submission
      default:
        return false;
    }
  };


  const renderPickupStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Point de collecte</h2>
        <p className="text-muted-foreground">Où devons-nous récupérer votre colis ?</p>
      </div>
      
      <AutocompleteLocationInput
        placeholder="Adresse de collecte"
        onChange={(location) => location && handleLocationSelect({
          address: location.address,
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
          type: 'google',
          placeId: location.placeId,
          name: location.name
        }, 'pickup')}
        className="h-12 text-lg bg-card border border-primary/30 focus:border-primary shadow-lg"
      />
    </div>
  );

  const renderDestinationStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
          <Package className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Point de livraison</h2>
        <p className="text-muted-foreground">Où devons-nous livrer votre colis ?</p>
      </div>
      
      <AutocompleteLocationInput
        placeholder="Adresse de livraison"
        onChange={(location) => location && handleLocationSelect({
          address: location.address,
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
          type: 'google',
          placeId: location.placeId,
          name: location.name
        }, 'delivery')}
        className="h-12 text-lg bg-card border border-primary/30 focus:border-primary shadow-lg"
      />
    </div>
  );

  const renderServiceStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Type de service</h2>
        <p className="text-muted-foreground">Choisissez le service adapté à vos besoins</p>
      </div>
      
      <div className="space-y-4">
        {Object.entries(SERVICE_TYPES).map(([key, service]) => (
          <div
            key={key}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] animate-fadeIn ${
              deliveryData.serviceType === key
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'border-primary/20 bg-card hover:border-primary/50 hover:shadow-soft shadow-lg'
            }`}
            onClick={() => setDeliveryData(prev => ({ ...prev, serviceType: key as any }))}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${service.gradient} flex items-center justify-center text-white text-xl`}>
                  {service.icon}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{service.name}</div>
                  <div className="text-sm text-muted-foreground">{service.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">{service.basePrice.toLocaleString()} CDF</div>
                <div className="text-xs text-muted-foreground">+ distance</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Label htmlFor="packageType" className="text-sm font-medium">Type de colis</Label>
        <select
          id="packageType"
          value={deliveryData.packageType}
          onChange={(e) => setDeliveryData(prev => ({ ...prev, packageType: e.target.value }))}
          className="w-full p-3 rounded-lg bg-card border border-primary/30 focus:border-primary text-foreground shadow-lg"
        >
          {PACKAGE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Confirmation</h2>
        <p className="text-muted-foreground">Vérifiez les détails de votre commande</p>
      </div>
      
      <div className="bg-card border border-congo-green/30 p-6 rounded-xl shadow-soft">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Collecte</p>
              <p className="text-sm text-muted-foreground truncate">
                {deliveryData.pickupLocation?.address}
              </p>
            </div>
          </div>
          
          <div className="ml-1.5 border-l border-dashed border-border h-6" />
          
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Livraison</p>
              <p className="text-sm text-muted-foreground truncate">
                {deliveryData.deliveryLocation?.address}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{SERVICE_TYPES[deliveryData.serviceType].name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type de colis</span>
              <span className="font-medium">{deliveryData.packageType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance</span>
              <span className="font-medium">
                {deliveryData.pickupLocation && deliveryData.deliveryLocation
                  ? formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))
                  : '—'
                }
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Prix estimé</span>
              <span className="text-congo-green">{deliveryData.estimatedPrice.toLocaleString()} CDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'pickup': return renderPickupStep();
      case 'destination': return renderDestinationStep();
      case 'service': return renderServiceStep();
      case 'confirm': return renderConfirmStep();
      default: return renderPickupStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 relative">
      {/* Content avec padding pour éviter que le footer masque le contenu */}
      <div className="pb-28 px-4 pt-6">
        <div className="max-w-md mx-auto">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {['pickup', 'destination', 'service', 'confirm'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      getStepNumber(currentStep) > index + 1 || isStepCompleted(step as Step)
                        ? 'bg-primary text-primary-foreground'
                        : getStepNumber(currentStep) === index + 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getStepNumber(currentStep) > index + 1 || isStepCompleted(step as Step) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-0.5 transition-colors ${
                        getStepNumber(currentStep) > index + 1 ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Étape {getStepNumber(currentStep)} sur 4
            </p>
          </div>

          {/* Step Content */}
          <Card className="shadow-lg">
            <div className="p-6">
              {renderCurrentStep()}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Footer FIXE avec meilleur z-index et padding */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-50 shadow-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center space-x-4">
            {currentStep !== 'pickup' && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            )}
            
            {currentStep === 'pickup' && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 btn-congo-soft"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}
            
            {currentStep !== 'confirm' ? (
              <Button
                onClick={handleNext}
                className="flex-1 btn-congo shadow-glow hover:shadow-congo"
                disabled={!deliveryData.pickupLocation && currentStep === 'pickup' || 
                         !deliveryData.deliveryLocation && currentStep === 'destination'}
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1 btn-congo shadow-glow hover:shadow-congo"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Confirmer la commande'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}