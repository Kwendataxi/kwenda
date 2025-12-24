import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { FoodProduct } from '@/types/food';

interface RestaurantMenuNavProps {
  products: FoodProduct[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const categoryIcons: Record<string, string> = {
  'Entrées': '🥗',
  'Plats': '🍽️',
  'Desserts': '🍰',
  'Boissons': '🥤',
  'Pizzas': '🍕',
  'Burgers': '🍔',
  'Grillades': '🍖',
  'Poisson': '🐟',
  'Poulet': '🍗',
  'Végétarien': '🥬',
  'Petit-déjeuner': '🍳',
  'Snacks': '🍟',
  'Salades': '🥗',
  'Soupes': '🍲',
  'Pâtes': '🍝',
  'Sushi': '🍣',
  'Africain': '🍛',
  'default': '🍴',
};

export const RestaurantMenuNav: React.FC<RestaurantMenuNavProps> = ({
  products,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get unique categories with counts
  const categories = products.reduce((acc, product) => {
    const category = product.category || 'Autres';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryList = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const getIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons.default;
  };

  return (
    <div
      ref={navRef}
      className={`sticky top-0 z-30 bg-background/95 backdrop-blur-md transition-all border-b ${
        isSticky ? 'shadow-md' : ''
      }`}
    >
      <div className="px-4 py-3">
        {/* Search Bar (Expanded) */}
        {isSearchOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
            >
              Annuler
            </Button>
          </motion.div>
        ) : null}

        {/* Category Tabs & Search Toggle */}
        <div className="flex items-center gap-2">
          <ScrollArea className="flex-1">
            <div className="flex gap-2 pb-1">
              {/* All Category */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange('')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === ''
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span>🍴</span>
                <span className="font-medium">Tout</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-1 ${activeCategory === '' ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                >
                  {products.length}
                </Badge>
              </motion.button>

              {/* Category Buttons */}
              {categoryList.map(([category, count]) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCategoryChange(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    activeCategory === category
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{getIcon(category)}</span>
                  <span className="font-medium">{category}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 ${activeCategory === category ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                  >
                    {count}
                  </Badge>
                </motion.button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-1" />
          </ScrollArea>

          {/* Search Toggle */}
          <Button
            variant={isSearchOpen ? "default" : "outline"}
            size="icon"
            className="flex-shrink-0"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
