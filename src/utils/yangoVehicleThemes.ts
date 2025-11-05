import { Car, Bike, Crown, Zap } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface YangoVehicleTheme {
  gradient: string;
  solidColor: string;
  bgColor: string;
  icon: LucideIcon;
  labelColor: string;
}

export const YANGO_VEHICLE_THEMES: Record<string, YangoVehicleTheme> = {
  'taxi_moto': {
    gradient: 'linear-gradient(135deg, #FFA726 0%, #FF6F00 100%)',
    solidColor: '#FF8F00',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    icon: Bike,
    labelColor: 'text-orange-600'
  },
  'taxi_eco': {
    gradient: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
    solidColor: '#4CAF50',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    icon: Car,
    labelColor: 'text-green-600'
  },
  'taxi_confort': {
    gradient: 'linear-gradient(135deg, #42A5F5 0%, #1565C0 100%)',
    solidColor: '#1976D2',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    icon: Car,
    labelColor: 'text-blue-600'
  },
  'taxi_premium': {
    gradient: 'linear-gradient(135deg, #7E57C2 0%, #4527A0 100%)',
    solidColor: '#5E35B1',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    icon: Crown,
    labelColor: 'text-purple-600'
  },
  'taxi_flash': {
    gradient: 'linear-gradient(135deg, #FF5722 0%, #D32F2F 100%)',
    solidColor: '#F44336',
    bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
    icon: Zap,
    labelColor: 'text-red-600'
  }
};

export const getYangoTheme = (vehicleType: string): YangoVehicleTheme => {
  return YANGO_VEHICLE_THEMES[vehicleType] || YANGO_VEHICLE_THEMES['taxi_eco'];
};
