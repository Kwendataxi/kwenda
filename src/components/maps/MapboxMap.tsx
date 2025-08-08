import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Navigation, Plus, Minus, Locate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MapboxMapProps {
  onLocationSelect?: (coordinates: [number, number]) => void;
  pickupLocation?: [number, number];
  destination?: [number, number];
  showRouting?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  onLocationSelect,
  pickupLocation,
  destination,
  showRouting = false,
  center = [0, 0], // Global default; will fly to user when available
  zoom = 12,
  height = "70vh"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userMarker, setUserMarker] = useState<mapboxgl.Marker | null>(null);
  const [pickupMarker, setPickupMarker] = useState<mapboxgl.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<mapboxgl.Marker | null>(null);
  
  const { toast } = useToast();
  const geolocation = useGeolocation();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        const { data: tokenData, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !tokenData?.token) {
          // Fallback to styled div when no Mapbox token
          mapContainer.current!.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
              <div class="text-center p-4">
                <div class="w-12 h-12 mx-auto text-blue-500 mb-2">🗺️</div>
                <h3 class="text-lg font-semibold text-blue-700 mb-2">Carte Interactive</h3>
                <p class="text-sm text-blue-600">Kinshasa, République Démocratique du Congo</p>
                <p class="text-xs text-muted-foreground mt-2">Configuration Mapbox en cours...</p>
              </div>
            </div>
          `;
          setMapReady(true);
          return;
        }

        mapboxgl.accessToken = tokenData.token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/navigation-day-v1',
          center: center,
          zoom: zoom,
          attributionControl: false,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapReady(true);
        });

        // Handle map clicks for location selection
        map.current.on('click', (e) => {
          if (onLocationSelect) {
            onLocationSelect([e.lngLat.lng, e.lngLat.lat]);
          }
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        // Show fallback UI
        mapContainer.current!.innerHTML = `
          <div class="w-full h-full bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
            <div class="text-center p-4">
              <div class="w-12 h-12 mx-auto text-red-500 mb-2">⚠️</div>
              <h3 class="text-lg font-semibold text-red-700 mb-2">Erreur de carte</h3>
              <p class="text-sm text-red-600">Impossible de charger la carte</p>
            </div>
          </div>
        `;
        setMapReady(true);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [center, zoom, onLocationSelect]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapReady || !geolocation.latitude || !geolocation.longitude) return;

    // Remove existing user marker
    if (userMarker) {
      userMarker.remove();
    }

    try {
      // Create user location marker
      const marker = new mapboxgl.Marker({
        color: '#3B82F6',
        scale: 1.2,
      })
        .setLngLat([geolocation.longitude, geolocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center"><strong>Votre position</strong></div>'
          )
        );

      // Ensure map is ready before adding marker
      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setUserMarker(marker);

        // Center map on user location
        map.current.flyTo({
          center: [geolocation.longitude, geolocation.latitude],
          zoom: 15,
          duration: 1000,
        });
      }
    } catch (error) {
      console.error('Error adding user marker:', error);
    }
  }, [geolocation.latitude, geolocation.longitude, mapReady]);

  // Add pickup location marker
  useEffect(() => {
    if (!map.current || !mapReady || !pickupLocation) return;

    if (pickupMarker) {
      pickupMarker.remove();
    }

    try {
      const marker = new mapboxgl.Marker({
        color: '#10B981',
        scale: 1.0,
      })
        .setLngLat(pickupLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center"><strong>Point de départ</strong></div>'
          )
        );

      // Ensure map is ready before adding marker
      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setPickupMarker(marker);
      }
    } catch (error) {
      console.error('Error adding pickup marker:', error);
    }
  }, [pickupLocation, mapReady]);

  // Add destination marker
  useEffect(() => {
    if (!map.current || !mapReady || !destination) return;

    if (destinationMarker) {
      destinationMarker.remove();
    }

    try {
      const marker = new mapboxgl.Marker({
        color: '#EF4444',
        scale: 1.0,
      })
        .setLngLat(destination)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center"><strong>Destination</strong></div>'
          )
        );

      // Ensure map is ready before adding marker
      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setDestinationMarker(marker);
      }
    } catch (error) {
      console.error('Error adding destination marker:', error);
    }
  }, [destination, mapReady]);

  // Draw route when pickup and destination are set
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clean existing route if toggled off or points missing
    const removeRoute = () => {
      if (!map.current) return;
      if (map.current.getLayer('route-line')) {
        map.current.removeLayer('route-line');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
    };

    if (!showRouting || !pickupLocation || !destination) {
      removeRoute();
      return;
    }

    const fetchRoute = async () => {
      try {
        const token = (mapboxgl as any).accessToken as string;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${pickupLocation[0]},${pickupLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${token}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const route = data?.routes?.[0]?.geometry;
        if (!route || !map.current) return;

        // Remove existing and add new route
        removeRoute();
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route,
          },
        } as any);

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#2563EB',
            'line-width': 5,
            'line-opacity': 0.85,
          },
        } as any);

        // Fit bounds to route
        const bounds = new mapboxgl.LngLatBounds();
        route.coordinates.forEach((c: [number, number]) => bounds.extend(c));
        map.current.fitBounds(bounds, { padding: 60, duration: 800 });
      } catch (e) {
        console.error('Failed to fetch route:', e);
      }
    };

    fetchRoute();

    // Cleanup on unmount/changes
    return () => removeRoute();
  }, [mapReady, showRouting, pickupLocation, destination]);

  const handleLocateUser = async () => {
    try {
      await geolocation.getCurrentPosition();
      toast({
        title: "Position trouvée",
        description: "Votre position a été mise à jour sur la carte",
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          style={{ height }}
          className="w-full relative"
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg"
            onClick={handleZoomIn}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg"
            onClick={handleZoomOut}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Locate Button */}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg"
            onClick={handleLocateUser}
            disabled={geolocation.loading}
          >
            <Locate className={`w-4 h-4 ${geolocation.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Location Status */}
        {geolocation.latitude && geolocation.longitude && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-sm">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Position: </span>
                <span className="text-muted-foreground">
                  {geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapboxMap;