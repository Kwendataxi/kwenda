import { motion } from 'framer-motion';
import { Car, Bike, Bus, Truck, Crown, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { useRef, useState, useEffect } from 'react';

const iconMap = {
  Car,
  Bike,
  Bus,
  Truck,
  Crown
};

interface CompactVehicleSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  city?: string;
  distance?: number;
}

export default function CompactVehicleSelector({ 
  selected, 
  onSelect, 
  city = 'Kinshasa',
  distance = 0 
}: CompactVehicleSelectorProps) {
  const { vehicles, isLoading } = useVehicleTypes({ distance, city });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Détecter si scroll possible
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
      setScrollPosition(scrollLeft);
    };
    
    checkScroll();
    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    return () => {
      scrollElement?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [vehicles]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-foreground px-1">
          Choisissez votre type de véhicule
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-20 sm:w-24 space-y-1.5">
              <Skeleton className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-full" />
              <Skeleton className="w-12 h-3 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const itemWidth = scrollRef.current ? scrollRef.current.scrollWidth / vehicles.length : 100;
  const currentIndex = Math.round(scrollPosition / itemWidth);

  return (
    <div className="space-y-2">
      <h3 className="text-sm sm:text-base font-bold text-foreground px-1">
        Choisissez votre type de véhicule
      </h3>
      
      <div className="relative">
        {/* Flèche gauche */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-lg border border-border hover:bg-accent transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
        )}
        
        {/* Container scrollable avec gradient fade */}
        <div className="relative">
          {/* Gradient fade gauche */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
          )}
          
          {/* Liste de véhicules */}
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide px-4"
          >
            {vehicles.map((vehicle, index) => {
              const IconComponent = iconMap[vehicle.icon as keyof typeof iconMap] || Car;
              const isSelected = selected === vehicle.id;
              
              return (
                <motion.button
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.08,
                    type: 'spring',
                    damping: 30,
                    stiffness: 200,
                    mass: 0.8
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { damping: 20, stiffness: 400 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(vehicle.id)}
                  className={`
                    relative flex-shrink-0 w-20 sm:w-24 snap-center
                    ${isSelected ? 'z-10' : 'z-0'}
                  `}
                >
                  {vehicle.isPopular && (
                    <Badge className="absolute -top-1.5 -right-1 bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 shadow-md z-10">
                      <Zap className="w-2.5 h-2.5 mr-0.5" />
                      Top
                    </Badge>
                  )}
                  
                  {/* Icône circulaire avec gradient */}
                  <motion.div
                    animate={isSelected ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                    className={`
                      w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-full 
                      bg-gradient-to-br ${vehicle.gradient}
                      flex items-center justify-center
                      shadow-lg
                      ${isSelected 
                        ? 'ring-3 ring-primary ring-offset-2 ring-offset-background shadow-2xl' 
                        : 'opacity-70 hover:opacity-100'
                      }
                      transition-all duration-300
                    `}
                  >
                    <IconComponent className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
                  </motion.div>
                  
                  {/* Nom */}
                  <p className={`
                    text-[11px] sm:text-xs font-semibold mt-1.5 text-center leading-tight
                    ${isSelected ? 'text-primary' : 'text-foreground'}
                    transition-colors
                  `}>
                    {vehicle.name}
                  </p>
                  
                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
          
          {/* Gradient fade droite */}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />
          )}
        </div>
        
        {/* Flèche droite */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-lg border border-border hover:bg-accent transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
      
      {/* Dots indicateurs */}
      {vehicles.length > 1 && (
        <div className="flex justify-center gap-1.5 px-1">
          {vehicles.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
