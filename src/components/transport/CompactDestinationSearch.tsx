import { Search, Home, Building, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserFavorites } from '@/hooks/useUserFavorites';

interface CompactDestinationSearchProps {
  destination: string | null;
  onOpenSearch: () => void;
  onSelectQuick?: (location: { address: string; lat: number; lng: number; name: string }) => void;
  city?: string;
  className?: string;
}

export default function CompactDestinationSearch({
  destination,
  onOpenSearch,
  onSelectQuick,
  city = 'Kinshasa',
  className
}: CompactDestinationSearchProps) {
  const { favorites } = useUserFavorites(city);

  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const homeFavorite = favorites.find(f => f.type === 'home');
  const workFavorite = favorites.find(f => f.type === 'work');

  return (
    <div className={cn("bg-background/95 backdrop-blur-md pb-3", className)}>
      {/* Barre de recherche principale */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <button
          onClick={() => {
            onOpenSearch();
            triggerHaptic();
          }}
          className="w-full h-12 px-4 flex items-center gap-3 text-left"
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-[10px] text-muted-foreground">Destination</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {destination.split(',')[0]}
                </p>
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">Où allez-vous ?</p>
            )}
          </div>
          {destination && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              ✓
            </Badge>
          )}
        </button>
      </motion.div>

      {/* Quick access chips - Favoris réels */}
      {!destination && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1"
        >
          {homeFavorite && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onSelectQuick?.({
                  address: homeFavorite.address,
                  lat: homeFavorite.lat,
                  lng: homeFavorite.lng,
                  name: homeFavorite.name
                });
                triggerHaptic();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-medium whitespace-nowrap hover:shadow-md"
            >
              <Home className="w-3.5 h-3.5" />
              Maison
            </motion.button>
          )}

          {workFavorite && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onSelectQuick?.({
                  address: workFavorite.address,
                  lat: workFavorite.lat,
                  lng: workFavorite.lng,
                  name: workFavorite.name
                });
                triggerHaptic();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs font-medium whitespace-nowrap hover:shadow-md"
            >
              <Building className="w-3.5 h-3.5" />
              Travail
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onOpenSearch();
              triggerHaptic();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-primary/10 text-primary border-primary/20 text-xs font-medium whitespace-nowrap hover:shadow-md"
          >
            <Search className="w-3.5 h-3.5" />
            Rechercher
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
