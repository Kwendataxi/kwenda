import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Smartphone, Shirt, Home, Car, Baby, Gamepad2, Book, Apple } from 'lucide-react';

const categories = [
  { id: 'all', name: 'Tout', icon: null },
  { id: 'electronics', name: 'Électronique', icon: Smartphone },
  { id: 'fashion', name: 'Mode', icon: Shirt },
  { id: 'home', name: 'Maison', icon: Home },
  { id: 'auto', name: 'Auto', icon: Car },
  { id: 'baby', name: 'Bébé', icon: Baby },
  { id: 'games', name: 'Jeux', icon: Gamepad2 },
  { id: 'books', name: 'Livres', icon: Book },
  { id: 'food', name: 'Alimentation', icon: Apple },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  productCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange,
  productCounts = {}
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30">
      {categories.map((category) => {
        const Icon = category.icon;
        const count = productCounts[category.id] || 0;
        const isSelected = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2 relative"
            onClick={() => onCategoryChange(category.id)}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {category.name}
            {count > 0 && category.id !== 'all' && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};