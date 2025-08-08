import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Navigation, Plus, Minus, Locate, Route, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KwendaDynamicMapProps {
  onLocationSelect?: (coordinates: [number, number]) => void;
  pickupLocation?: [number, number];
  destination?: [number, number];
  showRouting?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  deliveryMode?: 'flash' | 'flex' | 'maxicharge';
}

const KwendaDynamicMap: React.FC<KwendaDynamicMapProps> = ({
  onLocationSelect,
  pickupLocation,
  destination,
  showRouting = false,
  center = [15.2663, -4.4419], // Kinshasa default
  zoom = 12,
  height = "50vh",
  deliveryMode = 'flash'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userMarker, setUserMarker] = useState<mapboxgl.Marker | null>(null);
  const [pickupMarker, setPickupMarker] = useState<mapboxgl.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<mapboxgl.Marker | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  
  const { toast } = useToast();
  const geolocation = useGeolocation();

  // Kwenda brand colors and markers
  const getKwendaMarkerStyle = (type: 'pickup' | 'destination' | 'user') => {
    switch (type) {
      case 'pickup':
        return { color: '#10B981', scale: 1.2 }; // Vert Kwenda
      case 'destination':
        return { color: '#EC2027', scale: 1.2 }; // Rouge Kwenda
      case 'user':
        return { color: '#F2A216', scale: 1.0 }; // Or Congo
    }
  };

  // Custom Kwenda marker element
  const createKwendaMarker = (type: 'pickup' | 'destination' | 'user') => {
    const el = document.createElement('div');
    el.className = 'kwenda-marker';
    
    const colors = getKwendaMarkerStyle(type);
    const icon = type === 'pickup' ? '🚀' : type === 'destination' ? '🎯' : '📍';
    
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: ${colors.color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: scale(${colors.scale});
        animation: kwendaPulse 2s infinite;
      ">
        ${icon}
      </div>
    `;
    
    return el;
  };

  // Initialize map with Kwenda style
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        const { data: tokenData, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !tokenData?.token) {
          // Kwenda fallback UI
          mapContainer.current!.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
              <div class="text-center p-4">
                <div class="w-16 h-16 mx-auto text-primary mb-4">🗺️</div>
                <h3 class="text-lg font-semibold text-primary mb-2">Carte Kwenda</h3>
                <p class="text-sm text-foreground/70">Kinshasa & Abidjan</p>
                <p class="text-xs text-muted-foreground mt-2">Configuration en cours...</p>
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

        // Add Kwenda-styled navigation controls
        const nav = new mapboxgl.NavigationControl({
          visualizePitch: true,
        });
        map.current.addControl(nav, 'top-right');

        map.current.on('load', () => {
          console.log('Kwenda map loaded successfully');
          setMapReady(true);
          
          // Add CSS animations for Kwenda markers
          const style = document.createElement('style');
          style.textContent = `
            @keyframes kwendaPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(236, 32, 39, 0.3); }
              50% { transform: scale(1.1); box-shadow: 0 6px 20px rgba(236, 32, 39, 0.5); }
            }
            .route-animation {
              stroke-dasharray: 10;
              animation: routeFlow 2s linear infinite;
            }
            @keyframes routeFlow {
              to { stroke-dashoffset: -20; }
            }
          `;
          document.head.appendChild(style);
        });

        // Handle map clicks for location selection
        map.current.on('click', (e) => {
          if (onLocationSelect) {
            onLocationSelect([e.lngLat.lng, e.lngLat.lat]);
          }
        });

      } catch (error) {
        console.error('Error initializing Kwenda map:', error);
        mapContainer.current!.innerHTML = `
          <div class="w-full h-full bg-gradient-to-br from-destructive/10 to-orange-100 rounded-lg flex items-center justify-center border-2 border-dashed border-destructive/30">
            <div class="text-center p-4">
              <div class="w-12 h-12 mx-auto text-destructive mb-2">⚠️</div>
              <h3 class="text-lg font-semibold text-destructive mb-2">Erreur Carte</h3>
              <p class="text-sm text-destructive/70">Connexion impossible</p>
            </div>
          </div>
        `;
        setMapReady(true);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, onLocationSelect]);

  // Add user location marker with Kwenda style
  useEffect(() => {
    if (!map.current || !mapReady || !geolocation.latitude || !geolocation.longitude) return;

    if (userMarker) {
      userMarker.remove();
    }

    try {
      const marker = new mapboxgl.Marker({
        element: createKwendaMarker('user'),
      })
        .setLngLat([geolocation.longitude, geolocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center p-2"><strong>Votre position</strong><br/><small>📱 Kwenda</small></div>'
          )
        );

      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setUserMarker(marker);

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

  // Add pickup location marker with Kwenda style
  useEffect(() => {
    if (!map.current || !mapReady || !pickupLocation) return;

    if (pickupMarker) {
      pickupMarker.remove();
    }

    try {
      const marker = new mapboxgl.Marker({
        element: createKwendaMarker('pickup'),
      })
        .setLngLat(pickupLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center p-2"><strong>🚀 Point de départ</strong><br/><small>Kwenda Pickup</small></div>'
          )
        );

      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setPickupMarker(marker);
      }
    } catch (error) {
      console.error('Error adding pickup marker:', error);
    }
  }, [pickupLocation, mapReady]);

  // Add destination marker with Kwenda style
  useEffect(() => {
    if (!map.current || !mapReady || !destination) return;

    if (destinationMarker) {
      destinationMarker.remove();
    }

    try {
      const marker = new mapboxgl.Marker({
        element: createKwendaMarker('destination'),
      })
        .setLngLat(destination)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="text-center p-2"><strong>🎯 Destination</strong><br/><small>Kwenda Delivery</small></div>'
          )
        );

      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setDestinationMarker(marker);
      }
    } catch (error) {
      console.error('Error adding destination marker:', error);
    }
  }, [destination, mapReady]);

  // Draw dynamic route with Kwenda styling and directional arrows
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const removeRoute = () => {
      const m = map.current as mapboxgl.Map | null;
      if (!m) return;
      if (!(m as any).style || (typeof (m as any).isStyleLoaded === 'function' && !(m as any).isStyleLoaded())) {
        return;
      }
      if (m.getLayer('route-line')) m.removeLayer('route-line');
      if (m.getLayer('route-arrows')) m.removeLayer('route-arrows');
      if (m.getSource('route')) m.removeSource('route');
      if (m.getSource('route-arrows')) m.removeSource('route-arrows');
    };

    if (!showRouting || !pickupLocation || !destination) {
      removeRoute();
      return;
    }

    const fetchRoute = async () => {
      try {
        const token = (mapboxgl as any).accessToken as string;
        const profile = deliveryMode === 'flash' ? 'driving-traffic' : 'driving';
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${pickupLocation[0]},${pickupLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&steps=true&access_token=${token}`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const route = data?.routes?.[0];
        if (!route || !map.current) return;

        // Store route info
        setRouteInfo({
          distance: Math.round(route.distance / 1000 * 10) / 10, // km
          duration: Math.round(route.duration / 60) // minutes
        });

        removeRoute();
        
        // Add main route line with Kwenda styling
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        } as any);

        // Route color based on delivery mode
        const routeColor = deliveryMode === 'flash' ? '#EC2027' : 
                          deliveryMode === 'flex' ? '#F2A216' : '#10B981';

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 6,
            'line-opacity': 0.9,
          },
        } as any);

        // Add directional arrows along the route
        const coordinates = route.geometry.coordinates;
        const arrowFeatures = [];
        
        for (let i = 0; i < coordinates.length - 1; i += Math.floor(coordinates.length / 8)) {
          const start = coordinates[i];
          const end = coordinates[i + 1] || coordinates[coordinates.length - 1];
          
          arrowFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: start,
            },
            properties: {
              bearing: calculateBearing(start, end),
            },
          });
        }

        map.current.addSource('route-arrows', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: arrowFeatures,
          },
        } as any);

        map.current.addLayer({
          id: 'route-arrows',
          type: 'symbol',
          source: 'route-arrows',
          layout: {
            'icon-image': 'arrow',
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-size': 0.8,
            'symbol-placement': 'line',
            'symbol-spacing': 100,
          },
        } as any);

        // Fit bounds to route with padding
        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((c: [number, number]) => bounds.extend(c));
        if (map.current) {
          map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
        
      } catch (e) {
        console.error('Failed to fetch route:', e);
      }
    };

    fetchRoute();
    return () => removeRoute();
  }, [mapReady, showRouting, pickupLocation, destination, deliveryMode]);

  const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const [lng1, lat1] = start;
    const [lng2, lat2] = end;
    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const handleLocateUser = async () => {
    try {
      await geolocation.getCurrentPosition();
      toast({
        title: "📍 Position trouvée",
        description: "Votre position Kwenda a été mise à jour",
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          style={{ height }}
          className="w-full relative rounded-lg overflow-hidden"
        />
        
        {/* Enhanced Kwenda Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/95 backdrop-blur-sm shadow-lg border-primary/20 hover:bg-primary hover:text-primary-foreground"
            onClick={handleZoomIn}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/95 backdrop-blur-sm shadow-lg border-primary/20 hover:bg-primary hover:text-primary-foreground"
            onClick={handleZoomOut}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Locate Button with Kwenda style */}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={handleLocateUser}
            disabled={geolocation.loading}
          >
            <Locate className={`w-4 h-4 ${geolocation.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Route Info Display */}
        {routeInfo && (
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Route className="w-4 h-4 text-primary" />
                <span className="font-medium">{routeInfo.distance} km</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{routeInfo.duration} min</span>
                {deliveryMode === 'flash' && <Zap className="w-4 h-4 text-secondary" />}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Mode Indicator */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${
                deliveryMode === 'flash' ? 'bg-primary animate-pulse' :
                deliveryMode === 'flex' ? 'bg-secondary' : 'bg-accent'
              }`} />
              <span className="font-medium capitalize">{deliveryMode}</span>
            </div>
          </div>
        </div>

        {/* User Position Display */}
        {geolocation.latitude && geolocation.longitude && (
          <div className="absolute bottom-16 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs border border-primary/20">
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3 text-secondary" />
                <span className="font-medium">Position:</span>
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

export default KwendaDynamicMap;