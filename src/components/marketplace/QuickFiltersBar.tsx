import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, MapPin, TrendingDown, Sparkles, Star } from 'lucide-react';

interface QuickFiltersBarProps {
  onQuickFilter: (filterId: string) => void;
  onOpenAdvancedFilters: () => void;
  activeFiltersCount?: number;
}

const QUICK_FILTERS = [
  { id: 'nearby', label: '📍 À proximité', icon: MapPin },
  { id: 'deals', label: '💰 Promotions', icon: TrendingDown },
  { id: 'new', label: '✨ Nouveautés', icon: Sparkles },
  { id: 'premium', label: '⭐ Best Rated', icon: Star }
];

export const QuickFiltersBar = ({
  onQuickFilter,
  onOpenAdvancedFilters,
  activeFiltersCount = 0
}: QuickFiltersBarProps) => {
  return (
    <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
      <span className="text-xs font-medium text-muted-foreground mr-2 whitespace-nowrap">
        Filtres rapides:
      </span>
      
      {QUICK_FILTERS.map(filter => (
        <Badge
          key={filter.id}
          variant="outline"
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap"
          onClick={() => onQuickFilter(filter.id)}
        >
          {filter.label}
        </Badge>
      ))}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onOpenAdvancedFilters}
        className="ml-auto whitespace-nowrap"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtres avancés
        {activeFiltersCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
