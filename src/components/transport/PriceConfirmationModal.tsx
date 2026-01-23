import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Target, Route, Clock, Search, Zap, ArrowLeft, Loader2, Minus, Plus, Info } from 'lucide-react';
import { Car, Bike, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RideBiddingModal } from './RideBiddingModal';

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
  bookingId?: string;
  onOfferAccepted?: (driverId: string) => void;
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
  onBack,
  bookingId,
  onOfferAccepted
}: PriceConfirmationModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  const [clientPrice, setClientPrice] = useState(Math.floor(calculatedPrice * 0.8));

  const vehicle = VEHICLE_CONFIG[vehicleType] || VEHICLE_CONFIG['taxi_eco'];
  const VehicleIcon = vehicle.icon;

  // Mettre à jour le prix proposé quand le prix calculé change
  useEffect(() => {
    setClientPrice(Math.floor(calculatedPrice * 0.8));
  }, [calculatedPrice]);

  const minPrice = Math.floor(calculatedPrice * 0.5);
  const maxPrice = Math.ceil(calculatedPrice * 1.5);

  const handlePriceChange = (increment: number) => {
    setClientPrice(prev => {
      const newPrice = prev + increment;
      return Math.max(minPrice, Math.min(maxPrice, newPrice));
    });
  };

  const handleConfirm = async () => {
    if (biddingEnabled) {
      // Ouvrir le modal de bidding
      setShowBiddingModal(true);
    } else {
      // Recherche classique
      setIsSearching(true);
      try {
        await onConfirm();
      } finally {
        setIsSearching(false);
      }
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
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${vehicle.gradient} flex items-center justify-center shadow-xl`}
            >
              <VehicleIcon className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
            {vehicle.name}
          </h2>

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

          {/* Toggle mode bidding AMÉLIORÉ avec badge NOUVEAU */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="mb-4 p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 rounded-2xl border-2 border-primary/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="bidding-toggle" className="text-base font-bold cursor-pointer flex items-center gap-2">
                    🎯 Mode Enchères
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary text-primary-foreground">
                      NOUVEAU
                    </Badge>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="h-5 w-5 rounded-full hover:bg-muted/50 flex items-center justify-center transition-colors">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-medium">💡 Les chauffeurs proposent leurs meilleurs prix</p>
                        <p className="text-xs text-muted-foreground mt-1">Économisez jusqu'à 50% sur votre course!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Proposez votre prix et recevez des offres de chauffeurs
                </p>
              </div>
              <Switch
                id="bidding-toggle"
                checked={biddingEnabled}
                onCheckedChange={setBiddingEnabled}
                disabled={isSearching}
                className="data-[state=checked]:bg-primary scale-110"
              />
            </div>
            
            {/* Indicateur économie potentielle */}
            {!biddingEnabled && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg">
                <Zap className="h-3 w-3" />
                <span className="font-medium">Économisez jusqu'à {Math.round(calculatedPrice * 0.3).toLocaleString()} CDF avec ce mode</span>
              </div>
            )}
          </motion.div>

          {/* 🎯 Interface Bidding moderne et épurée */}
          {biddingEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 p-5 bg-gradient-to-br from-amber-50/80 to-background dark:from-amber-950/30 dark:to-background rounded-2xl border border-amber-200/50 dark:border-amber-800/30"
            >
              {/* Titre */}
              <p className="text-sm font-medium text-center text-muted-foreground mb-4">
                Proposez votre prix
              </p>

              {/* Presets rapides */}
              <div className="flex justify-center gap-2 mb-5">
                {[
                  { label: '-30%', multiplier: 0.7 },
                  { label: '-20%', multiplier: 0.8 },
                  { label: '-10%', multiplier: 0.9 },
                ].map((preset) => {
                  const presetValue = Math.max(Math.floor(calculatedPrice * preset.multiplier), minPrice);
                  const isActive = clientPrice === presetValue;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setClientPrice(presetValue)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md scale-105'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Contrôle prix principal */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handlePriceChange(-1000)}
                  disabled={clientPrice <= minPrice}
                  className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                >
                  <Minus className="w-6 h-6" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    value={clientPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setClientPrice(Math.max(minPrice, Math.min(maxPrice, val)));
                      }
                    }}
                    className="w-36 h-16 text-center text-3xl font-bold bg-background border-2 border-primary/30 rounded-2xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    min={minPrice}
                    max={maxPrice}
                  />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                    CDF
                  </span>
                </div>

                <button
                  onClick={() => handlePriceChange(1000)}
                  disabled={clientPrice >= maxPrice}
                  className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Économie affichée */}
              {clientPrice < calculatedPrice && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-6 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl"
                >
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                    💰 Économie: {(calculatedPrice - clientPrice).toLocaleString()} CDF
                    <span className="ml-2 text-xs opacity-80">
                      ({Math.round(((calculatedPrice - clientPrice) / calculatedPrice) * 100)}%)
                    </span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* CTA - Bouton principal */}
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
            ) : biddingEnabled ? (
              <span className="flex items-center gap-2">
                <Zap className="w-6 h-6" />
                Lancer l'enchère
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-6 h-6" />
                Rechercher un chauffeur
              </span>
            )}
          </Button>

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

      {/* Modal de bidding */}
      {bookingId && showBiddingModal && (
        <RideBiddingModal
          open={showBiddingModal}
          onClose={() => setShowBiddingModal(false)}
          bookingId={bookingId}
          estimatedPrice={calculatedPrice}
          clientProposedPrice={clientPrice}
          onOfferAccepted={(driverId) => {
            setShowBiddingModal(false);
            onOfferAccepted?.(driverId);
          }}
        />
      )}
    </Dialog>
  );
}
