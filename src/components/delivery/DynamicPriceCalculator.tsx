import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, MapPin, Route } from 'lucide-react';
import { secureLocation, isValidLocation, calculateBasePrice } from '@/utils/locationValidation';
import type { LocationData } from '@/types/location';

interface DynamicPriceCalculatorProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  onPriceCalculated: (price: number) => void;
}

const DynamicPriceCalculator: React.FC<DynamicPriceCalculatorProps> = ({
  pickup,
  destination,
  serviceType,
  onPriceCalculated
}) => {
  const [calculating, setCalculating] = useState(false);
  const [priceDetails, setPriceDetails] = useState<{
    price: number;
    distance: number;
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculatePrice = async () => {
      if (!pickup || !destination) {
        setPriceDetails(null);
        setError(null);
        return;
      }

      setCalculating(true);
      setError(null);

      try {
        const securePickup = secureLocation(pickup);
        const secureDestination = secureLocation(destination);

        if (!isValidLocation(securePickup) || !isValidLocation(secureDestination)) {
          throw new Error('Coordonnées invalides pour le calcul du prix');
        }

        const result = calculateBasePrice(securePickup, secureDestination, serviceType);
        setPriceDetails(result);
        onPriceCalculated(result.price);

      } catch (err: any) {
        console.error('Erreur calcul prix:', err);
        setError(err.message || 'Erreur de calcul du prix');
        
        const fallbackPrices = {
          flash: 5000,
          flex: 7000,
          maxicharge: 12000
        };
        
        const fallbackPrice = fallbackPrices[serviceType];
        setPriceDetails({
          price: fallbackPrice,
          distance: 0,
          duration: 30
        });
        onPriceCalculated(fallbackPrice);
      } finally {
        setCalculating(false);
      }
    };

    const timeout = setTimeout(calculatePrice, 300);
    return () => clearTimeout(timeout);
  }, [pickup, destination, serviceType, onPriceCalculated]);

  if (!pickup || !destination) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="w-4 h-4" />
            <span className="text-sm">Sélectionnez les adresses pour voir le prix</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Estimation du prix</span>
          {calculating && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        {error && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ {error}
          </div>
        )}

        {priceDetails && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {priceDetails.price.toLocaleString()} FC
              </div>
              <Badge variant="outline" className="mt-1">
                Service {serviceType.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Distance</span>
                  <div className="font-medium">
                    {priceDetails.distance > 0 ? `${priceDetails.distance} km` : 'Estimée'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Durée</span>
                  <div className="font-medium">{priceDetails.duration} min</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="text-primary">{priceDetails.price.toLocaleString()} FC</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 Prix indicatif. Le tarif final peut varier selon les conditions de circulation.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicPriceCalculator;