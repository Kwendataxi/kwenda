import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RestaurantCard } from '@/components/food/RestaurantCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';
import { FoodBackToTop } from '@/components/food/FoodBackToTop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  X,
  DollarSign,
  Star,
  Clock,
  Truck,
  Store,
  UtensilsCrossed,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllDishes } from '@/hooks/useAllDishes';
import { useAllRestaurants } from '@/hooks/useAllRestaurants';
import { useSmartCitySelection } from '@/hooks/useSmartCitySelection';
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
  { value: 'african', label: 'Africain', emoji: '🌍' },
  { value: 'fast-food', label: 'Fast-food', emoji: '🍔' },
  { value: 'asian', label: 'Asiatique', emoji: '🍜' },
  { value: 'italian', label: 'Italien', emoji: '🍕' },
  { value: 'grillades', label: 'Grillades', emoji: '🥩' },
  { value: 'desserts', label: 'Desserts', emoji: '🍰' },
  { value: 'boissons', label: 'Boissons', emoji: '🥤' },
  { value: 'breakfast', label: 'Petit-déj', emoji: '🍳' },
];

export default function FoodExplore() {
  const navigate = useNavigate();
  const { currentCity } = useSmartCitySelection();
  const city = currentCity?.name || 'Kinshasa';
  
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(60);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Fetch restaurants
  const { 
    restaurants, 
    isLoading: restaurantsLoading,
    updateFilters: updateRestaurantFilters,
    resetFilters: resetRestaurantFilters
  } = useAllRestaurants(city);

  // Fetch dishes
  const { 
    dishes, 
    isLoading: dishesLoading,
    updateFilters: updateDishFilters,
    resetFilters: resetDishFilters
  } = useAllDishes(city);

  // Filter restaurants based on search
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !searchQuery || 
      r.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = r.rating_average >= minRating;
    const matchesDeliveryTime = !r.average_preparation_time || r.average_preparation_time <= maxDeliveryTime;
    return matchesSearch && matchesRating && matchesDeliveryTime;
  });

  // Filter dishes based on search and categories
  const filteredDishes = dishes.filter(d => {
    const matchesSearch = !searchQuery || 
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(d.category?.toLowerCase() || '');
    const matchesPrice = d.price >= priceRange[0] && d.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

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
    resetRestaurantFilters();
    resetDishFilters();
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

  const loading = restaurantsLoading || dishesLoading;

  if (loading && restaurants.length === 0 && dishes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
        <FoodFooterNav />
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
                className="pl-10 pr-10 bg-background dark:bg-card border-border/60"
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
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-card border-t-2 border-border/60">
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
                      Prix ({priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} CDF)
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
                {cat.emoji} {cat.label}
              </Badge>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="restaurants" className="gap-2">
                <Store className="w-4 h-4" />
                Restaurants ({filteredRestaurants.length})
              </TabsTrigger>
              <TabsTrigger value="dishes" className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Plats ({filteredDishes.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Results */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtres:</span>
            {searchQuery && (
              <Badge variant="secondary">
                "{searchQuery}"
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
            {minRating > 0 && (
              <Badge variant="secondary">
                ≥ {minRating}⭐
              </Badge>
            )}
          </div>
        )}

        <Tabs value={activeTab}>
          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4 mt-0">
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-6xl mb-4">🍽️</p>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aucun restaurant trouvé
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez d'ajuster vos filtres ou votre recherche
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Réinitialiser les filtres
                    </Button>
                  )}
                </motion.div>
              ) : (
                filteredRestaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RestaurantCard
                      restaurant={restaurant}
                      onClick={() => navigate(`/food?restaurant=${restaurant.id}`)}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Dishes Tab */}
          <TabsContent value="dishes" className="space-y-4 mt-0">
            <AnimatePresence mode="popLayout">
              {filteredDishes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-6xl mb-4">🍜</p>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aucun plat trouvé
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez d'ajuster vos filtres ou votre recherche
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Réinitialiser les filtres
                    </Button>
                  )}
                </motion.div>
              ) : (
                filteredDishes.map((dish, index) => (
                  <motion.div
                    key={dish.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all cursor-pointer bg-card shadow-md"
                      onClick={() => navigate(`/food?restaurant=${dish.restaurant_id}`)}
                    >
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {dish.main_image_url ? (
                            <img
                              src={dish.main_image_url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🍽️
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{dish.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Store className="w-3 h-3" />
                            {dish.restaurant_name || 'Restaurant'}
                          </p>
                          
                          {dish.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {dish.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary">
                              {dish.price?.toLocaleString()} CDF
                            </p>
                            <Button 
                              size="sm" 
                              className="gap-1 h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/food?restaurant=${dish.restaurant_id}`);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              Voir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      <FoodBackToTop />
      <FoodFooterNav />
    </div>
  );
}
