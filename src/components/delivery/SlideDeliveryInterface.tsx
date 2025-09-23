/**
 * Interface de livraison moderne avec navigation par slides
 * Basée sur le même principe que ModernTaxiInterface.tsx
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, Clock, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSimpleLocation } from '@/hooks/useSimpleLocation';
import { LocationSearchResult } from '@/services/simpleLocationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryData {
  pickupLocation: LocationSearchResult | null;
  deliveryLocation: LocationSearchResult | null;
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
  const { getCurrentPosition, searchLocations, calculateDistance, formatDistance } = useSimpleLocation();
  
  const [currentStep, setCurrentStep] = useState<Step>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: 'Documents',
    estimatedPrice: 3000
  });

  const [pickupQuery, setPickupQuery] = useState('');
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSearchResult[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<LocationSearchResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser la position actuelle
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Recherche pickup
  useEffect(() => {
    if (pickupQuery.length > 2) {
      searchLocations(pickupQuery, setPickupSuggestions);
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupQuery, searchLocations]);

  // Recherche delivery
  useEffect(() => {
    if (deliveryQuery.length > 2) {
      searchLocations(deliveryQuery, setDeliverySuggestions);
    } else {
      setDeliverySuggestions([]);
    }
  }, [deliveryQuery, searchLocations]);

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

  const handleLocationSelect = (location: LocationSearchResult, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      if (!location.address || !location.lat || !location.lng) {
        toast({
          title: "Adresse invalide",
          description: "Veuillez sélectionner une adresse valide avec des coordonnées précises",
          variant: "destructive"
        });
        return;
      }
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
      setPickupQuery(location.title);
      setPickupSuggestions([]);
      setCurrentStep('destination');
    } else {
      if (!location.address || !location.lat || !location.lng) {
        toast({
          title: "Adresse invalide",
          description: "Veuillez sélectionner une adresse valide avec des coordonnées précises",
          variant: "destructive"
        });
        return;
      }
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
      setDeliveryQuery(location.title);
      setDeliverySuggestions([]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const orderData = {
        user_id: user.id,
        pickup_location: deliveryData.pickupLocation.address,
        delivery_location: deliveryData.deliveryLocation.address,
        pickup_coordinates: {
          lat: deliveryData.pickupLocation.lat,
          lng: deliveryData.pickupLocation.lng
        },
        delivery_coordinates: {
          lat: deliveryData.deliveryLocation.lat,
          lng: deliveryData.deliveryLocation.lng
        },
        delivery_type: deliveryData.serviceType,
        package_type: deliveryData.packageType,
        estimated_price: deliveryData.estimatedPrice,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Delivery order created:', data);

      // Automatic driver assignment
      try {
        const { data: assignmentResult, error: assignmentError } = await supabase.functions.invoke('delivery-dispatcher', {
          body: {
            orderId: data.id,
            pickupLat: deliveryData.pickupLocation.lat,
            pickupLng: deliveryData.pickupLocation.lng,
            deliveryType: deliveryData.serviceType
          }
        });

        if (assignmentError) {
          console.error('❌ Driver assignment failed:', assignmentError);
          toast({
            title: "Commande créée",
            description: "Commande créée mais aucun livreur disponible pour le moment"
          });
        } else if (assignmentResult?.success) {
          console.log('✅ Driver assigned:', assignmentResult.driver);
          toast({
            title: "Commande créée",
            description: "Votre demande de livraison a été enregistrée et un livreur a été assigné"
          });
        } else {
          toast({
            title: "Commande créée",
            description: "Votre demande de livraison a été enregistrée avec succès"
          });
        }
      } catch (assignmentError) {
        console.error('❌ Assignment service error:', assignmentError);
        toast({
          title: "Commande créée",
          description: "Votre demande de livraison a été enregistrée avec succès"
        });
      }

      onSubmit(data);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
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

  const LocationInput = ({ 
    value, 
    onChange, 
    suggestions, 
    onSelect, 
    placeholder,
    type
  }: {
    value: string;
    onChange: (value: string) => void;
    suggestions: LocationSearchResult[];
    onSelect: (location: LocationSearchResult) => void;
    placeholder: string;
    type: 'pickup' | 'delivery';
  }) => (
    <div className="relative space-y-4">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 text-lg glass-input"
        autoFocus
      />
      
      {suggestions.length > 0 && (
        <div className="glass-card border border-border/20 rounded-lg overflow-hidden z-50">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-border/10 last:border-b-0"
              onClick={() => onSelect(suggestion)}
            >
              <div className="font-medium text-foreground">{suggestion.title}</div>
              {suggestion.subtitle && (
                <div className="text-sm text-muted-foreground mt-1">{suggestion.subtitle}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPickupStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Point de collecte</h2>
        <p className="text-muted-foreground">Où devons-nous récupérer votre colis ?</p>
      </div>
      
      <LocationInput
        value={pickupQuery}
        onChange={setPickupQuery}
        suggestions={pickupSuggestions}
        onSelect={(location) => handleLocationSelect(location, 'pickup')}
        placeholder="Rechercher une adresse..."
        type="pickup"
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
      
      <LocationInput
        value={deliveryQuery}
        onChange={setDeliveryQuery}
        suggestions={deliverySuggestions}
        onSelect={(location) => handleLocationSelect(location, 'delivery')}
        placeholder="Rechercher une adresse..."
        type="delivery"
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
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
              deliveryData.serviceType === key
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                : 'border-border/20 glass-card hover:border-primary/30'
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
          className="w-full p-3 rounded-lg glass-input border border-border/20 bg-background/20 text-foreground"
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
      
      <div className="glass-card border border-green-500/20 bg-green-500/5 p-6 rounded-xl">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Point de collecte</div>
              <div className="text-sm text-muted-foreground">{deliveryData.pickupLocation?.address}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-secondary mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Point de livraison</div>
              <div className="text-sm text-muted-foreground">{deliveryData.deliveryLocation?.address}</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <div className="font-medium text-foreground">Service</div>
              <div className="text-sm text-muted-foreground">
                {SERVICE_TYPES[deliveryData.serviceType].name} - {deliveryData.packageType}
              </div>
            </div>
          </div>
          
          {deliveryData.pickupLocation && deliveryData.deliveryLocation && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">Distance</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))}
                </div>
              </div>
            </div>
          )}
          
          <div className="border-t border-border/20 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Prix total</span>
              <span className="text-2xl font-bold text-primary">
                {deliveryData.estimatedPrice.toLocaleString()} CDF
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'pickup':
        return renderPickupStep();
      case 'destination':
        return renderDestinationStep();
      case 'service':
        return renderServiceStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return renderPickupStep();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec indicateur de progression */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/20 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-foreground">Livraison Express</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {getStepNumber(currentStep)}/4
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {(['pickup', 'destination', 'service', 'confirm'] as Step[]).map((step, index) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : isStepCompleted(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isStepCompleted(step) ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 rounded-full transition-all ${
                    getStepNumber(currentStep) > index + 1 || isStepCompleted(step)
                      ? 'bg-green-500' 
                      : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-border/20 p-6">
            {renderCurrentStep()}
          </Card>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-border/20 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep !== 'pickup' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 glass-button"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          
          {currentStep === 'pickup' && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 glass-button"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          )}
          
          {currentStep !== 'confirm' ? (
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!deliveryData.pickupLocation && currentStep === 'pickup' || 
                       !deliveryData.deliveryLocation && currentStep === 'destination'}
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Confirmer la commande'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}