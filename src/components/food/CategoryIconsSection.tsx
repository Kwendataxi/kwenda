import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';
import { Flame, TrendingUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  emoji: string;
  categoryId: string | null;
  gradient: string;
  shadowColor: string;
  isPopular?: boolean;
}

// Gradients premium et couleurs pour chaque catégorie
const categoryStyles: Record<string, { gradient: string; shadowColor: string }> = {
  all: { gradient: 'from-slate-600 to-slate-800', shadowColor: 'shadow-slate-500/30' },
  pizza: { gradient: 'from-red-500 to-orange-600', shadowColor: 'shadow-red-500/40' },
  burger: { gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/40' },
  chicken: { gradient: 'from-orange-500 to-red-600', shadowColor: 'shadow-orange-500/40' },
  african: { gradient: 'from-emerald-500 to-green-600', shadowColor: 'shadow-emerald-500/40' },
  asian: { gradient: 'from-rose-500 to-pink-600', shadowColor: 'shadow-rose-500/40' },
  dessert: { gradient: 'from-purple-500 to-violet-600', shadowColor: 'shadow-purple-500/40' },
  drinks: { gradient: 'from-cyan-500 to-blue-600', shadowColor: 'shadow-cyan-500/40' },
  salad: { gradient: 'from-lime-500 to-green-600', shadowColor: 'shadow-lime-500/40' },
  seafood: { gradient: 'from-blue-500 to-indigo-600', shadowColor: 'shadow-blue-500/40' },
  grilled: { gradient: 'from-orange-600 to-red-700', shadowColor: 'shadow-orange-600/40' },
};

const popularCategories = ['burger', 'pizza', 'chicken', 'african'];

const CATEGORIES: Category[] = [
  { 
    id: 'all', 
    name: 'Tous', 
    emoji: '🍽️', 
    categoryId: null,
    gradient: categoryStyles.all.gradient,
    shadowColor: categoryStyles.all.shadowColor
  },
  ...FOOD_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    categoryId: cat.id,
    gradient: categoryStyles[cat.id]?.gradient || 'from-gray-500 to-gray-700',
    shadowColor: categoryStyles[cat.id]?.shadowColor || 'shadow-gray-500/30',
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
    <section className="py-4 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-md sticky top-[108px] z-40 border-b border-border/20">
      {/* Section title */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Catégories</span>
        </div>
        <span className="text-xs text-muted-foreground/70">{CATEGORIES.length} disponibles</span>
      </div>

      <div 
        className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {CATEGORIES.map((category, index) => {
          const isActive = activeCategory === category.categoryId;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onCategorySelect(category.categoryId)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              style={{ scrollSnapAlign: 'start' }}
              className={cn(
                "relative flex flex-col items-center gap-2.5 px-4 py-4 rounded-2xl min-w-[95px] transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${category.gradient} text-white shadow-xl ${category.shadowColor}` 
                  : "bg-card/80 hover:bg-card border border-border/40 hover:border-border hover:shadow-lg"
              )}
            >
              {/* Badge populaire avec animation */}
              {category.isPopular && !isActive && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
                  className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full p-1.5 shadow-lg"
                >
                  <Flame className="w-3 h-3 text-white" />
                </motion.div>
              )}
              
              {/* Emoji avec effet 3D */}
              <motion.div 
                className={cn(
                  "relative",
                  isActive && "drop-shadow-lg"
                )}
                animate={isActive ? { 
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <span className="text-4xl filter drop-shadow-sm">{category.emoji}</span>
                
                {/* Glow effect pour l'emoji actif */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-white/30 blur-xl rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              {/* Nom avec style amélioré */}
              <span className={cn(
                "text-xs font-bold text-center leading-tight line-clamp-1 tracking-wide",
                isActive ? "text-white" : "text-foreground/80"
              )}>
                {category.name}
              </span>
              
              {/* Indicateur actif avec animation */}
              {isActive && (
                <motion.div
                  layoutId="categoryIndicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Inner glow pour les cards actives */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-white/10 pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Scroll indicator gradient */}
      <div className="absolute right-0 top-[52px] bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </section>
  );
};
