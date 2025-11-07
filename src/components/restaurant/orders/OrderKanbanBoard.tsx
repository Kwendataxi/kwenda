import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  items: any[];
  total_amount: number;
  delivery_phone: string;
  delivery_address: string;
  estimated_preparation_time?: number;
}

interface OrderKanbanBoardProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onConfirmOrder: (orderId: string, prepTime: number) => void;
}

const COLUMNS = [
  { id: 'pending', label: 'Nouveau', color: 'from-blue-500 to-cyan-500', nextStatus: 'confirmed' },
  { id: 'confirmed', label: 'Confirmé', color: 'from-purple-500 to-pink-500', nextStatus: 'preparing' },
  { id: 'preparing', label: 'En préparation', color: 'from-orange-500 to-red-500', nextStatus: 'ready' },
  { id: 'ready', label: 'Prêt', color: 'from-green-500 to-emerald-500', nextStatus: 'picked_up' },
];

export const OrderKanbanBoard = ({ orders, onStatusChange, onConfirmOrder }: OrderKanbanBoardProps) => {
  const [orderTimers, setOrderTimers] = useState<{ [key: string]: number }>({});

  // Timer pour chaque commande
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderTimers(prev => {
        const newTimers = { ...prev };
        orders.forEach(order => {
          const createdAt = new Date(order.created_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000 / 60); // minutes
          newTimers[order.id] = elapsed;
        });
        return newTimers;
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [orders]);

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const getTimerColor = (minutes: number, status: string) => {
    if (status === 'pending' && minutes > 5) return 'text-red-500';
    if (status === 'preparing' && minutes > 30) return 'text-red-500';
    if (minutes > 15) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const columnOrders = getOrdersByStatus(column.id);
        
        return (
          <div key={column.id} className="space-y-3">
            {/* Column Header */}
            <div className={`rounded-xl bg-gradient-to-r ${column.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{column.label}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {columnOrders.length}
                </Badge>
              </div>
            </div>

            {/* Orders */}
            <div className="space-y-3 min-h-[200px]">
              {columnOrders.map((order, index) => {
                const elapsed = orderTimers[order.id] || 0;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">#{order.order_number}</CardTitle>
                            <div className={`flex items-center gap-1 text-sm ${getTimerColor(elapsed, order.status)} mt-1`}>
                              <Clock className="h-3 w-3" />
                              <span>{elapsed} min</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{order.total_amount.toLocaleString()} FC</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Items summary */}
                        <div className="bg-muted/50 rounded-lg p-2 text-xs space-y-1">
                          {order.items.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-muted-foreground">+{order.items.length - 2} autre(s)</p>
                          )}
                        </div>

                        {/* Contact */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{order.delivery_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{order.delivery_address}</span>
                          </div>
                        </div>

                        {/* Action button */}
                        {order.status === 'pending' ? (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onConfirmOrder(order.id, 15)}
                          >
                            Confirmer (15 min)
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            onClick={() => onStatusChange(order.id, column.nextStatus!)}
                          >
                            <span>{getNextActionLabel(column.id)}</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {columnOrders.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Aucune commande
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getNextActionLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    confirmed: 'Commencer',
    preparing: 'Marquer prêt',
    ready: 'Récupéré',
  };
  return labels[status] || 'Suivant';
};
