import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Package, DollarSign, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'ride', title: 'Nouvelle course disponible', message: 'Une course vers Gombe', time: new Date(), read: false },
  { id: '2', type: 'payment', title: 'Paiement reçu', message: '15,000 CDF ajoutés à votre wallet', time: new Date(Date.now() - 3600000), read: false },
  { id: '3', type: 'message', title: 'Nouveau message', message: 'Client: "Je suis en bas"', time: new Date(Date.now() - 7200000), read: true },
  { id: '4', type: 'system', title: 'Mise à jour système', message: 'Nouvelle version disponible', time: new Date(Date.now() - 86400000), read: true },
];

export const NotificationsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    newRides: true,
    payments: true,
    messages: true,
    system: false,
    sound: true,
    vibration: true,
  });

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ride': return Package;
      case 'payment': return DollarSign;
      case 'message': return MessageSquare;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5" />
                <span className="font-semibold">Notifications</span>
              </div>
              <p className="text-sm opacity-90">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </p>
            </div>
            <Badge className="bg-white text-purple-600">{MOCK_NOTIFICATIONS.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <div className="space-y-2">
        <h3 className="font-semibold mb-3">Récentes</h3>
        {MOCK_NOTIFICATIONS.map((notif) => {
          const Icon = getIcon(notif.type);
          return (
            <Card key={notif.id} className={!notif.read ? 'border-l-4 border-l-primary bg-blue-50/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    notif.type === 'ride' ? 'bg-orange-100 text-orange-600' :
                    notif.type === 'payment' ? 'bg-green-100 text-green-600' :
                    notif.type === 'message' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(notif.time, 'PPp', { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Paramètres de notifications */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          Paramètres
        </h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nouvelles courses</p>
                <p className="text-xs text-muted-foreground">Recevoir les alertes de nouvelles courses</p>
              </div>
              <Switch 
                checked={settings.newRides} 
                onCheckedChange={(checked) => setSettings({...settings, newRides: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Paiements</p>
                <p className="text-xs text-muted-foreground">Notifications de paiements reçus</p>
              </div>
              <Switch 
                checked={settings.payments} 
                onCheckedChange={(checked) => setSettings({...settings, payments: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">Messages des clients</p>
              </div>
              <Switch 
                checked={settings.messages} 
                onCheckedChange={(checked) => setSettings({...settings, messages: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Système</p>
                <p className="text-xs text-muted-foreground">Mises à jour et annonces</p>
              </div>
              <Switch 
                checked={settings.system} 
                onCheckedChange={(checked) => setSettings({...settings, system: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Son</p>
                <p className="text-xs text-muted-foreground">Jouer un son pour les notifications</p>
              </div>
              <Switch 
                checked={settings.sound} 
                onCheckedChange={(checked) => setSettings({...settings, sound: checked})}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Vibration</p>
                <p className="text-xs text-muted-foreground">Vibrer lors des notifications</p>
              </div>
              <Switch 
                checked={settings.vibration} 
                onCheckedChange={(checked) => setSettings({...settings, vibration: checked})}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
