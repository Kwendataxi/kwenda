import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { LocationData } from '@/types/location';
import { 
  Calculator, 
  MapPin, 
  Clock, 
  Truck,
  Loader2 
} from 'lucide-react';

interface DynamicPriceCalculatorProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  onPriceCalculated?: (price: number, distance: number, duration: number) => void;
}

const DynamicPriceCalculator = ({ 
  pickup, 
  destination, 
  serviceType, 
  onPriceCalculated 
}: DynamicPriceCalculatorProps) => {
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { calculateDeliveryPrice } = useEnhancedDeliveryOrders();

  // Service base prices for fallback
  const basePrices = {
    flash: 5000,
    flex: 7000,
    maxicharge: 12000
  };

  // Calculate price when locations change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!pickup || !destination) {
        setCalculatedPrice(null);
        setDistance(null);
        setDuration(null);
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const result = await calculateDeliveryPrice(pickup, destination, serviceType);
        
        setCalculatedPrice(result.price);
        setDistance(result.distance);
        setDuration(result.duration);

        // Callback for parent component
        if (onPriceCalculated) {
          onPriceCalculated(result.price, result.distance, result.duration);
        }
      } catch (err) {
        console.error('Price calculation failed:', err);
        setError('Erreur de calcul du prix');
        
        // Use base price as fallback
        const fallbackPrice = basePrices[serviceType];
        setCalculatedPrice(fallbackPrice);
        setDistance(0);
        setDuration(30);

        if (onPriceCalculated) {
          onPriceCalculated(fallbackPrice, 0, 30);
        }
      } finally {
        setIsCalculating(false);
      }
    };

    calculatePrice();
  }, [pickup, destination, serviceType, calculateDeliveryPrice, onPriceCalculated]);

  if (!pickup || !destination) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">Calcul du prix</h3>
          {isCalculating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        <div className="space-y-3">
          {/* Route Info */}
          <div className="text-sm space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground truncate">{pickup.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{destination.address}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Calculation Results */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-medium">
                {distance !== null ? `${distance.toFixed(1)} km` : '...'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Durée est.</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration !== null ? `${duration} min` : '...'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Price Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prix total</p>
              {error && (
                <p className="text-xs text-destructive">Prix estimé</p>
              )}
            </div>
            <div className="text-right">
              {calculatedPrice !== null ? (
                <div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {calculatedPrice.toLocaleString()} CDF
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Service {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                  </p>
                </div>
              ) : (
                <Badge variant="outline">
                  Calcul en cours...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicPriceCalculator;