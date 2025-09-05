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
              <div className="flex justify-between font-medium border-t pt-1">
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

  // Calculate price when locations change avec validation ultra-sécurisée
  useEffect(() => {
    const calculatePrice = async () => {
      // Validation stricte pour éviter "Cannot read properties of undefined"
      if (!pickup || !destination || !pickup.lat || !pickup.lng || !destination.lat || !destination.lng) {
        setCalculatedPrice(null);
        setDistance(null);
        setDuration(null);
        return;
      }

      // Double sécurisation des locations avant calcul
      const securePickup = secureLocation(pickup);
      const secureDestination = secureLocation(destination);

      // Validation finale avant de procéder
      if (!securePickup || !secureDestination || 
          typeof securePickup.lat !== 'number' || typeof securePickup.lng !== 'number' ||
          typeof secureDestination.lat !== 'number' || typeof secureDestination.lng !== 'number') {
        console.error('Coordonnées invalides détectées:', { pickup, destination });
        setCalculatedPrice(basePrices[serviceType] || 5000);
        setDistance(0);
        setDuration(30);
        setError('Positions invalides, prix estimé');
        return;
      }

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