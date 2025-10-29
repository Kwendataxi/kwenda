/**
 * Types unifiés pour la marketplace Kwenda
 * Évite les conflits entre Product/HorizontalProduct/CartItem
 */

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  image: string; // Première image (helper pour compatibilité)
  category: string;
  condition: string;
  seller_id: string;
  seller: { display_name: string };
  location: string;
  coordinates?: { lat: number; lng: number };
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviews: number;
  brand?: string;
  specifications?: Record<string, any>;
  viewCount?: number;
  salesCount?: number;
  popularityScore?: number;
  created_at?: string;
  moderation_status: string;
  status?: string;
}

export interface CartItem {
  id: string;
  product_id?: string; // ID du produit dans la DB (optionnel pour rétrocompatibilité)
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
  seller_id: string;
  coordinates?: { lat: number; lng: number };
  // Propriétés optionnelles pour compatibilité avec différents contextes
  originalPrice?: number;
  category?: string;
  isAvailable?: boolean;
}

export interface HorizontalProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  seller: string;
  sellerId: string;
  isAvailable: boolean;
  location?: { lat: number; lng: number };
}

// Helper pour convertir MarketplaceProduct → CartItem
export const productToCartItem = (product: MarketplaceProduct, quantity: number = 1): CartItem => ({
  id: product.id,
  product_id: product.id, // Ajouter product_id explicitement
  name: product.title,
  price: product.price,
  image: product.images[0] || '',
  quantity,
  seller: product.seller.display_name,
  seller_id: product.seller_id,
  coordinates: product.coordinates,
});
