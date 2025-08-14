import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Car, 
  Package, 
  ShoppingCart,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { driverOrderTracker, OrderNotification } from '@/services/driverOrderTracker';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export const DriverOrderNotifications = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = driverOrderTracker.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Garder 10 max
      
      // Son de notification
      if (soundEnabled) {
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {
            // Fallback: utiliser Web Audio API pour un bip
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          });
        } catch (e) {
          console.log('Son non disponible');
        }
      }

      // Toast notification
      toast.success(notification.title, {
        description: notification.message,
        duration: 8000
      });
    });

    setIsListening(true);

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [soundEnabled]);

  const getNotificationIcon = (type: OrderNotification['type']) => {
    switch (type) {
      case 'transport': return <Car className="h-4 w-4" />;
      case 'delivery': return <Package className="h-4 w-4" />;
      case 'marketplace': return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: OrderNotification['type']) => {
    switch (type) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'delivery': return 'bg-green-100 text-green-800';
      case 'marketplace': return 'bg-purple-100 text-purple-800';
    }
  };

  const handleAcceptOrder = async (notification: OrderNotification) => {
    let result;
    
    switch (notification.type) {
      case 'transport':
        result = await driverOrderTracker.acceptRideOffer(
          notification.orderId, 
          notification.data.offer_id
        );
        break;
      case 'delivery':
        result = await driverOrderTracker.acceptDeliveryOrder(notification.orderId);
        break;
      case 'marketplace':
        result = await driverOrderTracker.acceptMarketplaceAssignment(notification.data.id);
        break;
    }

    if (result?.success) {
      toast.success('Commande acceptée!');
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, status: 'accepted' } 
            : n
        )
      );
    } else {
      toast.error(`Erreur: ${result?.error || 'Échec acceptation'}`);
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Commandes
            {notifications.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {notifications.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
              >
                Vider
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Statut d'écoute */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {isListening ? 'Écoute active des commandes...' : 'Écoute désactivée'}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune nouvelle commande</p>
              <p className="text-xs mt-1">Les nouvelles commandes apparaîtront ici</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                          {notification.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.timestamp.toLocaleTimeString()}
                        </Badge>
                        {notification.status === 'accepted' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepté
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium text-sm mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>

                      {/* Détails de la commande */}
                      {notification.data && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {notification.data.pickup_location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {notification.data.pickup_location}
                              </span>
                            </div>
                          )}
                          {(notification.data.estimated_price || notification.data.surge_price || notification.data.delivery_fee) && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {formatCurrency(
                                  notification.data.surge_price || 
                                  notification.data.estimated_price || 
                                  notification.data.delivery_fee
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {notification.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptOrder(notification)}
                          className="text-xs"
                        >
                          Accepter
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissNotification(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};