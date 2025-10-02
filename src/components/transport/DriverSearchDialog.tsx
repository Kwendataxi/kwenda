import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchStatus: 'searching' | 'analyzing' | 'selecting' | 'found' | 'error';
  driversFound?: number;
  searchRadius?: number;
  elapsedTime?: number;
  estimatedTime?: number;
  onRetry?: () => void;
  onExpandRadius?: () => void;
}

const encouragementMessages = [
  "Patience, nous trouvons le meilleur chauffeur pour vous...",
  "Nos algorithmes analysent les chauffeurs disponibles...",
  "Sélection basée sur la distance, les avis et la disponibilité...",
  "Presque terminé, encore quelques secondes...",
  "Votre chauffeur arrive bientôt !"
];

const statusMessages = {
  searching: "🔍 Recherche en cours...",
  analyzing: "📡 Analyse des chauffeurs disponibles...",
  selecting: "🎯 Sélection du meilleur chauffeur...",
  found: "✅ Chauffeur trouvé !",
  error: "❌ Aucun chauffeur disponible"
};

export default function DriverSearchDialog({
  isOpen,
  onClose,
  searchStatus,
  driversFound = 0,
  searchRadius = 3,
  elapsedTime = 0,
  estimatedTime = 10,
  onRetry,
  onExpandRadius
}: DriverSearchDialogProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotation des messages encourageants
  useEffect(() => {
    if (searchStatus === 'error' || searchStatus === 'found') return;
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % encouragementMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [searchStatus]);

  // Mise à jour de la progress bar
  useEffect(() => {
    if (searchStatus === 'error' || searchStatus === 'found') {
      setProgress(100);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / estimatedTime);
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [searchStatus, estimatedTime]);


  const renderSearchAnimation = () => {
    if (searchStatus === 'found') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px hsl(var(--congo-green) / 0.3)',
                  '0 0 40px hsl(var(--congo-green) / 0.6)',
                  '0 0 20px hsl(var(--congo-green) / 0.3)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="p-6 rounded-full bg-congo-green"
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <p className="text-xl font-semibold text-congo-green">Chauffeur trouvé !</p>
        </motion.div>
      );
    }

    if (searchStatus === 'error') {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, x: [0, -10, 10, -10, 10, 0] }}
          transition={{ 
            scale: { type: "spring", stiffness: 200 },
            x: { duration: 0.5, delay: 0.2 }
          }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="p-6 rounded-full bg-destructive/10">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <p className="text-xl font-semibold text-destructive">Aucun chauffeur disponible</p>
        </motion.div>
      );
    }

    return (
      <div className="relative w-full h-64 flex items-center justify-center">
        {/* Radar circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0.1, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className={cn(
                "absolute rounded-full border-2",
                "border-congo-red/30 w-40 h-40"
              )}
            />
          ))}
        </div>

        {/* Center icon with glow */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px hsl(var(--congo-red) / 0.3), 0 0 30px hsl(var(--congo-yellow) / 0.2)',
              '0 0 40px hsl(var(--congo-red) / 0.5), 0 0 60px hsl(var(--congo-yellow) / 0.4)',
              '0 0 20px hsl(var(--congo-red) / 0.3), 0 0 30px hsl(var(--congo-yellow) / 0.2)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-10 p-6 rounded-full bg-gradient-to-br from-congo-red to-congo-yellow"
        >
          <Search className="h-8 w-8 text-white" />
        </motion.div>

        {/* Animated car */}
        <motion.div
          animate={{
            x: [-30, 30],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <Car className="h-8 w-8 text-congo-red" />
        </motion.div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={searchStatus !== 'found' ? onClose : undefined}>
      <DialogContent className="sm:max-w-md overflow-hidden border-congo-red/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {statusMessages[searchStatus]}
            </DialogTitle>
            {searchStatus !== 'error' && searchStatus !== 'found' && (
              <DialogDescription className="text-center pt-2">
                {driversFound > 0 && (
                  <span className="text-congo-red font-medium">
                    {driversFound} chauffeur{driversFound > 1 ? 's' : ''} analysé{driversFound > 1 ? 's' : ''}
                  </span>
                )}
                {searchRadius > 0 && driversFound > 0 && ' • '}
                {searchRadius > 0 && (
                  <span className="text-muted-foreground">
                    Rayon: {searchRadius} km
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-6">
            {renderSearchAnimation()}
          </div>

          {/* Progress bar */}
          {searchStatus !== 'error' && searchStatus !== 'found' && (
            <div className="space-y-2">
              <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-congo-red via-congo-yellow to-congo-green rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}%</span>
                <span>{elapsedTime}s / {estimatedTime}s</span>
              </div>
            </div>
          )}

          {/* Encouragement message */}
          {searchStatus !== 'error' && searchStatus !== 'found' && (
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center text-sm text-muted-foreground mt-4"
              >
                {encouragementMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          )}

          {/* Error actions */}
          {searchStatus === 'error' && (
            <div className="flex flex-col gap-2 mt-6">
              {onExpandRadius && (
                <Button
                  onClick={onExpandRadius}
                  variant="outline"
                  className="w-full border-congo-yellow text-congo-red hover:bg-congo-yellow/10"
                >
                  Élargir la zone de recherche (+5km)
                </Button>
              )}
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full bg-gradient-to-r from-congo-red to-congo-yellow text-white"
                >
                  Réessayer
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
