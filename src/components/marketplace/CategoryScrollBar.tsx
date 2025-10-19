import { motion } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Smartphone, Laptop, Shirt, Home, Utensils, Baby, 
  Dumbbell, Book, Briefcase, Wrench, Car, Music, Grid
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
}

const MARKETPLACE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tout', icon: Grid },
  { id: 'electronics', name: 'Électronique', icon: Smartphone },
  { id: 'computers', name: 'Informatique', icon: Laptop },
  { id: 'fashion', name: 'Mode', icon: Shirt },
  { id: 'home', name: 'Maison', icon: Home },
  { id: 'food', name: 'Alimentation', icon: Utensils },
  { id: 'baby', name: 'Bébé', icon: Baby },
  { id: 'sports', name: 'Sports', icon: Dumbbell },
  { id: 'books', name: 'Livres', icon: Book },
  { id: 'office', name: 'Bureau', icon: Briefcase },
  { id: 'tools', name: 'Outils', icon: Wrench },
  { id: 'automotive', name: 'Auto', icon: Car },
  { id: 'music', name: 'Musique', icon: Music },
];

interface CategoryScrollBarProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoryScrollBar = ({
  selectedCategory,
  onCategoryChange
}: CategoryScrollBarProps) => {
  return (
    <div className="sticky top-[132px] z-[130] bg-background/95 backdrop-blur-md border-b py-3">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-3 px-4">
          {MARKETPLACE_CATEGORIES.map(category => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all min-w-[100px]",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {category.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
