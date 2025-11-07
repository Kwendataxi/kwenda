import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface RestaurantDebugPanelProps {
  city: string;
  onRefresh: () => void;
}

export const RestaurantDebugPanel: React.FC<RestaurantDebugPanelProps> = ({
  city,
  onRefresh
}) => {
  const [open, setOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // Fetch all restaurants
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('city', city);

      console.log('🐛 [Debug] Restaurants:', restaurants);

      if (restaurantsError) throw restaurantsError;

      // For each active restaurant, fetch products
      const restaurantDetails = await Promise.all(
        (restaurants || []).map(async (restaurant) => {
          const { data: products } = await supabase
            .from('food_products')
            .select('*')
            .eq('restaurant_id', restaurant.id);

          return {
            ...restaurant,
            products: products || [],
            approvedProducts: products?.filter(p => p.moderation_status === 'approved') || []
          };
        })
      );

      setDebugData({
        city,
        totalRestaurants: restaurants?.length || 0,
        activeRestaurants: restaurants?.filter(r => r.is_active).length || 0,
        restaurants: restaurantDetails
      });
    } catch (error) {
      console.error('🐛 [Debug] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(!open);
          if (!open && !debugData) fetchDebugData();
        }}
        className="bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug Panel
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-12 right-0 w-96 max-h-[600px] overflow-auto"
          >
            <Card className="shadow-2xl border-yellow-500">
              <CardHeader className="bg-yellow-500 text-black">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>🐛 Debug: {city}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      fetchDebugData();
                      onRefresh();
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {debugData && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Restaurants</p>
                        <p className="font-bold">{debugData.totalRestaurants}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actifs</p>
                        <p className="font-bold text-green-600">{debugData.activeRestaurants}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {debugData.restaurants.map((restaurant: any) => (
                        <Card key={restaurant.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-semibold text-sm">{restaurant.restaurant_name}</p>
                              <div className="flex gap-1">
                                <Badge variant={restaurant.is_active ? "default" : "secondary"} className="text-xs">
                                  {restaurant.is_active ? '✓ Active' : '✗ Inactive'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {restaurant.verification_status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Produits</p>
                                <p className="font-bold">{restaurant.products.length}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Approuvés</p>
                                <p className="font-bold text-green-600">{restaurant.approvedProducts.length}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Disponibles</p>
                                <p className="font-bold">
                                  {restaurant.products.filter((p: any) => p.is_available).length}
                                </p>
                              </div>
                            </div>

                            {restaurant.approvedProducts.length > 0 && (
                              <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">Produits approuvés:</p>
                                {restaurant.approvedProducts.map((product: any) => (
                                  <div key={product.id} className="flex justify-between">
                                    <span>{product.name}</span>
                                    <span className="text-muted-foreground">
                                      {product.price.toLocaleString()} FC
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
