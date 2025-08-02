import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
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
    <div className="p-4 bg-background border-b">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher des produits..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">
          Rechercher
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
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
  );
};