import React, { memo, useMemo } from 'react';
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
  { id: 'partners', label: 'Agences', icon: Building2 },
  { id: 'vehicles', label: 'Véhicules', icon: Car },
  { id: 'promos', label: 'Promos', icon: Sparkles },
  { id: 'my-rentals', label: 'Mes locations', icon: Calendar },
] as const;

// Composant Tab mémorisé pour éviter les re-renders
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
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl
        transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }
      `}
    >
      <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
      <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
      <Badge 
        variant={isActive ? "secondary" : "outline"}
        className={`
          text-xs px-2 min-w-[24px] justify-center transition-colors duration-200
          ${isActive ? 'bg-primary-foreground/20 text-primary-foreground border-transparent' : ''}
          ${tab.id === 'promos' && count > 0 && !isActive ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
        `}
      >
        {count}
      </Badge>
    </button>
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
        return { icon: Info, text: 'Explorez nos agences partenaires de confiance' };
      case 'vehicles':
        return { icon: Car, text: 'Découvrez notre flotte de véhicules disponibles' };
      case 'promos':
        return { icon: Sparkles, text: 'Profitez de nos offres spéciales et réductions', color: 'text-amber-500' };
      case 'my-rentals':
        return { icon: Calendar, text: 'Gérez vos réservations en cours et passées' };
    }
  }, [viewMode]);

  const ContextIcon = contextMessage.icon;

  const filteredCategories = useMemo(() => 
    categories.filter(cat => (vehicleCounts[cat.id] || 0) > 0),
    [categories, vehicleCounts]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      {/* Navigation principale */}
      <div className="bg-card/80 backdrop-blur-xl border rounded-2xl p-1 shadow-lg">
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
      </div>

      {/* Message contextuel */}
      <div className="mt-4">
        <div className={`flex gap-2 text-sm transition-opacity duration-200 ${contextMessage.color || 'text-muted-foreground'}`}>
          <ContextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{contextMessage.text}</span>
        </div>
      </div>

      {/* Filtres de catégories pour les véhicules */}
      {viewMode === 'vehicles' && (
        <div className="mt-4">
          <div className="relative -mx-4 px-4">
            <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(null)}
                className="rounded-full shrink-0 snap-start transition-all duration-200"
              >
                Tous ({vehiclesCount})
              </Button>

              {filteredCategories.map(cat => {
                const count = vehicleCounts[cat.id] || 0;
                const theme = getCategoryTheme(cat.name);
                
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCategoryChange(cat.id)}
                    className="rounded-full gap-1 shrink-0 snap-start transition-all duration-200"
                  >
                    <span>{theme.icon}</span>
                    <span className="whitespace-nowrap">{cat.name}</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-1 text-xs shrink-0 ${selectedCategory === cat.id ? 'bg-primary-foreground/20' : ''}`}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModernRentalNavigationV2.displayName = 'ModernRentalNavigationV2';