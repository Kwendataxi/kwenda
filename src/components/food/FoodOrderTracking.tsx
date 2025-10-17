import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FoodOrderTrackingProps {
  orderId: string;
  onBack: () => void;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  estimated_delivery_time?: number;
  restaurant_profiles: {
    restaurant_name: string;
    phone_number: string;
  };
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmée', icon: CheckCircle2, color: 'bg-blue-500' },
  preparing: { label: 'En préparation', icon: Package, color: 'bg-orange-500' },
  ready: { label: 'Prêt', icon: CheckCircle2, color: 'bg-green-500' },
  picked_up: { label: 'En livraison', icon: Truck, color: 'bg-purple-500' },
  delivered: { label: 'Livré', icon: CheckCircle2, color: 'bg-green-600' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'bg-red-500' },
};

export const FoodOrderTracking = ({ orderId, onBack }: FoodOrderTrackingProps) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('food_orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          estimated_delivery_time,
          restaurant_profiles (
            restaurant_name,
            phone_number
          )
        `)
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setOrder(data as any);
      }
      setLoading(false);
    };

    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`food-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-muted-foreground mb-4">Commande introuvable</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Suivi de commande</h1>
            <p className="text-sm opacity-90">#{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center flex-col gap-4">
              <div className={`${statusConfig.color} rounded-full p-4`}>
                <StatusIcon className="h-12 w-12 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{statusConfig.label}</h2>
                {order.estimated_delivery_time && order.status !== 'delivered' && (
                  <p className="text-muted-foreground mt-2">
                    Temps estimé: {order.estimated_delivery_time} minutes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{order.restaurant_profiles.restaurant_name}</p>
            <p className="text-sm text-muted-foreground">{order.restaurant_profiles.phone_number}</p>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numéro</span>
              <span className="font-semibold">#{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold text-orange-600">
                {order.total_amount.toLocaleString()} FC
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([status, config], index) => {
                const isActive = order.status === status;
                const Icon = config.icon;
                const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
                const currentIndex = statusOrder.indexOf(order.status);
                const stepIndex = statusOrder.indexOf(status);
                const isCompleted = stepIndex <= currentIndex;

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        isCompleted ? config.color : 'bg-muted'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isActive ? 'text-orange-600' : ''}`}>
                        {config.label}
                      </p>
                    </div>
                    {isActive && (
                      <Badge className={config.color + ' text-white'}>En cours</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
