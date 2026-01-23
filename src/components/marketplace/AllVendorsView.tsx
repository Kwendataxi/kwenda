import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/common/PaginationControls';
import { VendorCard } from './VendorCard';
import { useAllVendors } from '@/hooks/useAllVendors';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';

interface AllVendorsViewProps {
  onBack: () => void;
  onSelectVendor: (vendorId: string) => void;
}

export const AllVendorsView: React.FC<AllVendorsViewProps> = ({
  onBack,
  onSelectVendor
}) => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    vendors,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    filters,
    sort,
    updateFilters,
    resetFilters,
    updateSort,
    setCurrentPage
  } = useAllVendors();

  // Synchroniser recherche
  React.useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch]);

  const activeFiltersCount = [
    filters.minRating > 0,
    filters.minSales > 0,
    filters.verifiedOnly
  ].filter(Boolean).length;

  const getActiveFilterBadges = () => {
    const badges: Array<{ label: string; onRemove: () => void }> = [];
    
    if (filters.minRating > 0) {
      badges.push({
        label: `⭐ ${filters.minRating}+`,
        onRemove: () => updateFilters({ minRating: 0 })
      });
    }

    if (filters.minSales > 0) {
      badges.push({
        label: `${filters.minSales}+ ventes`,
        onRemove: () => updateFilters({ minSales: 0 })
      });
    }

    if (filters.verifiedOnly) {
      badges.push({
        label: 'Vérifié uniquement',
        onRemove: () => updateFilters({ verifiedOnly: false })
      });
    }

    return badges;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Toutes les Boutiques</h1>
              <p className="text-xs text-muted-foreground">{totalCount} boutiques disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="sticky top-[73px] z-30 bg-background/95 backdrop-blur-lg border-b p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une boutique..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <FilterDrawer
            activeFiltersCount={activeFiltersCount}
            onReset={resetFilters}
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          >
            {/* Note minimum */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Note minimum</Label>
              <Select 
                value={filters.minRating.toString()} 
                onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Toutes les notes</SelectItem>
                  <SelectItem value="3">⭐ 3+</SelectItem>
                  <SelectItem value="4">⭐ 4+</SelectItem>
                  <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ventes minimum */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Ventes minimum</Label>
              <Select 
                value={filters.minSales.toString()} 
                onValueChange={(value) => updateFilters({ minSales: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Toutes</SelectItem>
                  <SelectItem value="10">10+ ventes</SelectItem>
                  <SelectItem value="50">50+ ventes</SelectItem>
                  <SelectItem value="100">100+ ventes</SelectItem>
                  <SelectItem value="500">500+ ventes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vérifié uniquement */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => updateFilters({ verifiedOnly: checked as boolean })}
              />
              <Label htmlFor="verified" className="text-sm cursor-pointer">
                Boutiques vérifiées uniquement
              </Label>
            </div>
          </FilterDrawer>
        </div>

        {/* Active Filters Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            <AnimatePresence>
              {getActiveFilterBadges().map((badge, index) => (
                <FilterBadge
                  key={`${badge.label}-${index}`}
                  label={badge.label}
                  onRemove={badge.onRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Tri */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {vendors.length} résultats
          </span>
          <Select 
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-');
              updateSort({ field, direction: direction as 'asc' | 'desc' });
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average_rating-desc">Meilleures notes</SelectItem>
              <SelectItem value="total_sales-desc">Plus de ventes</SelectItem>
              <SelectItem value="created_at-desc">Plus récents</SelectItem>
              <SelectItem value="shop_name-asc">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grille de boutiques */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune boutique trouvée</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {vendors.map((vendor, index) => (
                <VendorCard
                  key={vendor.user_id}
                  vendor={vendor}
                  onVisit={onSelectVendor}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                hasNextPage={currentPage < totalPages}
                hasPreviousPage={currentPage > 1}
                onPageChange={setCurrentPage}
                onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                onPreviousPage={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                itemName="boutiques"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
