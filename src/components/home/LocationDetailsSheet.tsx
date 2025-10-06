import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bookmark, Edit3, Share2, MapPin, Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from '@/hooks/use-toast';

interface LocationDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  coordinates?: { lat: number; lng: number };
}

export const LocationDetailsSheet: React.FC<LocationDetailsSheetProps> = ({
  open,
  onOpenChange,
  address,
  coordinates
}) => {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !coordinates || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    new google.maps.Marker({
      position: coordinates,
      map: newMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#E31E24',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    setMap(newMap);
  }, [isLoaded, coordinates, map]);

  const handleSaveLocation = () => {
    toast({
      title: "Position enregistrée",
      description: "Votre position a été sauvegardée avec succès"
    });
  };

  const handleEditLocation = () => {
    toast({
      title: "Modifier la position",
      description: "Fonctionnalité en cours de développement"
    });
  };

  const handleShareLocation = async () => {
    if (coordinates) {
      const shareUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Ma position',
            text: address,
            url: shareUrl
          });
        } catch (err) {
          // User cancelled share
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Lien copié",
          description: "Le lien de votre position a été copié"
        });
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-2xl font-bold text-center">
            VOTRE POSITION
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Mini Map */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-muted border">
            {!isLoaded || !coordinates ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>

          {/* Address Display */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Adresse actuelle</p>
              <p className="text-base font-semibold text-foreground mt-1">{address}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-left"
              onClick={handleSaveLocation}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bookmark className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">
                Enregistrer la position pour une utilisation ultérieure
              </span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-left"
              onClick={handleEditLocation}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Edit3 className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">
                Modifier votre position
              </span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-left"
              onClick={handleShareLocation}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">
                Partager la position
              </span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
