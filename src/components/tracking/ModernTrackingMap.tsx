import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Navigation,
  MapPin,
  Clock,
  Maximize2,
  Minimize2,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Radio
} from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface DriverData {
  name: string;
  phone?: string;
  avatar?: string;
  vehicle?: {
    type: string;
    plate?: string;
  };
  rating?: number;
}

interface ModernTrackingMapProps {
  pickup: Location;
  destination: Location;
  driverLocation?: Location;
  driverHeading?: number;
  driver?: DriverData;
  eta?: string;
  distance?: string;
  status?: string;
  trackingType?: 'delivery' | 'taxi' | 'marketplace';
  className?: string;
  onDriverCall?: () => void;
  showControls?: boolean;
  autoFollow?: boolean;
}

export default function ModernTrackingMap({
  pickup,
  destination,
  driverLocation,
  driverHeading,
  driver,
  eta,
  distance,
  status = 'in_transit',
  trackingType = 'delivery',
  className = '',
  onDriverCall,
  showControls = true,
  autoFollow = true
}: ModernTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  const { isLoaded } = useGoogleMaps();
  const [isFollowing, setIsFollowing] = useState(autoFollow);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Couleurs selon le type de service
  const getServiceColor = () => {
    switch (trackingType) {
      case 'delivery':
        return status === 'picked_up' ? '#ec2027' : '#F59E0B'; // Rouge Kwenda ou Jaune
      case 'taxi':
        return '#10b981'; // Vert
      case 'marketplace':
        return '#8b5cf6'; // Violet
      default:
        return '#F59E0B';
    }
  };

  // Initialiser la carte
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInitialized) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 14,
      center: pickup,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    googleMapRef.current = map;
    setMapInitialized(true);

    // Marker de départ (vert)
    pickupMarkerRef.current = new google.maps.Marker({
      position: pickup,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: 'Départ'
    });

    // Marker de destination (rouge)
    destinationMarkerRef.current = new google.maps.Marker({
      position: destination,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ec2027',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: 'Arrivée'
    });

    // Tracer la route
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: pickup,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          routePolylineRef.current = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            geodesic: true,
            strokeColor: getServiceColor(),
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map
          });

          // Ajuster les bounds pour voir toute la route
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickup);
          bounds.extend(destination);
          if (driverLocation) bounds.extend(driverLocation);
          map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
        }
      }
    );
  }, [isLoaded, pickup, destination, mapInitialized]);

  // Mettre à jour la position du chauffeur
  useEffect(() => {
    if (!googleMapRef.current || !driverLocation || !mapInitialized) return;

    if (!driverMarkerRef.current) {
      // Créer le marker du chauffeur avec animation
      driverMarkerRef.current = new google.maps.Marker({
        position: driverLocation,
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: getServiceColor(),
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          rotation: driverHeading || 0
        },
        title: driver?.name || 'Chauffeur',
        animation: google.maps.Animation.DROP
      });

      // Ajouter un cercle de pulse autour du chauffeur
      new google.maps.Circle({
        strokeColor: getServiceColor(),
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: getServiceColor(),
        fillOpacity: 0.1,
        map: googleMapRef.current,
        center: driverLocation,
        radius: 100
      });
    } else {
      // Animer le mouvement du marker
      const currentPos = driverMarkerRef.current.getPosition();
      if (currentPos) {
        // Animation fluide de la position
        const startLat = currentPos.lat();
        const startLng = currentPos.lng();
        const endLat = driverLocation.lat;
        const endLng = driverLocation.lng;

        let step = 0;
        const steps = 20;
        const animationInterval = setInterval(() => {
          step++;
          const progress = step / steps;
          const lat = startLat + (endLat - startLat) * progress;
          const lng = startLng + (endLng - startLng) * progress;

          driverMarkerRef.current?.setPosition({ lat, lng });

          if (step >= steps) {
            clearInterval(animationInterval);
          }
        }, 50);
      }

      // Mettre à jour la rotation si heading disponible
      if (driverHeading !== undefined) {
        const icon = driverMarkerRef.current.getIcon() as google.maps.Symbol;
        icon.rotation = driverHeading;
        driverMarkerRef.current.setIcon(icon);
      }
    }

    // Auto-suivre le chauffeur
    if (isFollowing) {
      googleMapRef.current.panTo(driverLocation);
    }
  }, [driverLocation, driverHeading, isFollowing, mapInitialized]);

  // Fonctions de contrôle
  const handleRecenter = () => {
    if (!googleMapRef.current) return;

    if (driverLocation) {
      googleMapRef.current.panTo(driverLocation);
      googleMapRef.current.setZoom(16);
      setIsFollowing(true);
    } else {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(destination);
      googleMapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
    }
  };

  const handleZoomIn = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(currentZoom - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isLoaded) {
    return (
      <div className={`relative w-full h-[400px] bg-muted rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : `w-full ${className}`}`}
    >
      {/* Carte */}
      <div
        ref={mapRef}
        className={`rounded-xl overflow-hidden shadow-lg ${
          isFullscreen ? 'h-full' : 'h-[400px]'
        }`}
      />

      {/* Info Card flottante - ETA et Distance */}
      <AnimatePresence>
        {(eta || distance) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4"
          >
            <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Arrivée estimée</p>
                      <p className="text-lg font-bold">{eta || 'Calcul...'}</p>
                    </div>
                  </div>
                  {distance && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="font-semibold">{distance}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Chauffeur flottante */}
      <AnimatePresence>
        {driver && driverLocation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-24 left-4 right-4"
          >
            <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        {driver.avatar ? (
                          <img
                            src={driver.avatar}
                            alt={driver.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      {driver.vehicle && (
                        <p className="text-sm text-muted-foreground">
                          {driver.vehicle.type}
                          {driver.vehicle.plate && ` • ${driver.vehicle.plate}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {onDriverCall && driver.phone && (
                    <Button
                      onClick={onDriverCall}
                      size="icon"
                      className="h-10 w-10 bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] hover:from-[#FBBF24] hover:to-[#F59E0B] shadow-lg"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contrôles de la carte */}
      {showControls && (
        <div className="absolute bottom-4 right-4 space-y-2">
          {/* Bouton Suivre */}
          {driverLocation && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  if (!isFollowing) handleRecenter();
                }}
                className={`h-12 px-4 shadow-lg ${
                  isFollowing
                    ? 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] hover:from-[#FBBF24] hover:to-[#F59E0B]'
                    : 'bg-background/95 backdrop-blur-xl text-foreground hover:bg-background'
                }`}
              >
                <Navigation className={`w-4 h-4 mr-2 ${isFollowing ? 'animate-pulse' : ''}`} />
                {isFollowing ? 'Suivi actif' : 'Suivre'}
              </Button>
            </motion.div>
          )}

          {/* Recentrer */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRecenter}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background"
            >
              <MapPin className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Zoom + */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleZoomIn}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background font-bold text-lg"
            >
              +
            </Button>
          </motion.div>

          {/* Zoom - */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleZoomOut}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background font-bold text-lg"
            >
              −
            </Button>
          </motion.div>

          {/* Fullscreen */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={toggleFullscreen}
              size="icon"
              className="h-12 w-12 bg-background/95 backdrop-blur-xl shadow-lg hover:bg-background"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Indicateur de connexion temps réel */}
      <div className="absolute top-4 right-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 px-3 py-2 bg-background/95 backdrop-blur-xl rounded-full shadow-lg"
        >
          <Radio className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-xs font-medium">En direct</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
