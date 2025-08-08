import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Bell, 
  Car, 
  Package, 
  DollarSign, 
  Users, 
  MapPin, 
  Clock,
  Settings,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// Using realtime notifications from hook; local interface removed

const NotificationCenter: React.FC = () => {
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();
  const [settings, setSettings] = useState({
    pushEnabled: true,
    rideUpdates: true,
    paymentAlerts: true,
    promotions: false,
    driverUpdates: true,
    systemAlerts: true
  });
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ride':
      return <Car className="h-4 w-4" />;
    case 'delivery':
      return <Package className="h-4 w-4" />;
    case 'payment':
      return <DollarSign className="h-4 w-4" />;
    case 'system':
      return <Settings className="h-4 w-4" />;
    case 'marketing':
      return <Users className="h-4 w-4" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'error':
      return 'bg-destructive';
    case 'warning':
      return 'bg-primary';
    case 'success':
      return 'bg-accent';
    default:
      return 'bg-muted';
  }
};
const deleteNotification = (id: string) => {
  setHiddenIds((prev) => new Set([...Array.from(prev), id]));
};
const formatTime = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
};
  const visibleNotifications = notifications.filter(n => !hiddenIds.has(n.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Paramètres de notification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'pushEnabled', label: 'Notifications push', description: 'Recevoir les notifications sur votre appareil' },
            { key: 'rideUpdates', label: 'Mises à jour de course', description: 'Statut des courses en temps réel' },
            { key: 'paymentAlerts', label: 'Alertes de paiement', description: 'Confirmations de paiement' },
            { key: 'promotions', label: 'Promotions', description: 'Offres spéciales et réductions' },
            { key: 'driverUpdates', label: 'Mises à jour chauffeur', description: 'Position et arrivée du chauffeur' },
            { key: 'systemAlerts', label: 'Alertes système', description: 'Maintenance et mises à jour importantes' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={settings[setting.key as keyof typeof settings]}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, [setting.key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {visibleNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune notification pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          visibleNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors ${!notification.read ? 'bg-accent/50 border-primary/50' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? getTypeColor(notification.type) : 'bg-muted'}`}></div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(notification.type)}
                      <p className="font-medium">{notification.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(notification.timestamp)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;