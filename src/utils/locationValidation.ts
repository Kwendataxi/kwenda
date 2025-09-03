/**
 * Utilitaires de validation et sécurisation des coordonnées
 * Prévient l'erreur "Cannot read properties of undefined (reading 'lat')"
 */

import type { LocationData } from '@/types/location';

export interface ValidatedLocation {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database';
  placeId?: string;
  name?: string;
  subtitle?: string;
  coordinates?: { lat: number; lng: number };
}

// Coordonnées par défaut sécurisées pour chaque ville
export const DEFAULT_COORDINATES = {
  'Kinshasa': { lat: -4.3217, lng: 15.3069 },
  'Lubumbashi': { lat: -11.6708, lng: 27.4794 },
  'Kolwezi': { lat: -10.7158, lng: 25.4664 },
  'Abidjan': { lat: 5.3600, lng: -4.0083 }
} as const;

/**
 * Vérifie si une location a des coordonnées valides
 */
export function isValidLocation(location: any): location is ValidatedLocation {
  if (!location) return false;
  
  // Vérifications strictes
  const hasLat = typeof location.lat === 'number' && !isNaN(location.lat);
  const hasLng = typeof location.lng === 'number' && !isNaN(location.lng);
  const hasAddress = typeof location.address === 'string' && location.address.length > 0;
  
  // Vérifier les ranges valides
  const validLatRange = hasLat && location.lat >= -90 && location.lat <= 90;
  const validLngRange = hasLng && location.lng >= -180 && location.lng <= 180;
  
  return hasAddress && validLatRange && validLngRange;
}

/**
 * Sécurise une location en ajoutant des coordonnées par défaut si nécessaire
 */
export function secureLocation(location: any, city: string = 'Kinshasa'): ValidatedLocation {
  if (!location) {
    const defaultCoords = DEFAULT_COORDINATES[city as keyof typeof DEFAULT_COORDINATES] || DEFAULT_COORDINATES.Kinshasa;
    return {
      address: `Position par défaut - ${city}`,
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      type: 'fallback',
      coordinates: defaultCoords
    };
  }

  // Si location valide, retourner telle quelle
  if (isValidLocation(location)) {
    return {
      ...location,
      coordinates: { lat: location.lat, lng: location.lng }
    };
  }

  // Réparer location invalide
  const defaultCoords = DEFAULT_COORDINATES[city as keyof typeof DEFAULT_COORDINATES] || DEFAULT_COORDINATES.Kinshasa;
  
  return {
    address: location.address || `Position corrigée - ${city}`,
    lat: typeof location.lat === 'number' && !isNaN(location.lat) ? location.lat : defaultCoords.lat,
    lng: typeof location.lng === 'number' && !isNaN(location.lng) ? location.lng : defaultCoords.lng,
    type: location.type || 'fallback',
    placeId: location.placeId,
    name: location.name,
    subtitle: location.subtitle,
    coordinates: {
      lat: typeof location.lat === 'number' && !isNaN(location.lat) ? location.lat : defaultCoords.lat,
      lng: typeof location.lng === 'number' && !isNaN(location.lng) ? location.lng : defaultCoords.lng
    }
  };
}

/**
 * Calcule la distance entre deux points en km (Haversine)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Valide et calcule le prix de base selon la distance
 */
export function calculateBasePrice(
  pickup: ValidatedLocation, 
  destination: ValidatedLocation, 
  serviceType: 'flash' | 'flex' | 'maxicharge'
): { price: number; distance: number; duration: number } {
  // Prix de base sécurisés
  const basePrices = {
    flash: 5000,
    flex: 7000,
    maxicharge: 12000
  };

  // Tarifs par km
  const kmRates = {
    flash: 500,
    flex: 400,
    maxicharge: 600
  };

  try {
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const basePrice = basePrices[serviceType];
    const kmPrice = distance * kmRates[serviceType];
    const totalPrice = Math.round(basePrice + kmPrice);
    
    // Durée estimée : 2 km/min pour flash, 1.5 km/min pour autres
    const speed = serviceType === 'flash' ? 2 : 1.5;
    const duration = Math.max(10, Math.round(distance / speed * 60)); // minimum 10 min
    
    return {
      price: totalPrice,
      distance: Math.round(distance * 10) / 10, // 1 décimale
      duration
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    return {
      price: basePrices[serviceType],
      distance: 0,
      duration: 30
    };
  }
}

/**
 * Conversion sécurisée UnifiedLocation vers LocationData
 */
export function unifiedToLocationData(unified: any): LocationData {
  const secured = secureLocation({
    address: unified?.address || unified?.name || '',
    lat: unified?.lat || unified?.coordinates?.lat,
    lng: unified?.lng || unified?.coordinates?.lng,
    type: unified?.type,
    placeId: unified?.placeId,
    name: unified?.name,
    subtitle: unified?.subtitle
  });
  
  return {
    address: secured.address,
    lat: secured.lat,
    lng: secured.lng,
    type: secured.type,
    placeId: secured.placeId,
    accuracy: 1
  };
}