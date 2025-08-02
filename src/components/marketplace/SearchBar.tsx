import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  filters: {
    priceRange: [number, number];
    inStockOnly: boolean;
    freeShipping: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  filters,
  onFiltersChange,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
    onSearch();
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher des produits..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-card border-border/50 focus:border-primary transition-colors"
            />
          </div>
          <Button 
            type="submit" 
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-medium touch-manipulation"
          >
            <Search className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Rechercher</span>
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 w-12 p-0 border-border/50 hover:bg-muted touch-manipulation">
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>
                  Affinez votre recherche avec ces filtres
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-sm font-medium">Prix (FC)</Label>
                  <div className="mt-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => 
                        onFiltersChange({ ...filters, priceRange: value })
                      }
                      max={500000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{filters.priceRange[0].toLocaleString()} FC</span>
                      <span>{filters.priceRange[1].toLocaleString()} FC</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-stock">En stock seulement</Label>
                  <Switch
                    id="in-stock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, inStockOnly: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="free-shipping">Livraison gratuite</Label>
                  <Switch
                    id="free-shipping"
                    checked={filters.freeShipping}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, freeShipping: checked })
                    }
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </form>
      </div>
    </div>
  );
};