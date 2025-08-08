import { useState, useEffect, useCallback, useRef } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';
import { ZoneService, ServiceZone } from '@/services/zoneService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GeofenceAlert {
  id: string;
  type: 'zone_enter' | 'zone_exit' | 'surge_change' | 'safety_alert';
  zone?: ServiceZone;
  message: string;
  timestamp: Date;
}

interface EnhancedLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  zone: ServiceZone | null;
  isMoving: boolean;
  battery: {
    level: number | null;
    isCharging: boolean | null;
  };
  networkType: 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown';
}

interface UseEnhancedGeolocationOptions {
  enableBackgroundTracking?: boolean;
  geofencing?: boolean;
  adaptiveTracking?: boolean;
  securityMode?: boolean;
  tripMode?: boolean;
  shareLocation?: boolean;
}

export const useEnhancedGeolocation = (options: UseEnhancedGeolocationOptions = {}) => {
  const {
    enableBackgroundTracking = false,
    geofencing = true,
    adaptiveTracking = true,
    securityMode = false,
    tripMode = false,
    shareLocation = false
  } = options;

  const { user } = useAuth();
  const { toast } = useToast();
  const geolocation = useGeolocation({ watchPosition: true });
  const backgroundTracking = useBackgroundTracking();
  
  const [enhancedData, setEnhancedData] = useState<EnhancedLocationData | null>(null);
  const [currentZone, setCurrentZone] = useState<ServiceZone | null>(null);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [sharedTripId, setSharedTripId] = useState<string | null>(null);
  
  const previousZoneRef = useRef<ServiceZone | null>(null);
  const lastMovementRef = useRef<Date>(new Date());
  const locationHistoryRef = useRef<{ lat: number; lng: number; timestamp: Date }[]>([]);

  // Enhanced location data computation
  useEffect(() => {
    if (!geolocation.latitude || !geolocation.longitude) return;

    const zone = ZoneService.getZoneByPoint(geolocation.longitude, geolocation.latitude);
    const history = locationHistoryRef.current;
    
    // Add current location to history
    const currentLocation = {
      lat: geolocation.latitude,
      lng: geolocation.longitude,
      timestamp: new Date()
    };
    
    history.push(currentLocation);
    // Keep only last 10 positions for movement detection
    if (history.length > 10) {
      history.shift();
    }

    // Detect movement (if moved more than 10m in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentPositions = history.filter(pos => pos.timestamp > oneMinuteAgo);
    const isMoving = recentPositions.length > 1 && 
      recentPositions.some(pos => {
        const distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          pos.lat, pos.lng
        );
        return distance > 0.01; // 10m
      });

    if (isMoving) {
      lastMovementRef.current = new Date();
    }

    // Get battery and network info (mock for web, real on mobile)
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          return {
            level: battery.level * 100,
            isCharging: battery.charging
          };
        }
      } catch (e) {
        // Fallback for unsupported browsers
      }
      return { level: null, isCharging: null };
    };

    const getNetworkType = (): string => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        return connection.effectiveType || 'unknown';
      }
      return 'unknown';
    };

    getBatteryInfo().then(battery => {
      setEnhancedData({
        latitude: geolocation.latitude!,
        longitude: geolocation.longitude!,
        accuracy: geolocation.accuracy || 0,
        speed: null, // Would come from GPS in real implementation
        heading: null, // Would come from GPS in real implementation
        zone,
        isMoving,
        battery,
        networkType: getNetworkType() as any
      });
    });

    setCurrentZone(zone);
  }, [geolocation.latitude, geolocation.longitude, geolocation.accuracy]);

  // Geofencing - detect zone changes
  useEffect(() => {
    if (!geofencing || !currentZone) return;

    const previousZone = previousZoneRef.current;
    
    if (previousZone?.id !== currentZone?.id) {
      const alerts: GeofenceAlert[] = [];
      
      if (previousZone) {
        alerts.push({
          id: `exit_${previousZone.id}_${Date.now()}`,
          type: 'zone_exit',
          zone: previousZone,
          message: `Vous avez quitté ${previousZone.name}`,
          timestamp: new Date()
        });
      }
      
      alerts.push({
        id: `enter_${currentZone.id}_${Date.now()}`,
        type: 'zone_enter',
        zone: currentZone,
        message: `Vous êtes maintenant à ${currentZone.name}`,
        timestamp: new Date()
      });

      // Check for surge pricing changes
      if (currentZone.surgeMultiplier > 1.5) {
        alerts.push({
          id: `surge_${currentZone.id}_${Date.now()}`,
          type: 'surge_change',
          zone: currentZone,
          message: `Demande élevée à ${currentZone.name} (${currentZone.surgeMultiplier}x)`,
          timestamp: new Date()
        });
      }

      setAlerts(prev => [...alerts, ...prev].slice(0, 20)); // Keep last 20 alerts
      
      // Show toast for zone change
      toast({
        title: `Zone: ${currentZone.name}`,
        description: currentZone.surgeMultiplier > 1 ? 
          `Demande ${currentZone.surgeMultiplier}x` : 
          'Nouvelle zone détectée',
      });
    }

    previousZoneRef.current = currentZone;
  }, [currentZone, geofencing, toast]);

  // Adaptive tracking based on movement and battery
  const startAdaptiveTracking = useCallback(async () => {
    if (!adaptiveTracking || !user) return;

    const batteryLevel = enhancedData?.battery.level || 100;
    const isCharging = enhancedData?.battery.isCharging || false;
    const isMoving = enhancedData?.isMoving || false;

    // Adjust tracking frequency based on context
    let intervalMs = 30000; // Default 30s
    let distanceFilter = 50; // Default 50m

    if (batteryLevel < 20 && !isCharging) {
      // Battery saver mode
      intervalMs = 120000; // 2 minutes
      distanceFilter = 200; // 200m
    } else if (isMoving) {
      // More frequent when moving
      intervalMs = 15000; // 15s
      distanceFilter = 25; // 25m
    } else if (tripMode) {
      // High frequency for trips
      intervalMs = 5000; // 5s
      distanceFilter = 10; // 10m
    }

    await backgroundTracking.start();
  }, [adaptiveTracking, user, enhancedData, tripMode, backgroundTracking]);

  const stopAdaptiveTracking = useCallback(async () => {
    await backgroundTracking.stop();
  }, [backgroundTracking]);

  // Emergency/SOS mode
  const activateEmergencyMode = useCallback(async () => {
    if (!user || !geolocation.latitude || !geolocation.longitude) return;

    setIsEmergencyMode(true);
    
    // Start high-frequency tracking
    await backgroundTracking.start();

    // Log emergency activation
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'emergency_activation',
      description: 'Mode urgence activé',
      metadata: {
        location: {
          lat: geolocation.latitude,
          lng: geolocation.longitude
        },
        zone: currentZone?.name
      }
    });

    toast({
      title: "Mode urgence activé",
      description: "Votre position est partagée en continu",
      variant: "destructive"
    });
  }, [user, geolocation.latitude, geolocation.longitude, currentZone, backgroundTracking, toast]);

  const deactivateEmergencyMode = useCallback(async () => {
    setIsEmergencyMode(false);
    await stopAdaptiveTracking();
    
    toast({
      title: "Mode urgence désactivé",
      description: "Localisation normale rétablie",
    });
  }, [stopAdaptiveTracking, toast]);

  // Trip sharing
  const startLocationSharing = useCallback(async (tripDetails?: any) => {
    if (!user || !shareLocation) return;

    const tripId = `trip_${user.id}_${Date.now()}`;
    setSharedTripId(tripId);

    // Create shared trip record
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'trip_sharing_started',
      description: 'Partage de localisation démarré',
      reference_id: tripId,
      metadata: tripDetails
    });

    // Start high-frequency tracking for trip
    await backgroundTracking.start();

    toast({
      title: "Partage activé",
      description: "Votre trajet est partagé en temps réel",
    });

    return tripId;
  }, [user, shareLocation, backgroundTracking, toast]);

  const stopLocationSharing = useCallback(async () => {
    if (!sharedTripId) return;

    await supabase.from('activity_logs').insert({
      user_id: user!.id,
      activity_type: 'trip_sharing_ended',
      description: 'Partage de localisation arrêté',
      reference_id: sharedTripId
    });

    setSharedTripId(null);
    await stopAdaptiveTracking();
    
    toast({
      title: "Partage arrêté",
      description: "Votre localisation n'est plus partagée",
    });
  }, [sharedTripId, stopAdaptiveTracking, toast]);

  // Start/stop enhanced tracking
  useEffect(() => {
    if (enableBackgroundTracking) {
      startAdaptiveTracking();
    } else {
      stopAdaptiveTracking();
    }

    return () => {
      stopAdaptiveTracking();
    };
  }, [enableBackgroundTracking, startAdaptiveTracking, stopAdaptiveTracking]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return {
    // Basic location data
    ...geolocation,
    
    // Enhanced data
    enhancedData,
    currentZone,
    alerts,
    
    // States
    isEmergencyMode,
    sharedTripId,
    isBackgroundTracking: backgroundTracking.isTracking,
    
    // Controls
    startAdaptiveTracking,
    stopAdaptiveTracking,
    activateEmergencyMode,
    deactivateEmergencyMode,
    startLocationSharing,
    stopLocationSharing,
    
    // Zone utilities
    getZoneInfo: (lng: number, lat: number) => ZoneService.getZoneByPoint(lng, lat),
    getNearbyZones: (lng: number, lat: number, radius?: number) => 
      ZoneService.getNearbyZones(lng, lat, radius),
    searchPopularPlaces: (query: string) => ZoneService.searchPopularPlaces(query),
    
    // Utilities
    clearAlerts: () => setAlerts([]),
    getLocationHistory: () => locationHistoryRef.current,
    calculateDistance
  };
};
