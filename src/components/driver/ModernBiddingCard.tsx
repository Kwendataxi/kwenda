import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, Users, Zap, Timer, TrendingDown, Navigation } from 'lucide-react';

interface ModernBiddingCardProps {
  bookingId: string;
  pickupAddress: string;
  destinationAddress: string;
  distance: number;
  estimatedPrice: number;
  clientProposedPrice?: number;
  offerCount: number;
  biddingClosesAt?: string;
  distanceToPickup?: number;
  isBiddingMode?: boolean;
  onAcceptKwendaPrice: () => void;
  onMakeOffer: () => void;
  onIgnore: () => void;
}

export const ModernBiddingCard = ({
  bookingId,
  pickupAddress,
  destinationAddress,
  distance,
  estimatedPrice,
  clientProposedPrice,
  offerCount,
  biddingClosesAt,
  distanceToPickup = 0,
  isBiddingMode = false,
  onAcceptKwendaPrice,
  onMakeOffer,
  onIgnore
}: ModernBiddingCardProps) => {
  const [timeRemaining, setTimeRemaining] = useState('--:--');
  const [isExpired, setIsExpired] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  // Timer countdown
  useEffect(() => {
    if (!biddingClosesAt) return;

    const updateTimer = () => {
      const remaining = new Date(biddingClosesAt).getTime() - Date.now();
      
      if (remaining <= 0) {
        setTimeRemaining('Expiré');
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Determine urgency level
      if (remaining < 30000) {
        setUrgencyLevel('critical');
      } else if (remaining < 60000) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('normal');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [biddingClosesAt]);

  const discount = clientProposedPrice 
    ? Math.round(((estimatedPrice - clientProposedPrice) / estimatedPrice) * 100)
    : 0;

  const estimatedArrival = Math.ceil(distanceToPickup * 2.5); // ~2.5 min/km

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className={`overflow-hidden border-0 shadow-xl ${
        isBiddingMode 
          ? 'bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-background dark:from-amber-950/30 dark:via-orange-950/20 dark:to-background'
          : 'bg-gradient-to-br from-emerald-50/80 via-green-50/50 to-background dark:from-emerald-950/30 dark:via-green-950/20 dark:to-background'
      }`}>
        {/* Header avec badge selon le mode */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isBiddingMode ? [0, 10, -10, 0] : [0, 0, 0, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {isBiddingMode ? (
                <Zap className="h-5 w-5 text-amber-500" />
              ) : (
                <MapPin className="h-5 w-5 text-emerald-500" />
              )}
            </motion.div>
            <span className="font-bold text-base">
              {isBiddingMode ? 'Mode Enchères' : 'Course Disponible'}
            </span>
          </div>
          
          {/* Timer badge - only in bidding mode */}
          {isBiddingMode && biddingClosesAt ? (
            <Badge 
              variant="outline" 
              className={`
                flex items-center gap-1.5 font-mono text-sm px-3 py-1
                ${urgencyLevel === 'critical' 
                  ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse' 
                  : urgencyLevel === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-muted border-border'
                }
              `}
            >
              <Timer className="h-3.5 w-3.5" />
              {timeRemaining}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              Proposez votre tarif
            </Badge>
          )}
        </div>

        {/* Competition badge */}
        {offerCount > 0 && (
          <div className="px-4 pb-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              <Users className="h-3 w-3 mr-1" />
              {offerCount} chauffeur{offerCount > 1 ? 's' : ''} en compétition
            </Badge>
          </div>
        )}

        {/* Route info */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-red-500 my-1" />
              <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Départ</p>
                <p className="text-sm font-medium truncate">{pickupAddress || 'Adresse de départ'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Arrivée</p>
                <p className="text-sm font-medium truncate">{destinationAddress || 'Adresse d\'arrivée'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-4 py-2 grid grid-cols-3 gap-2">
          <div className="bg-background/60 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">{distance.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">km course</p>
          </div>
          <div className="bg-background/60 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <Navigation className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">{distanceToPickup.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">km de vous</p>
          </div>
          <div className="bg-background/60 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">~{estimatedArrival}</p>
            <p className="text-[10px] text-muted-foreground">min arrivée</p>
          </div>
        </div>

        {/* Price comparison */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Prix Kwenda</p>
              <p className="text-lg font-bold">{estimatedPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">CDF</p>
            </div>
            
            {clientProposedPrice ? (
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-3 text-center relative">
                {discount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5"
                  >
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    -{discount}%
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mb-1">Offre client</p>
                <p className="text-lg font-bold text-primary">{clientProposedPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">CDF</p>
              </div>
            ) : (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Votre offre</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">À proposer</p>
                <p className="text-xs text-muted-foreground">Faites une offre</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 space-y-2">
          {/* Bouton accepter prix Kwenda - toujours visible */}
          <Button
            onClick={onAcceptKwendaPrice}
            disabled={isExpired}
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Accepter {clientProposedPrice ? clientProposedPrice.toLocaleString() : estimatedPrice.toLocaleString()} CDF
          </Button>
          
          {/* Bouton faire une offre */}
          <Button
            onClick={onMakeOffer}
            disabled={isExpired}
            variant="outline"
            className="w-full h-12 font-semibold border-2 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isBiddingMode ? 'Contre-offre' : 'Proposer mon tarif'}
          </Button>

          <Button
            onClick={onIgnore}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Ignorer cette course
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
