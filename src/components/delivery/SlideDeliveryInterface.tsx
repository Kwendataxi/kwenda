/**
 * Interface de livraison moderne - 3 étapes fluides
 * Design soft-modern épuré, minimaliste et professionnel
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, ArrowLeft, Check, User, Phone as PhoneIcon, ArrowDown, Truck, Bike, Container, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { LocationData } from '@/types/location';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { universalGeolocation } from '@/services/universalGeolocation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';
import { cn } from '@/lib/utils';

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
  flash: { name: 'Flash', icon: Bike, description: 'Express 5-15 min', color: 'text-amber-500' },
  flex: { name: 'Flex', icon: Truck, description: 'Standard 30-60 min', color: 'text-primary' },
  maxicharge: { name: 'Maxi', icon: Container, description: 'Gros colis 1-3h', color: 'text-purple-500' }
};

const getPackageTypes = (t: any) => [
  t('delivery.package_documents'),
  t('delivery.package_electronics'),
  t('delivery.package_clothes'),
  t('delivery.package_food'),
  t('delivery.package_medicines'),
  t('delivery.package_other')
];

type Step = 'addresses' | 'details' | 'confirm';

export default function SlideDeliveryInterface({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const packageTypes = getPackageTypes(t);
  
  const { calculateDeliveryPrice, getServicePricing } = useDeliveryPricing();
  
  const [currentStep, setCurrentStep] = useState<Step>('addresses');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: packageTypes[0],
    estimatedPrice: 3000,
    senderName: user?.user_metadata?.display_name || '',
    senderPhone: user?.user_metadata?.phone_number || '',
    recipientName: '',
    recipientPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371000;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  useEffect(() => {
    if (deliveryData.pickupLocation && deliveryData.deliveryLocation) {
      const distanceMeters = calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation);
      const distanceKm = distanceMeters / 1000;
      const priceCalculation = calculateDeliveryPrice(deliveryData.serviceType, distanceKm);
      setDeliveryData(prev => ({ ...prev, estimatedPrice: priceCalculation.totalPrice }));
    }
  }, [deliveryData.pickupLocation, deliveryData.deliveryLocation, deliveryData.serviceType, calculateDeliveryPrice]);

  const handleLocationSelect = async (location: LocationData, type: 'pickup' | 'delivery') => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      toast({ title: t('delivery.invalid_address'), variant: "destructive" });
      return;
    }

    const currentCity = await universalGeolocation.detectUserCity();
    const isInServiceArea = universalGeolocation.isWithinCityBounds({ lat: location.lat, lng: location.lng }, currentCity);

    if (!isInServiceArea) {
      toast({ title: t('delivery.area_not_covered'), variant: "destructive" });
      return;
    }

    if (type === 'pickup') {
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
    }
  };

  const handleNext = () => {
    if (currentStep === 'addresses') {
      if (!deliveryData.pickupLocation) {
        toast({ title: "Adresse de collecte requise", variant: "destructive" });
        return;
      }
      if (!deliveryData.deliveryLocation) {
        toast({ title: "Adresse de livraison requise", variant: "destructive" });
        return;
      }
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!deliveryData.senderName?.trim() || deliveryData.senderName.trim().length < 2) {
        toast({ title: "Nom expéditeur requis", variant: "destructive" });
        return;
      }
      if (!deliveryData.senderPhone?.trim() || deliveryData.senderPhone.trim().length < 9) {
        toast({ title: "Téléphone expéditeur invalide", variant: "destructive" });
        return;
      }
      if (!deliveryData.recipientName?.trim() || deliveryData.recipientName.trim().length < 2) {
        toast({ title: "Nom destinataire requis", variant: "destructive" });
        return;
      }
      if (!deliveryData.recipientPhone?.trim() || deliveryData.recipientPhone.trim().length < 9) {
        toast({ title: "Téléphone destinataire invalide", variant: "destructive" });
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') setCurrentStep('addresses');
    else if (currentStep === 'confirm') setCurrentStep('details');
  };

  const handleSubmit = async () => {
    if (!deliveryData.pickupLocation || !deliveryData.deliveryLocation) return;
    
    setIsSubmitting(true);
    try {
      const distanceMeters = calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation);
      const distanceKm = distanceMeters / 1000;
      const durationMinutes = Math.round(distanceKm * 2.5);

      const validatedOrderData = {
        pickup: {
          location: { address: deliveryData.pickupLocation.address, coordinates: { lat: deliveryData.pickupLocation.lat, lng: deliveryData.pickupLocation.lng } },
          contact: { name: deliveryData.senderName.trim(), phone: deliveryData.senderPhone.trim() }
        },
        destination: {
          location: { address: deliveryData.deliveryLocation.address, coordinates: { lat: deliveryData.deliveryLocation.lat, lng: deliveryData.deliveryLocation.lng } },
          contact: { name: deliveryData.recipientName.trim(), phone: deliveryData.recipientPhone.trim() }
        },
        service: {
          mode: deliveryData.serviceType,
          name: SERVICE_TYPES[deliveryData.serviceType].name,
          estimatedTime: `${durationMinutes} min`
        },
        pricing: { price: deliveryData.estimatedPrice, distance: distanceKm, duration: durationMinutes },
        distance: distanceKm,
        duration: durationMinutes,
        mode: deliveryData.serviceType
      };

      onSubmit(validatedOrderData);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer la commande", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Step[] = ['addresses', 'details', 'confirm'];
  const currentStepIndex = steps.indexOf(currentStep);

  const formatPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '+243' + cleaned.substring(1);
    if (cleaned && !cleaned.startsWith('+')) cleaned = '+243' + cleaned;
    return cleaned.slice(0, 16);
  };

  // ================== STEP 1: ADDRESSES ==================
  const renderAddressesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Collecte */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <Label className="text-sm font-medium">Collecte</Label>
        </div>
        <AutocompleteLocationInput
          placeholder="Adresse de collecte..."
          onChange={(location) => location && handleLocationSelect({
            address: location.address,
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
            type: 'google',
            placeId: location.placeId,
            name: location.name
          }, 'pickup')}
          className="rounded-xl border-border/50 bg-muted/20"
          locationContext="pickup"
          showRecentSearches={true}
        />
        {deliveryData.pickupLocation && (
          <p className="text-xs text-primary flex items-center gap-1 pl-4">
            <Check className="w-3 h-3" />
            <span className="truncate">{deliveryData.pickupLocation.address}</span>
          </p>
        )}
      </div>

      {/* Séparateur */}
      <div className="flex items-center justify-center py-1">
        <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
      </div>

      {/* Livraison */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <Label className="text-sm font-medium">Livraison</Label>
        </div>
        <AutocompleteLocationInput
          placeholder="Adresse de livraison..."
          onChange={(location) => location && handleLocationSelect({
            address: location.address,
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
            type: 'google',
            placeId: location.placeId,
            name: location.name
          }, 'delivery')}
          className="rounded-xl border-border/50 bg-muted/20"
          locationContext="delivery"
          showRecentSearches={false}
        />
        {deliveryData.deliveryLocation && (
          <p className="text-xs text-primary flex items-center gap-1 pl-4">
            <Check className="w-3 h-3" />
            <span className="truncate">{deliveryData.deliveryLocation.address}</span>
          </p>
        )}
      </div>

      {/* Distance estimée */}
      {deliveryData.pickupLocation && deliveryData.deliveryLocation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 bg-muted/20 rounded-xl border border-border/30"
        >
          <p className="text-sm text-muted-foreground">
            Distance : <span className="font-semibold text-foreground">
              {formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))}
            </span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );

  // ================== STEP 2: DETAILS ==================
  const renderDetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Service selection - Compact */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Service</Label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SERVICE_TYPES).map(([key, service]) => {
            const isSelected = deliveryData.serviceType === key;
            const Icon = service.icon;
            
            return (
              <button
                key={key}
                onClick={() => setDeliveryData(prev => ({ ...prev, serviceType: key as any }))}
                className={cn(
                  "p-3 rounded-xl text-center transition-all border-2",
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/20 border-transparent hover:border-border/50"
                )}
              >
                <Icon className={cn("w-5 h-5 mx-auto mb-1", service.color)} />
                <div className="text-xs font-medium">{service.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expéditeur */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Expéditeur
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={deliveryData.senderName}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, senderName: e.target.value }))}
            className="h-11 rounded-xl bg-muted/20 border-border/30"
          />
          <Input
            placeholder="+243..."
            value={deliveryData.senderPhone}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, senderPhone: formatPhoneNumber(e.target.value) }))}
            className="h-11 rounded-xl bg-muted/20 border-border/30"
          />
        </div>
      </div>

      {/* Destinataire */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Destinataire
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={deliveryData.recipientName}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, recipientName: e.target.value }))}
            className="h-11 rounded-xl bg-muted/20 border-border/30"
          />
          <Input
            placeholder="+243..."
            value={deliveryData.recipientPhone}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, recipientPhone: formatPhoneNumber(e.target.value) }))}
            className="h-11 rounded-xl bg-muted/20 border-border/30"
          />
        </div>
      </div>

      {/* Package type - Compact select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type de colis</Label>
        <select
          value={deliveryData.packageType}
          onChange={(e) => setDeliveryData(prev => ({ ...prev, packageType: e.target.value }))}
          className="w-full h-11 px-3 rounded-xl bg-muted/20 border border-border/30 text-sm"
        >
          {packageTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );

  // ================== STEP 3: CONFIRM ==================
  const renderConfirmStep = () => {
    const ServiceIcon = SERVICE_TYPES[deliveryData.serviceType].icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* Timeline compacte */}
        <div className="bg-card border border-border/30 rounded-2xl p-4">
          {/* Collecte */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <div className="w-0.5 flex-1 bg-border/40 my-1.5" />
            </div>
            <div className="flex-1 pb-3 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Collecte</p>
              <p className="text-sm font-medium truncate">{deliveryData.pickupLocation?.address}</p>
              <p className="text-xs text-muted-foreground">{deliveryData.senderName} • {deliveryData.senderPhone}</p>
            </div>
          </div>
          
          {/* Livraison */}
          <div className="flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Livraison</p>
              <p className="text-sm font-medium truncate">{deliveryData.deliveryLocation?.address}</p>
              <p className="text-xs text-muted-foreground">{deliveryData.recipientName} • {deliveryData.recipientPhone}</p>
            </div>
          </div>
        </div>

        {/* Résumé compact */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-xl">
            <ServiceIcon className={cn("w-4 h-4", SERVICE_TYPES[deliveryData.serviceType].color)} />
            <span className="text-sm font-medium">{SERVICE_TYPES[deliveryData.serviceType].name}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-xl">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {deliveryData.pickupLocation && deliveryData.deliveryLocation
                ? formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))
                : '—'}
            </span>
          </div>
          
          <div className="flex-1 text-right px-3 py-2 bg-primary/10 rounded-xl">
            <span className="text-sm font-bold text-primary">
              {deliveryData.estimatedPrice.toLocaleString()} CDF
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header minimaliste */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/20 px-4 py-3 safe-area-top">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={currentStep === 'addresses' ? onCancel : handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <span className="font-semibold">Livraison</span>
          </div>

          {/* Progress dots compacts */}
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index <= currentStepIndex 
                    ? "w-5 bg-primary" 
                    : "w-1 bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5 pb-28 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === 'addresses' && renderAddressesStep()}
            {currentStep === 'details' && renderDetailsStep()}
            {currentStep === 'confirm' && renderConfirmStep()}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/20 p-4 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <Button
            onClick={currentStep === 'confirm' ? handleSubmit : handleNext}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-medium"
            disabled={isSubmitting || 
              (currentStep === 'addresses' && (!deliveryData.pickupLocation || !deliveryData.deliveryLocation))
            }
          >
            {currentStep === 'confirm' 
              ? (isSubmitting ? 'Création...' : `Commander • ${deliveryData.estimatedPrice.toLocaleString()} CDF`) 
              : 'Continuer'
            }
          </Button>
        </div>
      </footer>
    </div>
  );
}
