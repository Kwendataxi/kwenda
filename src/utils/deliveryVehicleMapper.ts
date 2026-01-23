/**
 * Mapping des types de livraison vers les classes de véhicules
 * Utilisé pour filtrer les chauffeurs appropriés selon le type de commande
 */

export type DeliveryType = 'flash' | 'flex' | 'maxicharge';
export type VehicleClass = 'moto' | 'standard' | 'truck';

export const DELIVERY_TO_VEHICLE_MAPPING: Record<DeliveryType, VehicleClass> = {
  'flash': 'moto',        // Livraison express → Moto-taxi
  'flex': 'standard',     // Livraison standard → Véhicule standard
  'maxicharge': 'truck'   // Gros colis → Camion/Truck
};

/**
 * Convertit un type de livraison en classe de véhicule requise
 */
export const getVehicleClassForDelivery = (deliveryType: string): VehicleClass | null => {
  const normalizedType = deliveryType.toLowerCase() as DeliveryType;
  return DELIVERY_TO_VEHICLE_MAPPING[normalizedType] || null;
};

/**
 * Vérifie si un véhicule peut gérer un type de livraison
 */
export const canVehicleHandleDelivery = (
  vehicleClass: string, 
  deliveryType: string
): boolean => {
  const requiredClass = getVehicleClassForDelivery(deliveryType);
  if (!requiredClass) return false;
  
  // Une moto ne peut pas faire maxicharge
  if (deliveryType === 'maxicharge' && vehicleClass === 'moto') {
    return false;
  }
  
  // Un truck/standard peut faire flex et maxicharge
  if (vehicleClass === 'truck' || vehicleClass === 'standard') {
    return deliveryType === 'flex' || deliveryType === 'maxicharge';
  }
  
  // Une moto peut faire flash et flex
  if (vehicleClass === 'moto') {
    return deliveryType === 'flash' || deliveryType === 'flex';
  }
  
  return vehicleClass === requiredClass;
};

/**
 * Labels français pour les classes de véhicules
 */
export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  'moto': 'Moto-taxi',
  'standard': 'Véhicule standard',
  'truck': 'Camion'
};
