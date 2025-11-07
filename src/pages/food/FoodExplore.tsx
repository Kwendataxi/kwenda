import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  X,
  DollarSign,
  Star,
  Clock,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllDishes } from '@/hooks/useAllDishes';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CUISINE_CATEGORIES = [
  { value: 'african', label: '🌍 Africain', emoji: '🌍' },
  { value: 'fast-food', label: '🍔 Fast-food', emoji: '🍔' },
  { value: 'asian', label: '🍜 Asiatique', emoji: '🍜' },
  { value: 'italian', label: '🍕 Italien', emoji: '🍕' },
  { value: 'grillades', label: '🥩 Grillades', emoji: '🥩' },
  { value: 'desserts', label: '🍰 Desserts', emoji: '🍰' },
];

export default function FoodExplore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(60);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Mock data - à remplacer par vrai appel API
  const { dishes, isLoading } = useAllDishes('Kinshasa');
  const restaurants: any[] = []; // Simulé

  const loading = isLoading;

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 50000]);
    setMinRating(0);
    setMaxDeliveryTime(60);
    setFreeDeliveryOnly(false);
    setOpenNow(false);
    setSortBy('popularity');
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategories.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 50000 ||
    minRating > 0 ||
    maxDeliveryTime < 60 ||
    freeDeliveryOnly ||
    openNow;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 dark:from-primary/10 to-background dark:to-background pb-24">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-background/98 dark:bg-background/95 backdrop-blur-md border-b border-border/60 dark:border-border/80 shadow-sm dark:shadow-lg">
        <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Explorer</h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un restaurant ou un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-background dark:bg-card border-border/60 dark:border-border/80 text-foreground dark:text-foreground/95 placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/80"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="w-5 h-5" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-card dark:bg-card/98 border-t-2 border-border/60 dark:border-border/80">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>
                    Affinez votre recherche selon vos préférences
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  {/* Sort */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Trier par</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularité</SelectItem>
                        <SelectItem value="rating">Note</SelectItem>
                        <SelectItem value="delivery-time">Temps de livraison</SelectItem>
                        <SelectItem value="price-asc">Prix croissant</SelectItem>
                        <SelectItem value="price-desc">Prix décroissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Prix ({priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FC)
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                      min={0}
                      max={50000}
                      step={1000}
                      className="mt-2"
                    />
                  </div>

                  {/* Min Rating */}
                  <div>
                    <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Note minimum ({minRating}⭐)
                    </Label>
                    <Slider
                      value={[minRating]}
                      onValueChange={(v) => setMinRating(v[0])}
                      min={0}
                      max={5}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>

                  {/* Max Delivery Time */}
                  <div>
                    <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Livraison max ({maxDeliveryTime} min)
                    </Label>
                    <Slider
                      value={[maxDeliveryTime]}
                      onValueChange={(v) => setMaxDeliveryTime(v[0])}
                      min={15}
                      max={90}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Livraison gratuite
                      </Label>
                      <Switch checked={freeDeliveryOnly} onCheckedChange={setFreeDeliveryOnly} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ouvert maintenant</Label>
                      <Switch checked={openNow} onCheckedChange={setOpenNow} />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CUISINE_CATEGORIES.map((cat) => (
              <Badge
                key={cat.value}
                variant={selectedCategories.includes(cat.value) ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtres actifs:</span>
            {searchQuery && (
              <Badge variant="secondary">
                Recherche: {searchQuery}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => setSearchQuery('')}
                />
              </Badge>
            )}
            {selectedCategories.map(cat => (
              <Badge key={cat} variant="secondary">
                {CUISINE_CATEGORIES.find(c => c.value === cat)?.emoji} {cat}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => toggleCategory(cat)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Restaurant Grid */}
        <div className="space-y-4">
          <AnimatePresence>
            {restaurants.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-muted-foreground">
                  Essayez d'ajuster vos filtres ou votre recherche
                </p>
              </motion.div>
            ) : (
              restaurants.map((restaurant: any) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RestaurantCard
                    restaurant={restaurant}
                    onClick={() => navigate(`/food?restaurant=${restaurant.id}`)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
