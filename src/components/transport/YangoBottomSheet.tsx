import { motion, PanInfo } from 'framer-motion';
import { useState, useEffect } from 'react';
import YangoVehicleSelector from './YangoVehicleSelector';
import BeneficiarySelector from './BeneficiarySelector';
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
  isForSomeoneElse?: boolean;
  onToggleBeneficiary?: (value: boolean) => void;
  selectedBeneficiary?: any;
  onSelectBeneficiary?: (beneficiary: any) => void;
}

type SheetPosition = 'COLLAPSED' | 'SMALL' | 'MEDIUM' | 'LARGE';

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
  onContinue,
  isForSomeoneElse,
  onToggleBeneficiary,
  selectedBeneficiary,
  onSelectBeneficiary
}: YangoBottomSheetProps) {
  const { height: windowHeight } = useWindowSize();
  
  // Position initiale adaptative selon l'étape
  const getInitialPosition = (): SheetPosition => {
    if (bookingStep === 'vehicle') return 'MEDIUM';
    if (bookingStep === 'destination') return 'LARGE';
    return 'COLLAPSED';
  };
  
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>(getInitialPosition());
  const [isDraggable, setIsDraggable] = useState(true);

  // Positions en pixels depuis le bas de l'écran (améliorées pour plus de visibilité)
  const SHEET_POSITIONS = {
    COLLAPSED: 120,
    SMALL: 280,
    MEDIUM: 480,
    LARGE: Math.min(windowHeight * 0.85, 720)
  };

  // Feedback haptique amélioré
  const triggerHaptic = (type: 'snap' | 'expand' | 'collapse' | 'light' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        snap: [5, 10, 5],
        expand: [15],
        collapse: [10],
        light: 10
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Drag ultra-fluide avec seuil réduit
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;
    
    let newPosition: SheetPosition;
    
    // Drag rapide : changement direct de position (seuil réduit à 200)
    if (Math.abs(velocity) > 200) {
      if (velocity < 0) {
        // Drag rapide vers le haut → Agrandir
        if (sheetPosition === 'COLLAPSED') newPosition = 'SMALL';
        else if (sheetPosition === 'SMALL') newPosition = 'MEDIUM';
        else newPosition = 'LARGE';
        triggerHaptic('expand');
      } else {
        // Drag rapide vers le bas → Réduire
        if (sheetPosition === 'LARGE') newPosition = 'MEDIUM';
        else if (sheetPosition === 'MEDIUM') newPosition = 'SMALL';
        else newPosition = 'COLLAPSED';
        triggerHaptic('collapse');
      }
    } else {
      // Snap vers la position la plus proche
      const positions = [
        { name: 'LARGE' as SheetPosition, value: SHEET_POSITIONS.LARGE },
        { name: 'MEDIUM' as SheetPosition, value: SHEET_POSITIONS.MEDIUM },
        { name: 'SMALL' as SheetPosition, value: SHEET_POSITIONS.SMALL },
        { name: 'COLLAPSED' as SheetPosition, value: SHEET_POSITIONS.COLLAPSED }
      ];
      
      const closest = positions.reduce((prev, curr) => {
        const prevDiff = Math.abs(currentY - (windowHeight - prev.value));
        const currDiff = Math.abs(currentY - (windowHeight - curr.value));
        return currDiff < prevDiff ? curr : prev;
      });
      
      newPosition = closest.name;
      triggerHaptic('snap');
    }
    
    setSheetPosition(newPosition);
    setIsDraggable(true);
    onSheetPositionChange?.(SHEET_POSITIONS[newPosition]);
  };

  // Notifier la hauteur initiale au montage
  useEffect(() => {
    onSheetPositionChange?.(SHEET_POSITIONS[sheetPosition]);
  }, [sheetPosition, onSheetPositionChange]);

  // Auto-expand selon l'étape (avec animation)
  useEffect(() => {
    if (bookingStep === 'destination' && sheetPosition !== 'LARGE') {
      setSheetPosition('LARGE');
      triggerHaptic('expand');
    } else if (bookingStep === 'vehicle' && sheetPosition === 'COLLAPSED') {
      setSheetPosition('MEDIUM');
      triggerHaptic('expand');
    }
  }, [bookingStep]);

  // Double tap sur la barre pour changer de position
  const handleBarDoubleClick = () => {
    const nextPosition: Record<SheetPosition, SheetPosition> = {
      COLLAPSED: 'SMALL',
      SMALL: 'MEDIUM',
      MEDIUM: 'LARGE',
      LARGE: 'COLLAPSED'
    };
    const newPosition = nextPosition[sheetPosition];
    setSheetPosition(newPosition);
    triggerHaptic(newPosition === 'COLLAPSED' ? 'collapse' : 'expand');
    onSheetPositionChange?.(SHEET_POSITIONS[newPosition]);
  };

  // Animations ultra-fluides avec spring adouci
  return (
    <motion.div
      role="dialog"
      aria-label="Options de réservation"
      aria-expanded={sheetPosition !== 'COLLAPSED'}
      initial={{ opacity: 0, x: bookingStep === 'vehicle' ? -50 : 50 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        height: SHEET_POSITIONS[sheetPosition],
        y: 0,
        transition: {
          height: { 
            type: "spring",
            damping: 30,
            stiffness: 250,
            mass: 0.6
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
      drag={isDraggable ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.25, bottom: 0.15 }}
      onDragEnd={handleDragEnd}
      className="fixed bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl overflow-hidden"
      style={{
        willChange: 'height, transform',
        transform: 'translateZ(0)'
      }}
    >
      {/* Zone de grip agrandie avec indicateur de position */}
      <div 
        className="flex justify-center items-center pt-5 pb-4 cursor-grab active:cursor-grabbing select-none relative"
        onDoubleClick={handleBarDoubleClick}
        style={{ minHeight: '48px' }}
      >
        <div className="w-16 h-1.5 bg-muted-foreground/40 rounded-full"></div>
        
        {/* Indicateur visuel de position (4 points) */}
        <div className="absolute right-4 top-5 flex gap-1">
          {(['COLLAPSED', 'SMALL', 'MEDIUM', 'LARGE'] as SheetPosition[]).map((pos) => (
            <div 
              key={pos}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                sheetPosition === pos ? "bg-primary" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Mode COLLAPSED : Résumé avec bouton expand */}
      {sheetPosition === 'COLLAPSED' && selectedVehicle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              🚗
            </div>
            <div>
              <p className="text-sm font-semibold">
                {selectedVehicle === 'moto' ? 'Moto-taxi' : 
                 selectedVehicle === 'eco' ? 'Taxi Eco' :
                 selectedVehicle === 'comfort' ? 'Taxi Confort' :
                 selectedVehicle === 'premium' ? 'Taxi Premium' : 'Taxi'}
              </p>
              <p className="text-xs text-muted-foreground">
                {distance > 0 ? `${distance.toFixed(1)} km` : 'En attente...'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setSheetPosition('MEDIUM');
              triggerHaptic('expand');
            }}
            className="text-primary text-sm font-medium px-3 py-1.5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            Modifier
          </button>
        </motion.div>
      )}
      
      {/* Contenu scrollable avec gestion drag/scroll séparée */}
      <div 
        className={cn(
          "px-3 sm:px-4 pb-6 overflow-y-auto transition-spacing duration-300",
          "scroll-smooth overscroll-contain relative",
          sheetPosition === 'COLLAPSED' && "hidden",
          sheetPosition === 'SMALL' && "pb-3 space-y-2",
          sheetPosition === 'MEDIUM' && "space-y-4 sm:space-y-5",
          sheetPosition === 'LARGE' && "pb-8 space-y-6"
        )}
        style={{
          maxHeight: `${SHEET_POSITIONS[sheetPosition] - 60}px`,
          overscrollBehavior: 'contain'
        }}
        onTouchStart={(e) => {
          const target = e.currentTarget;
          if (target.scrollHeight > target.clientHeight) {
            setIsDraggable(false);
          }
        }}
        onTouchEnd={() => setIsDraggable(true)}
      >
        {/* Gradient fade si contenu dépasse (sauf en LARGE) */}
        {sheetPosition !== 'LARGE' && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        )}
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
            
            {/* Sélecteur de bénéficiaire intégré après sélection véhicule */}
            {selectedVehicle && isForSomeoneElse !== undefined && onToggleBeneficiary && (
              <div className="mt-4">
                <BeneficiarySelector
                  isForSomeoneElse={isForSomeoneElse}
                  onToggle={onToggleBeneficiary}
                  selectedBeneficiary={selectedBeneficiary || null}
                  onSelectBeneficiary={onSelectBeneficiary || (() => {})}
                />
              </div>
            )}
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
