/**
 * Hook de géolocalisation simplifié - DÉPRÉCIÉ
 * Utiliser useUnifiedLocation à la place
 * @deprecated Utiliser useUnifiedLocation
 */

// Re-export du nouveau hook unifié pour compatibilité
export { useUnifiedLocation as useSimpleLocation, type LocationData, type SimpleLocationSearchResult as LocationSearchResult } from './useUnifiedLocation';

// Le contenu a été déplacé vers useUnifiedLocation.ts pour éviter les conflits de types