import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';

interface Category {
  id: string;
  name: string;
  emoji: string;
  categoryId: string | null;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', emoji: '🍽️', categoryId: null },
  ...FOOD_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    categoryId: cat.id
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
    <section className="py-4 bg-background/50 backdrop-blur-sm sticky top-[104px] z-40 border-b">
      <div className="flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.categoryId;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onCategorySelect(category.categoryId)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[70px] transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span className="text-2xl">{category.emoji}</span>
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
