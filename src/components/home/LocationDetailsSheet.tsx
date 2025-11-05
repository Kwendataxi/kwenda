import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Edit3, Share2, MapPin, ExternalLink, Check, Navigation, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeGeolocation } from '@/hooks/useRealtimeGeolocation';

// 🎨 Couleurs Kwenda pour marqueurs
const KWENDA_MARKER_COLORS = {
  normal: '#EF4444',      // Rouge Kwenda
  editing: '#F59E0B',     // Orange pour édition
  success: '#10B981',     // Vert pour confirmation
  white: '#FFFFFF'
};

// 🔍 Validation des coordonnées
const isValidCoordinates = (coords: { lat: number; lng: number } | undefined): boolean => {
  if (!coords) return false;
  const { lat, lng } = coords;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

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
  const geolocation = useRealtimeGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(coordinates);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [savedPositions, setSavedPositions] = useState<Array<{ name: string; address: string; coordinates: { lat: number; lng: number } }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [positionName, setPositionName] = useState('');

  // Debug log
  useEffect(() => {
    if (open && coordinates) {
      console.log('🗺️ LocationDetailsSheet ouvert:', {
        address,
        coordinates,
        isValid: isValidCoordinates(coordinates)
      });
    }
  }, [open, coordinates, address]);

  // Update current coords when props change
  useEffect(() => {
    setCurrentCoords(coordinates);
    setCurrentAddress(address);
  }, [coordinates, address]);

  // Load saved positions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kwenda_saved_positions');
    if (saved) {
      setSavedPositions(JSON.parse(saved));
    }
  }, []);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        setGoogleApiKey(data.apiKey);
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la carte",
          variant: "destructive"
        });
      }
    };

    if (open) {
      fetchApiKey();
    }
  }, [open]);

  // Load Google Maps script dynamically with timeout
  useEffect(() => {
    if (!googleApiKey || !open) return;

    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        const startTime = performance.now();
        
        if (window.google?.maps) {
          console.log('✅ Google Maps already loaded');
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          console.log('⏳ Waiting for existing script to load...');
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval);
              console.log('✅ Google Maps loaded from existing script');
              resolve();
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.google?.maps) {
              reject(new Error('Google Maps loading timeout'));
            }
          }, 10000);
          return;
        }

        console.log('📦 Loading Google Maps script...');
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          const loadTime = performance.now() - startTime;
          console.log(`✅ Google Maps script loaded successfully in ${loadTime.toFixed(0)}ms`);
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps script');
          reject(new Error('Failed to load Google Maps'));
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!window.google?.maps) {
            reject(new Error('Google Maps loading timeout'));
          }
        }, 10000);
        
        document.head.appendChild(script);
      });
    };

    loadGoogleMapsScript()
      .then(() => {
        console.log('✅ Setting mapLoaded to true');
        setMapLoaded(true);
      })
      .catch((error) => {
        console.error('❌ Error loading Google Maps:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger Google Maps. Veuillez réessayer.",
          variant: "destructive"
        });
        // Fallback: still allow sheet to function without map
        setMapLoaded(true);
      });
  }, [googleApiKey, open]);

  // Initialize Google Map
  useEffect(() => {
    console.log('📍 Map init check:', { open, mapLoaded, hasRef: !!mapRef.current, currentCoords, hasGoogle: !!window.google });
    
    if (!open || !mapLoaded || !mapRef.current || !currentCoords || !window.google?.maps) {
      return;
    }

    const timer = setTimeout(() => {
      if (!mapRef.current || !currentCoords) return;

      try {
        console.log('🗺️ Creating map with coords:', currentCoords);
        
        const newMap = new google.maps.Map(mapRef.current, {
          center: currentCoords,
          zoom: 16,
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

        console.log('📍 Creating marker at:', currentCoords);
        
        const marker = new google.maps.Marker({
          position: currentCoords,
          map: newMap,
          draggable: isEditing,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isEditing ? 14 : 12,
            fillColor: isEditing ? KWENDA_MARKER_COLORS.editing : KWENDA_MARKER_COLORS.normal,
            fillOpacity: 1,
            strokeColor: KWENDA_MARKER_COLORS.white,
            strokeWeight: isEditing ? 5 : 4
          }
        });

        // Handle marker drag with haptic feedback and animation
        marker.addListener('dragstart', () => {
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
          
          // Animate marker during drag
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: KWENDA_MARKER_COLORS.editing,
            fillOpacity: 0.7,
            strokeColor: KWENDA_MARKER_COLORS.white,
            strokeWeight: 6
          });
          
          toast({
            title: "📍 Repositionnement en cours",
            description: "Relâchez pour confirmer la nouvelle position",
            duration: 2000
          });
        });
        
        marker.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
          
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          
          // Validate new position
          const isValidLocation = newLat !== 0 || newLng !== 0;
          if (!isValidLocation) {
            toast({
              title: "⚠️ Position incorrecte",
              description: "Veuillez choisir une position valide sur la carte",
              variant: "destructive"
            });
            marker.setPosition(currentCoords);
            return;
          }
          
          setCurrentCoords({ lat: newLat, lng: newLng });

          // Show success with green marker temporarily
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: KWENDA_MARKER_COLORS.success,
            fillOpacity: 1,
            strokeColor: KWENDA_MARKER_COLORS.white,
            strokeWeight: 4
          });

          // Revert to normal red after 1 second
          setTimeout(() => {
            marker.setIcon({
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: KWENDA_MARKER_COLORS.normal,
              fillOpacity: 1,
              strokeColor: KWENDA_MARKER_COLORS.white,
              strokeWeight: 4
            });
          }, 1000);

          // Reverse geocode
          try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ 
              location: { lat: newLat, lng: newLng } 
            });
            
            if (response.results[0]) {
              setCurrentAddress(response.results[0].formatted_address);
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }
        });

        markerRef.current = marker;
        setMap(newMap);
        console.log('✅ Map and marker created successfully');
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        toast({
          title: "Erreur carte",
          description: "Impossible d'afficher la carte",
          variant: "destructive"
        });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [mapLoaded, currentCoords, open, isEditing]);

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
    if (!currentCoords || !isValidCoordinates(currentCoords)) {
      toast({
        title: "❌ Position invalide",
        description: "Impossible d'enregistrer une position non valide",
        variant: "destructive"
      });
      return;
    }
    
    const name = positionName.trim() || `Position ${savedPositions.length + 1}`;
    const newPosition = {
      name,
      address: currentAddress,
      coordinates: currentCoords
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
    setIsEditing(!isEditing);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (!isEditing) {
      toast({
        title: "📍 Mode édition activé",
        description: "Déplacez le marqueur sur la carte pour modifier votre position",
      });
      
      if (markerRef.current) {
        markerRef.current.setDraggable(true);
        markerRef.current.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: KWENDA_MARKER_COLORS.editing,
          fillOpacity: 1,
          strokeColor: KWENDA_MARKER_COLORS.white,
          strokeWeight: 5
        });
      }
    } else {
      if (markerRef.current) {
        markerRef.current.setDraggable(false);
        markerRef.current.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: KWENDA_MARKER_COLORS.normal,
          fillOpacity: 1,
          strokeColor: KWENDA_MARKER_COLORS.white,
          strokeWeight: 4
        });
      }
      
      toast({
        title: "✅ Position modifiée",
        description: "Nouvelle position enregistrée",
      });
    }
  };

  const handleDeletePosition = (index: number) => {
    const updated = savedPositions.filter((_, i) => i !== index);
    setSavedPositions(updated);
    localStorage.setItem('kwenda_saved_positions', JSON.stringify(updated));
    
    toast({
      title: "🗑️ Position supprimée",
      description: "La position a été retirée de vos favoris"
    });
  };

  const handleShareLocation = async () => {
    if (!currentCoords || !isValidCoordinates(currentCoords)) {
      toast({
        title: "❌ Partage impossible",
        description: "Aucune position valide à partager",
        variant: "destructive"
      });
      return;
    }

    const shareUrl = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
    const shareText = `📍 Ma position Kwenda\n${currentAddress}\n\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma position Kwenda',
          text: shareText
        });
        
        toast({
          title: "📤 Partagé avec succès",
          description: "Votre position a été partagée"
        });
      } catch (err) {
        // User cancelled or fallback to clipboard
        if (err instanceof Error && err.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareText);
          toast({
            title: "📋 Copié !",
            description: "Position copiée dans le presse-papiers"
          });
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(shareText);
      toast({
        title: "📋 Copié !",
        description: "Position copiée dans le presse-papiers"
      });
    }
  };

  const openInGoogleMaps = () => {
    if (currentCoords) {
      const url = `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`;
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
          <SheetHeader className="space-y-2 pb-4 border-b border-border/40">
            <div className="flex items-center gap-3 justify-center">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <MapPin className="h-5 w-5 text-primary" />
              </motion.div>
              <SheetTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                {isEditing ? 'Modifier la position' : 'Votre position'}
              </SheetTitle>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {isEditing ? 'Déplacez le marqueur sur la carte' : '📍 Détectée avec précision GPS'}
            </p>
          </SheetHeader>

          {/* Warning if no valid GPS */}
          {open && (!coordinates || !isValidCoordinates(coordinates)) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
            >
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ Position GPS non disponible. Activez la géolocalisation dans votre navigateur.
              </p>
            </motion.div>
          )}

          <div className="space-y-5">
            {/* Mini Map with Enhanced Design */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="relative"
            >
              <div className="relative w-full h-64 rounded-[32px] overflow-hidden bg-muted/20 border border-border/30 shadow-lg">
                <AnimatePresence mode="wait">
                  {!mapLoaded ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 flex items-center justify-center"
                    >
                      <div className="space-y-3 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 mx-auto"
                        >
                          <MapPin className="w-full h-full text-primary" />
                        </motion.div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Chargement de la carte...
                        </p>
                      </div>
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

                {/* GPS Status Badge */}
                {geolocation?.isRealGPS && geolocation?.accuracy && mapLoaded && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-3 left-3 bg-green-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg z-10"
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    GPS précis ({Math.round(geolocation.accuracy)}m)
                  </motion.div>
                )}

                {/* Open in Google Maps Button */}
                {mapLoaded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-3 right-3"
                  >
                    <Button
                      size="sm"
                      onClick={openInGoogleMaps}
                      className="h-8 gap-1.5 bg-background/80 backdrop-blur-md border border-border/40 shadow-md hover:shadow-lg transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Google Maps</span>
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
              className="relative overflow-hidden rounded-[20px] bg-muted/30 border border-border/30 p-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    {isEditing ? 'Nouvelle adresse' : 'Adresse actuelle'}
                  </p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">{currentAddress}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Navigation className="h-3 w-3 text-green-600" />
                    <span className="text-[10px] text-green-600 font-medium">
                      {isEditing ? 'Déplacez le marqueur' : 'Position GPS précise'}
                    </span>
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
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-primary/20">
                    <p className="text-sm font-semibold text-foreground">Nom de la position (optionnel)</p>
                    <Input
                      placeholder="Ex: Maison, Bureau, Arrêt de bus..."
                      value={positionName}
                      onChange={(e) => setPositionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmSaveLocation()}
                      className="h-11"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={confirmSaveLocation}
                        className="flex-1 gap-2 h-10"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
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
                  className="w-full justify-start gap-3 h-12 hover:bg-accent/50 active:scale-[0.98] transition-all"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    handleSaveLocation();
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold">Enregistrer ma position</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant={isEditing ? "default" : "outline"}
                  className="w-full justify-start gap-3 h-12 hover:bg-accent/50 active:scale-[0.98] transition-all"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    handleEditLocation();
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Edit3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold">
                    {isEditing ? '✅ Confirmer la position' : 'Modifier ma position'}
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
                  className="w-full justify-start gap-3 h-12 hover:bg-accent/50 active:scale-[0.98] transition-all"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    handleShareLocation();
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Share2 className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold">Partager la position</span>
                </Button>
              </motion.div>
            </div>

            {/* Saved Positions List */}
            {savedPositions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3 pt-4 border-t border-border"
              >
                <p className="text-sm font-semibold text-foreground">Positions enregistrées ({savedPositions.length}/10)</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedPositions.map((pos, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group"
                    >
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{pos.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{pos.address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePosition(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
