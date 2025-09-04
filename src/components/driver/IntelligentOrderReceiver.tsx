import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Car,
  Package,
  ShoppingBag,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useIntelligentOrderDispatch } from '@/hooks/useIntelligentOrderDispatch';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const IntelligentOrderReceiver: React.FC = () => {
  const { user } = useAuth();
  const {
    pendingOrders,
    loading,
    isListening,
    acceptOrder,
    rejectOrder,
    toggleListening
  } = useIntelligentOrderDispatch();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAcceptHighScore, setAutoAcceptHighScore] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  // Jouer son de notification
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Créer un son simple avec Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Jouer son quand nouvelle commande arrive
  useEffect(() => {
    if (pendingOrders.length > 0) {
      playNotificationSound();
    }
  }, [pendingOrders.length]);

  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingOrder(orderId);
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      const success = await acceptOrder(order);
      if (success) {
        // Vibration si supportée
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }
    setAcceptingOrder(null);
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'taxi': return Car;
      case 'delivery': return Package;
      case 'marketplace': return ShoppingBag;
      default: return Package;
    }
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'taxi': return 'Course Taxi';
      case 'delivery': return 'Livraison';
      case 'marketplace': return 'Marketplace';
      default: return 'Commande';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const calculateTimeLeft = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const timeLeft = 30 - Math.floor((now.getTime() - created.getTime()) / 1000);
    return Math.max(0, timeLeft);
  };

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Réception intelligente des commandes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Écoute active</span>
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? 'En marche' : 'Arrêté'}
              </Badge>
            </div>
            <Switch
              checked={isListening}
              onCheckedChange={toggleListening}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications sonores</span>
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-green-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-accept (score >90)</span>
              <Switch
                checked={autoAcceptHighScore}
                onCheckedChange={setAutoAcceptHighScore}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      {isListening && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pendingOrders.length}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pendingOrders.filter(o => o.priority === 'high' || o.priority === 'urgent').length}
              </div>
              <div className="text-xs text-muted-foreground">Priorité haute</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {pendingOrders.filter(o => o.type === 'marketplace').length}
              </div>
              <div className="text-xs text-muted-foreground">Marketplace</div>
            </div>
          </Card>
        </div>
      )}

      {/* Commandes en attente */}
      <AnimatePresence>
        {pendingOrders.map((order) => {
          const OrderIcon = getOrderIcon(order.type);
          const timeLeft = calculateTimeLeft(order.created_at);
          const progress = (timeLeft / 30) * 100;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              className="relative"
            >
              <Card className={cn(
                "border-l-4 shadow-lg",
                order.priority === 'urgent' && "border-l-red-500 bg-red-50/50",
                order.priority === 'high' && "border-l-orange-500 bg-orange-50/50",
                order.priority === 'normal' && "border-l-blue-500 bg-blue-50/50"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        order.type === 'taxi' && "bg-blue-100 text-blue-600",
                        order.type === 'delivery' && "bg-green-100 text-green-600",
                        order.type === 'marketplace' && "bg-purple-100 text-purple-600"
                      )}>
                        <OrderIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{getOrderTypeLabel(order.type)}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                          {order.type === 'marketplace' && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              Gains majorés
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {order.estimated_price.toLocaleString('fr-CD')} CDF
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timeLeft}s restantes
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Barre de progression temporelle */}
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Détails de la commande */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">Départ</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {order.pickup_location}
                        </div>
                      </div>
                    </div>

                    {order.delivery_location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Arrivée</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {order.delivery_location}
                          </div>
                        </div>
                      </div>
                    )}

                    {order.distance_km && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {order.distance_km.toFixed(1)} km • ~{Math.ceil(order.distance_km * 2)} min
                        </span>
                      </div>
                    )}

                    {order.special_requirements && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          {order.special_requirements}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectOrder(order.id)}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={acceptingOrder === order.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {acceptingOrder === order.id ? 'Acceptation...' : 'Accepter'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* État vide */}
      {isListening && pendingOrders.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">En attente de commandes</h3>
              <p className="text-sm text-muted-foreground">
                Votre système intelligent écoute en temps réel...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* État hors ligne */}
      {!isListening && (
        <Card className="p-8 text-center border-muted">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <VolumeX className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Écoute désactivée</h3>
              <p className="text-sm text-muted-foreground">
                Activez l'écoute pour recevoir des commandes
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default IntelligentOrderReceiver;