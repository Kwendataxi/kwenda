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
    categoryId: cat.id,
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
    <section className="py-3 bg-background">
      <div 
        className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.categoryId;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.categoryId)}
              style={{ scrollSnapAlign: 'start' }}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl min-w-[80px] transition-all duration-200",
                isActive 
                  ? "bg-primary/10 ring-1 ring-primary/30" 
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span className="text-2xl">{category.emoji}</span>
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {category.name}
              </span>
              
              {isActive && (
                <div className="w-5 h-0.5 bg-primary rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
