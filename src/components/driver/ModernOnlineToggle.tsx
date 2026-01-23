/**
 * 🟢 PHASE 2: Toggle Online/Offline Moderne
 * Gros bouton visible style Uber/Yango Driver
 * Feedback haptique + animation confetti + force GPS
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Power, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface ModernOnlineToggleProps {
  className?: string;
}

export const ModernOnlineToggle: React.FC<ModernOnlineToggleProps> = ({ className }) => {
  const { status, loading, goOnline, goOffline } = useDriverStatus();
  const { location, getCurrentPosition, loading: gpsLoading } = useDriverGeolocation({ autoSync: false });
  const [updating, setUpdating] = useState(false);
  const [onlineTime, setOnlineTime] = useState<Date | null>(null);

  // Calculer durée en ligne
  const getOnlineDuration = () => {
    if (!onlineTime || !status.isOnline) return null;
    const diff = Date.now() - onlineTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const handleToggle = async () => {
    setUpdating(true);
    
    try {
      if (!status.isOnline) {
        // ✅ PASSER EN LIGNE - Force GPS d'abord
        toast.loading('Activation du GPS...');
        
        let currentLocation = location;
        try {
          currentLocation = await getCurrentPosition();
          toast.dismiss();
        } catch (err) {
          toast.dismiss();
          toast.error('GPS requis pour passer en ligne', {
            description: 'Veuillez activer votre localisation',
            duration: 4000
          });
          setUpdating(false);
          return;
        }

        if (!currentLocation) {
          toast.error('Position GPS introuvable');
          setUpdating(false);
          return;
        }

        // Passer en ligne
        const success = await goOnline(currentLocation.latitude, currentLocation.longitude);
        
        if (success) {
          // 🎉 Animation confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#6EE7B7']
          });
          
          // Haptic feedback (si disponible)
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          
          setOnlineTime(new Date());
        }
      } else {
        // ⏸️ PASSER HORS LIGNE
        const success = await goOffline();
        if (success) {
          setOnlineTime(null);
          
          // Haptic doux
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  const isLoading = loading || updating || gpsLoading;
  const duration = getOnlineDuration();

  return (
    <div className={cn("w-full", className)}>
      {/* Gros bouton principal */}
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "w-full h-16 text-xl font-bold shadow-2xl transition-all duration-300 relative overflow-hidden",
          status.isOnline 
            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
            : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white"
        )}
      >
        {/* Animation de fond pulsante quand en ligne */}
        {status.isOnline && (
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
        )}
        
        <div className="relative flex items-center justify-center gap-3">
          {status.isOnline ? (
            <>
              <Wifi className="h-8 w-8 animate-pulse" />
              <span>EN LIGNE - Prêt à recevoir</span>
            </>
          ) : (
            <>
              <Power className="h-8 w-8" />
              <span>HORS LIGNE - Appuyez pour vous connecter</span>
            </>
          )}
        </div>
      </Button>

      {/* Badge durée en ligne */}
      {status.isOnline && duration && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            En ligne depuis {duration}
          </Badge>
        </div>
      )}

      {/* Indicateur GPS */}
      {status.isOnline && (
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location ? (
            <span className="text-green-600 font-medium">GPS actif</span>
          ) : (
            <span className="text-yellow-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              GPS en attente...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
