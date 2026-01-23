import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FoodDishDetailSheet } from './FoodDishDetailSheet';
import type { FoodProduct } from '@/types/food';
import { formatCurrency } from '@/lib/utils';
import { FOOD_CATEGORIES } from '@/config/foodCategories';

interface AllDishesViewProps {
  city: string;
  onBack: () => void;
  onAddToCart: (product: FoodProduct, quantity?: number, notes?: string) => void;
}

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
  const [selectedDish, setSelectedDish] = useState<(FoodProduct & { restaurant_name?: string }) | null>(null);

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

  const handleAddFromSheet = (quantity: number, notes?: string) => {
    if (selectedDish) {
      onAddToCart(selectedDish, quantity, notes);
    }
  };

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
                  {FOOD_CATEGORIES.map(cat => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={filters.categories.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          updateFilters({
                            categories: checked
                              ? [...filters.categories, cat.id]
                              : filters.categories.filter(c => c !== cat.id)
                          });
                        }}
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">
                        {cat.emoji} {cat.name}
                      </Label>
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
              {filters.categories.map(catId => {
                const category = FOOD_CATEGORIES.find(c => c.id === catId);
                return (
                  <FilterBadge
                    key={catId}
                    label={category ? `${category.emoji} ${category.name}` : catId}
                    onRemove={() => updateFilters({ 
                      categories: filters.categories.filter(c => c !== catId) 
                    })}
                  />
                );
              })}
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
            <div className="space-y-4">
              {dishes.map((dish) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedDish(dish)}
                  className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex gap-4 p-3">
                    {/* Image à gauche (format carré mais plus grand) */}
                    <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={dish.main_image_url || '/placeholder-food.jpg'}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      {!dish.is_available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-xs">
                            Indisponible
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Contenu à droite */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 mb-1">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          {dish.restaurant_name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-lg">
                          {formatPrice(dish.price)}
                        </span>
                        <Button
                          size="sm"
                          variant={dish.is_available ? "default" : "secondary"}
                          disabled={!dish.is_available}
                          className="h-9 px-4 gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(dish, 1);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
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

      {/* Detail Sheet */}
      {selectedDish && (
        <FoodDishDetailSheet
          open={!!selectedDish}
          onOpenChange={(open) => !open && setSelectedDish(null)}
          dish={selectedDish}
          onAddToCart={handleAddFromSheet}
        />
      )}
    </motion.div>
  );
};
