import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Car, Sparkles, Calendar, Info } from 'lucide-react';
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
  { id: 'partners', label: 'Agences', icon: Building2, color: 'emerald' },
  { id: 'vehicles', label: 'Véhicules', icon: Car, color: 'teal' },
  { id: 'promos', label: 'Promos', icon: Sparkles, color: 'amber' },
  { id: 'my-rentals', label: 'Mes locations', icon: Calendar, color: 'purple' },
] as const;

// Tab Button premium avec animations
const TabButton = memo(({ 
  tab, 
  count, 
  isActive, 
  onClick 
}: { 
  tab: typeof tabs[number]; 
  count: number; 
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = tab.icon;
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl
        transition-all duration-300 ease-out overflow-hidden
        ${isActive 
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }
      `}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect for active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <motion.div
        animate={isActive ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'drop-shadow-lg' : ''}`} />
      </motion.div>
      
      <span className="text-xs font-semibold whitespace-nowrap">{tab.label}</span>
      
      <Badge 
        variant={isActive ? "secondary" : "outline"}
        className={`
          text-xs px-2 min-w-[24px] justify-center transition-all duration-300
          ${isActive 
            ? 'bg-white/25 text-white border-transparent shadow-inner' 
            : 'bg-background'
          }
          ${tab.id === 'promos' && count > 0 && !isActive ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' : ''}
          ${tab.id === 'my-rentals' && count > 0 && !isActive ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : ''}
        `}
      >
        {count}
      </Badge>

      {/* Underline indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-white/50 rounded-full"
          layoutId="activeTab"
          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        />
      )}
    </motion.button>
  );
});

TabButton.displayName = 'TabButton';

export const ModernRentalNavigationV2: React.FC<ModernRentalNavigationV2Props> = memo(({
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
  const counts = useMemo(() => ({
    partners: partnersCount,
    vehicles: vehiclesCount,
    promos: promosCount,
    'my-rentals': myRentalsCount,
  }), [partnersCount, vehiclesCount, promosCount, myRentalsCount]);

  const contextMessage = useMemo(() => {
    switch (viewMode) {
      case 'partners':
        return { icon: Building2, text: 'Explorez nos agences partenaires de confiance', color: 'text-emerald-500' };
      case 'vehicles':
        return { icon: Car, text: 'Découvrez notre flotte de véhicules disponibles', color: 'text-teal-500' };
      case 'promos':
        return { icon: Sparkles, text: 'Profitez de nos offres spéciales et réductions', color: 'text-amber-500' };
      case 'my-rentals':
        return { icon: Calendar, text: 'Gérez vos réservations en cours et passées', color: 'text-purple-500' };
    }
  }, [viewMode]);

  const ContextIcon = contextMessage.icon;

  const filteredCategories = useMemo(() => 
    categories.filter(cat => (vehicleCounts[cat.id] || 0) > 0),
    [categories, vehicleCounts]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      {/* Navigation principale avec glassmorphism */}
      <motion.div 
        className="bg-card/60 backdrop-blur-2xl border-2 border-border/50 rounded-3xl p-1.5 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              count={counts[tab.id]}
              isActive={viewMode === tab.id}
              onClick={() => onViewModeChange(tab.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Message contextuel animé */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          className="mt-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`flex gap-2 text-sm ${contextMessage.color}`}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ContextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            </motion.div>
            <span className="font-medium">{contextMessage.text}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Filtres de catégories premium pour les véhicules */}
      <AnimatePresence>
        {viewMode === 'vehicles' && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative -mx-4 px-4">
              <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCategoryChange(null)}
                    className={`
                      rounded-full shrink-0 snap-start transition-all duration-300 h-10
                      ${selectedCategory === null 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-0' 
                        : 'hover:border-emerald-500/50'
                      }
                    `}
                  >
                    <span className="mr-1">🚘</span>
                    Tous ({vehiclesCount})
                  </Button>
                </motion.div>

                {filteredCategories.map((cat, index) => {
                  const count = vehicleCounts[cat.id] || 0;
                  const theme = getCategoryTheme(cat.name);
                  const isSelected = selectedCategory === cat.id;
                  
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onCategoryChange(cat.id)}
                        className={`
                          rounded-full gap-1.5 shrink-0 snap-start transition-all duration-300 h-10
                          ${isSelected 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 border-0' 
                            : 'hover:border-emerald-500/50 hover:bg-emerald-500/5'
                          }
                        `}
                      >
                        <span className="text-base">{theme.icon}</span>
                        <span className="whitespace-nowrap">{cat.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={`
                            ml-0.5 text-xs shrink-0 transition-all duration-300
                            ${isSelected ? 'bg-white/25 text-white' : 'bg-muted'}
                          `}
                        >
                          {count}
                        </Badge>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ModernRentalNavigationV2.displayName = 'ModernRentalNavigationV2';
