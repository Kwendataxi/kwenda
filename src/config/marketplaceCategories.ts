import { 
  Smartphone, 
  Shirt, 
  Home, 
  Car, 
  Baby, 
  Gamepad2, 
  Book, 
  Apple,
  Sparkles,
  Dumbbell,
  type LucideIcon
} from 'lucide-react';

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  subcategories?: string[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'all',
    name: 'Tout',
    icon: Apple, // Icône par défaut pour "Tout"
  },
  {
    id: 'electronics',
    name: 'Électronique',
    icon: Smartphone,
    subcategories: ['Smartphones', 'Ordinateurs', 'Tablettes', 'Accessoires', 'Audio/Vidéo']
  },
  {
    id: 'fashion',
    name: 'Mode & Vêtements',
    icon: Shirt,
    subcategories: ['Hommes', 'Femmes', 'Enfants', 'Chaussures', 'Accessoires']
  },
  {
    id: 'home',
    name: 'Maison & Jardin',
    icon: Home,
    subcategories: ['Meubles', 'Décoration', 'Électroménager', 'Cuisine', 'Jardin']
  },
  {
    id: 'beauty',
    name: 'Beauté & Santé',
    icon: Sparkles,
    subcategories: ['Cosmétiques', 'Parfums', 'Soins', 'Hygiène']
  },
  {
    id: 'sports',
    name: 'Sports & Loisirs',
    icon: Dumbbell,
    subcategories: ['Équipements sportifs', 'Vêtements sport', 'Outdoor', 'Fitness']
  },
  {
    id: 'food',
    name: 'Alimentation',
    icon: Apple,
    subcategories: ['Fruits & Légumes', 'Épicerie', 'Boissons', 'Produits frais']
  },
  {
    id: 'auto',
    name: 'Automobile',
    icon: Car,
    subcategories: ['Pièces détachées', 'Accessoires', 'Entretien', 'Outillage']
  },
  {
    id: 'books',
    name: 'Livres & Éducation',
    icon: Book,
    subcategories: ['Livres', 'Fournitures scolaires', 'Manuels', 'Romans']
  },
  {
    id: 'baby',
    name: 'Jouets & Bébé',
    icon: Baby,
    subcategories: ['Jouets', 'Vêtements bébé', 'Puériculture', 'Jeux éducatifs']
  },
  {
    id: 'games',
    name: 'Jeux Vidéo',
    icon: Gamepad2,
    subcategories: ['Consoles', 'Jeux', 'Accessoires gaming', 'PC Gaming']
  }
];

export const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
  { value: 'refurbished', label: 'Reconditionné' }
];

export const getCategoryById = (id: string): MarketplaceCategory | undefined => {
  return MARKETPLACE_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || 'Catégorie inconnue';
};

export const getConditionLabel = (value: string): string => {
  const condition = PRODUCT_CONDITIONS.find(c => c.value === value);
  return condition?.label || value;
};
