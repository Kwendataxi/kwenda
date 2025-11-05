import { motion } from 'framer-motion';
import { Car, Bike, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const VEHICLES = [
  {
    id: 'taxi_moto',
    name: 'Moto',
    icon: Bike,
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    color: '#F59E0B'
  },
  {
    id: 'taxi_eco',
    name: 'Éco',
    icon: Car,
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    color: '#10B981',
    isPopular: true
  },
  {
    id: 'taxi_confort',
    name: 'Confort',
    icon: Car,
    gradient: 'from-blue-500 via-sky-500 to-blue-600',
    color: '#3B82F6'
  },
  {
    id: 'taxi_premium',
    name: 'Premium',
    icon: Crown,
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    color: '#8B5CF6'
  }
];

interface CompactVehicleSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CompactVehicleSelector({ selected, onSelect }: CompactVehicleSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground px-1">
        Choisissez votre type de véhicule
      </h3>
      
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide -mx-1 px-1">
        {VEHICLES.map((vehicle, index) => {
          const IconComponent = vehicle.icon;
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
                relative flex-shrink-0 w-24 snap-center
                ${isSelected ? 'z-10' : 'z-0'}
              `}
            >
              {vehicle.isPopular && (
                <Badge className="absolute -top-2 -right-1 bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 shadow-md z-10">
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
                  w-20 h-20 mx-auto rounded-full 
                  bg-gradient-to-br ${vehicle.gradient}
                  flex items-center justify-center
                  shadow-lg
                  ${isSelected 
                    ? 'ring-4 ring-primary ring-offset-2 ring-offset-background shadow-2xl' 
                    : 'opacity-70 hover:opacity-100'
                  }
                  transition-all duration-300
                `}
              >
                <IconComponent className="w-9 h-9 text-white" />
              </motion.div>
              
              {/* Nom */}
              <p className={`
                text-sm font-semibold mt-2 text-center
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
    </div>
  );
}
