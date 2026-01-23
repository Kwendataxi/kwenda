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
    <section className="py-2 bg-background relative">
      {/* Masques de fondu latéraux */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div 
        className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
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
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[68px] transition-all duration-200",
                isActive 
                  ? "bg-primary/10" 
                  : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              {/* Emoji avec fond circulaire */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isActive ? "bg-primary/15" : "bg-background"
              )}>
                <span className="text-xl">{category.emoji}</span>
              </div>
              
              <span className={cn(
                "text-[11px] font-medium text-center leading-tight transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {category.name}
              </span>
              
              {/* Indicateur actif - ligne fine */}
              {isActive && (
                <div className="w-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
