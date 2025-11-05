import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryTheme } from '@/utils/categoryThemes';

interface Category {
  id: string;
  name: string;
}

interface RentalCategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
  totalVehicles: number;
}

export const RentalCategoryBar: React.FC<RentalCategoryBarProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  vehicleCounts,
  totalVehicles,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected category
  useEffect(() => {
    if (selectedCategory && scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(`[data-category-id="${selectedCategory}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string | null) => {
    onCategoryChange(categoryId);
    
    // Scroll vers la section correspondante
    if (categoryId) {
      setTimeout(() => {
        const element = document.getElementById(`category-${categoryId}`);
        element?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[155px] z-40 bg-background/98 backdrop-blur-xl border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-3 py-3">
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-2 pb-2">
            {/* Badge TOUS */}
            <motion.button
              onClick={() => handleCategoryClick(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap
                transition-all duration-300 shadow-md hover:shadow-xl shrink-0
                ${selectedCategory === null
                  ? 'bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground border-2 border-primary/50 shadow-lg'
                  : 'bg-card border-2 border-border hover:border-primary/50 hover:bg-card/80'
                }
              `}
              aria-label="Voir tous les véhicules"
              aria-pressed={selectedCategory === null}
            >
              <span className="text-lg">🌐</span>
              <span>Tous</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${selectedCategory === null 
                  ? 'bg-white/20 text-white' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {totalVehicles}
              </span>
              
              {selectedCategory === null && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary rounded-xl -z-10"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>

            {/* Catégories scrollables */}
            {categories.map((category) => {
              const count = vehicleCounts[category.id] || 0;
              if (count === 0) return null;
              
              const theme = getCategoryTheme(category.name);
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  data-category-id={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap
                    transition-all duration-300 shadow-md hover:shadow-xl shrink-0
                    ${isActive
                      ? `bg-gradient-to-r ${theme.gradient} text-white border-2 border-white/30 shadow-lg`
                      : 'bg-card border-2 border-border hover:border-primary/50 hover:bg-card/80'
                    }
                  `}
                  aria-label={`Filtrer par ${category.name}`}
                  aria-pressed={isActive}
                >
                  <span className="text-lg">{theme.icon}</span>
                  <span>{category.name.trim()}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {count}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} rounded-xl -z-10`}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
          
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </div>
  );
};
