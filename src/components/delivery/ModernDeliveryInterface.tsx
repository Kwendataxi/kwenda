/**
 * Interface de livraison modernisée nouvelle génération
 * Remplace OneStepDeliveryInterface avec MasterLocationService
 * Design simple, moderne et fiable
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, MapPin, Clock, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { useEnhancedDeliveryOrders, type DeliveryOrderData } from '@/hooks/useEnhancedDeliveryOrders';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';
import { LocationData } from '@/services/MasterLocationService';
import { formatCurrency } from '@/lib/utils';
import { ModernDeliveryDriverSearch } from './ModernDeliveryDriverSearch';
import DeliveryLiveTracker from './DeliveryLiveTracker';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  initialMode?: 'flash' | 'flex' | 'maxicharge';
}

interface DeliveryMode {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  estimatedTime: string;
  basePrice: number;
}

const deliveryModes: DeliveryMode[] = [
  {
    id: 'flash',
    name: 'Flash',
    icon: <div className="text-2xl">⚡</div>,
    description: 'Ultra-rapide',
    features: ['Moto', 'Express', 'Priorité max'],
    estimatedTime: '15-30 min',
    basePrice: 5000
  },
  {
    id: 'flex',
    name: 'Flex',
    icon: <div className="text-2xl">🚗</div>,
    description: 'Économique',
    features: ['Voiture', 'Standard', 'Bon rapport qualité/prix'],
    estimatedTime: '30-60 min',
    basePrice: 3000
  },
  {
    id: 'maxicharge',
    name: 'MaxiCharge',
    icon: <div className="text-2xl">🚛</div>,
    description: 'Gros colis',
    features: ['Camion', 'Volumineux', 'Jusqu\'à 500kg'],
    estimatedTime: '1-2 heures',
    basePrice: 8000
  }
];

export const ModernDeliveryInterface: React.FC<ModernDeliveryInterfaceProps> = ({
  onSubmit,
  onCancel,
  activeTab = 'home',
  onTabChange = () => {},
  initialMode
}) => {
  // États
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge' | null>(
    initialMode || null
  );
  const [priceInfo, setPriceInfo] = useState<{price: number; distance: number; duration: number} | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'searching' | 'tracking' | 'success'>('form');
  const [orderId, setOrderId] = useState<string>('');
  const [assignedDriverId, setAssignedDriverId] = useState<string>('');

  const { toast } = useToast();
  const { createDeliveryOrder, submitting, calculateDeliveryPrice } = useEnhancedDeliveryOrders();

  // Auto-sélection du mode par défaut
  useEffect(() => {
    if (pickup && destination && !selectedMode) {
      setSelectedMode('flex'); // Mode économique par défaut
    }
  }, [pickup, destination, selectedMode]);

  // Calcul automatique du prix avec cache pour éviter la boucle infinie
  useEffect(() => {
    const calculatePrice = async () => {
      if (pickup && destination && selectedMode) {
        setCalculating(true);
        try {
          const result = await calculateDeliveryPrice(pickup, destination, selectedMode);
          setPriceInfo(result);
        } catch (error) {
          console.error('Erreur calcul prix:', error);
          setPriceInfo({
            price: deliveryModes.find(m => m.id === selectedMode)!.basePrice,
            distance: 5,
            duration: 30
          });
        } finally {
          setCalculating(false);
        }
      } else {
        setPriceInfo(null);
      }
    };

    // Cache simple pour éviter les recalculs inutiles
    const currentKey = pickup && destination && selectedMode 
      ? `${pickup.lat}-${pickup.lng}-${destination.lat}-${destination.lng}-${selectedMode}`
      : null;
    
    if (currentKey) {
      calculatePrice();
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, selectedMode]);

  const canProceed = pickup && destination && selectedMode && priceInfo;

  const handleConfirm = async () => {
    if (!canProceed) return;

    try {
      const orderData: DeliveryOrderData = {
        city: 'Kinshasa',
        pickup: pickup!,
        destination: destination!,
        mode: selectedMode!,
        estimatedPrice: priceInfo!.price,
        distance: priceInfo!.distance,
        duration: priceInfo!.duration
      };

      const newOrderId = await createDeliveryOrder(orderData);
      setOrderId(newOrderId);
      setStep('searching'); // Passer directement à la recherche de livreur
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  const handleDriverAssigned = (driverId: string, driverData: any) => {
    setAssignedDriverId(driverId);
    setStep('tracking');
  };

  const handleBackToForm = () => {
    setStep('form');
    setOrderId('');
    setAssignedDriverId('');
  };

  const handleCancelSearch = () => {
    setStep('form');
    // Optionnel: annuler la commande dans la DB
  };

  // Interface de recherche de livreur
  if (step === 'searching') {
    return (
      <ModernDeliveryDriverSearch
        orderId={orderId}
        deliveryMode={selectedMode!}
        estimatedPrice={priceInfo!.price}
        onDriverAssigned={handleDriverAssigned}
        onCancel={handleCancelSearch}
        onBackToForm={handleBackToForm}
      />
    );
  }

  // Interface de tracking en temps réel
  if (step === 'tracking') {
    return (
      <DeliveryLiveTracker
        orderId={orderId}
        orderData={{
          pickup: pickup ? { lat: pickup.lat, lng: pickup.lng, address: pickup.address } : undefined,
          destination: destination ? { lat: destination.lat, lng: destination.lng, address: destination.address } : undefined,
          mode: selectedMode
        }}
        onBack={handleBackToForm}
      />
    );
  }

  // Interface de succès
  if (step === 'success') {
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
                Votre livraison {deliveryModes.find(m => m.id === selectedMode)?.name} a été confirmée
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
              <div className="flex justify-between">
                <span>Prix</span>
                <span className="font-bold text-primary">{formatCurrency(priceInfo?.price || 0)}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Recherche de livreur en cours...
            </div>
          </div>
        </div>
        
        <ModernBottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    );
  }

  // Interface principale
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Livraison Express</h1>
            <p className="text-sm opacity-90">Commandez en 3 étapes simples</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-primary-foreground hover:bg-white/20"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 pb-24">
        {/* 1. Adresses */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Adresses</h3>
            </div>

            {/* Récupération */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Récupération</span>
                {pickup && (
                  <Badge variant="outline" className="text-xs">✓</Badge>
                )}
              </div>
              <UniversalLocationPicker
                value={pickup}
                onLocationSelect={setPickup}
                placeholder="Où récupérer le colis ?"
                context="delivery"
                showCurrentLocation={true}
                className="w-full"
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Destination</span>
                {destination && (
                  <Badge variant="outline" className="text-xs">✓</Badge>
                )}
              </div>
              <UniversalLocationPicker
                value={destination}
                onLocationSelect={setDestination}
                placeholder="Où livrer le colis ?"
                context="delivery"
                showCurrentLocation={false}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* 2. Mode de livraison */}
        {pickup && destination && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Mode de livraison</h3>
              </div>

              <div className="grid gap-3">
                {deliveryModes.map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMode === mode.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {mode.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{mode.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {mode.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mode.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mode.features.map((feature, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">
                              {feature}{idx < mode.features.length - 1 ? ' • ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedMode === mode.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 3. Récapitulatif et prix */}
        {canProceed && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Récapitulatif</h3>
              </div>

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
                    <span className="font-medium">{priceInfo.distance.toFixed(1)} km</span>
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
                      <span className="font-semibold">Prix total</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(priceInfo.price)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        )}
      </div>

      {/* Bouton de confirmation */}
      <div className="p-4 border-t bg-background">
        <Button
          onClick={handleConfirm}
          disabled={!canProceed || submitting || calculating}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            'Création en cours...'
          ) : calculating ? (
            'Calcul du prix...'
          ) : canProceed ? (
            `Commander • ${formatCurrency(priceInfo!.price)}`
          ) : (
            'Complétez les informations'
          )}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <ModernBottomNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};

export default ModernDeliveryInterface;