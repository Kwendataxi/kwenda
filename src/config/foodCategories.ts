import { 
  Utensils, 
  Coffee, 
  IceCream, 
  Wine,
  type LucideIcon 
} from 'lucide-react';

export interface FoodCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  description?: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    id: 'entrees',
    name: 'Entrées',
    icon: Utensils,
    description: 'Salades, soupes, amuse-bouches'
  },
  {
    id: 'plats',
    name: 'Plats',
    icon: Utensils,
    description: 'Plats principaux, viandes, poissons'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    icon: IceCream,
    description: 'Pâtisseries, glaces, fruits'
  },
  {
    id: 'boissons',
    name: 'Boissons',
    icon: Wine,
    description: 'Boissons chaudes, froides, alcoolisées'
  }
];

export const getCategoryById = (id: string): FoodCategory | undefined => {
  return FOOD_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || 'Catégorie inconnue';
};
