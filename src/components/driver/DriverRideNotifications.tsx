import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface RideNotification {
  id: string;
  title: string;
  message: string;
  distance: number;
  estimatedTime: number;
  expiresIn: number;
}

export default function DriverRideNotifications() {
  const [notifications, setNotifications] = useState<RideNotification[]>([]);

  // Simulation pour les tests
  useEffect(() => {
    // Ajouter une notification de test après 3 secondes
    const timer = setTimeout(() => {
      setNotifications([{
        id: 'test-1',
        title: 'Nouvelle course disponible',
        message: 'Course taxi standard',
        distance: 2.3,
        estimatedTime: 8,
        expiresIn: 120
      }]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Course acceptée !');
  };

  const handleReject = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.info('Course refusée');
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card key={notification.id} className="bg-white border-primary shadow-lg animate-in slide-in-from-right">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3" />
                <span>Distance: {notification.distance} km</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                <span>Arrivée: ~{notification.estimatedTime} min</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(notification.expiresIn / 120) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono">{notification.expiresIn}s</span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleReject(notification.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Refuser
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAccept(notification.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepter
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}