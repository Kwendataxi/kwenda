import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import HorizontalServiceSelector from './HorizontalServiceSelector';
import { 
  ArrowLeft,
  ArrowRight,
  Zap,
  Truck,
  Package
} from 'lucide-react';

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ServiceSelectionStepProps {
  pickup: DeliveryLocation;
  destination: DeliveryLocation;
  onServiceSelect: (service: DeliveryService, pricing: DeliveryPricing) => void;
  onBack: () => void;
}

interface DeliveryService {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  description: string;
  icon: any;
  features: string[];
  estimatedTime: string;
}

interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
}

const deliveryServices: DeliveryService[] = [
  {
    id: 'flash',
    name: 'Kwenda Flash',
    subtitle: 'Express',
    description: 'Rapide et urgent',
    icon: Zap,
    features: ['Urgent'],
    estimatedTime: '30-60 min'
  },
  {
    id: 'flex',
    name: 'Kwenda Flex',
    subtitle: 'Standard',
    description: 'Équilibré',
    icon: Package,
    features: ['Normal'],
    estimatedTime: '2-4h'
  },
  {
    id: 'maxicharge',
    name: 'Kwenda MaxiCharge',
    subtitle: 'Gros colis',
    description: 'Volumineux',
    icon: Truck,
    features: ['Gros'],
    estimatedTime: '3-6h'
  }
];

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  pickup,
  destination,
  onServiceSelect,
  onBack
}) => {
  const [selectedService, setSelectedService] = useState<DeliveryService | null>(null);
  const [pricing, setPricing] = useState<Record<string, DeliveryPricing>>({});
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  const { calculateDeliveryPrice } = useEnhancedDeliveryOrders();

  // Calculer les prix pour tous les services
  useEffect(() => {
    const calculateAllPrices = async () => {
      setLoadingPricing(true);
      const pricingResults: Record<string, DeliveryPricing> = {};

      try {
        for (const service of deliveryServices) {
          const result = await calculateDeliveryPrice(
            { address: pickup.address, lat: pickup.coordinates.lat, lng: pickup.coordinates.lng },
            { address: destination.address, lat: destination.coordinates.lat, lng: destination.coordinates.lng },
            service.id
          );
          pricingResults[service.id] = result;
        }
        setPricing(pricingResults);
      } catch (error) {
        console.error('Error calculating prices:', error);
      } finally {
        setLoadingPricing(false);
      }
    };

    if (pickup && destination) {
      calculateAllPrices();
    }
  }, [pickup, destination, calculateDeliveryPrice]);

  const handleServiceSelect = () => {
    if (selectedService && pricing[selectedService.id]) {
      onServiceSelect(selectedService, pricing[selectedService.id]);
    }
  };

  const handleServiceCardSelect = (service: DeliveryService) => {
    setSelectedService(service);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-background/95 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Soft Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 h-12 px-4 rounded-xl
                        bg-card/50 backdrop-blur-sm border border-border/20
                        hover:bg-card/70 hover:border-primary/30 
                        transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Retour</span>
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Service de Livraison
              </h1>
              <p className="text-muted-foreground mt-1">
                Choisissez le service adapté à vos besoins
              </p>
            </div>
            <div className="w-24" />
          </div>
          
          {/* Route display simplifié */}
          <div className="glassmorphism rounded-xl p-4 border border-border/20">
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="truncate text-foreground">{pickup.address}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                <span className="truncate text-foreground">{destination.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Services Selector */}
        <HorizontalServiceSelector
          services={deliveryServices}
          selectedService={selectedService}
          pricing={pricing}
          loadingPricing={loadingPricing}
          onServiceSelect={handleServiceCardSelect}
          className="mb-8"
        />

        {/* Continue Button simplifié */}
        <div className="flex justify-center">
          <Button
            onClick={handleServiceSelect}
            disabled={!selectedService || loadingPricing}
            size="lg"
            className="h-14 px-8 text-lg font-bold rounded-xl
                      bg-gradient-to-r from-primary to-primary/90 
                      hover:from-primary/90 hover:to-primary/80
                      disabled:opacity-50
                      transition-all duration-300 transform
                      hover:scale-105 active:scale-95
                      shadow-lg hover:shadow-xl"
          >
            {loadingPricing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Calcul...</span>
              </div>
            ) : selectedService ? (
              <div className="flex items-center gap-2">
                <span>Confirmer</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            ) : (
              'Choisir un service'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};