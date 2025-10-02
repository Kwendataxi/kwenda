export interface VehicleType {
  id: string;
  name: string;
  description: string;
  icon: 'Car' | 'Bike' | 'Bus' | 'Truck';
  gradient: string;
  basePrice: number;
  pricePerKm: number;
  calculatedPrice: number;
  eta: number;
  features: string[];
  capacity: number;
  available: boolean;
  isPopular?: boolean;
}

export interface VehicleConfig {
  displayName: string;
  icon: 'Car' | 'Bike' | 'Bus' | 'Truck';
  gradient: string;
  description: string;
}
