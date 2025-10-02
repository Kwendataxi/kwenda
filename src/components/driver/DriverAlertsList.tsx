/**
 * 📱 Composant d'Alertes de Livraison pour Chauffeurs
 * Affiche et gère les notifications temps réel
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MapPin, Clock, DollarSign, Package, X } from 'lucide-react';
import { useDriverOrderNotifications } from '@/hooks/useDriverOrderNotifications';

export default function DriverAlertsList() {
  const {
    pendingAlerts,
    loading,
    markAlertAsSeen,
    acceptOrder,
    ignoreOrder
  } = useDriverOrderNotifications();

  if (pendingAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 space-y-3 max-w-md mx-auto">
      {pendingAlerts.map((alert) => (
        <Card 
          key={alert.id}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary shadow-glow animate-fade-in"
          onClick={() => markAlertAsSeen(alert.id)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary animate-pulse" />
                <span>Nouvelle course {alert.order_details?.delivery_type?.toUpperCase()}</span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {alert.distance_km.toFixed(1)}km
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {alert.order_details?.pickup_location}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  {alert.order_details?.delivery_location}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>~{Math.ceil(alert.distance_km * 3)} min</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{alert.order_details?.estimated_price?.toLocaleString()} FC</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  acceptOrder(alert.id, alert.order_id);
                }}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Package className="h-4 w-4 mr-1" />
                Accepter
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  ignoreOrder(alert.id);
                }}
                variant="outline"
              >
                <X className="h-4 w-4 mr-1" />
                Ignorer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
