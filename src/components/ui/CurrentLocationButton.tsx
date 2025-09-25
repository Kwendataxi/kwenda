/**
 * 🎯 BOUTON DE GÉOLOCALISATION MODERNE ET PROFESSIONNEL
 * 
 * Composant unifié pour tous les services (taxi, livraison, etc.)
 * Design moderne avec animations fluides et feedback instantané
 */

import React, { useState } from 'react';
import { Crosshair, Navigation, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSmartGeolocation, type LocationData } from '@/hooks/useSmartGeolocation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface CurrentLocationButtonProps {
  onLocationSelect?: (location: LocationData) => void;
  context?: 'pickup' | 'delivery' | 'taxi-start' | 'taxi-destination' | 'general';
  variant?: 'default' | 'compact' | 'mini' | 'icon-only';
  className?: string;
  disabled?: boolean;
  showAccuracy?: boolean;
  autoTrigger?: boolean;
}

const contextLabels = {
  'pickup': 'Me géolocaliser',
  'delivery': 'Livrer ici', 
  'taxi-start': 'Départ ici',
  'taxi-destination': 'Destination ici',
  'general': 'Position actuelle'
};

const contextTooltips = {
  'pickup': 'Utiliser ma position actuelle comme point de collecte',
  'delivery': 'Utiliser ma position actuelle comme adresse de livraison',
  'taxi-start': 'Utiliser ma position actuelle comme point de départ',
  'taxi-destination': 'Utiliser ma position actuelle comme destination',
  'general': 'Obtenir ma position actuelle'
};

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationSelect,
  context = 'general',
  variant = 'default',
  className,
  disabled = false,
  showAccuracy = true,
  autoTrigger = false
}) => {
  const { getCurrentPosition, loading, error, currentLocation } = useSmartGeolocation();
  const [localState, setLocalState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  // Auto-trigger si demandé
  React.useEffect(() => {
    if (autoTrigger && !currentLocation && !loading) {
      handleGetLocation();
    }
  }, [autoTrigger, currentLocation, loading]);

  const handleGetLocation = async () => {
    if (disabled || loading) return;

    setLocalState('loading');
    
    try {
      const location = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      
      setLastAccuracy(location.accuracy || null);
      setLocalState('success');
      
      // Callback avec la position
      onLocationSelect?.(location);
      
      // Reset state après 2 secondes
      setTimeout(() => setLocalState('idle'), 2000);
      
    } catch (err) {
      console.error('Erreur géolocalisation:', err);
      setLocalState('error');
      
      // Reset error après 3 secondes
      setTimeout(() => setLocalState('idle'), 3000);
    }
  };

  const getIcon = () => {
    switch (localState) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Crosshair className="h-4 w-4" />;
    }
  };

  const getButtonContent = () => {
    if (variant === 'icon-only' || variant === 'mini') {
      return getIcon();
    }

    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium">
            {localState === 'loading' ? 'Localisation...' : 
             localState === 'success' ? 'Trouvé !' :
             localState === 'error' ? 'Erreur' :
             'GPS'}
          </span>
        </div>
      );
    }

    // Variant default
    return (
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {localState === 'loading' ? 'Géolocalisation...' : 
             localState === 'success' ? 'Position trouvée !' :
             localState === 'error' ? 'Erreur de localisation' :
             contextLabels[context]}
          </span>
          {showAccuracy && lastAccuracy && localState === 'success' && (
            <span className="text-xs text-muted-foreground">
              Précision ±{Math.round(lastAccuracy)}m
            </span>
          )}
        </div>
      </div>
    );
  };

  const getButtonVariant = () => {
    switch (localState) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getButtonSize = () => {
    switch (variant) {
      case 'mini':
        return 'sm';
      case 'icon-only':
        return 'icon';
      default:
        return 'default';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              onClick={handleGetLocation}
              disabled={disabled || loading}
              variant={getButtonVariant()}
              size={getButtonSize()}
              className={cn(
                'relative transition-all duration-200',
                // Animations de pulsation en mode loading
                localState === 'loading' && 'animate-pulse',
                // Glow effect pour success
                localState === 'success' && 'shadow-glow bg-success text-success-foreground border-success',
                // Style d'erreur
                localState === 'error' && 'bg-destructive/10 text-destructive border-destructive/20',
                // Hover effects
                'hover:shadow-md hover:border-primary/40',
                className
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={localState}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {getButtonContent()}
                </motion.div>
              </AnimatePresence>
            </Button>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{contextTooltips[context]}</p>
            {error && (
              <p className="text-xs text-destructive">
                {typeof error === 'string' ? error : 'Erreur de géolocalisation'}
              </p>
            )}
            {currentLocation && (
              <p className="text-xs text-muted-foreground">
                Dernière position: {currentLocation.address}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrentLocationButton;