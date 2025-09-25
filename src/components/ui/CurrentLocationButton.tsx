/**
 * 🎯 BOUTON DE GÉOLOCALISATION MODERNE ET PROFESSIONNEL
 * 
 * Composant unifié pour tous les services (taxi, livraison, etc.)
 * Design moderne avec animations fluides et feedback instantané
 */

import React, { useState } from 'react';
import { Crosshair, Navigation, CheckCircle, AlertCircle, Loader2, Target } from 'lucide-react';
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
      // Options optimisées pour précision maximale
      const location = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Plus de temps pour l'Afrique
        maximumAge: 30000, // Position plus récente
        fallbackToIP: true,
        fallbackToDatabase: false // Éviter les positions imprécises de la DB
      });
      
      // Valider la précision avant d'accepter
      if (location.accuracy && location.accuracy > 500) {
        console.warn('Position peu précise:', location.accuracy, 'm');
        // Retry une fois avec des paramètres plus stricts
        try {
          const retryLocation = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0 // Force une nouvelle position
          });
          if (retryLocation.accuracy && retryLocation.accuracy < location.accuracy) {
            setLastAccuracy(retryLocation.accuracy || null);
            setLocalState('success');
            onLocationSelect?.(retryLocation);
            setTimeout(() => setLocalState('idle'), 2500);
            return;
          }
        } catch {
          // Continue avec la position originale si retry échoue
        }
      }
      
      setLastAccuracy(location.accuracy || null);
      setLocalState('success');
      
      // Callback avec la position
      onLocationSelect?.(location);
      
      // Reset state après 2.5 secondes
      setTimeout(() => setLocalState('idle'), 2500);
      
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
        return <Target className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Crosshair className="h-4 w-4 text-primary" />;
    }
  };

  const getPrecisionBadge = () => {
    if (!lastAccuracy || localState !== 'success') return null;
    
    const accuracy = Math.round(lastAccuracy);
    let color = 'text-green-500';
    let label = 'Excellent';
    
    if (accuracy > 200) {
      color = 'text-destructive';
      label = 'Faible';
    } else if (accuracy > 50) {
      color = 'text-yellow-500';
      label = 'Bon';
    }
    
    return (
      <span className={`text-xs ${color} font-medium`}>
        ±{accuracy}m ({label})
      </span>
    );
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
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 25px hsl(var(--primary) / 0.6)",
              rotate: 5
            }}
            whileTap={{ 
              scale: 0.9,
              rotate: -5
            }}
            animate={{
              boxShadow: localState === 'loading' 
                ? "0 0 20px hsl(var(--primary) / 0.9)" 
                : localState === 'success'
                ? "0 0 30px hsl(var(--success) / 0.8)"
                : "0 0 5px hsl(var(--primary) / 0.3)",
              rotate: localState === 'loading' ? [0, 5, -5, 0] : 0
            }}
            transition={{
              rotate: localState === 'loading' 
                ? { repeat: Infinity, duration: 1, ease: "easeInOut" }
                : { duration: 0.2 }
            }}
          >
            <Button
              onClick={handleGetLocation}
              disabled={disabled || loading}
              variant={getButtonVariant()}
              size={getButtonSize()}
              className={cn(
                'relative transition-all duration-300 overflow-hidden',
                // Animation de pulsation modernisée en mode loading
                localState === 'loading' && 'animate-pulse shadow-lg shadow-primary/25',
                // Glow effect moderne pour success
                localState === 'success' && 'shadow-lg shadow-green-500/30 bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
                // Style d'erreur moderne
                localState === 'error' && 'shadow-lg shadow-destructive/20 bg-destructive/5 text-destructive border-destructive/30 hover:bg-destructive/10',
                // État par défaut avec glow subtil
                localState === 'idle' && 'shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50',
                className
              )}
            >
              {/* Effet de background animé */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ 
                  x: localState === 'loading' ? '100%' : '-100%'
                }}
                transition={{ 
                  duration: 1,
                  repeat: localState === 'loading' ? Infinity : 0,
                  ease: 'linear'
                }}
              />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={localState}
                  initial={{ opacity: 0, scale: 0.7, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 180 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20,
                    duration: 0.3
                  }}
                  className="relative z-10"
                >
                  {getButtonContent()}
                </motion.div>
              </AnimatePresence>

              {/* Particules de succès améliorées */}
              {localState === 'success' && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-success/80 rounded-full"
                      initial={{
                        x: "50%",
                        y: "50%",
                        scale: 0,
                        opacity: 1
                      }}
                      animate={{
                        x: `${50 + (Math.cos((i * 45) * Math.PI / 180) * 50)}%`,
                        y: `${50 + (Math.sin((i * 45) * Math.PI / 180) * 50)}%`,
                        scale: [0, 1.5, 0],
                        opacity: [1, 0.8, 0]
                      }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.08,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                  {/* Effet de pulsation centrale */}
                  <motion.div
                    className="absolute inset-1 bg-success/20 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.5, 0],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeOut"
                    }}
                  />
                </div>
              )}

              {/* Effet de vibration pour les erreurs */}
              {localState === 'error' && (
                <motion.div
                  className="absolute inset-0 bg-destructive/20 rounded-full"
                  initial={{ scale: 1 }}
                  animate={{ 
                    x: [-2, 2, -2, 2, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{contextTooltips[context]}</p>
            
            {/* Indicateur de précision */}
            {getPrecisionBadge() && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Précision:</span>
                {getPrecisionBadge()}
              </div>
            )}
            
            {/* Messages d'état */}
            {localState === 'loading' && (
              <p className="text-xs text-primary font-medium">
                🎯 Recherche de votre position...
              </p>
            )}
            
            {localState === 'success' && lastAccuracy && (
              <p className="text-xs text-green-600">
                ✅ Position trouvée avec succès
              </p>
            )}
            
            {error && (
              <div className="space-y-1">
                <p className="text-xs text-destructive font-medium">
                  ❌ {typeof error === 'string' ? error : 'Erreur de géolocalisation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vérifiez vos paramètres GPS et réessayez
                </p>
              </div>
            )}
            
            {currentLocation && localState === 'idle' && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Dernière position:</p>
                <p className="text-xs font-mono bg-muted/50 p-1 rounded text-foreground">
                  {currentLocation.address}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrentLocationButton;