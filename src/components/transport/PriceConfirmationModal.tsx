import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Target, Route, Clock, Search, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Car, Bike, Crown } from 'lucide-react';
import { useState } from 'react';

interface PriceConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleType: string;
  pickup: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  distance: number;
  duration: number;
  calculatedPrice: number;
  onConfirm: () => void;
  onBack: () => void;
}

const VEHICLE_CONFIG: Record<string, { name: string; icon: any; gradient: string }> = {
  'taxi_moto': { name: 'Moto-taxi', icon: Bike, gradient: 'from-amber-500 via-yellow-500 to-amber-600' },
  'taxi_eco': { name: 'Éco', icon: Car, gradient: 'from-green-500 via-emerald-500 to-green-600' },
  'taxi_confort': { name: 'Confort', icon: Car, gradient: 'from-blue-500 via-sky-500 to-blue-600' },
  'taxi_premium': { name: 'Premium', icon: Crown, gradient: 'from-purple-500 via-violet-500 to-purple-600' }
};

export default function PriceConfirmationModal({
  open,
  onOpenChange,
  vehicleType,
  pickup,
  destination,
  distance,
  duration,
  calculatedPrice,
  onConfirm,
  onBack
}: PriceConfirmationModalProps) {
  const [isSearching, setIsSearching] = useState(false);

  const vehicle = VEHICLE_CONFIG[vehicleType] || VEHICLE_CONFIG['taxi_eco'];
  const VehicleIcon = vehicle.icon;

  const handleConfirm = async () => {
    setIsSearching(true);
    try {
      await onConfirm();
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 bg-transparent shadow-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-background via-background/95 to-primary/5 rounded-3xl p-6 shadow-2xl border border-border/50"
        >
          {/* Header avec icône véhicule */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 20 }}
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${vehicle.gradient} flex items-center justify-center shadow-xl`}
            >
              <VehicleIcon className="w-12 h-12 text-white" />
            </motion.div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
            {vehicle.name}
          </h2>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Détails de votre course
          </p>

          {/* Itinéraire */}
          <div className="space-y-3 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl"
            >
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Départ</p>
                <p className="text-sm font-medium truncate text-foreground">{pickup.address}</p>
              </div>
            </motion.div>

            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3 }}
                className="w-0.5 h-8 bg-gradient-to-b from-border via-primary to-border origin-top"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl"
            >
              <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Arrivée</p>
                <p className="text-sm font-medium truncate text-foreground">{destination.address}</p>
              </div>
            </motion.div>
          </div>

          {/* Détails de la course */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 bg-muted/20 rounded-xl text-center"
            >
              <Route className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">
                {distance.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">km</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 bg-muted/20 rounded-xl text-center"
            >
              <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">
                {Math.round(duration / 60)}
              </p>
              <p className="text-xs text-muted-foreground">min</p>
            </motion.div>
          </div>

          {/* PRIX TOTAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', damping: 20 }}
            className="relative mb-6 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border-2 border-primary/20"
          >
            <p className="text-sm text-muted-foreground mb-1 text-center">
              Prix estimé
            </p>
            <p className="text-5xl font-black text-center bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              {calculatedPrice.toLocaleString()}
            </p>
            <p className="text-lg text-center text-muted-foreground font-medium">
              CDF
            </p>
            
            {/* Badge dynamique */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-lg">
                <Zap className="w-3 h-3 mr-1" />
                Meilleur tarif
              </Badge>
            </div>
          </motion.div>

          {/* CTA - Bouton principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={isSearching}
              className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Recherche en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-6 h-6" />
                  Rechercher un chauffeur
                </span>
              )}
            </Button>
          </motion.div>

          {/* Info paiement */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            💳 Paiement en espèces ou mobile money après la course
          </p>

          {/* Bouton retour discret */}
          <button
            onClick={onBack}
            disabled={isSearching}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Modifier la destination
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
