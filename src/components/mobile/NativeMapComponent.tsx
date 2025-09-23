/**
 * Composant Map Native optimisé pour iOS/Android
 * Utilise les performances natives de Capacitor
 */

import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Zap, 
  Smartphone,
  RefreshCw
} from 'lucide-react';

interface NativeMapProps {
  origin?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  showTraffic?: boolean;
  enableNavigation?: boolean;
  optimizeForBattery?: boolean;
  showDrivers?: boolean;
  onRouteCalculated?: (route: any) => void;
  onLocationUpdate?: (location: any) => void;
}

export default function NativeMapComponent({
  origin,
  destination,
  showTraffic = true,
  enableNavigation = false,
  optimizeForBattery = true,
  showDrivers = false,
  onRouteCalculated,
  onLocationUpdate
}: NativeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isNative, setIsNative] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapLoaded && origin && destination) {
      calculateRoute();
    }
  }, [mapLoaded, origin, destination]);

  const initializeMap = async () => {
    try {
      if (isNative) {
        // Utiliser les capacités natives de géolocalisation
        await initializeNativeMap();
      } else {
        // Fallback pour web avec Google Maps API
        await initializeWebMap();
      }
      setMapLoaded(true);
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      setError('Impossible de charger la carte');
    }
  };

  const initializeNativeMap = async () => {
    // Configuration spécifique pour mobile
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: !optimizeForBattery,
      timeout: optimizeForBattery ? 15000 : 10000,
      maximumAge: optimizeForBattery ? 30000 : 10000
    });

    setCurrentLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    });

    onLocationUpdate?.(position.coords);
  };

  const initializeWebMap = async () => {
    // Fallback web avec géolocalisation standard
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          onLocationUpdate?.(position.coords);
        },
        (error) => {
          console.error('Erreur géolocalisation web:', error);
          setError('Géolocalisation non disponible');
        },
        {
          enableHighAccuracy: !optimizeForBattery,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    try {
      // Simuler calcul de route optimisé pour mobile
      const mockRoute = {
        distance: calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng),
        duration: Math.ceil(calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng) / 1000 * 2), // 2 min par km
        polyline: `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`,
        steps: [
          {
            instruction: `Diriger vers ${destination.address || 'destination'}`,
            distance: calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng),
            duration: Math.ceil(calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng) / 1000 * 2)
          }
        ]
      };

      setRoute(mockRoute);
      onRouteCalculated?.(mockRoute);
    } catch (error) {
      console.error('Erreur calcul route:', error);
      setError('Impossible de calculer l\'itinéraire');
    }
  };

  const startNavigation = () => {
    if (!destination) return;

    // Ouvrir dans l'app de navigation native
    const url = isNative 
      ? `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}(${destination.address || 'Destination'})`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;

    window.open(url, '_system');
  };

  const refreshLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      onLocationUpdate?.(position.coords);
    } catch (error) {
      console.error('Erreur actualisation position:', error);
      setError('Impossible d\'actualiser la position');
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-destructive mb-4">
          <MapPin className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Erreur de carte</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={initializeMap} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Container de carte native/web */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-lg relative overflow-hidden"
      >
        {/* Simulation visuelle de carte */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>

        {/* Marqueurs */}
        {currentLocation && (
          <div 
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '50%', 
              top: '50%'
            }}
          >
            <div className="relative">
              <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute inset-0 h-4 w-4 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
          </div>
        )}

        {origin && (
          <div 
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '30%', 
              top: '60%'
            }}
          >
            <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        )}

        {destination && (
          <div 
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '70%', 
              top: '40%'
            }}
          >
            <div className="h-3 w-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        )}

        {/* Route simulée */}
        {route && origin && destination && (
          <svg className="absolute inset-0 w-full h-full z-5">
            <path
              d={`M 30% 60% Q 50% 30% 70% 40%`}
              stroke="rgb(59 130 246)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
          </svg>
        )}
      </div>

      {/* Badges d'information */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <Badge variant="secondary" className="flex items-center space-x-1">
          {isNative ? <Smartphone className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          <span>{isNative ? 'Natif' : 'Web'}</span>
        </Badge>
        
        {optimizeForBattery && (
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Éco</span>
          </Badge>
        )}

        {currentLocation && (
          <Badge variant="outline" className="text-xs">
            ±{Math.round(currentLocation.accuracy)}m
          </Badge>
        )}
      </div>

      {/* Contrôles */}
      <div className="absolute bottom-4 right-4 z-20 space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={refreshLocation}
          className="bg-background/90 backdrop-blur"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        {enableNavigation && destination && (
          <Button
            size="sm"
            onClick={startNavigation}
            className="bg-primary text-primary-foreground"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Navigation
          </Button>
        )}
      </div>

      {/* Informations de route */}
      {route && (
        <Card className="absolute bottom-4 left-4 z-20 p-3 bg-background/90 backdrop-blur">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{formatDuration(route.duration)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}