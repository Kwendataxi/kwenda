/**
 * Composant de preview de carte pour visualiser le trajet de livraison
 * ✅ FIX: Utilise googleMapsLoader au lieu de VITE_GOOGLE_MAPS_API_KEY
 * ✅ FIX: Padding dynamique pour éviter éléments masqués
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Navigation, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';
import { googleMapsLoader } from '@/services/googleMapsLoader';
import { PRESET_PADDINGS } from '@/utils/mapPaddingUtils';

interface DeliveryMapPreviewProps {
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  serviceType: 'flash' | 'flex' | 'maxicharge';
  distance?: number;
  duration?: number;
  price?: number;
  onClose: () => void;
}

export const DeliveryMapPreview: React.FC<DeliveryMapPreviewProps> = ({
  pickup,
  destination,
  serviceType,
  distance,
  duration,
  price,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        
        // ✅ Utiliser le loader unifié qui récupère la clé depuis Edge Function
        await googleMapsLoader.load(['places', 'geometry']);
        
        initMap();
      } catch (error) {
        console.error('Erreur chargement carte:', error);
        setMapError('Impossible de charger la carte');
      } finally {
        setIsLoading(false);
      }
    };

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(pickup.lat, pickup.lng));
        bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));

        const map = new google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 12,
          minZoom: 10,
          maxZoom: 18,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        // Ajuster la vue avec padding adaptatif pour le bottom overlay
        const padding = PRESET_PADDINGS.simple_preview();
        map.fitBounds(bounds, padding);
        
        // Limiter le zoom max
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 17) map.setZoom(17);
        });

        // Marker de pickup (vert)
        new google.maps.Marker({
          position: { lat: pickup.lat, lng: pickup.lng },
          map,
          title: 'Point de collecte',
          label: {
            text: 'A',
            color: 'white',
            fontWeight: 'bold'
          },
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        // Marker de destination (rouge)
        new google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map,
          title: 'Point de livraison',
          label: {
            text: 'B',
            color: 'white',
            fontWeight: 'bold'
          },
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        // Tracer la route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsService.route(
          {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: google.maps.TravelMode.DRIVING
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      } catch (error) {
        console.error('Erreur initialisation carte:', error);
        setMapError('Erreur d\'affichage de la carte');
      }
    };

    loadGoogleMaps();
  }, [pickup, destination]);

  const formatPrice = (priceValue: number) => formatCurrency(priceValue, 'CDF');

  const serviceLabels = {
    flash: '⚡ Flash',
    flex: '📦 Flex',
    maxicharge: '🚚 MaxiCharge'
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Aperçu du trajet</h2>
            <span className="text-sm text-muted-foreground">
              {serviceLabels[serviceType]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center bg-muted/20">
              <div className="animate-pulse text-muted-foreground">Chargement de la carte...</div>
            </div>
          ) : mapError ? (
            <div className="h-96 flex items-center justify-center bg-muted/20">
              <p className="text-muted-foreground">{mapError}</p>
            </div>
          ) : (
            <div ref={mapRef} className="h-96 w-full" />
          )}

          {/* Info Overlay */}
          {distance && duration && price && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Navigation className="h-4 w-4" />
                      <span className="text-xs">Distance</span>
                    </div>
                    <p className="font-bold text-foreground">
                      {distance.toFixed(1)} km
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Durée estimée</span>
                    </div>
                    <p className="font-bold text-foreground">
                      ~{duration} min
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Prix</span>
                    </div>
                    <p className="font-bold text-primary">
                      {formatPrice(price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Address Details */}
        <div className="p-4 space-y-3 bg-card/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-green-600 font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Point de collecte</p>
              <p className="text-sm font-medium text-foreground truncate">
                {pickup.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-red-600 font-bold text-sm">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Point de livraison</p>
              <p className="text-sm font-medium text-foreground truncate">
                {destination.address}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-card/50 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </Card>
    </div>
  );
};
