import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Star, MapPin, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { smartLocationService } from '@/services/smartLocationService';
import SmartLocationSearch from './SmartLocationSearch';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData } from '@/types/location';

interface OneStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  initialSelectedMode?: 'flash' | 'flex' | 'maxicharge';
  selectedPackageId?: string;
}

interface DeliveryMode {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  icon: string;
  description: string;
  features: string[];
}

const deliveryModes: DeliveryMode[] = [
  {
    id: 'flash',
    name: 'Flash',
    icon: '🏍️',
    description: 'Ultra-rapide',
    features: ['Moto', 'Express', '15-30min']
  },
  {
    id: 'flex',
    name: 'Flex',
    icon: '🚗',
    description: 'Économique',
    features: ['Voiture', 'Standard', '30-60min']
  },
  {
    id: 'maxicharge',
    name: 'MaxiCharge',
    icon: '🚛',
    description: 'Gros colis',
    features: ['Camion', 'Volumineux', '1-2h']
  }
];

const OneStepDeliveryInterface: React.FC<OneStepDeliveryInterfaceProps> = ({
  onSubmit,
  onCancel,
  activeTab = 'home',
  onTabChange = () => {},
  initialSelectedMode,
  selectedPackageId,
}) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'created'>('input');
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge' | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [priceInfo, setPriceInfo] = useState<{price: number, distance: number, duration: number} | null>(null);
  const [calculating, setCalculating] = useState(false);

  const { toast } = useToast();
  const { createDeliveryOrder, submitting, calculateDeliveryPrice } = useEnhancedDeliveryOrders();

  // Appliquer le mode initial le cas échéant
  useEffect(() => {
    if (initialSelectedMode) {
      setSelectedMode(initialSelectedMode);
    }
  }, [initialSelectedMode]);

  // Auto-détecter position actuelle au chargement
  useEffect(() => {
    smartLocationService.getCurrentLocation()
      .then(location => setPickup(location))
      .catch(() => {
        // Silence, fallback déjà géré dans le service
      });
  }, []);
  // Sélection par défaut si non fournie
  useEffect(() => {
    if (!selectedMode && pickup && destination) {
      setSelectedMode(initialSelectedMode || 'flex');
    }
  }, [pickup, destination, selectedMode, initialSelectedMode]);

  // Calcul automatique du prix dès que pickup + destination + mode sont définis
  useEffect(() => {
    const calculatePrice = async () => {
      if (pickup && destination && selectedMode) {
        setCalculating(true);
        try {
          const result = await calculateDeliveryPrice({
            address: pickup.address,
            lat: pickup.lat,
            lng: pickup.lng
          }, {
            address: destination.address,
            lat: destination.lat,
            lng: destination.lng
          }, selectedMode);
          setPriceInfo(result);
        } catch (error) {
          console.error('Erreur calcul prix:', error);
          setPriceInfo(null);
        } finally {
          setCalculating(false);
        }
      } else {
        setPriceInfo(null);
      }
    };

    calculatePrice();
  }, [pickup, destination, selectedMode, calculateDeliveryPrice]);

  const canProceed = pickup && destination && selectedMode && priceInfo;

  const handleSearchDriver = async () => {
    if (!canProceed) return;

    console.log('Recherche de livreur - État:', { pickup, destination, selectedMode });

    try {
      const orderData = {
        city: 'Kinshasa',
        pickup: pickup!,
        destination: destination!,
        mode: selectedMode!,
        estimatedPrice: priceInfo!.price,
        distance: priceInfo!.distance,
        duration: priceInfo!.duration
      };

      console.log('Données commande préparées:', orderData);

      const newOrderId = await createDeliveryOrder(orderData);
      setOrderId(newOrderId);

      // Déclencher la recherche de livreur (rayon selon mode)
      try {
        const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
          body: {
            action: 'find_drivers',
            orderId: newOrderId,
            mode: selectedMode!,
            pickupCoordinates: { lat: pickup!.lat, lng: pickup!.lng }
          }
        });
        if (error || data?.success === false) {
          console.warn('Recherche livreur échouée:', error || data);
          toast({
            title: "Aucun livreur pour l'instant",
            description: "Nous réessaierons automatiquement.",
          });
        }
      } catch (e) {
        console.error('Invocation delivery-dispatcher erreur:', e);
      }

      setStep('created');
      console.log('Commande créée avec ID:', newOrderId);

      setTimeout(() => {
        onSubmit({ ...orderData, orderId: newOrderId });
      }, 1200);
    } catch (error) {
      console.error('Erreur dans handleConfirm:', error);
      // Error géré par le hook
    }
  };

  // Étape 3: Commande créée avec succès
  if (step === 'created') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-sm">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Commande créée !
              </h2>
              <p className="text-muted-foreground">
                Votre livraison {selectedMode} a été confirmée
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Commande #</span>
                <span className="font-mono">{orderId.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-bold">{deliveryModes.find(m => m.id === selectedMode)?.name}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Redirection vers le suivi...
            </div>
          </div>
        </div>
        
        {/* Navigation en bas */}
        <ModernBottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    );
  }

  // Plus d'étape confirmation - action directe

  // Étape 1: Saisie des adresses (Interface unifiée)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header moderne */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Livraison Express</h1>
              <p className="text-sm opacity-90">Saisissez vos adresses</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-primary-foreground"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Formulaire unifié */}
        <div className="flex-1 p-4 space-y-4 pb-24">
          {/* Récupération */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Récupération</span>
              {pickup?.type === 'geocoded' && (
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Position détectée
                </Badge>
              )}
            </div>
            <SmartLocationSearch
              placeholder="Où récupérer ?"
              value={pickup?.address || ''}
              onLocationSelect={setPickup}
              showCurrentLocation={true}
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">Destination</span>
            </div>
            <SmartLocationSearch
              placeholder="Où livrer ?"
              value={destination?.address || ''}
              onLocationSelect={setDestination}
              showCurrentLocation={false}
            />
          </div>

          {/* Mode sélectionné et prix */}
          {selectedMode && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">
                  {deliveryModes.find(m => m.id === selectedMode)?.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {deliveryModes.find(m => m.id === selectedMode)?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {deliveryModes.find(m => m.id === selectedMode)?.description}
                  </div>
                </div>
              </div>
              
              {/* Informations de prix */}
              {calculating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Calcul du prix...
                </div>
              ) : priceInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Distance</span>
                    </div>
                    <span className="font-medium">{priceInfo.distance?.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Temps estimé</span>
                    </div>
                    <span className="font-medium">{Math.round(priceInfo.duration)} min</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Prix</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{priceInfo.price?.toLocaleString()} CDF</span>
                  </div>
                </div>
              ) : pickup && destination ? (
                <div className="text-sm text-muted-foreground">
                  Calcul du prix en cours...
                </div>
              ) : null}
            </Card>
          )}
        </div>

        {/* Bouton continuer avec prix fixé en bas */}
        <div className="p-4 border-t bg-background">
          <Button
            onClick={handleSearchDriver}
            disabled={!canProceed || submitting || calculating}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              'Recherche en cours...'
            ) : calculating ? (
              'Calcul du prix...'
            ) : priceInfo ? (
              `Continuer • ${priceInfo.price?.toLocaleString()} CDF`
            ) : (
              'Sélectionner les adresses'
            )}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Navigation en bas */}
      <ModernBottomNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};

export default OneStepDeliveryInterface;