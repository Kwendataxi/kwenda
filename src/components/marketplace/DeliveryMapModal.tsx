import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryMapModalProps {
  open: boolean;
  onClose: () => void;
  deliveryCoordinates: { lat: number; lng: number };
  deliveryAddress?: string;
  pickupCoordinates?: { lat: number; lng: number };
}

export const DeliveryMapModal = ({ 
  open, 
  onClose, 
  deliveryCoordinates, 
  deliveryAddress,
  pickupCoordinates 
}: DeliveryMapModalProps) => {
  const [mapApiKey, setMapApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data?.apiKey) {
          setMapApiKey(data.apiKey);
        }
      } catch (error) {
        console.error('Error fetching Maps API key:', error);
        setLoading(false);
      }
    };
    if (open) fetchApiKey();
  }, [open]);

  useEffect(() => {
    if (!mapApiKey || !mapRef.current || !open) return;

    const loadMap = async () => {
      try {
        // Load Google Maps script if not already loaded
        if (!window.google?.maps) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Initialize map
        const map = new google.maps.Map(mapRef.current!, {
          center: deliveryCoordinates,
          zoom: 15,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
        });

        mapInstanceRef.current = map;

        // Add delivery marker (red)
        new google.maps.Marker({
          position: deliveryCoordinates,
          map,
          title: 'Point de livraison',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        // Add pickup marker if available (green)
        if (pickupCoordinates) {
          new google.maps.Marker({
            position: pickupCoordinates,
            map,
            title: 'Point de retrait',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });

          // Adjust bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(deliveryCoordinates);
          bounds.extend(pickupCoordinates);
          map.fitBounds(bounds);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading map:', error);
        setLoading(false);
      }
    };

    loadMap();
  }, [mapApiKey, open, deliveryCoordinates, pickupCoordinates]);

  const openInGoogleMaps = () => {
    const url = pickupCoordinates
      ? `https://www.google.com/maps/dir/?api=1&origin=${pickupCoordinates.lat},${pickupCoordinates.lng}&destination=${deliveryCoordinates.lat},${deliveryCoordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${deliveryCoordinates.lat},${deliveryCoordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localisation de livraison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Adresse */}
          {deliveryAddress && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Adresse :</p>
              <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
            </div>
          )}

          {/* Coordonnées */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📍 Lat: {deliveryCoordinates.lat.toFixed(6)}</span>
            <span>📍 Lng: {deliveryCoordinates.lng.toFixed(6)}</span>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Open in Google Maps button */}
          <Button 
            onClick={openInGoogleMaps}
            className="w-full"
            variant="outline"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Ouvrir dans Google Maps (itinéraire)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
