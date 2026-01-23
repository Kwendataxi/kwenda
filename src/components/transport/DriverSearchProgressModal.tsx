import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Car, CheckCircle2, Star, ArrowRight, MapPin, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchProgress {
  radius: number;
  driversFound: number;
  status: 'idle' | 'searching' | 'found' | 'failed';
}

interface AssignedDriver {
  driver_id: string;
  distance_km: number;
  score: number;
  driver_name?: string;
  driver_avatar?: string;
  rating_average?: number;
  total_rides?: number;
}

interface DriverSearchProgressModalProps {
  isSearching: boolean;
  searchProgress: SearchProgress;
  assignedDriver: AssignedDriver | null;
  bookingId?: string | null;
  onClose?: () => void;
}

export default function DriverSearchProgressModal({
  isSearching,
  searchProgress,
  assignedDriver,
  bookingId,
  onClose
}: DriverSearchProgressModalProps) {
  const navigate = useNavigate();

  const handleTrackDriver = () => {
    if (bookingId) {
      navigate(`/app/transport/track/${bookingId}`);
      onClose?.();
    }
  };

  const handleRetry = () => {
    onClose?.();
  };

  return (
    <Dialog open={isSearching || searchProgress.status === 'found' || searchProgress.status === 'failed'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 gap-0">
        <AnimatePresence mode="wait">
          {/* État 1: Recherche en cours */}
          {searchProgress.status === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Animation radar circulaire */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.8, 1],
                    opacity: [0.6, 0, 0.6]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-primary/30"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 0, 0.4]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    delay: 0.3,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-primary/20"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full">
                  <Car className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-2">
                Recherche de chauffeur...
              </h3>
              <p className="text-sm text-center text-muted-foreground mb-6">
                Nous recherchons le meilleur chauffeur pour vous
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rayon de recherche</span>
                  <span className="font-semibold">{searchProgress.radius} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chauffeurs trouvés</span>
                  <span className="font-semibold">{searchProgress.driversFound}</span>
                </div>
              </div>
              
              <Progress value={33} className="h-2" />
            </motion.div>
          )}

          {/* État 2: Chauffeur trouvé */}
          {searchProgress.status === 'found' && assignedDriver && (
            <motion.div
              key="found"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
                className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-center mb-2">
                Chauffeur trouvé !
              </h3>
              <p className="text-sm text-center text-muted-foreground mb-6">
                Votre chauffeur a été assigné avec succès
              </p>
              
              {/* Afficher infos chauffeur */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={assignedDriver.driver_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {assignedDriver.driver_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {assignedDriver.driver_name || 'Chauffeur'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {assignedDriver.rating_average?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        • {assignedDriver.total_rides || 0} courses
                      </span>
                    </div>
                  </div>
                </div>

                {assignedDriver.distance_km > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-background rounded-lg p-2 text-center">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold">{assignedDriver.distance_km.toFixed(1)} km</p>
                    </div>
                    <div className="bg-background rounded-lg p-2 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Arrivée</p>
                      <p className="text-sm font-semibold">~{Math.ceil(assignedDriver.distance_km * 3)} min</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                size="lg" 
                className="w-full h-12 text-base font-semibold"
                onClick={handleTrackDriver}
              >
                Suivre le chauffeur
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* État 3: Aucun chauffeur trouvé */}
          {searchProgress.status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-6">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              
              <h3 className="text-2xl font-bold text-center mb-2">
                Aucun chauffeur disponible
              </h3>
              <p className="text-sm text-center text-muted-foreground mb-6">
                Tous les chauffeurs sont actuellement occupés. Veuillez réessayer dans quelques instants.
              </p>
              
              <div className="space-y-2">
                <Button 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleRetry}
                >
                  Réessayer
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={onClose}
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
