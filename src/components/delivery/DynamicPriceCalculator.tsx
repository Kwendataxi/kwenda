import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import { LocationData } from '@/types/location';
import { 
  isValidLocation, 
  secureLocation, 
  calculateBasePrice, 
  type ValidatedLocation 
} from '@/utils/locationValidation';
import { 
  Calculator, 
  MapPin, 
  Clock, 
  Truck,
  Loader2,
  AlertTriangle
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

  // Calculate price when locations change avec validation sécurisée
  useEffect(() => {
    const calculatePrice = async () => {
      // Validation stricte pour éviter "Cannot read properties of undefined"
      if (!pickup || !destination) {
        setCalculatedPrice(null);
        setDistance(null);
        setDuration(null);
        return;
      }

      // Sécurisation des locations avant calcul
      const securePickup = secureLocation(pickup);
      const secureDestination = secureLocation(destination);

      console.log('Calcul prix livraison démarré:', {
        pickup: securePickup,
        destination: secureDestination,
        mode: serviceType
      });

      setIsCalculating(true);
      setError(null);

      try {
        // Validation finale des coordonnées
        if (!isValidLocation(securePickup) || !isValidLocation(secureDestination)) {
          throw new Error('Coordonnées invalides après sécurisation');
        }

        // Tentative de calcul via API
        const result = await calculateDeliveryPrice(securePickup, secureDestination, serviceType);
        
        setCalculatedPrice(result.price);
        setDistance(result.distance);
        setDuration(result.duration);

        if (onPriceCalculated) {
          onPriceCalculated(result.price, result.distance, result.duration);
        }
      } catch (err) {
        console.error('API calculation failed, using fallback:', err);
        
        // Fallback avec calcul local sécurisé
        const fallbackResult = calculateBasePrice(securePickup, secureDestination, serviceType);
        
        setCalculatedPrice(fallbackResult.price);
        setDistance(fallbackResult.distance);
        setDuration(fallbackResult.duration);
        setError('Calcul estimé (mode hors ligne)');

        if (onPriceCalculated) {
          onPriceCalculated(fallbackResult.price, fallbackResult.distance, fallbackResult.duration);
        }
      } finally {
        setIsCalculating(false);
      }
    };

    calculatePrice();
  }, [pickup, destination, serviceType, calculateDeliveryPrice, onPriceCalculated]);

  // Sécurisation finale avant affichage
  const securePickup = pickup ? secureLocation(pickup) : null;
  const secureDestination = destination ? secureLocation(destination) : null;

  if (!securePickup || !secureDestination) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Veuillez sélectionner les adresses de départ et d'arrivée</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">Calcul du prix</h3>
          {isCalculating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {error && <AlertTriangle className="h-4 w-4 text-amber-500" />}
        </div>

        <div className="space-y-3">
          {/* Route Info */}
          <div className="text-sm space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground truncate">{securePickup.address}</p>
                {securePickup.type === 'fallback' && (
                  <span className="text-xs text-amber-600">(Position par défaut)</span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{secureDestination.address}</p>
                {secureDestination.type === 'fallback' && (
                  <span className="text-xs text-amber-600">(Position par défaut)</span>
                )}
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
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {error}
                </p>
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