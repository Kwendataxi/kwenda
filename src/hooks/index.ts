/**
 * 🎯 INDEX DES HOOKS DE GÉOLOCALISATION UNIFIÉS
 * 
 * Point d'entrée centralisé pour tous les hooks de géolocalisation Kwenda
 * Système unifié basé sur useSmartGeolocation
 */

// Hook principal et moderne - RECOMMANDÉ
export { useSmartGeolocation } from './useSmartGeolocation';
export type { 
  LocationData, 
  LocationSearchResult, 
  GeolocationOptions 
} from './useSmartGeolocation';

// Hooks de compatibilité - Tous redirigent vers useSmartGeolocation
export { useSimpleLocation } from './useSimpleLocation';
export { useMasterLocation } from './useMasterLocation';
export { useUnifiedLocation } from './useUnifiedLocation';
export { useEnhancedLocation } from './useEnhancedLocation';
export { useIntelligentLocation } from './useIntelligentLocation';
export { useGeolocation } from './useGeolocation';

// Types unifiés
export type { UnifiedLocation, UnifiedCoordinates } from '@/types/unifiedLocation';

/**
 * 🔥 MIGRATION GUIDE:
 * 
 * Ancien hook → Nouveau hook
 * ----------------------
 * useSimpleLocation    → useSmartGeolocation ✅
 * useMasterLocation    → useSmartGeolocation ✅
 * useUnifiedLocation   → useSmartGeolocation ✅
 * useEnhancedLocation  → useSmartGeolocation ✅
 * useIntelligentLocation → useSmartGeolocation ✅
 * useGeolocation       → useSmartGeolocation ✅
 * 
 * 🎯 UTILISATION RECOMMANDÉE:
 * import { useSmartGeolocation } from '@/hooks';
 * 
 * Fonctionnalités unifiées:
 * - getCurrentPosition() : Position actuelle avec fallbacks
 * - searchLocations(query) : Recherche intelligente
 * - getPopularPlaces() : Lieux populaires par ville
 * - calculateDistance() & formatDistance() : Calculs
 * - Détection automatique de ville
 * - Cache intelligent
 * - Fallbacks robustes (GPS → IP → Database → Default)
 */