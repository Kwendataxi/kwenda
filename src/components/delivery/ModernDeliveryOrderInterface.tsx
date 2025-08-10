import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { LocationData } from '@/types/location';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { 
  Package, 
  MapPin, 
  Navigation, 
  Clock, 
  Truck,
  Zap,
  Search,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePricingRules } from '@/hooks/usePricingRules';

interface ModernDeliveryOrderInterfaceProps {
  className?: string;
}

const ModernDeliveryOrderInterface: React.FC<ModernDeliveryOrderInterfaceProps> = ({ className }) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  const [packageType, setPackageType] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Refs for scrollable container and sections
  const containerRef = useRef<HTMLDivElement | null>(null);
  const addressesRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<HTMLDivElement | null>(null);
  const packageRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLDivElement | null>(null);
  
  const { 
    calculateDeliveryPrice, 
    createDeliveryOrder, 
    loading, 
    submitting 
  } = useEnhancedDeliveryOrders();
  const { rules, isLoading: pricingLoading } = usePricingRules();
  const { calculateDistance, formatDistance } = useMasterLocation();

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || !containerRef.current) return;
    const top = ref.current.offsetTop - 8; // small offset
    containerRef.current.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const handleFieldFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    // Ensure field is visible within the scroll container on mobile keyboards
    (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const deliveryModes = [
    { 
      id: 'flash', 
      name: 'Flash', 
      icon: Zap, 
      description: 'Livraison rapide moto (1-2h)'
    },
    { 
      id: 'flex', 
      name: 'Flex', 
      icon: Package, 
      description: 'Livraison standard (2-4h)'
    },
    { 
      id: 'maxicharge', 
      name: 'MaxiCharge', 
      icon: Truck, 
      description: 'Gros colis camion (4-8h)'
    }
  ];

  const fallbackBase: Record<'flash' | 'flex' | 'maxicharge', number> = {
    flash: 5000,
    flex: 3000,
    maxicharge: 8000
  };

  const getBasePriceForMode = (modeId: 'flash' | 'flex' | 'maxicharge') => {
    const rule = rules.find(r => r.service_type === 'delivery' && r.vehicle_class === modeId);
    return rule?.base_price ?? fallbackBase[modeId];
  };

  const handleCalculatePrice = async () => {
    if (!pickup || !destination) {
      toast.error('Veuillez saisir les adresses de collecte et de livraison');
      return;
    }

    try {
      setIsCalculating(true);
      
      // Calculer le prix avec les nouvelles locations
      const priceData = await calculateDeliveryPrice(pickup, destination, selectedMode);

      setEstimatedPrice(priceData.price);
      setDistance(priceData.distance);
      
      toast.success(`Prix estimé: ${priceData.price.toLocaleString()} CDF`);
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      toast.error('Erreur lors du calcul du prix');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!pickup || !destination) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (estimatedPrice === 0) {
      toast.error('Veuillez d\'abord calculer le prix de la livraison');
      return;
    }

    try {
      // Créer la commande avec les nouvelles locations
      const orderData = {
        city: 'Kinshasa', // À adapter selon la géolocalisation
        pickup,
        destination,
        mode: selectedMode,
        packageType,
        specialInstructions,
        estimatedPrice,
        distance,
        duration: 3600 // 1h par défaut
      };

      const orderId = await createDeliveryOrder(orderData);
      
      if (orderId) {
        // Reset form
        setPickup(null);
        setDestination(null);
        setPackageType('');
        setSpecialInstructions('');
        setEstimatedPrice(0);
        setDistance(0);
        
        toast.success('Commande de livraison créée avec succès !');
      }
    } catch (error) {
      console.error('Erreur création commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Commander une livraison
        </CardTitle>
      </CardHeader>
      <CardContent
          ref={containerRef}
          className="space-y-4 max-h-[calc(100dvh-220px)] overflow-y-auto md:max-h-[calc(100dvh-260px)] lg:max-h-[calc(100dvh-320px)] pr-1 scroll-smooth overscroll-contain pb-24 md:pb-6"
        >
        {/* Quick Navigation */}
        <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex gap-2 p-2">
            <Button size="sm" variant="outline" onClick={() => scrollToSection(addressesRef)}>Adresses</Button>
            <Button size="sm" variant="outline" onClick={() => scrollToSection(modeRef)}>Mode</Button>
            <Button size="sm" variant="outline" onClick={() => scrollToSection(packageRef)}>Colis</Button>
            <Button size="sm" variant="outline" onClick={() => scrollToSection(notesRef)}>Notes</Button>
          </div>
        </nav>

        {/* Location Inputs Modernes */}
        <section ref={addressesRef} aria-labelledby="addresses-title" className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Point de collecte
            </label>
            <UniversalLocationPicker
              value={pickup}
              onLocationSelect={setPickup}
              placeholder="Adresse de collecte"
              context="delivery"
              variant="default"
              showCurrentLocation={true}
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Navigation className="w-3 h-3 text-red-500" />
              Point de livraison
            </label>
            <UniversalLocationPicker
              value={destination}
              onLocationSelect={setDestination}
              placeholder="Adresse de livraison"
              context="delivery"
              variant="default"
            />
          </div>
        </section>

        {/* Delivery Mode Selection */}
        <section ref={modeRef} aria-labelledby="mode-title" className="space-y-3">
          <div className="text-sm font-medium">Mode de livraison :</div>
          <div className="grid gap-2">
            {deliveryModes.map((mode) => (
              <Button
                key={mode.id}
                variant={selectedMode === mode.id ? 'default' : 'outline'}
                onClick={() => setSelectedMode(mode.id as any)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <mode.icon className="h-5 w-5" />
                  <div className="text-left flex-1">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-xs text-muted-foreground">{mode.description}</div>
                  </div>
                  <div className="font-semibold">{pricingLoading ? 'Chargement…' : `À partir de ${getBasePriceForMode(mode.id as 'flash'|'flex'|'maxicharge').toLocaleString()} CDF`}</div>
                </div>
              </Button>
            ))}
          </div>
        </section>

        {/* Package Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Type de colis (optionnel)</label>
            <Input
              placeholder="Ex: Documents, Nourriture, Électronique..."
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instructions spéciales (optionnel)</label>
            <Textarea
              placeholder="Fragile, instructions de livraison, numéro de contact..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Price Calculation */}
        <div className="space-y-3">
          <Button 
            onClick={handleCalculatePrice}
            disabled={isCalculating || !pickup || !destination}
            variant="outline"
            className="w-full"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Calculer le prix
              </>
            )}
          </Button>

          {estimatedPrice > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Clock className="h-4 w-4" />
                <span>
                  <strong>Prix estimé:</strong> {estimatedPrice.toLocaleString()} CDF
                  {distance > 0 && ` • Distance: ${(distance / 1000).toFixed(1)} km`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Create Order Button */}
        <Button 
          onClick={handleCreateOrder}
          disabled={submitting || estimatedPrice === 0}
          className="w-full"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Création en cours...
            </div>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Commander la livraison • {estimatedPrice.toLocaleString()} CDF
            </>
          )}
        </Button>

        {/* Info Note */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Un livreur sera automatiquement assigné à votre commande. 
              Vous recevrez une notification quand votre colis sera collecté.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernDeliveryOrderInterface;