import React from 'react';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  icon: string;
  filter: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', icon: '🍽️', filter: '' },
  { id: 'burger', name: 'Burgers', icon: '🍔', filter: 'Fast-food' },
  { id: 'pizza', name: 'Pizza', icon: '🍕', filter: 'Italien' },
  { id: 'grill', name: 'Grillades', icon: '🍗', filter: 'Grill' },
  { id: 'african', name: 'Africain', icon: '🍜', filter: 'Africain' },
  { id: 'dessert', name: 'Desserts', icon: '🍰', filter: 'Dessert' },
  { id: 'drinks', name: 'Boissons', icon: '☕', filter: 'Boisson' },
  { id: 'asian', name: 'Asiatique', icon: '🍱', filter: 'Asiatique' },
  { id: 'seafood', name: 'Poissons', icon: '🐟', filter: 'Fruits de mer' },
];

interface CategoryIconsSectionProps {
  activeCategory: string;
  onCategorySelect: (filter: string) => void;
}

export const CategoryIconsSection: React.FC<CategoryIconsSectionProps> = ({
  activeCategory,
  onCategorySelect,
}) => {
  return (
    <section className="py-4">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">Catégories 🍕</h2>
      </div>
      
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.filter;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onCategorySelect(category.filter)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1.5 min-w-[70px] p-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <div className="text-3xl">{category.icon}</div>
              <span className="text-xs font-medium whitespace-nowrap">
                {category.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
