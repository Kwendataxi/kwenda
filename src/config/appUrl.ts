/**
 * Configuration centralisée des URLs de l'application
 * Utilise le domaine de production par défaut pour les partages
 */

// URL de production (domaine personnalisé)
const PRODUCTION_URL = 'https://kwenda.app';

/**
 * Retourne l'URL de base à utiliser pour les partages et liens publics
 * @returns URL de base (production par défaut)
 */
export const getAppBaseUrl = (): string => {
  // En production ou staging, toujours utiliser l'URL de production
  // pour que les liens partagés pointent vers kwenda.app
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // Si on est en développement local (localhost), utiliser l'URL locale
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return window.location.origin;
    }
  }
  
  // Par défaut, toujours retourner l'URL de production
  return PRODUCTION_URL;
};

/**
 * Génère une URL complète pour le partage d'une boutique
 * @param vendorId ID du vendeur
 * @returns URL complète de la boutique
 */
export const getVendorShopUrl = (vendorId: string): string => {
  return `${getAppBaseUrl()}/marketplace/shop/${vendorId}`;
};

/**
 * Génère une URL complète pour le partage d'un produit
 * @param productId ID du produit
 * @returns URL complète du produit
 */
export const getProductUrl = (productId: string): string => {
  return `${getAppBaseUrl()}/marketplace/product/${productId}`;
};

/**
 * Génère une URL complète pour le tracking d'une course
 * @param trackingType Type de tracking (transport/delivery)
 * @param trackingId ID de tracking
 * @returns URL complète de tracking
 */
export const getTrackingUrl = (trackingType: string, trackingId: string): string => {
  return `${getAppBaseUrl()}/tracking/${trackingType}/${trackingId}`;
};

/**
 * Génère une URL complète pour un partage de trajet
 * @param shareId ID de partage
 * @returns URL complète de partage de trajet
 */
export const getSharedTripUrl = (shareId: string): string => {
  return `${getAppBaseUrl()}/shared-trip/${shareId}`;
};

/**
 * Génère une URL complète pour le partage d'un restaurant
 * @param restaurantId ID du restaurant
 * @returns URL complète du restaurant
 */
export const getRestaurantUrl = (restaurantId: string): string => {
  return `${getAppBaseUrl()}/food/restaurant/${restaurantId}`;
};
