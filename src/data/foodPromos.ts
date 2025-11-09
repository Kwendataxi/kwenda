import { FoodPromoOffer } from '@/components/food/FoodPromoSheet';

export const mockFoodPromos: FoodPromoOffer[] = [
  {
    id: 'kfc_chicken_box',
    restaurant_name: 'KFC Kinshasa',
    restaurant_logo: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=200&h=200&fit=crop&q=80',
    product_name: 'Chicken Lunchbox Max',
    product_image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1200&h=800&fit=crop&q=80',
    original_price: 6000,
    promo_price: 2000,
    promo_code: 'DELI2000',
    description: 'Commandez la Chicken Lunchbox Max avec 33% de REMISE — et économisez encore 2000 CFA avec le code',
    background_gradient: 'from-red-500 via-red-600 to-red-700',
    expiry_date: '2025-12-31'
  },
  {
    id: 'food_special_1',
    restaurant_name: 'Chez Maman Kolwezi',
    restaurant_logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop',
    product_name: 'Menu Complet du Jour',
    product_image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    original_price: 8000,
    promo_price: 5500,
    promo_code: 'KWENDA500',
    description: 'Profitez de notre menu complet avec boisson incluse à prix réduit — Plat du jour, riz, accompagnements et boisson fraîche',
    background_gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    expiry_date: '2025-11-30'
  },
  {
    id: 'pizza_night',
    restaurant_name: 'Pizza Corner Lubumbashi',
    restaurant_logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
    product_name: 'Pizza Familiale + Boissons',
    product_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    original_price: 12000,
    promo_price: 8000,
    promo_code: 'PIZZA33',
    description: 'Grande pizza au choix avec 4 boissons offertes — Profitez de -33% sur nos pizzas familiales ce week-end',
    background_gradient: 'from-yellow-400 via-orange-500 to-red-500',
    expiry_date: '2025-11-15'
  }
];
