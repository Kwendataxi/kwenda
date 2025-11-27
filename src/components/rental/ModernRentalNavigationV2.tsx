import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Car, Sparkles, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryTheme } from '@/utils/categoryThemes';

interface Category {
  id: string;
  name: string;
}

interface ModernRentalNavigationV2Props {
  viewMode: 'partners' | 'vehicles' | 'promos' | 'my-rentals';
  onViewModeChange: (mode: 'partners' | 'vehicles' | 'promos' | 'my-rentals') => void;
  partnersCount: number;
  vehiclesCount: number;
  promosCount: number;
  myRentalsCount: number;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  vehicleCounts: Record<string, number>;
}

const tabs = [
  { id: 'partners', label: 'Agences', icon: Building2, badgeVariant: 'secondary' as const },
  { id: 'vehicles', label: 'Véhicules', icon: Car, badgeVariant: 'secondary' as const },
  { id: 'promos', label: 'Promos', icon: Sparkles, badgeVariant: 'default' as const },
  { id: 'my-rentals', label: 'Mes locations', icon: Calendar, badgeVariant: 'secondary' as const },
];

export const ModernRentalNavigationV2: React.FC<ModernRentalNavigationV2Props> = ({
  viewMode,
  onViewModeChange,
  partnersCount,
  vehiclesCount,
  promosCount,
  myRentalsCount,
  categories,
  selectedCategory,
  onCategoryChange,
  vehicleCounts,
}) => {
  const getCounts = (tabId: string) => {
    switch (tabId) {
      case 'partners': return partnersCount;
      case 'vehicles': return vehiclesCount;
      case 'promos': return promosCount;
      case 'my-rentals': return myRentalsCount;
      default: return 0;
    }
  };

  const getContextMessage = () => {
    switch (viewMode) {
      case 'partners':
        return { icon: Info, text: 'Explorez nos agences partenaires de confiance' };
      case 'vehicles':
        return { icon: Car, text: 'Découvrez notre flotte de véhicules disponibles' };
      case 'promos':
        return { icon: Sparkles, text: 'Profitez de nos offres spéciales et réductions', color: 'text-amber-500' };
      case 'my-rentals':
        return { icon: Calendar, text: 'Gérez vos réservations en cours et passées' };
    }
  };

  const contextInfo = getContextMessage();
  const ContextIcon = contextInfo.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      {/* Navigation principale avec glassmorphism */}
      <div className="relative bg-card/80 backdrop-blur-xl border rounded-2xl p-1 shadow-lg">
        {/* Indicateur actif animé */}
        <div className="relative grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = getCounts(tab.id);
            const isActive = viewMode === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onViewModeChange(tab.id as any)}
                className={`
                  relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl
                  transition-all duration-300 z-10
                  ${isActive 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }
                `}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Background actif avec animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-xl shadow-md"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                {/* Contenu du tab */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ 
                      rotate: isActive ? [0, -10, 10, 0] : 0,
                      scale: isActive ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  
                  <span className="text-xs font-medium whitespace-nowrap">
                    {tab.label}
                  </span>
                  
                  {/* Badge avec animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${tab.id}-${count}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Badge 
                        variant={isActive ? "secondary" : tab.badgeVariant}
                        className={`
                          text-xs px-2 min-w-[24px] justify-center
                          ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''}
                          ${tab.id === 'promos' && count > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                        `}
                      >
                        {count}
                      </Badge>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Message contextuel animé */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className={`flex gap-2 text-sm ${contextInfo.color || 'text-muted-foreground'}`}>
            <ContextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{contextInfo.text}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Filtres de catégories pour les véhicules */}
      {viewMode === 'vehicles' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className="relative -mx-4 px-4">
            <motion.div 
              className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryChange(null)}
                  className="rounded-full shrink-0 snap-start transition-all duration-300"
                >
                  Tous ({vehiclesCount})
                </Button>
              </motion.div>

              {categories.map(cat => {
                const count = vehicleCounts[cat.id] || 0;
                if (count === 0) return null;
                const theme = getCategoryTheme(cat.name);
                
                return (
                  <motion.div
                    key={cat.id}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <Button
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCategoryChange(cat.id)}
                      className="rounded-full gap-1 shrink-0 snap-start transition-all duration-300 hover:scale-105"
                    >
                      <span>{theme.icon}</span>
                      <span className="whitespace-nowrap">{cat.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={`
                          ml-1 text-xs shrink-0 transition-all
                          ${selectedCategory === cat.id ? 'bg-primary-foreground/20' : ''}
                        `}
                      >
                        {count}
                      </Badge>
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
