import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CustomAnimatedMarker from './CustomAnimatedMarker';
import DriverMarkerAdvanced from './DriverMarkerAdvanced';

interface GoogleMapsKwendaProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  showRoute?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  deliveryMode?: 'flash' | 'flex' | 'maxicharge';
  driverLocation?: { lat: number; lng: number; heading?: number | null };
  additionalMarkers?: Array<{ lat: number; lng: number; icon?: string; label?: string }>;
}

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
    case Status.FAILURE:
      return <div className="flex items-center justify-center h-full text-destructive">
        Erreur de chargement de Google Maps
      </div>;
    default:
      return null;
  }
};

const GoogleMapsComponent: React.FC<GoogleMapsKwendaProps & { apiKey: string }> = ({
  onLocationSelect,
  pickup,
  destination,
  showRoute,
  center = { lat: -4.4419, lng: 15.2663 }, // Kinshasa
  zoom = 12,
  height = "400px",
  deliveryMode,
  driverLocation,
  apiKey
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ weight: "2.00" }]
        },
        {
          featureType: "all",
          elementType: "geometry.stroke",
          stylers: [{ color: "#9c9c9c" }]
        },
        {
          featureType: "all",
          elementType: "labels.text",
          stylers: [{ visibility: "on" }]
        }
      ]
    });

    setMap(mapInstance);

    // Gestionnaire de clic sur la carte
    if (onLocationSelect) {
      mapInstance.addListener('click', async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Géocodage inverse pour obtenir l'adresse
          const geocoder = new google.maps.Geocoder();
          try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            const address = response.results[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect({ lat, lng, address });
          } catch (error) {
            console.error('Erreur de géocodage:', error);
            onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
          }
        }
      });
    }

    return () => {
      // Nettoyage
    };
  }, [center, zoom, onLocationSelect]);

  // Validation robuste des coordonnées
  const isValidCoord = (coord: { lat: number; lng: number } | undefined): boolean => {
    if (!coord) return false;
    return typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180;
  };

  // Ajuster la vue pour inclure tous les points lorsque aucun itinéraire n'est affiché
  useEffect(() => {
    if (!map) return;
    if (showRoute) return; // DirectionsRenderer gère le fitBounds quand l'itinéraire est visible

    const bounds = new google.maps.LatLngBounds();
    let hasAny = false;
    
    if (isValidCoord(pickup)) { bounds.extend(pickup!); hasAny = true; }
    if (isValidCoord(destination)) { bounds.extend(destination!); hasAny = true; }
    if (driverLocation && isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng })) { 
      bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng }); 
      hasAny = true; 
    }

    if (hasAny) {
      map.fitBounds(bounds, 64);
    } else {
      // Fallback: Centrer sur la position par défaut si aucune coordonnée valide
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, pickup, destination, driverLocation, showRoute, center, zoom]);
  useEffect(() => {
    if (!map || !showRoute) return;
    
    // Valider les coordonnées avant de calculer l'itinéraire
    if (!isValidCoord(pickup) || !isValidCoord(destination)) {
      console.warn('⚠️ Coordonnées invalides pour calcul itinéraire', { pickup, destination });
      return;
    }

    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: deliveryMode === 'flash' ? '#F59E0B' : deliveryMode === 'flex' ? '#22C55E' : '#8B5CF6',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    renderer.setMap(map);
    setDirectionsRenderer(renderer);

    directionsService.route({
      origin: pickup!,
      destination: destination!,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderer.setDirections(result);
        console.log('✅ Itinéraire calculé avec succès');
      } else {
        console.error('❌ Erreur calcul itinéraire:', status);
        toast({
          title: "Erreur carte",
          description: "Impossible de calculer l'itinéraire entre les deux points",
          variant: "destructive"
        });
      }
    });
  }, [map, pickup, destination, showRoute, deliveryMode, toast]);

  const handleZoomIn = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom()! + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.setZoom(map.getZoom()! - 1);
    }
  }, [map]);

  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map?.setCenter(pos);
          map?.setZoom(15);
        },
        () => {
          toast({
            title: "Erreur",
            description: "Impossible d'obtenir votre position",
            variant: "destructive"
          });
        }
      );
    }
  }, [map, toast]);

  return (
    <Card className="relative overflow-hidden">
      <div ref={mapRef} style={{ height }} className="w-full" />
      
      {/* Overlay "En attente" si pas de coordonnées */}
      {!isValidCoord(pickup) && !isValidCoord(destination) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 pointer-events-none z-10">
          <div className="text-center p-4 bg-background/80 rounded-xl backdrop-blur-sm">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              En attente des coordonnées...
            </p>
          </div>
        </div>
      )}
      
      {/* Markers modernes animés */}
      {isValidCoord(pickup) && (
        <CustomAnimatedMarker
          map={map}
          position={pickup!}
          type="pickup"
          label="Point de départ"
          animation="drop"
        />
      )}
      
      {isValidCoord(destination) && (
        <CustomAnimatedMarker
          map={map}
          position={destination!}
          type="destination"
          label="Destination"
          animation="drop"
        />
      )}
      
      {driverLocation && isValidCoord({ lat: driverLocation.lat, lng: driverLocation.lng }) && (
        <DriverMarkerAdvanced
          map={map}
          position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
          heading={driverLocation.heading || 0}
          driverName="Chauffeur"
          smoothTransition={true}
          speed={0}
        />
      )}
      
      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLocateUser}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Badge du mode de livraison */}
      {deliveryMode && (
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            deliveryMode === 'flash' ? 'bg-red-500/20 text-red-700 border border-red-500/30' :
            deliveryMode === 'flex' ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' :
            'bg-purple-500/20 text-purple-700 border border-purple-500/30'
          }`}>
            {deliveryMode.toUpperCase()}
          </div>
        </div>
      )}
    </Card>
  );
};

const GoogleMapsKwenda: React.FC<GoogleMapsKwendaProps> = (props) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Invoke Supabase Edge Function to get API key
        const { data, error } = await supabase.functions.invoke('get-google-maps-key', {
          body: {},
        });
        if (error) throw error;
        if (!data?.apiKey) throw new Error('Google Maps API non disponible');
        setApiKey(data.apiKey);
      } catch (error) {
        console.warn('Google Maps fallback mode activated:', error);
        // Mode dégradé: pas d'erreur utilisateur, juste pas de carte
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center" style={{ height: props.height || "400px" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (!apiKey) {
    return (
      <Card className="flex items-center justify-center" style={{ height: props.height || "400px" }}>
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Google Maps non configuré</p>
        </div>
      </Card>
    );
  }

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['places', 'geometry']}>
      <GoogleMapsComponent {...props} apiKey={apiKey} />
    </Wrapper>
  );
};

export default GoogleMapsKwenda;