import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
import { Flame } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  emoji: string;
  categoryId: string | null;
  color?: string;
  isPopular?: boolean;
}

// Couleurs vibrantes pour chaque catégorie
const categoryColors: Record<string, string> = {
  all: 'from-slate-500 to-slate-600',
  pizza: 'from-red-500 to-orange-500',
  burger: 'from-amber-500 to-yellow-500',
  chicken: 'from-orange-500 to-red-500',
  african: 'from-green-500 to-emerald-500',
  asian: 'from-rose-500 to-pink-500',
  dessert: 'from-purple-500 to-violet-500',
  drinks: 'from-cyan-500 to-blue-500',
  salad: 'from-lime-500 to-green-500',
  seafood: 'from-blue-500 to-indigo-500',
  grilled: 'from-orange-600 to-red-600',
};

const popularCategories = ['burger', 'pizza', 'chicken', 'african'];

const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', emoji: '🍽️', categoryId: null },
  ...FOOD_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    categoryId: cat.id,
    color: categoryColors[cat.id] || 'from-gray-500 to-gray-600',
    isPopular: popularCategories.includes(cat.id),
  }))
];

interface CategoryIconsSectionProps {
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const CategoryIconsSection = ({
  activeCategory,
  onCategorySelect,
}: CategoryIconsSectionProps) => {
  return (
    <section className="py-4 bg-gradient-to-b from-background to-background/80 backdrop-blur-md sticky top-[108px] z-40 border-b border-border/30">
      <div 
        className="flex gap-3 px-4 overflow-x-auto pb-3 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {CATEGORIES.map((category, index) => {
          const isActive = activeCategory === category.categoryId;
          const gradientColor = categoryColors[category.id] || 'from-gray-500 to-gray-600';
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onCategorySelect(category.categoryId)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{ scrollSnapAlign: 'start' }}
              className={cn(
                "relative flex flex-col items-center gap-2 px-4 py-3 rounded-2xl min-w-[85px] transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${gradientColor} text-white shadow-lg shadow-primary/30` 
                  : "bg-card hover:bg-muted border border-border/50 hover:border-primary/30"
              )}
            >
              {/* Badge populaire */}
              {category.isPopular && !isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                >
                  <Flame className="w-2.5 h-2.5 text-white" />
                </motion.div>
              )}
              
              {/* Emoji avec effet */}
              <motion.span 
                className="text-3xl drop-shadow-sm"
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {category.emoji}
              </motion.span>
              
              {/* Nom */}
              <span className={cn(
                "text-[11px] font-semibold text-center leading-tight line-clamp-1",
                isActive ? "text-white" : "text-foreground"
              )}>
                {category.name}
              </span>
              
              {/* Indicateur actif */}
              {isActive && (
                <motion.div
                  layoutId="categoryIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
