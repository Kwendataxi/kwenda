/**
 * Interface de livraison moderne avec navigation par slides
 * Basée sur le même principe que ModernTaxiInterface.tsx
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, ArrowLeft, ArrowRight, Check, User, Phone as PhoneIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { LocationData } from '@/types/location';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import ContactsStep from './ContactsStep';
import { universalGeolocation } from '@/services/universalGeolocation';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/utils/logger';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';

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

// ✅ Prix retirés - désormais récupérés depuis pricing_rules via useDeliveryPricing
const SERVICE_TYPES = {
  flash: { 
    name: 'Flash', 
    icon: '⚡', 
    description: 'flash_desc',
    color: 'text-red-400',
    gradient: 'from-red-400/80 to-orange-400/80'
  },
  flex: { 
    name: 'Flex', 
    icon: '📦', 
    description: 'flex_desc',
    color: 'text-blue-400',
    gradient: 'from-blue-400/80 to-cyan-400/80'
  },
  maxicharge: { 
    name: 'MaxiCharge', 
    icon: '🚚', 
    description: 'maxicharge_desc',
    color: 'text-purple-400',
    gradient: 'from-purple-400/80 to-pink-400/80'
  }
};

const getPackageTypes = (t: any) => [
  t('delivery.package_documents'),
  t('delivery.package_electronics'),
  t('delivery.package_clothes'),
  t('delivery.package_food'),
  t('delivery.package_medicines'),
  t('delivery.package_furniture'),
  t('delivery.package_equipment'),
  t('delivery.package_other')
];

type Step = 'pickup' | 'destination' | 'contacts' | 'service' | 'confirm';

// Schéma de validation Zod pour les contacts
const getContactSchema = (t: any) => z.object({
  senderName: z.string().trim().min(2, t('delivery.name_min_length')).max(100, t('delivery.name_max_length')),
  senderPhone: z.string().trim().regex(/^\+?243[0-9]{9}$/, t('delivery.phone_invalid_format')),
  recipientName: z.string().trim().min(2, t('delivery.name_min_length')).max(100, t('delivery.name_max_length')),
  recipientPhone: z.string().trim().regex(/^\+?243[0-9]{9}$/, t('delivery.phone_invalid_format'))
});

export default function SlideDeliveryInterface({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const contactSchema = getContactSchema(t);
  const packageTypes = getPackageTypes(t);
  
  // ✅ Hook unifié pour tarification avec realtime
  const { calculateDeliveryPrice, getServicePricing, isLoading: isPricingLoading } = useDeliveryPricing();
  
  const [currentStep, setCurrentStep] = useState<Step>('pickup');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: packageTypes[0],
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

  // ✅ Calculer le prix avec les vrais tarifs de l'admin
  useEffect(() => {
    if (deliveryData.pickupLocation && deliveryData.deliveryLocation) {
      const distanceMeters = calculateDistance(
        deliveryData.pickupLocation,
        deliveryData.deliveryLocation
      );
      const distanceKm = distanceMeters / 1000;
      
      // Utiliser le hook de tarification unifié
      const priceCalculation = calculateDeliveryPrice(deliveryData.serviceType, distanceKm);
      
      logger.info('💰 Prix de livraison calculé', {
        serviceType: deliveryData.serviceType,
        distance: `${distanceKm.toFixed(2)} km`,
        basePrice: priceCalculation.basePrice,
        pricePerKm: priceCalculation.pricePerKm,
        totalPrice: priceCalculation.totalPrice,
        source: priceCalculation.source
      });
      
      setDeliveryData(prev => ({ ...prev, estimatedPrice: priceCalculation.totalPrice }));
    }
  }, [deliveryData.pickupLocation, deliveryData.deliveryLocation, deliveryData.serviceType, calculateDeliveryPrice]);

  const handleLocationSelect = async (location: LocationData, type: 'pickup' | 'delivery') => {
    logger.debug(`Location sélectionnée [${type}]`, location);

    // Validation stricte des coordonnées
    if (!location || 
        typeof location.lat !== 'number' || 
        typeof location.lng !== 'number' || 
        isNaN(location.lat) || 
        isNaN(location.lng) ||
        !location.address) {
      logger.error(`Coordonnées invalides [${type}]`, location);
      toast({
        title: t('delivery.invalid_address'),
        description: t('delivery.select_valid_address'),
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDATION DYNAMIQUE MULTI-VILLES
    const currentCity = await universalGeolocation.detectUserCity();
    const isInServiceArea = universalGeolocation.isWithinCityBounds(
      { lat: location.lat, lng: location.lng },
      currentCity
    );

    if (!isInServiceArea) {
      logger.warn(`Coordonnées hors zone ${currentCity.name} [${type}]`, location);
      toast({
        title: t('delivery.area_not_covered'),
        description: t('delivery.outside_service_area', { city: currentCity.name }),
        variant: "destructive"
      });
      return;
    }

    logger.info(`Coordonnées validées pour ${currentCity.name} [${type}]`, { lat: location.lat, lng: location.lng });

    if (type === 'pickup') {
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
      setPickupInputValue(location.address);
      setCurrentStep('destination');
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
      setDeliveryInputValue(location.address);
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
        const trimmedData = {
          senderName: deliveryData.senderName?.trim() || '',
          senderPhone: deliveryData.senderPhone?.trim() || '',
          recipientName: deliveryData.recipientName?.trim() || '',
          recipientPhone: deliveryData.recipientPhone?.trim() || ''
        };

        try {
          contactSchema.parse(trimmedData);
          
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
          logger.error('Validation contacts échouée', error.errors);
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [SlideDeliveryInterface] handleSubmit démarré');
    console.log('📦 État actuel deliveryData:', JSON.stringify(deliveryData, null, 2));
    
    // ✅ VALIDATION ULTRA-STRICTE PRE-SOUMISSION
    
    // 1. Vérifier les locations
    if (!deliveryData.pickupLocation?.lat || !deliveryData.pickupLocation?.lng) {
      logger.error('❌ Coordonnées pickup invalides:', deliveryData.pickupLocation);
      toast({
        title: "❌ Adresse de collecte invalide",
        description: "Veuillez sélectionner une adresse valide sur la carte",
        variant: "destructive"
      });
      setCurrentStep('pickup');
      return;
    }
    
    if (!deliveryData.deliveryLocation?.lat || !deliveryData.deliveryLocation?.lng) {
      logger.error('❌ Coordonnées delivery invalides:', deliveryData.deliveryLocation);
      toast({
        title: "❌ Adresse de livraison invalide",
        description: "Veuillez sélectionner une adresse valide sur la carte",
        variant: "destructive"
      });
      setCurrentStep('destination');
      return;
    }

    // 2. Validation STRICTE des contacts avec trim
    const senderPhoneTrimmed = deliveryData.senderPhone?.trim();
    const recipientPhoneTrimmed = deliveryData.recipientPhone?.trim();
    const senderNameTrimmed = deliveryData.senderName?.trim();
    const recipientNameTrimmed = deliveryData.recipientName?.trim();

    // 3. Logs de debug contacts
    console.log('📞 Validation contacts:', {
      senderName: senderNameTrimmed,
      senderPhone: senderPhoneTrimmed,
      recipientName: recipientNameTrimmed,
      recipientPhone: recipientPhoneTrimmed
    });

    // 4. Validation expéditeur
    if (!senderNameTrimmed || senderNameTrimmed.length < 2) {
      logger.error('❌ Nom expéditeur invalide:', deliveryData.senderName);
      toast({
        title: "❌ Nom de l'expéditeur requis",
        description: "Le nom doit contenir au moins 2 caractères",
        variant: "destructive"
      });
      setCurrentStep('contacts');
      return;
    }

    if (!senderPhoneTrimmed || senderPhoneTrimmed.length < 9) {
      logger.error('❌ Téléphone expéditeur manquant');
      toast({
        title: "❌ Téléphone de l'expéditeur requis",
        description: "Format attendu: +243XXXXXXXXX (minimum 9 chiffres)",
        variant: "destructive"
      });
      setCurrentStep('contacts');
      return;
    }

    // 5. Validation destinataire
    if (!recipientNameTrimmed || recipientNameTrimmed.length < 2) {
      logger.error('❌ Nom destinataire invalide:', deliveryData.recipientName);
      toast({
        title: "❌ Nom du destinataire requis",
        description: "Le nom doit contenir au moins 2 caractères",
        variant: "destructive"
      });
      setCurrentStep('contacts');
      return;
    }

    if (!recipientPhoneTrimmed || recipientPhoneTrimmed.length < 9) {
      logger.error('❌ Téléphone destinataire manquant');
      toast({
        title: "❌ Téléphone du destinataire requis",
        description: "Format attendu: +243XXXXXXXXX (minimum 9 chiffres)",
        variant: "destructive"
      });
      setCurrentStep('contacts');
      return;
    }

    console.log('✅ Validation pré-soumission réussie - Tous les champs sont valides');

    setIsSubmitting(true);

    try {
      // ✅ Calculer distance et durée
      const distanceMeters = calculateDistance(
        deliveryData.pickupLocation,
        deliveryData.deliveryLocation
      );
      const distanceKm = distanceMeters / 1000;
      const durationMinutes = Math.round(distanceKm * 2.5);

      // ✅ Structure de données GARANTIE VALIDE
      const validatedOrderData = {
        pickup: {
          location: {
            address: deliveryData.pickupLocation.address,
            coordinates: {
              lat: deliveryData.pickupLocation.lat,
              lng: deliveryData.pickupLocation.lng
            }
          },
          contact: {
            name: senderNameTrimmed, // GARANTIE NON-VIDE
            phone: senderPhoneTrimmed // GARANTIE NON-VIDE
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
            name: recipientNameTrimmed, // GARANTIE NON-VIDE
            phone: recipientPhoneTrimmed // GARANTIE NON-VIDE
          }
        },
        service: {
          mode: deliveryData.serviceType,
          name: SERVICE_TYPES[deliveryData.serviceType].name,
          description: t(`delivery.${SERVICE_TYPES[deliveryData.serviceType].description}`),
          icon: SERVICE_TYPES[deliveryData.serviceType].icon,
          features: ['Suivi temps réel', 'Support 24/7', 'Assurance colis'],
          estimatedTime: `${durationMinutes} min`
        },
        pricing: {
          price: deliveryData.estimatedPrice,
          distance: distanceKm,
          duration: durationMinutes
        },
        distance: distanceKm,
        duration: durationMinutes,
        mode: deliveryData.serviceType
      };

      console.log('📦 Données validées et structurées:', JSON.stringify(validatedOrderData, null, 2));
      console.log('✅ GARANTIE: Tous les contacts sont présents et valides');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Appeler onSubmit avec données garanties valides
      onSubmit(validatedOrderData);
      
    } catch (error) {
      logger.error('❌ Erreur préparation commande:', error);
      toast({
        title: "❌ Erreur",
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-primary/20 shadow-soft">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          {t('delivery.pickup_location')}
        </h2>
        <p className="text-muted-foreground">{t('delivery.where_pickup')}</p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
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
          className="h-14 text-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-md 
            border border-primary/20 focus:border-primary/60 
            rounded-2xl shadow-soft hover:shadow-glow
            transition-all duration-300 ease-out
            placeholder:text-muted-foreground/60"
          locationContext="pickup"
          showRecentSearches={true}
        />
      </motion.div>
    </motion.div>
  );

  const renderDestinationStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-secondary/20 shadow-soft">
          <Package className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-secondary to-foreground bg-clip-text text-transparent">
          Point de livraison
        </h2>
        <p className="text-muted-foreground">Où devons-nous livrer votre colis ?</p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <AutocompleteLocationInput
          key={`delivery-${currentStep}`}
          placeholder="Adresse de livraison"
          onChange={(location) => location && handleLocationSelect({
            address: location.address,
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
            type: 'google',
            placeId: location.placeId,
            name: location.name
          }, 'delivery')}
          className="h-14 text-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-md 
            border border-primary/20 focus:border-primary/60 
            rounded-2xl shadow-soft hover:shadow-glow
            transition-all duration-300 ease-out
            placeholder:text-muted-foreground/60"
          locationContext="delivery"
          showRecentSearches={false}
        />
      </motion.div>
    </motion.div>
  );

  const renderServiceStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-accent/20 shadow-soft">
          <Truck className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
          Type de service
        </h2>
        <p className="text-muted-foreground">Choisissez le service adapté à vos besoins</p>
      </motion.div>
      
      <div className="space-y-3">
        {Object.entries(SERVICE_TYPES).map(([key, service], index) => {
          // ✅ Récupérer le vrai tarif depuis l'admin
          const servicePricing = getServicePricing(key as 'flash' | 'flex' | 'maxicharge');
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group p-6 rounded-2xl cursor-pointer backdrop-blur-md transition-all duration-300 ${
                        deliveryData.serviceType === key
                          ? 'bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 border-2 border-primary shadow-2xl ring-2 ring-primary/20 scale-[1.02]'
                          : 'bg-white/50 dark:bg-gray-900/50 border-2 border-border/30 hover:border-primary/50 hover:shadow-xl hover:scale-[1.01] shadow-md'
                      }`}
                      onClick={() => setDeliveryData(prev => ({ ...prev, serviceType: key as any }))}
                    >
                      <div className="flex items-start justify-between gap-6">
                        {/* Zone Gauche : Icône + Contenu */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${service.gradient} 
                            flex items-center justify-center text-white text-2xl
                            shadow-xl backdrop-blur-sm border border-white/20 
                            transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                            {service.icon}
                          </div>
                          <div className="flex flex-col gap-2 pt-1">
                            <div className="font-bold text-xl text-foreground leading-tight">{service.name}</div>
                            <div className="text-sm font-medium text-muted-foreground leading-tight">
                              {t(`delivery.${service.description}`)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Zone Droite : Prix en colonne */}
                        <div className="flex flex-col items-end gap-0.5 pt-1 shrink-0">
                          <div className="font-extrabold text-3xl text-foreground leading-none">
                            {servicePricing.basePrice.toLocaleString()}
                          </div>
                          <div className="text-xs font-bold text-primary/80 uppercase tracking-wider">
                            CDF
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium mt-1 px-2 py-0.5 bg-muted/40 rounded-full">
                            +{servicePricing.pricePerKm}/km
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  
                  <TooltipContent 
                    side="right" 
                    align="start"
                    className="max-w-sm p-4 bg-card border-2 border-primary/20 shadow-2xl"
                  >
                    <div className="space-y-3">
                      {/* En-tête */}
                      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center text-lg`}>
                          {service.icon}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {key === 'flash' && '⏱️ 5-15 minutes'}
                            {key === 'flex' && '⏱️ 30-60 minutes'}
                            {key === 'maxicharge' && '⏱️ 1-3 heures'}
                          </p>
                        </div>
                      </div>

                      {/* Description détaillée */}
                      <div className="space-y-2 text-xs">
                        <p className="font-semibold text-foreground">
                          {key === 'flash' && '🏍️ Livraison ultra-rapide par moto'}
                          {key === 'flex' && '🚐 Livraison standard en camionnette'}
                          {key === 'maxicharge' && '🚚 Transport de gros volumes'}
                        </p>
                        <ul className="space-y-1 text-muted-foreground">
                          {key === 'flash' && (
                            <>
                              <li>• Petits colis (max 5 kg)</li>
                              <li>• Documents, nourriture, objets légers</li>
                              <li>• Idéal pour les urgences</li>
                            </>
                          )}
                          {key === 'flex' && (
                            <>
                              <li>• Colis moyens et volumineux</li>
                              <li>• Vêtements, électronique, courses</li>
                              <li>• Meilleur rapport qualité/prix</li>
                            </>
                          )}
                          {key === 'maxicharge' && (
                            <>
                              <li>• Équipement lourd, meubles</li>
                              <li>• Déménagement partiel/complet</li>
                              <li>• Matériel professionnel</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Pricing détaillé */}
                      <div className="bg-primary/5 rounded-lg p-2 space-y-1 text-xs border border-primary/10">
                        <div className="flex justify-between font-semibold">
                          <span>Prix de base</span>
                          <span>{servicePricing.basePrice.toLocaleString()} CDF</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Prix au kilomètre</span>
                          <span>+{servicePricing.pricePerKm} CDF/km</span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Label htmlFor="packageType" className="text-sm font-medium bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Type de colis
        </Label>
        <select
          id="packageType"
          value={deliveryData.packageType}
          onChange={(e) => setDeliveryData(prev => ({ ...prev, packageType: e.target.value }))}
          className="w-full p-3 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md 
            border border-primary/20 focus:border-primary/60 text-foreground 
            shadow-soft hover:shadow-glow transition-all duration-300"
        >
          {packageTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </motion.div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-4"
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-green-400/20 shadow-soft">
          <Check className="w-6 h-6 text-congo-green" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground via-congo-green to-foreground bg-clip-text text-transparent">
          Confirmation
        </h2>
        <p className="text-sm text-muted-foreground">Vérifiez et validez votre commande</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-white/60 via-white/40 to-transparent 
          dark:from-gray-900/60 dark:via-gray-900/40 dark:to-transparent
          backdrop-blur-lg border border-white/30 p-6 rounded-3xl shadow-xl"
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 
                  rounded-full shadow-lg ring-2 ring-green-400/30 flex-shrink-0"
              />
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
            
            <div className="ml-1.5 border-l-2 border-dashed border-border h-4" />
            
            <div className="flex items-center gap-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 
                  rounded-full shadow-lg ring-2 ring-red-400/30 flex-shrink-0"
              />
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
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-sm">
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
      </motion.div>
    </motion.div>
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
    const content = (() => {
      switch (currentStep) {
        case 'pickup': return renderPickupStep();
        case 'destination': return renderDestinationStep();
        case 'contacts': return renderContactsStep();
        case 'service': return renderServiceStep();
        case 'confirm': return renderConfirmStep();
        default: return renderPickupStep();
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold 
                      transition-all duration-300 shadow-md ${
                        getStepNumber(currentStep) > index + 1 || isStepCompleted(step as Step)
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-white scale-110 shadow-glow'
                          : getStepNumber(currentStep) === index + 1
                          ? 'bg-gradient-to-br from-primary to-primary/70 text-white shadow-xl ring-4 ring-primary/20'
                          : 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm text-muted-foreground'
                    }`}
                  >
                    {getStepNumber(currentStep) > index + 1 || isStepCompleted(step as Step) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  {index < 4 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: getStepNumber(currentStep) > index + 1 ? 1 : 0.3 }}
                      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                      className="w-12 h-1 origin-left rounded-full bg-gradient-to-r from-primary to-primary/40"
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
          <Card className="shadow-xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-white/20 mb-6">
            <div className="p-6">
              {renderCurrentStep()}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Footer SÉCURISÉ - toujours visible avec boutons centrés */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky bottom-0 left-0 right-0 
          bg-gradient-to-t from-white/95 via-white/90 to-transparent 
          dark:from-gray-950/95 dark:via-gray-950/90 dark:to-transparent
          backdrop-blur-2xl border-t border-white/20 
          p-5 z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] 
          safe-area-padding"
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-4 w-full">
            {/* Bouton gauche - Retour ou Annuler */}
            {currentStep === 'pickup' ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 max-w-40">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-12 min-touch-target 
                    bg-white/60 dark:bg-gray-900/60 backdrop-blur-md 
                    border border-primary/20 hover:border-primary/40 
                    rounded-2xl shadow-soft hover:shadow-glow
                    transition-all duration-300"
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 max-w-40">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full h-12 min-touch-target 
                    bg-white/60 dark:bg-gray-900/60 backdrop-blur-md 
                    border border-primary/20 hover:border-primary/40 
                    rounded-2xl shadow-soft hover:shadow-glow
                    transition-all duration-300"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </motion.div>
            )}
            
            {/* Bouton droite - Suivant ou Confirmer */}
            {currentStep !== 'confirm' ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 max-w-40">
                <Button
                  onClick={handleNext}
                  className="w-full h-12 min-touch-target 
                    bg-gradient-to-r from-primary via-primary to-primary/90 
                    hover:from-primary/90 hover:to-primary 
                    rounded-2xl shadow-glow hover:shadow-xl
                    transition-all duration-300 ring-2 ring-primary/20"
                  disabled={
                    (currentStep === 'pickup' && !deliveryData.pickupLocation) || 
                    (currentStep === 'destination' && !deliveryData.deliveryLocation)
                  }
                >
                  <span className="flex items-center gap-2">
                    Suivant
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 max-w-40">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-12 min-touch-target 
                    bg-gradient-to-r from-congo-green via-congo-green to-green-500 
                    hover:from-green-500 hover:to-congo-green 
                    rounded-2xl shadow-glow hover:shadow-xl
                    transition-all duration-300 ring-2 ring-green-400/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Création...' : 'Confirmer'}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}