import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Package, 
  Truck,
  User,
  CheckCircle,
  X,
  Filter,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

import { AdminSystemNotification } from '@/types/adminNotifications';

export default function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminSystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(item => ({
        ...item,
        severity: item.severity as AdminSystemNotification['severity']
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      toast({
        title: "Notifications marquées comme lues",
        description: `${unreadIds.length} notifications marquées comme lues.`,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (type) {
      case 'vendor_self_delivery':
        return <Truck className="h-4 w-4" />;
      case 'driver_assignment_timeout':
        return <Clock className="h-4 w-4" />;
      case 'marketplace_order_issue':
        return <Package className="h-4 w-4" />;
      default:
        switch (severity) {
          case 'error':
            return <AlertTriangle className="h-4 w-4" />;
          case 'warning':
            return <AlertTriangle className="h-4 w-4" />;
          case 'success':
            return <CheckCircle className="h-4 w-4" />;
          default:
            return <Bell className="h-4 w-4" />;
        }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'urgent':
        return notification.severity === 'error' || notification.severity === 'warning';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => 
    (n.severity === 'error' || n.severity === 'warning') && !n.is_read
  ).length;

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications administrateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications administrateur</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} non lues
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                {urgentCount} urgentes
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-3 w-3" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Toutes', count: notifications.length },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'urgent', label: 'Urgentes', count: urgentCount }
          ].map(filterOption => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterOption.key as any)}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              {filterOption.label} ({filterOption.count})
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    notification.is_read 
                      ? 'bg-muted/30 border-border/50' 
                      : 'bg-background border-primary/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.severity === 'error' ? 'bg-destructive/10 text-destructive' :
                        notification.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-600' :
                        notification.severity === 'success' ? 'bg-green-500/10 text-green-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {getNotificationIcon(notification.type, notification.severity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium truncate ${
                            notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant={getSeverityColor(notification.severity) as any}
                            className="text-xs"
                          >
                            {notification.severity}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>

                        <p className={`text-xs mb-2 ${
                          notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                          
                          {notification.data?.order_id && (
                            <>
                              <span>•</span>
                              <span>Commande: {notification.data.order_id}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}