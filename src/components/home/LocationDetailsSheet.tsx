import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Edit3, Share2, MapPin, Loader2, ExternalLink, Check, Navigation } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [savedPositions, setSavedPositions] = useState<Array<{ name: string; address: string; coordinates: { lat: number; lng: number } }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [positionName, setPositionName] = useState('');

  // Load saved positions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kwenda_saved_positions');
    if (saved) {
      setSavedPositions(JSON.parse(saved));
    }
  }, []);

  // Initialize Google Map with improved loading
  useEffect(() => {
    if (!open || !isLoaded || !mapRef.current || !coordinates) {
      setMapLoaded(false);
      return;
    }

    // Reset map state when sheet opens
    setMap(null);
    setMapLoaded(false);

    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        const newMap = new google.maps.Map(mapRef.current, {
          center: coordinates,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Custom animated marker
        const marker = new google.maps.Marker({
          position: coordinates,
          map: newMap,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#E31E24',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 4
          }
        });

        // Add pulse animation to marker
        setTimeout(() => {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 1000);
        }, 500);

        setMap(newMap);
        setMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapLoaded(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isLoaded, coordinates, open]);

  const handleSaveLocation = () => {
    if (savedPositions.length >= 10) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez sauvegarder jusqu'à 10 positions maximum",
        variant: "destructive"
      });
      return;
    }
    setShowSaveDialog(true);
  };

  const confirmSaveLocation = () => {
    if (!coordinates) return;
    
    const name = positionName.trim() || `Position ${savedPositions.length + 1}`;
    const newPosition = {
      name,
      address,
      coordinates
    };

    const updated = [...savedPositions, newPosition];
    setSavedPositions(updated);
    localStorage.setItem('kwenda_saved_positions', JSON.stringify(updated));

    toast({
      title: "✅ Position enregistrée",
      description: `"${name}" a été sauvegardée avec succès`
    });

    setPositionName('');
    setShowSaveDialog(false);
  };

  const handleEditLocation = () => {
    toast({
      title: "📍 Modifier la position",
      description: "Déplacez le marqueur sur la carte pour changer votre position",
    });
  };

  const handleShareLocation = async () => {
    if (coordinates) {
      const shareUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      const shareText = `📍 Ma position: ${address}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Ma position Kwenda',
            text: shareText,
            url: shareUrl
          });
          
          toast({
            title: "📤 Partagé avec succès",
            description: "Votre position a été partagée"
          });
        } catch (err) {
          // User cancelled share
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({
          title: "📋 Lien copié",
          description: "Le lien de votre position a été copié dans le presse-papier"
        });
      }
    }
  };

  const openInGoogleMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SheetHeader className="space-y-3 pb-6">
            <SheetTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              VOTRE POSITION
            </SheetTitle>
            {coordinates && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-muted-foreground text-center font-mono"
              >
                GPS: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </motion.p>
            )}
          </SheetHeader>

          <div className="space-y-5">
            {/* Mini Map with Enhanced Design */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="relative"
            >
              <div className="relative w-full h-60 rounded-3xl overflow-hidden bg-gradient-to-br from-muted via-muted/50 to-background border-2 border-primary/10 shadow-2xl">
                <AnimatePresence mode="wait">
                  {!mapLoaded ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    >
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground animate-pulse">Chargement de la carte...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      ref={mapRef}
                      className="w-full h-full"
                    />
                  )}
                </AnimatePresence>

                {/* Open in Google Maps Button */}
                {mapLoaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-3 right-3"
                  >
                    <Button
                      size="sm"
                      onClick={openInGoogleMaps}
                      className="h-9 gap-2 bg-background/95 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      variant="secondary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-xs font-semibold">Google Maps</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Address Display with Modern Design */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/10 p-4 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex-shrink-0"
                >
                  <MapPin className="h-6 w-6 text-primary drop-shadow-sm" />
                </motion.div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Adresse actuelle</p>
                  <p className="text-sm font-bold text-foreground leading-relaxed">{address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Navigation className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Position GPS précise</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Save Dialog */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-primary/20">
                    <p className="text-sm font-semibold text-foreground">Nom de la position (optionnel)</p>
                    <Input
                      placeholder="Ex: Maison, Bureau, Arrêt de bus..."
                      value={positionName}
                      onChange={(e) => setPositionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmSaveLocation()}
                      className="h-11"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={confirmSaveLocation}
                        className="flex-1 gap-2 h-10"
                      >
                        <Check className="h-4 w-4" />
                        Confirmer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSaveDialog(false);
                          setPositionName('');
                        }}
                        className="flex-1 h-10"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions with Modern Icons */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-4 h-16 text-left group hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={handleSaveLocation}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Bookmark className="h-6 w-6 text-red-600" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    Enregistrer cette position
                  </span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-4 h-16 text-left group hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={handleEditLocation}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Edit3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    Modifier la position
                  </span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-4 h-16 text-left group hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={handleShareLocation}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Share2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    Partager la position
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
