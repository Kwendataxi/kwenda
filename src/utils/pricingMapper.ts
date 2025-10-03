/**
 * Mapping entre service_type (service_configurations) et vehicle_class (pricing_rules)
 * Ce fichier centralise la correspondance pour unifier le système de tarification
 */

export const SERVICE_TYPE_TO_VEHICLE_CLASS: Record<string, string> = {
  // Transport VTC
  'taxi_eco': 'eco',
  'taxi_confort': 'standard',
  'taxi_premium': 'premium',
  'taxi_moto': 'moto',
  // Delivery
  'delivery_flash': 'flash',
  'delivery_flex': 'flex',
  'delivery_maxicharge': 'maxicharge'
};

export const VEHICLE_CLASS_TO_SERVICE_TYPE: Record<string, string> = {
  // Transport VTC
  'eco': 'taxi_eco',
  'standard': 'taxi_confort',
  'premium': 'taxi_premium',
  'moto': 'taxi_moto',
  // Delivery
  'flash': 'delivery_flash',
  'flex': 'delivery_flex',
  'maxicharge': 'delivery_maxicharge'
};

/**
 * Convertit un service_type en vehicle_class
 * @param serviceType - Type de service (ex: 'taxi_eco')
 * @returns vehicle_class correspondant (ex: 'eco')
 */
export const getVehicleClass = (serviceType: string): string => {
  return SERVICE_TYPE_TO_VEHICLE_CLASS[serviceType] || 'standard';
};

/**
 * Convertit un vehicle_class en service_type
 * @param vehicleClass - Classe de véhicule (ex: 'eco')
 * @returns service_type correspondant (ex: 'taxi_eco')
 */
export const getServiceType = (vehicleClass: string): string => {
  return VEHICLE_CLASS_TO_SERVICE_TYPE[vehicleClass] || 'taxi_confort';
};
