import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { useAdminSystemNotifications } from "@/hooks/useAdminSystemNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { NotificationList } from "./NotificationList";
import { AdminNotificationList } from "./AdminNotificationList";
import { Badge } from "@/components/ui/badge";

export const NotificationBell = () => {
  const { userRole } = useUserRole();
  const isAdmin = userRole === 'admin';
  
  const { unreadCount: userUnreadCount } = useUserNotifications();
  const { unreadCount: adminUnreadCount } = useAdminSystemNotifications();
  
  const unreadCount = isAdmin ? adminUnreadCount : userUnreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {isAdmin ? <AdminNotificationList /> : <NotificationList />}
      </PopoverContent>
    </Popover>
  );
};
