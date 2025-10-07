/**
 * Interface de livraison moderne avec navigation par slides
 * Basée sur le même principe que ModernTaxiInterface.tsx
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, ArrowLeft, ArrowRight, Check, User, Phone as PhoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { LocationData } from '@/types/location';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import ContactsStep from './ContactsStep';

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
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
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

type Step = 'pickup' | 'destination' | 'contacts' | 'service' | 'confirm';

// Schéma de validation Zod pour les contacts
const contactSchema = z.object({
  senderName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom est trop long"),
  senderPhone: z.string().trim().regex(/^\+?243[0-9]{9}$/, "Format invalide. Exemple: +243123456789 ou 0123456789"),
  recipientName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom est trop long"),
  recipientPhone: z.string().trim().regex(/^\+?243[0-9]{9}$/, "Format invalide. Exemple: +243123456789 ou 0123456789")
});

export default function SlideDeliveryInterface({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: 'Documents',
    estimatedPrice: 3000,
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: ''
  });

  // États pour contrôler les valeurs des champs d'adresse
  const [pickupInputValue, setPickupInputValue] = useState<string>('');
  const [deliveryInputValue, setDeliveryInputValue] = useState<string>('');

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
      setPickupInputValue(location.address); // Contrôler la valeur affichée
      setCurrentStep('destination');
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
      setDeliveryInputValue(location.address); // Contrôler la valeur affichée
      setCurrentStep('contacts');
    }
  };

  // Réinitialiser le champ de livraison quand on revient à l'étape de destination
  const handleBack = () => {
    switch (currentStep) {
      case 'destination':
        setCurrentStep('pickup');
        break;
      case 'contacts':
        setCurrentStep('destination');
        break;
      case 'service':
        setCurrentStep('contacts');
        break;
      case 'confirm':
        setCurrentStep('service');
        break;
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
        setCurrentStep('contacts');
        break;
      case 'contacts':
        // VALIDATION STRICTE DES CHAMPS DE CONTACT
        const trimmedData = {
          senderName: deliveryData.senderName?.trim() || '',
          senderPhone: deliveryData.senderPhone?.trim() || '',
          recipientName: deliveryData.recipientName?.trim() || '',
          recipientPhone: deliveryData.recipientPhone?.trim() || ''
        };

        console.log('🔍 Validation des contacts:', trimmedData);

        try {
          contactSchema.parse(trimmedData);
          
          // Mettre à jour avec les données nettoyées
          setDeliveryData(prev => ({
            ...prev,
            senderName: trimmedData.senderName,
            senderPhone: trimmedData.senderPhone,
            recipientName: trimmedData.recipientName,
            recipientPhone: trimmedData.recipientPhone
          }));
          
          setCurrentStep('service');
        } catch (error: any) {
          const firstError = error.errors?.[0];
          console.error('❌ Erreur de validation des contacts:', error.errors);
          toast({
            title: "Validation échouée",
            description: firstError?.message || "Veuillez vérifier les informations saisies",
            variant: "destructive"
          });
        }
        break;
      case 'service':
        setCurrentStep('confirm');
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
          },
          contact: {
            name: deliveryData.senderName,
            phone: deliveryData.senderPhone
          }
        },
        destination: {
          location: {
            address: deliveryData.deliveryLocation.address,
            coordinates: {
              lat: deliveryData.deliveryLocation.lat,
              lng: deliveryData.deliveryLocation.lng
            }
          },
          contact: {
            name: deliveryData.recipientName,
            phone: deliveryData.recipientPhone
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
    const steps: Step[] = ['pickup', 'destination', 'contacts', 'service', 'confirm'];
    return steps.indexOf(step) + 1;
  };

  const isStepCompleted = (step: Step): boolean => {
    switch (step) {
      case 'pickup':
        return !!deliveryData.pickupLocation;
      case 'destination':
        return !!deliveryData.deliveryLocation;
      case 'contacts':
        return !!deliveryData.senderName && !!deliveryData.senderPhone && 
               !!deliveryData.recipientName && !!deliveryData.recipientPhone;
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
        <h2 className="text-2xl font-bold text-foreground">{t('delivery.pickup_location')}</h2>
        <p className="text-muted-foreground">{t('delivery.where_pickup')}</p>
      </div>
      
      <AutocompleteLocationInput
        placeholder={t('delivery.pickup_address')}
        onChange={(location) => location && handleLocationSelect({
          address: location.address,
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
          type: 'google',
          placeId: location.placeId,
          name: location.name
        }, 'pickup')}
        className="h-12 text-lg bg-card border border-primary/30 focus:border-primary shadow-lg"
        locationContext="pickup"
        showRecentSearches={true}
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
        key={`delivery-${currentStep}`} // Force re-render pour réinitialiser
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
        locationContext="delivery"
        showRecentSearches={false} // Pas de recherches récentes pour éviter la confusion
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
    <div className="space-y-4 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-congo-green/10 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-congo-green" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Confirmation</h2>
        <p className="text-sm text-muted-foreground">Vérifiez et validez votre commande</p>
      </div>
      
      <div className="bg-card border border-primary/20 p-4 rounded-xl shadow-soft">
        <div className="space-y-3">
          {/* Itinéraire compact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-congo-green rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Collecte</p>
                <p className="text-sm font-medium truncate">{deliveryData.pickupLocation?.address}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {deliveryData.senderName}
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" />
                    {deliveryData.senderPhone}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-1 border-l border-dashed border-border h-3" />
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-congo-red rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Livraison</p>
                <p className="text-sm font-medium truncate">{deliveryData.deliveryLocation?.address}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {deliveryData.recipientName}
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" />
                    {deliveryData.recipientPhone}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Détails en grille */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-medium">{SERVICE_TYPES[deliveryData.serviceType].name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{deliveryData.packageType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-medium">
                {deliveryData.pickupLocation && deliveryData.deliveryLocation
                  ? formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prix estimé</p>
              <p className="font-bold text-congo-green">{deliveryData.estimatedPrice.toLocaleString()} CDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactsStep = () => (
    <ContactsStep
      senderName={deliveryData.senderName}
      senderPhone={deliveryData.senderPhone}
      recipientName={deliveryData.recipientName}
      recipientPhone={deliveryData.recipientPhone}
      onSenderNameChange={(value) => setDeliveryData(prev => ({ ...prev, senderName: value }))}
      onSenderPhoneChange={(value) => setDeliveryData(prev => ({ ...prev, senderPhone: value }))}
      onRecipientNameChange={(value) => setDeliveryData(prev => ({ ...prev, recipientName: value }))}
      onRecipientPhoneChange={(value) => setDeliveryData(prev => ({ ...prev, recipientPhone: value }))}
      userProfile={user ? { display_name: user.user_metadata?.display_name, phone_number: user.user_metadata?.phone_number } : undefined}
    />
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'pickup': return renderPickupStep();
      case 'destination': return renderDestinationStep();
      case 'contacts': return renderContactsStep();
      case 'service': return renderServiceStep();
      case 'confirm': return renderConfirmStep();
      default: return renderPickupStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 relative flex flex-col">
      {/* Content scrollable avec espace pour le footer */}
      <div className="flex-1 content-scrollable px-4 pt-6 pb-36">
        <div className="max-w-md mx-auto">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {['pickup', 'destination', 'contacts', 'service', 'confirm'].map((step, index) => (
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
                  {index < 4 && (
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
              Étape {getStepNumber(currentStep)} sur 5
            </p>
          </div>

          {/* Step Content optimisé pour mobile */}
          <Card className="shadow-lg mb-6">
            <div className="p-6">
              {renderCurrentStep()}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Footer SÉCURISÉ - toujours visible avec boutons centrés */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border/50 p-4 z-[60] shadow-2xl safe-area-padding">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-4 w-full">
            {/* Bouton gauche - Retour ou Annuler */}
            {currentStep === 'pickup' ? (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 max-w-40 min-touch-target bg-muted/50 hover:bg-muted border-border"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex-1 max-w-40 min-touch-target bg-muted/50 hover:bg-muted text-foreground"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            )}
            
            {/* Bouton droite - Suivant ou Confirmer */}
            {currentStep !== 'confirm' ? (
              <Button
                onClick={handleNext}
                className="flex-1 max-w-40 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow hover:shadow-congo min-touch-target"
                disabled={
                  (currentStep === 'pickup' && !deliveryData.pickupLocation) || 
                  (currentStep === 'destination' && !deliveryData.deliveryLocation)
                }
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1 max-w-40 bg-congo-green hover:bg-congo-green/90 text-white shadow-glow hover:shadow-congo min-touch-target"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Confirmer'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}