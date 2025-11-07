import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, LayoutGrid, List } from 'lucide-react';
import { useFoodOrders } from '@/hooks/useFoodOrders';
import { OrderKanbanBoard } from '@/components/restaurant/orders/OrderKanbanBoard';
import { motion } from 'framer-motion';
import { RestaurantLayout } from '@/components/restaurant/RestaurantLayout';

export default function ModernRestaurantOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const { fetchRestaurantOrders, updateOrderStatus, subscribeToOrders } = useFoodOrders();

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadOrders();

      const unsubscribe = subscribeToOrders(
        restaurantId,
        (newOrder) => {
          // Notification sonore
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});

          toast({
            title: '🍽️ Nouvelle commande !',
            description: `Commande #${newOrder.order_number}`,
          });

          loadOrders();
        },
        () => loadOrders()
      );

      return unsubscribe;
    }
  }, [restaurantId]);

  const loadRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id, address')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
        setRestaurantAddress(profile.address || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!restaurantId) return;

    try {
      const data = await fetchRestaurantOrders(restaurantId);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleConfirmOrder = async (orderId: string, prepTime: number) => {
    const success = await updateOrderStatus(orderId, 'confirmed', prepTime);
    if (success) {
      toast({
        title: 'Commande confirmée',
        description: `Temps de préparation: ${prepTime} min`,
      });
      loadOrders();
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      toast({
        title: 'Statut mis à jour',
        description: 'La commande a été mise à jour',
      });
      loadOrders();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <RestaurantLayout>
      <div className="container mx-auto px-4 space-y-6">
        {/* Header avec gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Commandes</h1>
              <p className="text-white/90">Gérez vos commandes en temps réel</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-2">
                {activeOrders.length} actives
              </Badge>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </motion.div>

      <Tabs defaultValue="active" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Actives ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Historique ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Badge
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Badge>
            <Badge
              variant={viewMode === 'list' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Liste
            </Badge>
          </div>
        </div>

        <TabsContent value="active" className="space-y-4">
          {viewMode === 'kanban' ? (
            <OrderKanbanBoard
              orders={activeOrders}
              onStatusChange={handleStatusChange}
              onConfirmOrder={handleConfirmOrder}
              restaurantAddress={restaurantAddress}
            />
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">#{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total_amount.toLocaleString()} FC</p>
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium">Aucune commande active</p>
                <p className="text-sm text-muted-foreground">Les nouvelles commandes apparaîtront ici</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {completedOrders.slice(0, 10).map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">#{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total_amount.toLocaleString()} FC</p>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'destructive'}>
                      {order.status === 'delivered' ? 'Livré' : 'Annulé'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      </div>
    </RestaurantLayout>
  );
}
