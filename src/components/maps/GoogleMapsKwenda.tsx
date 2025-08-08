import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapsKwendaProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  pickup?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  showRoute?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  deliveryMode?: 'flash' | 'flex' | 'maxicharge';
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
  apiKey
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
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

  // Gestion du marker de pickup
  useEffect(() => {
    if (!map || !pickup) return;

    if (pickupMarker) {
      pickupMarker.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: pickup,
      map,
      title: "Point de collecte",
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#10B981"/>
            <circle cx="16" cy="16" r="8" fill="white"/>
            <circle cx="16" cy="16" r="4" fill="#10B981"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      }
    });

    setPickupMarker(marker);
  }, [map, pickup]);

  // Gestion du marker de destination
  useEffect(() => {
    if (!map || !destination) return;

    if (destinationMarker) {
      destinationMarker.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: destination,
      map,
      title: "Point de livraison",
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#EF4444"/>
            <circle cx="16" cy="16" r="8" fill="white"/>
            <circle cx="16" cy="16" r="4" fill="#EF4444"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      }
    });

    setDestinationMarker(marker);
  }, [map, destination]);

  // Gestion de l'itinéraire
  useEffect(() => {
    if (!map || !pickup || !destination || !showRoute) return;

    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: deliveryMode === 'flash' ? '#EF4444' : deliveryMode === 'flex' ? '#F59E0B' : '#8B5CF6',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    renderer.setMap(map);
    setDirectionsRenderer(renderer);

    directionsService.route({
      origin: pickup,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderer.setDirections(result);
        
        // Afficher les informations de l'itinéraire
        const route = result.routes[0];
        const leg = route.legs[0];
        toast({
          title: "Itinéraire calculé",
          description: `Distance: ${leg.distance?.text} - Durée: ${leg.duration?.text}`,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de calculer l'itinéraire",
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
        // Pour l'instant, on utilise une clé temporaire
        // En production, récupérer depuis Supabase Secrets
        const tempKey = 'YOUR_GOOGLE_MAPS_API_KEY';
        setApiKey(tempKey);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger Google Maps",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [toast]);

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