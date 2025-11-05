import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useState } from 'react';
import CompactVehicleSelector from './CompactVehicleSelector';
import DestinationSearchBar from './DestinationSearchBar';
import PopularPlacesList from './PopularPlacesList';

interface YangoBottomSheetProps {
  bookingStep: 'vehicle' | 'destination' | 'confirm';
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  distance: number;
  city: string;
  calculatingRoute: boolean;
  popularPlaces: any[];
  onPlaceSelect: (place: any) => void;
  onSearchFocus: () => void;
  hasDestination?: boolean;
}

export default function YangoBottomSheet({ 
  bookingStep,
  selectedVehicle,
  onVehicleSelect,
  popularPlaces,
  onPlaceSelect,
  onSearchFocus
}: YangoBottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Si on tire vers le bas de plus de 100px, on minimise
    if (info.offset.y > 100) {
      controls.start({ y: 200 });
    } else {
      controls.start({ y: 0 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: bookingStep === 'vehicle' ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: bookingStep === 'vehicle' ? 100 : -100 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="fixed bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden"
    >
      {/* Glissière */}
      <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 bg-border rounded-full"></div>
      </div>
      
      {/* Contenu scrollable */}
      <div className="px-4 pb-6 space-y-5 overflow-y-auto max-h-[calc(75vh-2rem)]">
        {/* ÉTAPE 1 : Sélection du véhicule */}
        {bookingStep === 'vehicle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <CompactVehicleSelector
              selected={selectedVehicle}
              onSelect={onVehicleSelect}
            />
          </motion.div>
        )}

        {/* ÉTAPE 2 : Sélection de la destination */}
        {bookingStep === 'destination' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3 px-1">
                Où allez-vous ?
              </h3>
              
              {/* Barre de recherche */}
              <DestinationSearchBar onFocus={onSearchFocus} />
            </div>
            
            {/* Lieux populaires */}
            <PopularPlacesList 
              places={popularPlaces}
              onSelectPlace={onPlaceSelect}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
