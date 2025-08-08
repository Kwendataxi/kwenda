import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryConfig';
import { 
  Plus, 
  Minus, 
  Locate, 
  Navigation,
  MapPin,
  Building2,
  Plane,
  ShoppingBag
} from 'lucide-react';

interface CityConfig {
  name: string;
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
  pois: {
    type: 'airport' | 'commercial' | 'residential' | 'transport';
    name: string;
    coordinates: [number, number];
    icon: string;
  }[];
}

interface OptimizedCityMapProps {
  city: 'kinshasa' | 'lubumbashi' | 'kolwezi' | 'abidjan';
  onLocationSelect?: (coordinates: [number, number]) => void;
  pickupLocation?: [number, number];
  destination?: [number, number];
  showRouting?: boolean;
  height?: string;
  deliveryMode?: 'flash' | 'flex' | 'maxicharge';
  interactive?: boolean;
}

const OptimizedCityMap: React.FC<OptimizedCityMapProps> = ({
  city,
  onLocationSelect,
  pickupLocation,
  destination,
  showRouting = false,
  height = "60vh",
  deliveryMode = 'flash',
  interactive = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  
  const { toast } = useToast();

  // Configuration optimisée par ville
  const cityConfigs: Record<string, CityConfig> = {
    kinshasa: {
      name: 'Kinshasa',
      center: [15.2663, -4.4419],
      zoom: 12,
      bounds: [[15.1000, -4.6000], [15.4500, -4.2000]],
      pois: [
        { type: 'airport', name: 'Aéroport N\'djili', coordinates: [15.4445, -4.3857], icon: '✈️' },
        { type: 'commercial', name: 'Boulevard du 30 Juin', coordinates: [15.2663, -4.4419], icon: '🏢' },
        { type: 'commercial', name: 'Marché Central', coordinates: [15.3142, -4.4419], icon: '🏪' },
        { type: 'residential', name: 'Gombe', coordinates: [15.2900, -4.4200], icon: '🏠' },
        { type: 'residential', name: 'Bandalungwa', coordinates: [15.2300, -4.4600], icon: '🏠' },
        { type: 'transport', name: 'Gare Centrale', coordinates: [15.2800, -4.4400], icon: '🚂' },
      ]
    },
    lubumbashi: {
      name: 'Lubumbashi',
      center: [27.5053, -11.6792],
      zoom: 13,
      bounds: [[27.3500, -11.8000], [27.6500, -11.5500]],
      pois: [
        { type: 'airport', name: 'Aéroport Luano', coordinates: [27.5308, -11.5912], icon: '✈️' },
        { type: 'commercial', name: 'Centre-ville', coordinates: [27.5053, -11.6792], icon: '🏢' },
        { type: 'residential', name: 'Kenya', coordinates: [27.4800, -11.6600], icon: '🏠' },
        { type: 'residential', name: 'Kampemba', coordinates: [27.5300, -11.7000], icon: '🏠' },
        { type: 'commercial', name: 'Université', coordinates: [27.4700, -11.6500], icon: '🎓' },
      ]
    },
    kolwezi: {
      name: 'Kolwezi',
      center: [25.4665, -10.7148],
      zoom: 14,
      bounds: [[25.3500, -10.8000], [25.5800, -10.6200]],
      pois: [
        { type: 'commercial', name: 'Centre-ville', coordinates: [25.4665, -10.7148], icon: '🏢' },
        { type: 'residential', name: 'Mutanda', coordinates: [25.4500, -10.7000], icon: '🏠' },
        { type: 'residential', name: 'Dilala', coordinates: [25.4800, -10.7300], icon: '🏠' },
        { type: 'commercial', name: 'Zone minière', coordinates: [25.5000, -10.7200], icon: '⛏️' },
      ]
    },
    abidjan: {
      name: 'Abidjan',
      center: [-4.0083, 5.3600],
      zoom: 12,
      bounds: [[-4.2000, 5.2000], [-3.8000, 5.5000]],
      pois: [
        { type: 'airport', name: 'Aéroport FHB', coordinates: [-3.9263, 5.2614], icon: '✈️' },
        { type: 'commercial', name: 'Plateau', coordinates: [-4.0266, 5.3205], icon: '🏢' },
        { type: 'residential', name: 'Cocody', coordinates: [-3.9800, 5.3600], icon: '🏠' },
        { type: 'residential', name: 'Yopougon', coordinates: [-4.0900, 5.3400], icon: '🏠' },
        { type: 'commercial', name: 'Adjamé', coordinates: [-4.0200, 5.3700], icon: '🏪' },
        { type: 'transport', name: 'Port d\'Abidjan', coordinates: [-4.0400, 5.2900], icon: '🚢' },
      ]
    }
  };

  const currentConfig = cityConfigs[city];

  // Style Kwenda pour les markers
  const createCityMarker = (poi: CityConfig['pois'][0]) => {
    const el = document.createElement('div');
    el.className = 'city-poi-marker';
    
    const colorMap = {
      airport: '#EC2027',    // Rouge Kwenda
      commercial: '#F2A216', // Or Congo
      residential: '#10B981', // Vert Kwenda
      transport: '#3B82F6'    // Bleu
    };
    
    el.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colorMap[poi.type]};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${poi.icon}
      </div>
    `;
    
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });
    
    return el;
  };

  const createLocationMarker = (type: 'pickup' | 'destination') => {
    const el = document.createElement('div');
    const color = type === 'pickup' ? '#10B981' : '#EC2027';
    const icon = type === 'pickup' ? '🚀' : '🎯';
    
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: kwenda-pulse 2s infinite;
      ">
        ${icon}
      </div>
    `;
    
    return el;
  };

  // Initialisation de la carte optimisée
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        const { data: tokenData, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !tokenData?.token) {
          mapContainer.current!.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
              <div class="text-center p-4">
                <Building2 class="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 class="text-lg font-semibold text-primary mb-2">Carte ${currentConfig.name}</h3>
                <p class="text-sm text-foreground/70">Optimisée pour ${city}</p>
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
          style: 'mapbox://styles/mapbox/streets-v12',
          center: currentConfig.center,
          zoom: currentConfig.zoom,
          interactive: interactive,
          attributionControl: false,
        });

        // Contraindre la carte aux limites de la ville
        if (currentConfig.bounds) {
          map.current.setMaxBounds(currentConfig.bounds);
        }

        // Contrôles de navigation
        if (interactive) {
          const nav = new mapboxgl.NavigationControl({ visualizePitch: false });
          map.current.addControl(nav, 'top-right');
        }

        map.current.on('load', () => {
          console.log(`Carte ${currentConfig.name} chargée avec optimisations`);
          setMapReady(true);
          
          // Ajouter les styles d'animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes kwenda-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            .city-poi-marker:hover {
              z-index: 1000;
            }
          `;
          document.head.appendChild(style);
          
          // Ajouter les POIs de la ville
          addCityPOIs();
        });

        // Gestion des clics pour sélection de lieu
        if (interactive && onLocationSelect) {
          map.current.on('click', (e) => {
            onLocationSelect([e.lngLat.lng, e.lngLat.lat]);
          });
        }

      } catch (error) {
        console.error(`Erreur initialisation carte ${currentConfig.name}:`, error);
      }
    };

    initializeMap();

    return () => {
      markers.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [city, interactive]);

  // Ajouter les POIs spécifiques à la ville
  const addCityPOIs = () => {
    if (!map.current || !mapReady) return;

    currentConfig.pois.forEach(poi => {
      const marker = new mapboxgl.Marker({
        element: createCityMarker(poi),
      })
        .setLngLat(poi.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25, className: 'kwenda-popup' })
            .setHTML(`
              <div class="text-center p-2">
                <div class="text-lg mb-1">${poi.icon}</div>
                <strong class="text-sm">${poi.name}</strong>
                <div class="text-xs text-gray-600 mt-1">${currentConfig.name}</div>
              </div>
            `)
        );

      if (map.current && map.current.loaded()) {
        marker.addTo(map.current);
        setMarkers(prev => [...prev, marker]);
      }
    });
  };

  // Ajouter markers pickup/destination
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Nettoyer les anciens markers
    markers.filter(m => m.getElement().classList.contains('location-marker')).forEach(m => {
      m.remove();
      setMarkers(prev => prev.filter(marker => marker !== m));
    });

    // Ajouter pickup marker
    if (pickupLocation) {
      const pickupMarker = new mapboxgl.Marker({
        element: createLocationMarker('pickup'),
      })
        .setLngLat(pickupLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML('<div class="text-center p-2"><strong>🚀 Point de départ</strong></div>')
        );

      pickupMarker.getElement().classList.add('location-marker');
      if (map.current.loaded()) {
        pickupMarker.addTo(map.current);
        setMarkers(prev => [...prev, pickupMarker]);
      }
    }

    // Ajouter destination marker
    if (destination) {
      const destMarker = new mapboxgl.Marker({
        element: createLocationMarker('destination'),
      })
        .setLngLat(destination)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML('<div class="text-center p-2"><strong>🎯 Destination</strong></div>')
        );

      destMarker.getElement().classList.add('location-marker');
      if (map.current.loaded()) {
        destMarker.addTo(map.current);
        setMarkers(prev => [...prev, destMarker]);
      }
    }

    // Ajuster la vue si les deux points sont définis
    if (pickupLocation && destination && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(pickupLocation);
      bounds.extend(destination);
      map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    }
  }, [pickupLocation, destination, mapReady]);

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleResetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: currentConfig.center,
        zoom: currentConfig.zoom,
        duration: 1000
      });
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
      <div 
        ref={mapContainer} 
        style={{ height }}
        className="w-full relative rounded-lg overflow-hidden"
      />
      
      {/* Contrôles optimisés pour mobile */}
      {interactive && (
        <>
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

          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/95 backdrop-blur-sm shadow-lg border-primary/20 hover:bg-primary hover:text-primary-foreground"
              onClick={handleResetView}
            >
              <Building2 className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
      
      {/* Info ville */}
      <div className="absolute top-4 left-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="font-medium">{currentConfig.name}</span>
            {deliveryMode && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="capitalize text-primary">{deliveryMode}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OptimizedCityMap;