import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Car, Users, Truck, Bike } from 'lucide-react';

interface VehicleOption {
  id: string;
  name: string;
  icon: any;
  time: string;
  price: number;
  pricePerKm: string;
  available: boolean;
  recommended?: boolean;
}

interface VehicleCarouselProps {
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
}

export default function VehicleCarousel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect
}: VehicleCarouselProps) {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const getIcon = (iconName: string) => {
    const icons: any = { Car, Users, Truck, Bike };
    return icons[iconName] || Car;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-foreground">Type de véhicule</h3>
        <Badge variant="outline" className="text-xs">
          {vehicles.length} disponibles
        </Badge>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {vehicles.map((vehicle) => {
            const isActive = selectedVehicleId === vehicle.id;
            const Icon = getIcon(vehicle.icon);

            return (
              <CarouselItem key={vehicle.id} className="pl-2 basis-[85%] sm:basis-[70%] md:basis-[50%]">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onVehicleSelect(vehicle.id);
                    triggerHaptic();
                  }}
                  className={cn(
                    "w-full glass-card rounded-3xl p-4 text-left transition-all duration-300",
                    isActive && "ring-2 ring-primary shadow-glow-green bg-primary/5"
                  )}
                >
                  {/* Header avec icône */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        isActive
                          ? "bg-gradient-to-br from-primary/30 to-primary/10"
                          : "bg-gradient-to-br from-primary/20 to-primary/5"
                      )}>
                        <Icon className={cn(
                          "w-8 h-8 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-foreground">{vehicle.name}</h4>
                        <p className="text-xs text-muted-foreground">{vehicle.time}</p>
                      </div>
                    </div>

                    {vehicle.recommended && (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                        ⭐ Top
                      </Badge>
                    )}
                  </div>

                  {/* Prix et disponibilité */}
                  <div className="flex items-end justify-between pt-3 border-t border-border/50">
                    <div>
                      <p className="text-2xl font-extrabold text-foreground">
                        {vehicle.price.toLocaleString()} CDF
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {vehicle.pricePerKm}/km
                      </p>
                    </div>
                    {vehicle.available && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                        Dispo
                      </Badge>
                    )}
                  </div>

                  {/* Indicateur de sélection */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Dots indicateurs */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {vehicles.map((vehicle, idx) => (
          <div
            key={vehicle.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              selectedVehicleId === vehicle.id
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
