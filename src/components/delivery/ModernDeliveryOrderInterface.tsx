import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { IntegrationGeocodingService } from '@/services/integrationGeocoding';
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
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  const [packageType, setPackageType] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  
  const { 
    calculateDeliveryPrice, 
    createDeliveryOrder, 
    loading, 
    submitting 
  } = useEnhancedDeliveryOrders();
  const { rules, isLoading: pricingLoading } = usePricingRules();

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
    if (!pickupLocation || !deliveryLocation) {
      toast.error('Veuillez saisir les adresses de collecte et de livraison');
      return;
    }

    try {
      // Géocoder les adresses
      const pickupCoords = await IntegrationGeocodingService.geocodeAddress(pickupLocation);
      const deliveryCoords = await IntegrationGeocodingService.geocodeAddress(deliveryLocation);

      // Calculer le prix
      const priceData = await calculateDeliveryPrice(
        { address: pickupLocation, lat: pickupCoords.lat, lng: pickupCoords.lng },
        { address: deliveryLocation, lat: deliveryCoords.lat, lng: deliveryCoords.lng },
        selectedMode
      );

      setEstimatedPrice(priceData.price);
      setDistance(priceData.distance);
      
      toast.success(`Prix estimé: ${priceData.price.toLocaleString()} CDF`);
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      toast.error('Erreur lors du calcul du prix');
    }
  };

  const handleCreateOrder = async () => {
    if (!pickupLocation || !deliveryLocation) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (estimatedPrice === 0) {
      toast.error('Veuillez d\'abord calculer le prix de la livraison');
      return;
    }

    try {
      // Géocoder les adresses
      const pickupCoords = await IntegrationGeocodingService.geocodeAddress(pickupLocation);
      const deliveryCoords = await IntegrationGeocodingService.geocodeAddress(deliveryLocation);

      // Créer la commande
      const orderData = {
        city: 'Kinshasa', // À adapter selon la géolocalisation
        pickup: { 
          address: pickupLocation, 
          lat: pickupCoords.lat, 
          lng: pickupCoords.lng,
          type: 'geocoded' as const
        },
        destination: { 
          address: deliveryLocation, 
          lat: deliveryCoords.lat, 
          lng: deliveryCoords.lng,
          type: 'geocoded' as const
        },
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
        setPickupLocation('');
        setDeliveryLocation('');
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
      <CardContent className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto md:max-h-[calc(100vh-260px)] lg:max-h-[calc(100vh-320px)] pr-1">
        {/* Location Inputs */}
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            <Input
              placeholder="Adresse de collecte"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
            <Input
              placeholder="Adresse de livraison"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Delivery Mode Selection */}
        <div className="space-y-3">
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
        </div>

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
            disabled={loading || !pickupLocation || !deliveryLocation}
            variant="outline"
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            Calculer le prix
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