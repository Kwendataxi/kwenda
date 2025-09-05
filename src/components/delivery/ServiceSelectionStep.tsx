import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { 
  ArrowLeft,
  ArrowRight,
  Zap,
  Truck,
  Package,
  Clock,
  DollarSign,
  CheckCircle2
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
    subtitle: 'Livraison express',
    description: 'Livraison ultra-rapide par moto-taxi pour vos urgences',
    icon: Zap,
    features: ['Livraison en moins de 1h', 'Suivi temps réel', 'Priorité maximale'],
    estimatedTime: '30-60 min'
  },
  {
    id: 'flex',
    name: 'Kwenda Flex',
    subtitle: 'Livraison standard',
    description: 'Service équilibré entre rapidité et économie',
    icon: Package,
    features: ['Livraison en 2-4h', 'Tarif avantageux', 'Service fiable'],
    estimatedTime: '2-4 heures'
  },
  {
    id: 'maxicharge',
    name: 'Kwenda MaxiCharge',
    subtitle: 'Gros colis',
    description: 'Pour vos colis volumineux et objets lourds',
    icon: Truck,
    features: ['Jusqu\'à 50kg', 'Véhicule adapté', 'Aide au chargement'],
    estimatedTime: '3-6 heures'
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Choisir le service
            </h1>
            <div className="w-16" />
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="truncate">{pickup.address}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-secondary rounded-full" />
                <span className="truncate">{destination.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Cards */}
        <div className="space-y-4 mb-6">
          {deliveryServices.map((service) => {
            const ServiceIcon = service.icon;
            const servicePricing = pricing[service.id];
            const isSelected = selectedService?.id === service.id;
            
            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                    : 'border-border/20 hover:border-primary/30 bg-card/50 backdrop-blur-sm'
                  }`}
                onClick={() => setSelectedService(service)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        <ServiceIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{service.subtitle}</p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle2 className="h-6 w-6 text-primary animate-fade-in" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{service.estimatedTime}</span>
                      </div>
                      <div className="space-y-1">
                        {service.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-center">
                      {loadingPricing ? (
                        <div className="text-sm text-muted-foreground">Calcul...</div>
                      ) : servicePricing ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                            <DollarSign className="h-5 w-5" />
                            {formatPrice(servicePricing.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {servicePricing.distance.toFixed(1)} km • {Math.round(servicePricing.duration)} min
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-destructive">Prix indisponible</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleServiceSelect}
          disabled={!selectedService || loadingPricing}
          className="w-full h-14 text-base font-medium rounded-xl
                    bg-gradient-to-r from-primary to-primary/90 
                    hover:from-primary/90 hover:to-primary
                    disabled:from-grey-300 disabled:to-grey-400
                    transition-all duration-300 transform
                    hover:scale-[1.02] active:scale-[0.98]
                    shadow-lg hover:shadow-xl"
        >
          {loadingPricing ? (
            'Calcul des prix...'
          ) : selectedService ? (
            <>
              Confirmer {selectedService.name}
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          ) : (
            'Sélectionnez un service'
          )}
        </Button>
      </div>
    </div>
  );
};