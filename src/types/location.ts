// Interface unifiée pour toutes les locations
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback';
  placeId?: string;
  accuracy?: number;
}

// Format de retour pour les résultats de recherche
export interface SearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
}

// Interface pour les coordonnées simples
export interface Coordinates {
  lat: number;
  lng: number;
}

// Interface pour les prix de livraison
export interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
  mode: 'flash' | 'flex' | 'maxicharge';
}