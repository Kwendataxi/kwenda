import { motion, PanInfo } from 'framer-motion';
import { useState, useEffect } from 'react';
import YangoVehicleSelector from './YangoVehicleSelector';
import DestinationSearchBar from './DestinationSearchBar';
import PopularPlacesList from './PopularPlacesList';
import { useWindowSize } from '@/hooks/useWindowSize';
import { cn } from '@/lib/utils';

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
  onSheetPositionChange?: (height: number) => void;
  onContinue?: () => void;
}

type SheetPosition = 'SMALL' | 'MEDIUM' | 'LARGE';

export default function YangoBottomSheet({ 
  bookingStep,
  selectedVehicle,
  onVehicleSelect,
  distance,
  city,
  calculatingRoute,
  popularPlaces,
  onPlaceSelect,
  onSearchFocus,
  onSheetPositionChange,
  onContinue
}: YangoBottomSheetProps) {
  const { height: windowHeight } = useWindowSize();
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>('MEDIUM');

  // Positions en pixels depuis le bas de l'écran
  const SHEET_POSITIONS = {
    SMALL: 220,
    MEDIUM: 450,
    LARGE: Math.min(windowHeight * 0.85, 700)
  };

  // Feedback haptique subtil
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // ⚡ PHASE 2: Throttle drag events pour performance
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;
    
    let newPosition: SheetPosition;
    
    // Drag rapide : changement direct de position
    if (Math.abs(velocity) > 700) {
      if (velocity < 0) {
        // Drag rapide vers le haut → Agrandir
        newPosition = sheetPosition === 'SMALL' ? 'MEDIUM' : 'LARGE';
      } else {
        // Drag rapide vers le bas → Réduire
        newPosition = sheetPosition === 'LARGE' ? 'MEDIUM' : 'SMALL';
      }
    } else {
      // Snap vers la position la plus proche
      const positions = [
        { name: 'LARGE' as SheetPosition, value: SHEET_POSITIONS.LARGE },
        { name: 'MEDIUM' as SheetPosition, value: SHEET_POSITIONS.MEDIUM },
        { name: 'SMALL' as SheetPosition, value: SHEET_POSITIONS.SMALL }
      ];
      
      const closest = positions.reduce((prev, curr) => {
        const prevDiff = Math.abs(currentY - (windowHeight - prev.value));
        const currDiff = Math.abs(currentY - (windowHeight - curr.value));
        return currDiff < prevDiff ? curr : prev;
      });
      
      newPosition = closest.name;
    }
    
    setSheetPosition(newPosition);
    triggerHaptic('light');
    onSheetPositionChange?.(SHEET_POSITIONS[newPosition]);
  };

  // Notifier la hauteur initiale au montage
  useEffect(() => {
    onSheetPositionChange?.(SHEET_POSITIONS[sheetPosition]);
  }, [sheetPosition, onSheetPositionChange]);

  // Double tap sur la barre pour changer de position
  const handleBarDoubleClick = () => {
    const nextPosition: Record<SheetPosition, SheetPosition> = {
      SMALL: 'MEDIUM',
      MEDIUM: 'LARGE',
      LARGE: 'SMALL'
    };
    const newPosition = nextPosition[sheetPosition];
    setSheetPosition(newPosition);
    triggerHaptic('light');
    onSheetPositionChange?.(SHEET_POSITIONS[newPosition]);
  };

  // ⚡ PHASE 2: Optimisation animations - désactiver layout
  return (
    <motion.div
      initial={{ opacity: 0, x: bookingStep === 'vehicle' ? -50 : 50 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        height: SHEET_POSITIONS[sheetPosition],
        y: 0,
        transition: {
          height: { 
            type: "spring",
            damping: 40,
            stiffness: 220,
            mass: 0.8
          }
        }
      }}
      exit={{ opacity: 0, x: bookingStep === 'vehicle' ? 100 : -100 }}
      transition={{ 
        type: 'spring', 
        damping: 40,
        stiffness: 220,
        mass: 0.8,
        opacity: { duration: 0.3, ease: "easeOut" }
      }}
      layout={false}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.25, bottom: 0.15 }}
      onDragEnd={handleDragEnd}
      className="fixed bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl overflow-hidden"
      style={{
        willChange: 'height, transform',
        transform: 'translateZ(0)'
      }}
    >
      {/* Glissière avec indicateur de position */}
      <div 
        className="flex justify-center items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
        onDoubleClick={handleBarDoubleClick}
      >
        <div className="w-12 h-1.5 bg-border rounded-full"></div>
        <div className="flex gap-1.5 ml-3">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-500 ease-out",
            sheetPosition === 'SMALL' ? 'bg-primary scale-125' : 'bg-muted'
          )} />
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-500 ease-out",
            sheetPosition === 'MEDIUM' ? 'bg-primary scale-125' : 'bg-muted'
          )} />
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-500 ease-out",
            sheetPosition === 'LARGE' ? 'bg-primary scale-125' : 'bg-muted'
          )} />
        </div>
      </div>
      
      {/* Contenu scrollable */}
      <div 
        className={cn(
          "px-3 sm:px-4 pb-6 overflow-y-auto transition-spacing duration-300",
          "scroll-smooth overscroll-contain",
          sheetPosition === 'SMALL' && "pb-3 space-y-2",
          sheetPosition === 'MEDIUM' && "space-y-4 sm:space-y-5",
          sheetPosition === 'LARGE' && "pb-8 space-y-6"
        )}
        style={{
          maxHeight: `${SHEET_POSITIONS[sheetPosition] - 50}px`
        }}
      >
        {/* ÉTAPE 1 : Sélection du véhicule */}
        {bookingStep === 'vehicle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <YangoVehicleSelector
              selectedVehicleId={selectedVehicle}
              onVehicleSelect={(vehicle) => onVehicleSelect(vehicle.id)}
              distance={distance}
              city={city}
              calculatingRoute={calculatingRoute}
              onContinue={onContinue}
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
