import { Search, Home, Building, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CompactDestinationSearchProps {
  destination: string | null;
  onOpenSearch: () => void;
  onSelectQuick?: (type: 'home' | 'work' | 'recent') => void;
  className?: string;
}

export default function CompactDestinationSearch({
  destination,
  onOpenSearch,
  onSelectQuick,
  className
}: CompactDestinationSearchProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const quickChips = [
    { id: 'home', icon: Home, label: 'Maison', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { id: 'work', icon: Building, label: 'Travail', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    { id: 'recent', icon: MapPin, label: 'Récent', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  ];

  return (
    <div className={cn("sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-3 -mx-4 px-4 pt-2", className)}>
      {/* Barre de recherche principale */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <button
          onClick={() => {
            onOpenSearch();
            triggerHaptic();
          }}
          className="w-full h-14 px-4 flex items-center gap-3 text-left"
        >
          <motion.div
            animate={destination ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {destination ? (
              <MapPin className="w-5 h-5 text-primary animate-pulse" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground" />
            )}
          </motion.div>
          <div className="flex-1">
            {destination ? (
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-semibold text-foreground truncate">{destination}</p>
              </div>
            ) : (
              <p className="text-base text-muted-foreground">Où allez-vous ?</p>
            )}
          </div>
          {destination && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              ✓
            </Badge>
          )}
        </button>
      </motion.div>

      {/* Quick access chips */}
      {!destination && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1"
        >
          {quickChips.map((chip) => (
            <motion.button
              key={chip.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onSelectQuick?.(chip.id as any);
                triggerHaptic();
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all",
                chip.color,
                "hover:shadow-md active:shadow-inner"
              )}
            >
              <chip.icon className="w-3.5 h-3.5" />
              {chip.label}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onOpenSearch();
              triggerHaptic();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-primary/10 text-primary border-primary/20 text-xs font-medium whitespace-nowrap hover:shadow-md"
          >
            <Search className="w-3.5 h-3.5" />
            Tout voir
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
