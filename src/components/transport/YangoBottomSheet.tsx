import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useState } from 'react';
import VehicleTypeSelector from './VehicleTypeSelector';
import DestinationSearchBar from './DestinationSearchBar';
import PopularPlacesList from './PopularPlacesList';

interface YangoBottomSheetProps {
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  popularPlaces: any[];
  onPlaceSelect: (place: any) => void;
  onSearchFocus: () => void;
}

export default function YangoBottomSheet({ 
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
      initial={{ y: 100 }}
      animate={controls}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
      <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[calc(75vh-2rem)]">
        {/* Types de véhicules */}
        <VehicleTypeSelector 
          selected={selectedVehicle}
          onSelect={onVehicleSelect}
        />
        
        {/* Barre de recherche */}
        <DestinationSearchBar onFocus={onSearchFocus} />
        
        {/* Lieux populaires */}
        <PopularPlacesList 
          places={popularPlaces}
          onSelectPlace={onPlaceSelect}
        />
      </div>
    </motion.div>
  );
}
