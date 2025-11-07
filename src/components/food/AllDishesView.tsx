import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllDishes } from '@/hooks/useAllDishes';
import { PaginationControls } from '@/components/common/PaginationControls';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/lib/utils';

interface AllDishesViewProps {
  city: string;
  onBack: () => void;
  onAddToCart: (product: FoodProduct) => void;
}

const CATEGORIES = ['Entrée', 'Plat', 'Dessert', 'Boisson', 'Snack'];

export const AllDishesView = ({ city, onBack, onAddToCart }: AllDishesViewProps) => {
  const {
    dishes,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  } = useAllDishes(city);

  const [searchInput, setSearchInput] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  const activeFiltersCount = 
    filters.categories.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0) +
    (filters.restaurantId ? 1 : 0) +
    (filters.availableOnly ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-6"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 space-y-4">
          {/* Top Bar */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Tous les Plats</h1>
              <p className="text-sm text-muted-foreground">{totalCount} plats disponibles</p>
            </div>
            <FilterDrawer
              onReset={resetFilters}
              activeFiltersCount={activeFiltersCount}
              open={filterOpen}
              onOpenChange={setFilterOpen}
            >
              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">📂 Catégorie</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat}`}
                        checked={filters.categories.includes(cat)}
                        onCheckedChange={(checked) => {
                          updateFilters({
                            categories: checked
                              ? [...filters.categories, cat]
                              : filters.categories.filter(c => c !== cat)
                          });
                        }}
                      />
                      <Label htmlFor={`cat-${cat}`} className="cursor-pointer">{cat}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">💰 Prix</Label>
                <div className="pt-2">
                  <Slider
                    min={0}
                    max={50000}
                    step={1000}
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatPrice(filters.priceRange[0])}</span>
                    <span>{formatPrice(filters.priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={filters.availableOnly}
                  onCheckedChange={(checked) => updateFilters({ availableOnly: !!checked })}
                />
                <Label htmlFor="available" className="cursor-pointer">✅ Disponible maintenant</Label>
              </div>
            </FilterDrawer>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un plat..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort & Active Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={`${filters.categories[0] || 'popularity'}`}
              onValueChange={(value) => {
                if (value === 'price-asc') updateSort({ field: 'price', direction: 'asc' });
                else if (value === 'price-desc') updateSort({ field: 'price', direction: 'desc' });
                else if (value === 'name') updateSort({ field: 'name', direction: 'asc' });
                else updateSort({ field: 'created_at', direction: 'desc' });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularité</SelectItem>
                <SelectItem value="price-asc">Prix ↑</SelectItem>
                <SelectItem value="price-desc">Prix ↓</SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Active filter badges */}
            <AnimatePresence>
              {filters.categories.map(cat => (
                <FilterBadge
                  key={cat}
                  label={cat}
                  onRemove={() => updateFilters({ 
                    categories: filters.categories.filter(c => c !== cat) 
                  })}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-semibold">Aucun plat trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos filtres</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dishes.map((dish) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={dish.main_image_url || '/placeholder-food.jpg'}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{dish.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{dish.restaurant_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{formatPrice(dish.price)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-primary/10 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => onAddToCart(dish)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  hasNextPage={currentPage < totalPages}
                  hasPreviousPage={currentPage > 1}
                  onNextPage={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  onPreviousPage={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
