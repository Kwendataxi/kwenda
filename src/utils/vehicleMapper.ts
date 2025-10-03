import { VehicleConfig } from '@/types/vehicle';

export const VEHICLE_TYPE_MAPPING: Record<string, VehicleConfig> = {
  // Mapping exact avec service_configurations.service_type
  'taxi_moto': {
    displayName: 'Moto-taxi',
    icon: 'Bike',
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    description: 'Transport rapide et économique par moto',
    color: '#F59E0B'
  },
  'taxi_eco': {
    displayName: 'Éco',
    icon: 'Car',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    description: 'Option économique pour vos déplacements',
    color: '#10B981'
  },
  'taxi_confort': {
    displayName: 'Confort',
    icon: 'Car',
    gradient: 'from-blue-500 via-sky-500 to-blue-600',
    description: 'Confort et qualité pour vos trajets',
    color: '#3B82F6'
  },
  'taxi_premium': {
    displayName: 'Premium',
    icon: 'Car',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    description: 'Luxe et prestige pour une expérience unique',
    color: '#8B5CF6'
  }
};

export const getVehicleConfig = (vehicleType: string): VehicleConfig => {
  return VEHICLE_TYPE_MAPPING[vehicleType] || {
    displayName: vehicleType,
    icon: 'Car',
    gradient: 'from-gray-400 to-gray-500',
    description: 'Véhicule standard',
    color: '#9CA3AF'
  };
};
