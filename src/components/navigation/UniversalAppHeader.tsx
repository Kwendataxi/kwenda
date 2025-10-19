import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ArrowLeft } from 'lucide-react';

interface UniversalAppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const UniversalAppHeader = ({ 
  title, 
  showBackButton = false, 
  onBackClick 
}: UniversalAppHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[150] bg-background/80 backdrop-blur-md border-b">
      <div className="px-4 py-3 flex items-center justify-between h-[60px]">
        {/* Left: Back button ou Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBackButton && onBackClick && (
            <Button variant="ghost" size="icon" onClick={onBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-bold truncate">{title}</h1>
          )}
        </div>

        {/* Right: Notifications uniquement */}
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};
