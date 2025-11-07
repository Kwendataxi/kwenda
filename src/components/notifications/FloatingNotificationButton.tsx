import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import NotificationBadge from './NotificationBadge';
import { useAuth } from '@/hooks/useAuth';
import { useUnifiedNotifications, UserType } from '@/hooks/useUnifiedNotifications';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const FloatingNotificationButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Détection automatique du rôle utilisateur
  useEffect(() => {
    const detectUserRole = async () => {
      if (!user?.id) {
        setUserType(null);
        return;
      }

      try {
        // Vérifier partner
        const { data: partnerData } = await supabase
          .from('partner_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (partnerData) {
          setUserType('partner');
          return;
        }

        // Vérifier driver
        const { data: driverData } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (driverData) {
          setUserType('driver');
          return;
        }

        // Vérifier vendor
        const { data: vendorData } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (vendorData) {
          setUserType('vendor');
          return;
        }

        // Par défaut : client
        setUserType('client');
      } catch (error) {
        console.error('[FloatingNotification] Erreur détection rôle:', error);
        setUserType('client');
      }
    };

    detectUserRole();
  }, [user?.id]);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUnifiedNotifications(
    userType || 'client'
  );

  // Masquer sur certaines routes (login, onboarding)
  useEffect(() => {
    const hideOnRoutes = ['/login', '/signup', '/onboarding', '/welcome'];
    const currentPath = window.location.pathname;
    setIsVisible(!hideOnRoutes.some(route => currentPath.startsWith(route)));
  }, []);

  if (!user || !userType || !isVisible) return null;

  const getNotificationIcon = (type: string) => {
    if (type.includes('transport') || type.includes('ride')) return '🚗';
    if (type.includes('delivery')) return '📦';
    if (type.includes('marketplace') || type.includes('order')) return '🛍️';
    if (type.includes('payment') || type.includes('wallet')) return '💰';
    if (type.includes('lottery') || type.includes('win')) return '🎉';
    return '🔔';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed z-[100]",
            "bottom-20 left-4", // Mobile : au-dessus de la bottom nav
            "md:bottom-6 md:left-6" // Desktop : plus bas
          )}
        >
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className={cn(
              "relative h-14 w-14 rounded-full shadow-2xl",
              "bg-primary hover:bg-primary/90",
              "transition-all duration-300",
              unreadCount > 0 && "animate-pulse-glow"
            )}
          >
            <Bell className="h-6 w-6" />
            
            {/* Badge avec nombre de notifications */}
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2">
                <NotificationBadge
                  count={unreadCount}
                  variant="destructive"
                  size="md"
                  pulse={true}
                />
              </div>
            )}
          </Button>
        </motion.div>
      </AnimatePresence>

      {/* Drawer de notifications */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-full sm:w-96 p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <NotificationBadge
                    count={unreadCount}
                    variant="destructive"
                    size="sm"
                  />
                )}
              </SheetTitle>
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="text-xs"
                >
                  Tout marquer lu
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Aucune notification
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer",
                      "transition-all duration-200",
                      "hover:bg-accent/50",
                      !notif.is_read && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => {
                      if (!notif.is_read) {
                        markAsRead(notif.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône */}
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </span>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            "font-semibold text-sm",
                            !notif.is_read && "text-primary"
                          )}>
                            {notif.title}
                          </h4>
                          
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                              locale: fr
                            })}
                          </span>

                          {notif.priority && (
                            <span className={cn(
                              "text-xs font-medium",
                              getPriorityColor(notif.priority)
                            )}>
                              {notif.priority === 'high' && '🔴 Urgent'}
                              {notif.priority === 'medium' && '🟡 Important'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
