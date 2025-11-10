import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LocationData } from '@/types/location';

interface TripSummaryCardProps {
  pickup: LocationData;
  destination: LocationData;
  distance: number;
  duration: number;
  price: number;
  biddingEnabled?: boolean;
  estimatedSavings?: number;
}

export default function TripSummaryCard({
  pickup,
  destination,
  distance,
  duration,
  price,
  biddingEnabled,
  estimatedSavings
}: TripSummaryCardProps) {
  const durationMinutes = Math.ceil(duration / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-card rounded-2xl p-4 space-y-4"
    >
      {/* Trajet visuel */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30" />
          <div className="w-0.5 h-12 bg-gradient-to-b from-primary via-primary/50 to-destructive/50 rounded-full" />
          <MapPin className="w-4 h-4 text-destructive drop-shadow-lg" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Départ</p>
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {pickup.address}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Arrivée</p>
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {destination.address}
            </p>
          </div>
        </div>
      </div>

      {/* Stats du trajet */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>{distance.toFixed(1)} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>~{durationMinutes} min</span>
          </div>
        </div>
        <Badge variant="outline" className="font-mono font-bold">
          {price.toLocaleString()} CDF
        </Badge>
      </div>

      {/* Badge économies si bidding */}
      {biddingEnabled && estimatedSavings && estimatedSavings > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl py-2.5 px-3"
        >
          <span className="text-lg">🎉</span>
          <p className="text-xs font-semibold text-green-600">
            Économie potentielle : {estimatedSavings.toLocaleString()} CDF
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
