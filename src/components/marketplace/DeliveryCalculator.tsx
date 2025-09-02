import React, { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Truck, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DeliveryCalculatorProps {
  vendorLocation?: { lat: number; lng: number };
  onDeliveryCalculated: (info: DeliveryInfo) => void;
}

interface DeliveryInfo {
  distance: number;
  duration: number;
  cost: number;
  zone: string;
}

export const DeliveryCalculator: React.FC<DeliveryCalculatorProps> = ({
  vendorLocation,
  onDeliveryCalculated
}) => {
  const geolocation = useGeolocation();
  const locationLoading = geolocation.loading;
  const coordinates = geolocation.latitude && geolocation.longitude ? { lat: geolocation.latitude, lng: geolocation.longitude } : null;
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Determine delivery zone based on distance
  const getDeliveryZone = (distance: number): string => {
    if (distance <= 5) return 'Proche';
    if (distance <= 15) return 'Ville';
    if (distance <= 30) return 'Banlieue';
    return 'Longue distance';
  };

  // Calculate delivery cost based on distance and zone
  const calculateDeliveryCost = (distance: number, zone: string): number => {
    const baseFee = 2000; // Base fee in CDF
    const perKmRate = zone === 'Proche' ? 300 : 
                     zone === 'Ville' ? 500 : 
                     zone === 'Banlieue' ? 800 : 1200;
    
    return baseFee + (distance * perKmRate);
  };

  // Estimate delivery duration based on distance and zone
  const estimateDeliveryDuration = (distance: number, zone: string): number => {
    // Base time + travel time (assuming average speed)
    const baseTime = 15; // minutes
    const avgSpeed = zone === 'Proche' ? 25 : 
                    zone === 'Ville' ? 20 : 
                    zone === 'Banlieue' ? 30 : 40; // km/h
    
    const travelTime = (distance / avgSpeed) * 60; // minutes
    return Math.round(baseTime + travelTime);
  };

  useEffect(() => {
    if (coordinates && vendorLocation && !calculating) {
      calculateDelivery();
    }
  }, [coordinates, vendorLocation]);

  const calculateDelivery = async () => {
    if (!coordinates || !vendorLocation) return;

    setCalculating(true);
    
    try {
      // Calculate straight-line distance
      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        vendorLocation.lat,
        vendorLocation.lng
      );

      // Determine zone and costs
      const zone = getDeliveryZone(distance);
      const cost = calculateDeliveryCost(distance, zone);
      const duration = estimateDeliveryDuration(distance, zone);

      const info: DeliveryInfo = {
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        duration,
        cost,
        zone
      };

      setDeliveryInfo(info);
      onDeliveryCalculated(info);
    } catch (error) {
      console.error('Error calculating delivery:', error);
    } finally {
      setCalculating(false);
    }
  };

  if (locationLoading || calculating) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coordinates) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Activez la géolocalisation pour calculer la livraison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendorLocation) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Localisation du vendeur non disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Informations de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deliveryInfo && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Distance
                </div>
                <div className="font-semibold">{deliveryInfo.distance} km</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Durée
                </div>
                <div className="font-semibold">{deliveryInfo.duration} min</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{deliveryInfo.zone}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">
                  {deliveryInfo.cost.toLocaleString()} FC
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Frais calculés selon la distance et la zone de livraison
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};