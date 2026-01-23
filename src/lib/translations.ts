// Translation system with named parameter interpolation

export type Language = 'fr' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // General
    'app.name': 'Kwenda',
    'app.tagline': 'Votre mobilité simplifiée',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.transport': 'Transport',
    'nav.delivery': 'Livraison',
    'nav.marketplace': 'Shop',
    'nav.profile': 'Profil',
    
    // Transport
    'transport.booking.title': 'Réserver un taxi',
    'transport.pickup': 'Point de départ',
    'transport.destination': 'Destination',
    'transport.vehicle.standard': 'Standard',
    'transport.vehicle.premium': 'Premium',
    'transport.vehicle.vip': 'VIP',
    'transport.confirm': 'Confirmer la course',
    'transport.searching': 'Recherche d\'un chauffeur...',
    'transport.driver.found': 'Chauffeur trouvé !',
    'transport.driver.arriving': 'Votre chauffeur arrive dans {minutes} min',
    
    // Delivery
    'delivery.title': 'Envoyer un colis',
    'delivery.pickup': 'Adresse d\'enlèvement',
    'delivery.dropoff': 'Adresse de livraison',
    'delivery.type.flash': 'Flash',
    'delivery.type.flex': 'Flex',
    'delivery.type.maxicharge': 'Maxicharge',
    'delivery.confirm': 'Confirmer la livraison',
    
    // Location
    'location.detecting': 'Détection de votre position...',
    'location.error': 'Impossible de détecter votre position',
    'location.unsupported': 'Zone non couverte : {city}',
    'location.permission.denied': 'Accès à la localisation refusé',
    'location.retry': 'Réessayer',
    
    // Errors
    'error.network': 'Erreur de connexion',
    'error.generic': 'Une erreur est survenue',
    'error.retry': 'Réessayer',
    
    // Auth
    'auth.login': 'Se connecter',
    'auth.logout': 'Se déconnecter',
    'auth.register': 'Créer un compte',
    
    // Wallet
    'wallet.balance': 'Solde',
    'wallet.topup': 'Recharger',
    'wallet.insufficient': 'Solde insuffisant'
  },
  en: {
    // General
    'app.name': 'Kwenda',
    'app.tagline': 'Your mobility simplified',
    
    // Navigation
    'nav.home': 'Home',
    'nav.transport': 'Transport',
    'nav.delivery': 'Delivery',
    'nav.marketplace': 'Shop',
    'nav.profile': 'Profile',
    
    // Transport
    'transport.booking.title': 'Book a taxi',
    'transport.pickup': 'Pickup location',
    'transport.destination': 'Destination',
    'transport.vehicle.standard': 'Standard',
    'transport.vehicle.premium': 'Premium',
    'transport.vehicle.vip': 'VIP',
    'transport.confirm': 'Confirm ride',
    'transport.searching': 'Searching for a driver...',
    'transport.driver.found': 'Driver found!',
    'transport.driver.arriving': 'Your driver arrives in {minutes} min',
    
    // Delivery
    'delivery.title': 'Send a package',
    'delivery.pickup': 'Pickup address',
    'delivery.dropoff': 'Delivery address',
    'delivery.type.flash': 'Flash',
    'delivery.type.flex': 'Flex',
    'delivery.type.maxicharge': 'Maxicharge',
    'delivery.confirm': 'Confirm delivery',
    
    // Location
    'location.detecting': 'Detecting your location...',
    'location.error': 'Unable to detect your location',
    'location.unsupported': 'Unsupported area: {city}',
    'location.permission.denied': 'Location access denied',
    'location.retry': 'Retry',
    
    // Errors
    'error.network': 'Connection error',
    'error.generic': 'An error occurred',
    'error.retry': 'Retry',
    
    // Auth
    'auth.login': 'Sign in',
    'auth.logout': 'Sign out',
    'auth.register': 'Create account',
    
    // Wallet
    'wallet.balance': 'Balance',
    'wallet.topup': 'Top up',
    'wallet.insufficient': 'Insufficient balance'
  }
};

/**
 * Interpolate translation string with named parameters
 * Supports both {name} and {0}, {1} style placeholders
 */
export const interpolate = (text: string, params?: Record<string, any> | any[]): string => {
  if (!params) return text;
  
  if (Array.isArray(params)) {
    // Support for positional params {0}, {1}, etc.
    return text.replace(/\{(\d+)\}/g, (match, index) => {
      const value = params[parseInt(index, 10)];
      return value !== undefined ? String(value) : match;
    });
  }
  
  // Support for named params {city}, {name}, etc.
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
};

/**
 * Get translation with interpolation
 */
export const getTranslation = (
  key: string,
  language: Language = 'fr',
  params?: Record<string, any> | any[]
): string => {
  const translation = translations[language]?.[key] || translations.fr[key] || key;
  return interpolate(translation, params);
};
