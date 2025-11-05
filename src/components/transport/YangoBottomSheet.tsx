import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useState } from 'react';
import { ModernVehicleSelector } from './ModernVehicleSelector';
import DestinationSearchBar from './DestinationSearchBar';
import PopularPlacesList from './PopularPlacesList';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface YangoBottomSheetProps {
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  distance: number;
  city: string;
  calculatingRoute: boolean;
  popularPlaces: any[];
  onPlaceSelect: (place: any) => void;
  onSearchFocus: () => void;
  onConfirmBooking?: () => void;
  hasDestination?: boolean;
}

export default function YangoBottomSheet({ 
  selectedVehicle,
  onVehicleSelect,
  distance,
  city,
  calculatingRoute,
  popularPlaces,
  onPlaceSelect,
  onSearchFocus,
  onConfirmBooking,
  hasDestination = false
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
        {/* Loading indicator pendant calcul */}
        {calculatingRoute && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20"
          >
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Calcul du tarif en cours...</p>
          </motion.div>
        )}

        {/* Types de véhicules - ModernVehicleSelector */}
        {hasDestination ? (
          <ModernVehicleSelector
            distance={distance}
            city={city}
            selectedVehicleId={selectedVehicle}
            onVehicleSelect={(vehicle) => onVehicleSelect(vehicle.id)}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              👆 Sélectionnez une destination pour voir les tarifs
            </p>
          </div>
        )}
        
        {/* Barre de recherche */}
        <DestinationSearchBar onFocus={onSearchFocus} />
        
        {/* Lieux populaires */}
        <PopularPlacesList 
          places={popularPlaces}
          onSelectPlace={onPlaceSelect}
        />

        {/* Bouton Confirmer la course - visible uniquement si destination + véhicule sélectionné */}
        {distance > 0 && selectedVehicle && onConfirmBooking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-2 -mx-4 px-4"
          >
            <Button
              size="lg"
              onClick={onConfirmBooking}
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl bg-gradient-to-r from-primary via-primary to-primary/90 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Confirmer la course
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-3">
              💳 Paiement après la course
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
