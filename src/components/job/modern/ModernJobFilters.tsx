import { motion } from 'framer-motion';
import { 
  Briefcase, Car, Truck, Store, UtensilsCrossed, Code, 
  Megaphone, Headphones, FileText, Box, Globe 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { JOB_CATEGORIES } from '@/types/jobs';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernJobFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  remoteOnly: boolean;
  onRemoteOnlyChange: (value: boolean) => void;
  categoryCounts?: Record<string, number>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Car,
  Truck,
  Store,
  UtensilsCrossed,
  Code,
  Megaphone,
  Headphones,
  FileText,
  Box,
};

export const ModernJobFilters = ({
  selectedCategory,
  onCategoryChange,
  remoteOnly,
  onRemoteOnlyChange,
  categoryCounts = {},
}: ModernJobFiltersProps) => {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="px-4 py-3 space-y-3"
    >
      {/* Remote toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="remote-toggle" className="text-sm font-medium cursor-pointer">
            Remote uniquement
          </Label>
        </div>
        <Switch
          id="remote-toggle"
          checked={remoteOnly}
          onCheckedChange={onRemoteOnlyChange}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {JOB_CATEGORIES.map((category, index) => {
          const IconComponent = iconMap[category.icon] || Briefcase;
          const isSelected = selectedCategory === category.id;
          const count = categoryCounts[category.id] || 0;
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Button
                variant="ghost"
                onClick={() => onCategoryChange(category.id)}
                className={`
                  relative h-9 px-3 rounded-xl shrink-0 transition-all duration-200
                  ${isSelected 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <IconComponent className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">
                  {category.name[language]}
                </span>
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`
                      ml-1.5 h-5 min-w-5 px-1.5 text-xs
                      ${isSelected 
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-muted-foreground/10'
                      }
                    `}
                  >
                    {count}
                  </Badge>
                )}
                
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="category-indicator"
                    className="absolute inset-0 rounded-xl border-2 border-emerald-500/30"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
