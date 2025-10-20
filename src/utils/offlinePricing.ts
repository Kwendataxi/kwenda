/**
 * Calculs de tarification offline
 * Utilise formules Haversine et tables de tarifs statiques
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface PricingResult {
  price: number;
  distance: number;
  duration: number;
  currency: string;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance entre deux points avec formule Haversine
 */
export const calculateOfflineDistance = (pointA: Coordinates, pointB: Coordinates): number => {
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.lat)) *
      Math.cos(toRad(pointB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Tarifs statiques par ville et service
 */
const tarifsOffline: Record<string, Record<string, { base: number; perKm: number; currency: string }>> = {
  kinshasa: {
    moto_taxi: { base: 1500, perKm: 500, currency: 'CDF' },
    taxi_bus: { base: 300, perKm: 100, currency: 'CDF' },
    vtc_prive: { base: 3000, perKm: 800, currency: 'CDF' },
    delivery_flash: { base: 5000, perKm: 500, currency: 'CDF' },
    delivery_flex: { base: 3000, perKm: 300, currency: 'CDF' },
    delivery_maxicharge: { base: 8000, perKm: 800, currency: 'CDF' }
  },
  lubumbashi: {
    taxi_prive: { base: 3600, perKm: 960, currency: 'CDF' },
    delivery_flash: { base: 6000, perKm: 600, currency: 'CDF' },
    delivery_flex: { base: 3600, perKm: 360, currency: 'CDF' },
    delivery_maxicharge: { base: 9600, perKm: 960, currency: 'CDF' }
  },
  kolwezi: {
    taxi_prive: { base: 3300, perKm: 880, currency: 'CDF' },
    delivery_flash: { base: 5500, perKm: 550, currency: 'CDF' },
    delivery_flex: { base: 3300, perKm: 330, currency: 'CDF' },
    delivery_maxicharge: { base: 8800, perKm: 880, currency: 'CDF' }
  },
  abidjan: {
    moto_taxi: { base: 500, perKm: 200, currency: 'XOF' },
    taxi_prive: { base: 1000, perKm: 300, currency: 'XOF' },
    delivery_flash: { base: 1500, perKm: 200, currency: 'XOF' },
    delivery_flex: { base: 1000, perKm: 100, currency: 'XOF' }
  }
};

/**
 * Vitesses moyennes par ville (km/h)
 */
const averageSpeedByCity: Record<string, number> = {
  kinshasa: 20,
  lubumbashi: 25,
  kolwezi: 30,
  abidjan: 18
};

/**
 * Calcule le tarif offline pour un trajet
 */
export const getOfflineTarif = (
  city: string,
  serviceType: string,
  distance: number
): PricingResult | null => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  if (!cityTarifs) return null;

  const tarif = cityTarifs[serviceType.toLowerCase()];
  if (!tarif) return null;

  const price = tarif.base + distance * tarif.perKm;
  const duration = estimateOfflineDuration(distance, city);

  return {
    price: Math.round(price),
    distance: Math.round(distance * 100) / 100,
    duration,
    currency: tarif.currency
  };
};

/**
 * Estime la durée du trajet en minutes
 */
export const estimateOfflineDuration = (distanceKm: number, city: string): number => {
  const speed = averageSpeedByCity[city.toLowerCase()] || 20;
  const hours = distanceKm / speed;
  return Math.round(hours * 60);
};

/**
 * Calcule le prix total d'un trajet offline
 */
export const calculateOfflinePrice = (
  pickupCoords: Coordinates,
  deliveryCoords: Coordinates,
  city: string,
  serviceType: string
): PricingResult | null => {
  const distance = calculateOfflineDistance(pickupCoords, deliveryCoords);
  return getOfflineTarif(city, serviceType, distance);
};

/**
 * Vérifie si les tarifs offline sont disponibles
 */
export const hasOfflineTarifs = (city: string, serviceType: string): boolean => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  if (!cityTarifs) return false;
  return !!cityTarifs[serviceType.toLowerCase()];
};

/**
 * Obtient tous les services disponibles offline pour une ville
 */
export const getAvailableOfflineServices = (city: string): string[] => {
  const cityTarifs = tarifsOffline[city.toLowerCase()];
  return cityTarifs ? Object.keys(cityTarifs) : [];
};
