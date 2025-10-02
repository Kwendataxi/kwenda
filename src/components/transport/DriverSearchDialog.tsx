import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Car, CheckCircle, AlertCircle, X } from 'lucide-react';

interface DriverSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchStatus: 'searching' | 'analyzing' | 'selecting' | 'found' | 'error';
  driversFound?: number;
  searchRadius?: number;
  onRetry?: () => void;
  onExpandRadius?: () => void;
}

const encouragementMessages = [
  "Patience, nous trouvons le meilleur chauffeur...",
  "Analyse des chauffeurs disponibles...",
  "Vérification de la distance et disponibilité...",
  "Presque terminé...",
];

const statusMessages = {
  searching: "Recherche en cours",
  analyzing: "Analyse des chauffeurs",
  selecting: "Sélection du meilleur",
  found: "Chauffeur trouvé !",
  error: "Aucun chauffeur disponible"
};

export default function DriverSearchDialog({
  isOpen,
  onClose,
  searchStatus,
  driversFound = 0,
  searchRadius = 3,
  onRetry,
  onExpandRadius
}: DriverSearchDialogProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Message rotation
  useEffect(() => {
    if (searchStatus === 'error' || searchStatus === 'found') return;
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % encouragementMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [searchStatus]);

  // Progress bar update
  useEffect(() => {
    if (searchStatus === 'error' || searchStatus === 'found') {
      setProgress(100);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 10;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [searchStatus]);

  const renderSearchAnimation = () => {
    if (searchStatus === 'found') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              rotate: { duration: 0.6, ease: "easeOut" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 bg-gradient-to-br from-congo-green to-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_hsl(var(--congo-green)/0.4)]"
          >
            <CheckCircle className="h-10 w-10 text-white" />
          </motion.div>
        </motion.div>
      );
    }

    if (searchStatus === 'error') {
      return (
        <div className="relative h-28 mb-8 flex items-center justify-center">
          {/* Alert ripples */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-24 h-24 rounded-full border-2 border-congo-red/40"
              animate={{
                scale: [1, 2],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut"
              }}
            />
          ))}

          {/* Falling particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-congo-red/60 rounded-full"
              initial={{
                x: (Math.random() - 0.5) * 60,
                y: -20,
                opacity: 0.8
              }}
              animate={{
                y: 40,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeIn"
              }}
            />
          ))}

          {/* Car with diagonal bar (barred car effect) */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: 1,
              rotate: [0, -5, 5, -5, 0]
            }}
            transition={{ 
              scale: { duration: 0.4, type: "spring", stiffness: 200 },
              rotate: { duration: 0.5, delay: 0.4 }
            }}
            className="relative z-10"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-congo-red/20 to-red-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-[0_0_30px_hsl(var(--congo-red)/0.3)] border border-congo-red/30">
              {/* Car icon */}
              <Car className="h-10 w-10 text-congo-red/70" />
              
              {/* Diagonal bar (prohibition symbol) */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-[110%] h-1 bg-congo-red rotate-45 shadow-lg" />
              </motion.div>

              {/* Alert badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8, type: "spring" }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-congo-red rounded-full flex items-center justify-center shadow-lg border-2 border-background"
              >
                <span className="text-white text-xs font-bold">!</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      );
    }

    // Searching animation - Enhanced radar with orbiting points
    return (
      <div className="relative h-28 mb-8 flex items-center justify-center">
        {/* 3 radar circles with improved undulations */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-20 h-20 rounded-full border border-congo-red/30"
            style={{ willChange: 'transform, opacity' }}
            animate={{
              scale: [1, 1.8],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        ))}

        {/* Orbiting luminous points */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute w-2 h-2 bg-congo-yellow rounded-full shadow-[0_0_8px_hsl(var(--congo-yellow)/0.8)]"
            style={{ willChange: 'transform' }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1,
              ease: "linear"
            }}
          >
            <motion.div
              className="w-full h-full"
              style={{
                transformOrigin: '50% 50%',
                transform: `translateX(${35 + i * 5}px)`
              }}
            />
          </motion.div>
        ))}

        {/* Center icon - larger with enhanced glow */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ willChange: 'transform' }}
          className="w-20 h-20 bg-gradient-to-br from-congo-red via-congo-yellow to-congo-red rounded-full flex items-center justify-center shadow-[0_0_35px_hsl(var(--congo-red)/0.5),0_0_60px_hsl(var(--congo-yellow)/0.3)] z-10 border-2 border-white/20"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Search className="h-10 w-10 text-white drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Subtle moving car indicator */}
        <motion.div
          className="absolute"
          animate={{
            x: [-30, 30],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            x: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <Car className="h-6 w-6 text-congo-yellow/90 drop-shadow" />
        </motion.div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-congo-red/5 border-congo-red/10">
        <div className="py-4">
          {renderSearchAnimation()}

          {/* Status message */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={searchStatus}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold text-center mb-4 text-foreground"
            >
              {statusMessages[searchStatus]}
            </motion.h2>
          </AnimatePresence>

          {/* Simplified progress bar */}
          {searchStatus !== 'found' && searchStatus !== 'error' && (
            <div className="mb-6 px-2">
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-congo-red via-congo-yellow to-congo-red rounded-full"
                  animate={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Compact stats */}
          {searchStatus !== 'found' && searchStatus !== 'error' && (
            <div className="flex justify-center gap-6 mb-5 text-sm">
              <motion.div 
                className="flex items-center gap-1.5"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Car className="h-4 w-4 text-congo-red" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{driversFound || 0}</span> trouvés
                </span>
              </motion.div>
            </div>
          )}

          {/* Encouragement message with smooth transition */}
          {searchStatus !== 'found' && searchStatus !== 'error' && (
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="text-center text-muted-foreground text-sm px-6"
              >
                {encouragementMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          )}

          {/* Success message */}
          {searchStatus === 'found' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-2"
            >
              <p className="text-lg font-semibold text-congo-green">
                Parfait !
              </p>
              <p className="text-muted-foreground text-sm px-4">
                Votre chauffeur arrive bientôt
              </p>
            </motion.div>
          )}

          {/* Error actions - cleaner layout */}
          {searchStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2 mb-6">
                <p className="text-base font-medium text-foreground">
                  Aucun chauffeur disponible
                </p>
                <p className="text-sm text-muted-foreground px-4">
                  Tous nos chauffeurs sont occupés
                </p>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {onExpandRadius && (
                  <Button 
                    onClick={onExpandRadius}
                    className="w-full bg-gradient-to-r from-congo-red to-congo-yellow hover:opacity-90 transition-opacity"
                  >
                    Élargir la recherche (+5km)
                  </Button>
                )}
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    variant="outline"
                    className="w-full border-congo-red/20 hover:bg-congo-red/5"
                  >
                    Réessayer
                  </Button>
                )}
                <Button 
                  onClick={onClose}
                  variant="ghost"
                  className="w-full hover:bg-secondary/50"
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          )}

          {/* Loading state cancel button */}
          {searchStatus !== 'found' && searchStatus !== 'error' && (
            <div className="mt-6">
              <Button 
                onClick={onClose}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
