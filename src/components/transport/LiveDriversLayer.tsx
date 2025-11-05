/**
 * 🗺️ Couche d'affichage des chauffeurs en temps réel sur la carte
 * Affiche tous les chauffeurs disponibles avec leurs markers animés
 */

import React, { useEffect } from 'react';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import DriverMarkerAdvanced from '@/components/maps/DriverMarkerAdvanced';
import { Badge } from '@/components/ui/badge';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';

interface LiveDriversLayerProps {
  map: google.maps.Map | null;
  userLocation: { lat: number; lng: number } | null;
  maxRadius?: number;
  showOnlyAvailable?: boolean;
  onDriverClick?: (driverId: string) => void;
}

export default function LiveDriversLayer({
  map,
  userLocation,
  maxRadius = 10,
  showOnlyAvailable = true,
  onDriverClick
}: LiveDriversLayerProps) {
  const { liveDrivers, loading, driversCount } = useLiveDrivers({
    userLocation,
    maxRadius,
    showOnlyAvailable,
    updateInterval: 10000
  });

  console.log('🗺️ [LiveDriversLayer] Affichage de', driversCount, 'chauffeurs');

  return (
    <>
      {/* Badge compteur de chauffeurs */}
      {driversCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-4 z-10"
        >
          <Badge 
            variant="secondary" 
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-white/30 shadow-lg px-4 py-2"
          >
            <Car className="w-4 h-4 mr-2 text-green-500" />
            <span className="font-semibold">{driversCount}</span>
            <span className="text-muted-foreground ml-1">
              chauffeur{driversCount > 1 ? 's' : ''} à proximité
            </span>
          </Badge>
        </motion.div>
      )}

      {/* Affichage des markers de chauffeurs */}
      {!loading && liveDrivers.map((driver) => (
        <DriverMarkerAdvanced
          key={driver.driver_id}
          map={map}
          position={{ lat: driver.latitude, lng: driver.longitude }}
          heading={driver.heading || 0}
          driverName={driver.driver_name}
          vehicleModel={driver.vehicle_model}
          speed={driver.speed || 0}
          smoothTransition={true}
        />
      ))}
    </>
  );
}
