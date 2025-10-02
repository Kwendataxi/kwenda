import { VehicleConfig } from '@/types/vehicle';

export const VEHICLE_TYPE_MAPPING: Record<string, VehicleConfig> = {
  'eco': {
    displayName: 'Éco',
    icon: 'Car',
    gradient: 'from-emerald-400 via-green-400 to-emerald-500',
    description: 'Économique et pratique'
  },
  'confort': {
    displayName: 'Taxi',
    icon: 'Car',
    gradient: 'from-blue-400 via-sky-400 to-blue-500',
    description: 'Confortable et fiable'
  },
  'moto': {
    displayName: 'Moto',
    icon: 'Bike',
    gradient: 'from-amber-400 via-yellow-400 to-amber-500',
    description: 'Rapide et agile'
  },
  'premium': {
    displayName: 'Premium',
    icon: 'Car',
    gradient: 'from-purple-400 via-violet-400 to-purple-500',
    description: 'Luxe et confort'
  },
  'standard': {
    displayName: 'Standard',
    icon: 'Car',
    gradient: 'from-blue-400 via-cyan-400 to-blue-500',
    description: 'Confortable et climatisé'
  }
};

export const getVehicleConfig = (vehicleType: string): VehicleConfig => {
  return VEHICLE_TYPE_MAPPING[vehicleType] || {
    displayName: vehicleType,
    icon: 'Car',
    gradient: 'from-gray-400 to-gray-500',
    description: 'Véhicule standard'
  };
};
