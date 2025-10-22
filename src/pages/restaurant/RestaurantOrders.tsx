import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, CheckCircle, XCircle, Phone, MapPin } from 'lucide-react';
import { useFoodOrders } from '@/hooks/useFoodOrders';

const STATUS_CONFIG: any = {
  pending: { label: 'Nouveau', variant: 'default', color: 'bg-blue-500' },
  confirmed: { label: 'Confirmé', variant: 'secondary', color: 'bg-purple-500' },
  preparing: { label: 'En préparation', variant: 'default', color: 'bg-orange-500' },
  ready: { label: 'Prêt', variant: 'default', color: 'bg-green-500' },
  picked_up: { label: 'Récupéré', variant: 'secondary', color: 'bg-teal-500' },
  delivered: { label: 'Livré', variant: 'default', color: 'bg-green-600' },
  cancelled: { label: 'Annulé', variant: 'destructive', color: 'bg-red-500' },
};

export default function RestaurantOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [prepTimes, setPrepTimes] = useState<{ [key: string]: string }>({});

  const { fetchRestaurantOrders, updateOrderStatus, subscribeToOrders } = useFoodOrders();

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadOrders();

      // S'abonner aux mises à jour en temps réel
      const unsubscribe = subscribeToOrders(
        restaurantId,
        (newOrder) => {
          // Son de notification
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
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
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

  const handleConfirmOrder = async (orderId: string) => {
    const prepTime = parseInt(prepTimes[orderId] || '15');
    const success = await updateOrderStatus(orderId, 'confirmed', prepTime);
    if (success) loadOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) loadOrders();
  };

  const getNextAction = (status: string) => {
    const actions: any = {
      pending: { label: 'Confirmer', nextStatus: 'confirmed', icon: CheckCircle, color: 'bg-green-600' },
      confirmed: { label: 'Commencer préparation', nextStatus: 'preparing', icon: Clock, color: 'bg-orange-600' },
      preparing: { label: 'Marquer prêt', nextStatus: 'ready', icon: CheckCircle, color: 'bg-green-600' },
    };
    return actions[status] || null;
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
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">Gérez vos commandes en temps réel</p>
        </div>

        {/* Commandes actives */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Commandes actives ({activeOrders.length})</h2>
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const nextAction = getNextAction(order.status);
              const ActionIcon = nextAction?.icon;

              return (
                <Card key={order.id} className="border-l-4" style={{ borderLeftColor: statusConfig.color }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Commande #{order.order_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-sm">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-sm font-medium">
                            {(item.price * item.quantity).toLocaleString()} FC
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span>{order.total_amount.toLocaleString()} FC</span>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{order.delivery_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="line-clamp-1">{order.delivery_address}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {order.status === 'pending' && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="Temps (min)"
                          value={prepTimes[order.id] || '15'}
                          onChange={(e) => setPrepTimes({ ...prepTimes, [order.id]: e.target.value })}
                          className="w-32"
                        />
                        <Button 
                          className="flex-1"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmer ({prepTimes[order.id] || 15} min)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {nextAction && order.status !== 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => handleStatusChange(order.id, nextAction.nextStatus)}
                      >
                        {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                        {nextAction.label}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {activeOrders.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucune commande active</p>
                  <p className="text-sm text-muted-foreground">Les nouvelles commandes apparaîtront ici</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Historique */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Historique ({completedOrders.length})</h2>
          <div className="space-y-2">
            {completedOrders.slice(0, 5).map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
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
                        <Badge variant={statusConfig.variant} className="mt-1">
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
