export const VEHICLE_FALLBACK_IMAGES: Record<string, string> = {
  // Images par catégorie de confort
  'Économique': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop&q=80',
  'Standard': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop&q=80',
  'Confort': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop&q=80',
  'Premium': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop&q=80',
  'Luxe': 'https://images.unsplash.com/photo-1563720223809-1b5e7e2c74d7?w=600&h=400&fit=crop&q=80',
  
  // Fallback général
  'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop&q=80'
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  'Économique': 'from-green-400 to-green-600',
  'Standard': 'from-blue-400 to-blue-600',
  'Confort': 'from-purple-400 to-purple-600',
  'Premium': 'from-orange-400 to-orange-600',
  'Luxe': 'from-pink-400 to-pink-600',
  'default': 'from-gray-400 to-gray-600'
};

export const getVehicleImage = (vehicle: any): string => {
  // Si l'image existe et n'est pas placeholder
  if (vehicle.images?.[0] && vehicle.images[0] !== '/placeholder.svg') {
    return vehicle.images[0];
  }
  
  // Sinon, utiliser l'image par catégorie
  return VEHICLE_FALLBACK_IMAGES[vehicle.comfort_level] || VEHICLE_FALLBACK_IMAGES.default;
};

export const getVehicleGradient = (vehicle: any): string => {
  return CATEGORY_GRADIENTS[vehicle.comfort_level] || CATEGORY_GRADIENTS.default;
};
