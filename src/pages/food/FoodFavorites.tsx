import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Star, Clock, ShoppingBag, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '@/context/FavoritesContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FoodFooterNav } from '@/components/food/FoodFooterNav';

export default function FoodFavorites() {
  const navigate = useNavigate();
  const { favoriteItems, removeFromFavorites, loading } = useFavorites();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');

  // Séparer les favoris par type (simulation - à adapter selon votre modèle)
  // Pour l'instant on filtre selon un champ type ou catégorie
  const restaurantFavorites = favoriteItems.filter(item => 
    !item.category || item.category === 'restaurant'
  );
  
  const dishFavorites = favoriteItems.filter(item => 
    item.category && item.category !== 'restaurant'
  );

  const handleRemoveFavorite = (id: string, name: string) => {
    removeFromFavorites(id);
    toast.success(`${name} retiré des favoris`);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FC`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = (icon: string, title: string, description: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button onClick={() => navigate('/food')} className="gap-2">
        <ShoppingBag className="w-4 h-4" />
        Découvrir des restaurants
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 dark:from-primary/10 to-background dark:to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 dark:bg-background/95 backdrop-blur-md border-b border-border/60 dark:border-border/80 shadow-sm dark:shadow-lg">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Mes Favoris</h1>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="restaurants" className="gap-2">
                <Store className="w-4 h-4" />
                Restaurants ({restaurantFavorites.length})
              </TabsTrigger>
              <TabsTrigger value="dishes" className="gap-2">
                <Heart className="w-4 h-4" />
                Plats ({dishFavorites.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab}>
          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4 mt-0">
            {restaurantFavorites.length === 0 ? (
              renderEmptyState(
                '🍽️',
                'Aucun restaurant favori',
                'Ajoutez des restaurants à vos favoris pour les retrouver facilement'
              )
            ) : (
              <AnimatePresence>
                {restaurantFavorites.map((restaurant) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className="overflow-hidden border-2 border-border/50 dark:border-border/80 hover:border-primary/50 dark:hover:border-primary/70 transition-all cursor-pointer bg-card dark:bg-card/95 shadow-md dark:shadow-xl dark:shadow-primary/10"
                      onClick={() => navigate(`/food?restaurant=${restaurant.id}`)}
                    >
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={restaurant.image || '/placeholder-food.jpg'}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-foreground truncate">{restaurant.name}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFavorite(restaurant.id, restaurant.name);
                              }}
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {(restaurant as any).description || 'Restaurant de qualité'}
                          </p>

                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-warning text-warning" />
                              4.5
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              25-35 min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Dishes Tab */}
          <TabsContent value="dishes" className="space-y-4 mt-0">
            {dishFavorites.length === 0 ? (
              renderEmptyState(
                '🍜',
                'Aucun plat favori',
                'Marquez vos plats préférés pour les commander rapidement'
              )
            ) : (
              <AnimatePresence>
                {dishFavorites.map((dish) => (
                  <motion.div
                    key={dish.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden border-2 border-border/50 dark:border-border/80 hover:border-primary/50 dark:hover:border-primary/70 transition-all bg-card dark:bg-card/95 shadow-md dark:shadow-xl dark:shadow-primary/10">
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={dish.image || '/placeholder-food.jpg'}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground truncate">{dish.name}</h3>
                              <p className="text-xs text-muted-foreground">Restaurant XYZ</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                              onClick={() => handleRemoveFavorite(dish.id, dish.name)}
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {(dish as any).description || 'Délicieux plat'}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(dish.price)}
                            </p>
                            <Button size="sm" className="gap-2">
                              <ShoppingBag className="w-3 h-3" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <FoodFooterNav />
    </div>
  );
}
