import { logger } from './logger';

/**
 * 📏 UTILITAIRES DE CALCUL DE DISTANCE ET DURÉE
 * Calculs géographiques et estimations de temps de trajet
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripTiming {
  pickup_time?: string | null;
  trip_started_at?: string | null;
  completion_time?: string | null;
  delivered_at?: string | null;
}

/**
 * Calcule la distance entre deux points géographiques (Haversine)
 * @returns Distance en kilomètres
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Rayon de la Terre en km
  
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 2 décimales
}

/**
 * Convertit des degrés en radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcule la distance depuis des coordonnées JSON
 */
export function calculateDistanceFromCoordinates(
  pickupCoords: any,
  deliveryCoords: any
): number {
  try {
    if (!pickupCoords || !deliveryCoords) {
      logger.warn('Coordonnées manquantes pour calcul distance');
      return 0;
    }

    const pickup = {
      lat: Number(pickupCoords.lat),
      lng: Number(pickupCoords.lng)
    };

    const delivery = {
      lat: Number(deliveryCoords.lat),
      lng: Number(deliveryCoords.lng)
    };

    if (isNaN(pickup.lat) || isNaN(pickup.lng) || isNaN(delivery.lat) || isNaN(delivery.lng)) {
      logger.warn('Coordonnées invalides', { pickupCoords, deliveryCoords });
      return 0;
    }

    return calculateDistance(pickup, delivery);
  } catch (error) {
    logger.error('Erreur calcul distance', error);
    return 0;
  }
}

/**
 * Calcule la durée d'un trajet depuis les timestamps
 * @returns Durée formatée (ex: "15 min", "1h 23min")
 */
export function calculateTripDuration(timing: TripTiming): string {
  try {
    const startTime = timing.trip_started_at || timing.pickup_time;
    const endTime = timing.completion_time || timing.delivered_at;

    if (!startTime || !endTime) {
      return 'N/A';
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    if (isNaN(start) || isNaN(end)) {
      return 'N/A';
    }

    const durationMs = end - start;
    
    if (durationMs < 0) {
      logger.warn('Durée négative détectée', { startTime, endTime });
      return 'N/A';
    }

    return formatDuration(durationMs);
  } catch (error) {
    logger.error('Erreur calcul durée', error);
    return 'N/A';
  }
}

/**
 * Formate une durée en millisecondes en texte lisible
 */
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}min` 
      : `${hours}h`;
  }
  
  return `${minutes} min`;
}

/**
 * Estime le temps de trajet basé sur la distance
 * Vitesse moyenne en ville: 25 km/h
 */
export function estimateTripDuration(distanceKm: number): string {
  const AVERAGE_SPEED_KMH = 25;
  const hours = distanceKm / AVERAGE_SPEED_KMH;
  const durationMs = hours * 60 * 60 * 1000;
  return formatDuration(durationMs);
}

/**
 * Formatte une distance pour affichage
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
