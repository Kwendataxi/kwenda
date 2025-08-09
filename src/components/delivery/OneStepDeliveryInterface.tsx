import React, { useState, useEffect } from 'react';
import { ArrowRight, Package, Clock, MapPin, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { UnifiedLocationService, LocationResult, RouteResult } from '@/services/unifiedLocationService';
import UnifiedLocationSearch from './UnifiedLocationSearch';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { ModernBottomNavigation } from '@/components/home/ModernBottomNavigation';

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
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [destination, setDestination] = useState<LocationResult | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge' | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const { toast } = useToast();
  const { createDeliveryOrder, submitting } = useEnhancedDeliveryOrders();

  // Appliquer le mode initial le cas échéant
  useEffect(() => {
    if (initialSelectedMode) {
      setSelectedMode(initialSelectedMode);
    }
  }, [initialSelectedMode]);

  // Auto-détecter position actuelle au chargement
  useEffect(() => {
    UnifiedLocationService.getCurrentLocation()
      .then(location => setPickup(location))
      .catch(() => {
        // Silence, fallback déjà géré dans le service
      });
  }, []);

  // Calculer les prix quand pickup ET destination sont définis
  useEffect(() => {
    if (pickup && destination) {
      setCalculating(true);
      
      UnifiedLocationService.calculateRoute(pickup, destination)
        .then(routeResults => {
          setRoutes(routeResults);
          // Auto-sélectionner le mode optimal (flex par défaut)
          setSelectedMode('flex');
        })
        .catch(error => {
          console.error('Route calculation error:', error);
          toast({
            title: "Erreur de calcul",
            description: "Impossible de calculer l'itinéraire. Veuillez réessayer.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setCalculating(false);
        });
    } else {
      setRoutes([]);
      setSelectedMode(null);
    }
  }, [pickup, destination, toast]);

  const canProceed = pickup && destination && selectedMode && routes.length > 0;
  const selectedRoute = routes.find(r => r.mode === selectedMode);

  const handleConfirm = async () => {
    if (!canProceed || !selectedRoute) return;

    console.log('Confirmation commande - État:', { pickup, destination, selectedMode, selectedRoute });

    try {
      const orderData = {
        city: 'Kinshasa',
        pickup: pickup!,
        destination: destination!,
        mode: selectedMode!,
        estimatedPrice: selectedRoute.price,
        distance: selectedRoute.distance,
        duration: selectedRoute.duration
      };

      console.log('Données commande préparées:', orderData);

      const newOrderId = await createDeliveryOrder(orderData);
      setOrderId(newOrderId);
      setStep('created');
      
      console.log('Commande créée avec ID:', newOrderId);
      
      // Auto-transition vers le tracking après 2 secondes
      setTimeout(() => {
        onSubmit({ ...orderData, orderId: newOrderId });
      }, 2000);
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
                <span>Prix</span>
                <span className="font-bold">{selectedRoute?.price.toLocaleString()} CDF</span>
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

  // Étape 2: Confirmation
  if (step === 'confirm' && canProceed && selectedRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Confirmation</h1>
                <p className="text-sm opacity-90">Vérifiez votre commande</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('input')}
                className="text-primary-foreground"
              >
                ← Modifier
              </Button>
            </div>
          </div>

          {/* Résumé de la commande */}
          <div className="flex-1 p-4 space-y-4 pb-24">
            {/* Trajet */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Trajet
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Récupération</div>
                    <div className="text-sm text-muted-foreground">{pickup?.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Livraison</div>
                    <div className="text-sm text-muted-foreground">{destination?.address}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Mode sélectionné */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mode de livraison
              </h3>
              <div className="flex items-center gap-3">
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
                <div className="text-right">
                  <div className="font-bold text-lg">{selectedRoute.price.toLocaleString()} CDF</div>
                  <div className="text-sm text-muted-foreground">
                    {UnifiedLocationService.formatDuration(selectedRoute.duration)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Détails */}
            <Card className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Distance</span>
                  <span>{UnifiedLocationService.formatDistance(selectedRoute.distance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temps estimé</span>
                  <span>{UnifiedLocationService.formatDuration(selectedRoute.duration)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{selectedRoute.price.toLocaleString()} CDF</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Bouton de confirmation fixé en bas */}
          <div className="p-4 border-t bg-background">
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Création...' : 'Confirmer la commande'}
              <CheckCircle className="w-4 h-4 ml-2" />
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
  }

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
            <UnifiedLocationSearch
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
            <UnifiedLocationSearch
              placeholder="Où livrer ?"
              value={destination?.address || ''}
              onLocationSelect={setDestination}
              showCurrentLocation={false}
            />
          </div>

          {/* Modes de livraison avec prix en temps réel */}
          {routes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode de livraison</span>
                {calculating && (
                  <div className="text-xs text-muted-foreground">Calcul en cours...</div>
                )}
              </div>
              
              {deliveryModes.map((mode) => {
                const route = routes.find(r => r.mode === mode.id);
                const isSelected = selectedMode === mode.id;
                
                return (
                  <Card
                    key={mode.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMode(mode.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{mode.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mode.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {mode.description}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-1">
                            {mode.features.map((feature, idx) => (
                              <span key={idx} className="text-xs text-muted-foreground">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {route ? (
                          <>
                            <div className="font-bold text-lg">
                              {route.price.toLocaleString()} CDF
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {UnifiedLocationService.formatDuration(route.duration)}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">---</div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Distance et temps */}
          {selectedRoute && (
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">
                  {UnifiedLocationService.formatDistance(selectedRoute.distance)}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Bouton continuer fixé en bas */}
        <div className="p-4 border-t bg-background">
          <Button
            onClick={() => setStep('confirm')}
            disabled={!canProceed || calculating}
            className="w-full"
            size="lg"
          >
            {calculating ? 'Calcul...' : `Continuer • ${selectedRoute?.price.toLocaleString() || '---'} CDF`}
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