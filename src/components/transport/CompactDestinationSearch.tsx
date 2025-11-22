import { Search, Home, Building, MapPin, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePlaces } from '@/hooks/usePlaces';
import QuickPlaceSetup from './QuickPlaceSetup';

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
  const { homePlace, workPlace, loading } = usePlaces();
  const [showSetup, setShowSetup] = useState(false);

  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

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

      {/* Quick access chips - Positions réelles */}
      {!destination && (
        <AnimatePresence mode="wait">
          {!loading && !homePlace && !workPlace ? (
            // Aucune position définie - Bouton d'ajout
            <motion.div
              key="add-places"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowSetup(true);
                  triggerHaptic();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 hover:border-primary/60 transition-all group"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Ajouter Maison & Travail</span>
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </motion.button>
            </motion.div>
          ) : (
            // Positions définies - Afficher les boutons
            <motion.div
              key="places-list"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1"
            >
              {homePlace && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onSelectQuick?.({
                      address: homePlace.address,
                      lat: homePlace.coordinates?.lat || 0,
                      lng: homePlace.coordinates?.lng || 0,
                      name: homePlace.name
                    });
                    triggerHaptic();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-medium whitespace-nowrap hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Home className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Maison</span>
                  <Badge variant="outline" className="ml-1 bg-blue-600/20 text-blue-700 border-blue-500/30 text-[10px] px-1.5 py-0">
                    ✓
                  </Badge>
                </motion.button>
              )}

              {workPlace && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onSelectQuick?.({
                      address: workPlace.address,
                      lat: workPlace.coordinates?.lat || 0,
                      lng: workPlace.coordinates?.lng || 0,
                      name: workPlace.name
                    });
                    triggerHaptic();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs font-medium whitespace-nowrap hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Building className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Travail</span>
                  <Badge variant="outline" className="ml-1 bg-purple-600/20 text-purple-700 border-purple-500/30 text-[10px] px-1.5 py-0">
                    ✓
                  </Badge>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Quick Place Setup Dialog */}
      <QuickPlaceSetup 
        open={showSetup} 
        onOpenChange={setShowSetup}
        onComplete={() => {
          // Places will auto-refresh via usePlaces
        }}
      />
    </div>
  );
}
