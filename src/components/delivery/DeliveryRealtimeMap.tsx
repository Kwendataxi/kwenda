import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation, Maximize2, Minimize2, MapPin, Truck } from 'lucide-react';

interface DeliveryRealtimeMapProps {
  pickupLocation: { lat: number; lng: number };
  deliveryLocation: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number };
  status: string;
  estimatedTime?: number;
}

export const DeliveryRealtimeMap = ({
  pickupLocation,
  deliveryLocation,
  driverLocation,
  status,
  estimatedTime
}: DeliveryRealtimeMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [eta, setEta] = useState<number>(estimatedTime || 0);

  useEffect(() => {
    const initMap = async () => {
      try {
        const response = await fetch('https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/get-google-maps-key');
        const { key } = await response.json();
        
        if (!key) {
          console.error('Google Maps API key not found');
          return;
        }

        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
          script.onload = () => createMap();
        } else {
          createMap();
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    const createMap = () => {
      const mapElement = document.getElementById('realtime-delivery-map');
      if (!mapElement || !window.google) return;

      const mapInstance = new google.maps.Map(mapElement, {
        zoom: 13,
        center: driverLocation || pickupLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });

      setMap(mapInstance);

      // Pickup marker
      new google.maps.Marker({
        position: pickupLocation,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: 'Point de retrait'
      });

      // Delivery marker
      new google.maps.Marker({
        position: deliveryLocation,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: 'Destination'
      });

      // Route
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: driverLocation || pickupLocation,
          destination: deliveryLocation,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            new google.maps.Polyline({
              path: result.routes[0].overview_path,
              geodesic: true,
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: mapInstance
            });

            const duration = result.routes[0].legs[0].duration?.value || 0;
            setEta(Math.ceil(duration / 60));
          }
        }
      );
    };

    initMap();
  }, [pickupLocation, deliveryLocation, driverLocation]);

  useEffect(() => {
    if (!map || !driverLocation) return;

    if (driverMarker) {
      driverMarker.setPosition(driverLocation);
    } else {
      const marker = new google.maps.Marker({
        position: driverLocation,
        map: map,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        },
        title: 'Livreur'
      });
      setDriverMarker(marker);
    }

    map.panTo(driverLocation);
  }, [map, driverLocation, driverMarker]);

  return (
    <Card className={`relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <div className="relative">
        <div 
          id="realtime-delivery-map" 
          className={isFullscreen ? 'h-screen' : 'h-80'}
        />

        {status !== 'delivered' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <Badge className="bg-white/90 backdrop-blur-sm text-foreground px-4 py-2 text-base font-semibold shadow-lg">
              <Navigation className="w-4 h-4 mr-2" />
              ETA : {eta} min
            </Badge>
            
            <Button
              size="icon"
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm shadow-lg"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Point de retrait</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Destination</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Livreur</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
