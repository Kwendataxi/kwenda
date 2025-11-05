import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const vehicleTypes = [
  {
    id: 'taxi_eco',
    name: 'Course',
    icon: '🚗',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900'
  },
  {
    id: 'taxi_confort',
    name: 'Confort',
    icon: '🚙',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900'
  },
  {
    id: 'taxi_premium',
    name: 'Express',
    icon: '⚡',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-900',
    isNew: true
  },
  {
    id: 'taxi_moto',
    name: 'Ville en Ville',
    icon: '🧳',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-900'
  }
];

interface VehicleTypeSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function VehicleTypeSelector({ selected, onSelect }: VehicleTypeSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
      {vehicleTypes.map((vehicle) => (
        <motion.button
          key={vehicle.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(vehicle.id)}
          className={`
            relative flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all
            ${selected === vehicle.id 
              ? `${vehicle.bgColor} ${vehicle.borderColor} shadow-md` 
              : 'bg-white border-border'
            }
          `}
        >
          {vehicle.isNew && (
            <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-0.5 shadow-md">
              New
            </Badge>
          )}
          
          <div className="text-3xl mb-1">{vehicle.icon}</div>
          
          <p className={`text-xs font-semibold ${selected === vehicle.id ? vehicle.textColor : 'text-foreground'}`}>
            {vehicle.name}
          </p>
        </motion.button>
      ))}
    </div>
  );
}
