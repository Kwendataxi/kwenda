/**
 * 🧭 Hub de Navigation GPS Intégré pour Chauffeurs/Livreurs
 * Navigation turn-by-turn + Instructions vocales + Tracking temps réel
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  Phone, 
  X, 
  Volume2, 
  VolumeX,
  MapPin,
  Clock,
  Route,
  AlertTriangle
} from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { navigationService } from '@/services/navigationService';
import { toast } from 'sonner';

interface DriverNavigationHubProps {
  orderId: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  customerPhone?: string;
  onClose: () => void;
  onArrival: () => void;
}

export default function DriverNavigationHub({
  orderId,
  pickup,
  destination,
  customerPhone,
  onClose,
  onArrival
}: DriverNavigationHubProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [navigationData, setNavigationData] = useState<{
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
    currentInstruction: string;
  } | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);

  useEffect(() => {
    startNavigation();
    return () => {
      navigationService.stopNavigation();
    };
  }, []);

  const startNavigation = async () => {
    try {
      setIsNavigating(true);
      
      // Démarrer la navigation avec le service
      const result = await navigationService.startNavigation(
        pickup,
        destination,
        {
          voiceEnabled,
          onLocationUpdate: (location) => {
            setCurrentLocation(location);
          },
          onInstructionChange: (instruction) => {
            setNavigationData(prev => prev ? { ...prev, currentInstruction: instruction } : null);
            if (voiceEnabled) {
              navigationService.speakInstruction(instruction);
            }
          },
          onOffRoute: () => {
            setIsOffRoute(true);
            toast.error('Vous êtes hors de l\'itinéraire', {
              description: 'Recalcul en cours...'
            });
          },
          onRouteRecalculated: () => {
            setIsOffRoute(false);
            toast.success('Nouvel itinéraire calculé');
          }
        }
      );

      if (result) {
        setNavigationData({
          distance: result.distance,
          duration: result.duration,
          distanceText: result.distanceText,
          durationText: result.durationText,
          currentInstruction: result.steps[0]?.instruction || 'Démarrage de la navigation'
        });
      }
    } catch (error) {
      console.error('Error starting navigation:', error);
      toast.error('Erreur lors du démarrage de la navigation');
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    navigationService.setVoiceEnabled(!voiceEnabled);
    toast.success(voiceEnabled ? 'Instructions vocales désactivées' : 'Instructions vocales activées');
  };

  const handleCallCustomer = () => {
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
    }
  };

  const handleConfirmArrival = () => {
    navigationService.stopNavigation();
    onArrival();
    toast.success('Arrivée confirmée !');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header avec instructions */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            <h1 className="text-lg font-bold">Navigation GPS</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleVoice}
              className="text-primary-foreground hover:bg-white/20"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-primary-foreground hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Instruction en cours */}
        {navigationData && (
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Route className="h-5 w-5 text-white mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {navigationData.currentInstruction}
                  </p>
                  {isOffRoute && (
                    <div className="flex items-center gap-1 mt-1 text-yellow-300">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">Recalcul de l'itinéraire...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Infos distance/temps */}
        {navigationData && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-white" />
                <div>
                  <p className="text-xs text-white/70">Distance</p>
                  <p className="text-sm font-bold text-white">{navigationData.distanceText}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white" />
                <div>
                  <p className="text-xs text-white/70">Temps estimé</p>
                  <p className="text-sm font-bold text-white">{navigationData.durationText}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Carte plein écran */}
      <div className="flex-1 relative">
        <GoogleMapsKwenda
          pickup={pickup}
          destination={destination}
          driverLocation={currentLocation ? {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            heading: null
          } : undefined}
          showRoute={true}
          height="100%"
          zoom={16}
        />
      </div>

      {/* Actions footer */}
      <div className="bg-background border-t border-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {customerPhone && (
            <Button
              onClick={handleCallCustomer}
              variant="outline"
              className="h-12"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler client
            </Button>
          )}
          <Button
            onClick={handleConfirmArrival}
            className="h-12 bg-green-600 hover:bg-green-700 text-white"
          >
              Confirmer arrivée
            </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            Commande #{orderId.slice(-8)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
