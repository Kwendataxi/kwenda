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
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex overflow-x-auto gap-3 p-4 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          const count = productCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 whitespace-nowrap min-h-12 px-4 touch-manipulation transition-all ${
                isSelected 
                  ? 'bg-primary text-white shadow-md scale-105' 
                  : 'bg-card hover:bg-muted border-border/50'
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium">{category.name}</span>
              {count > 0 && category.id !== 'all' && (
                <Badge variant="secondary" className="ml-1 text-xs bg-primary/20 text-primary border-0">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};