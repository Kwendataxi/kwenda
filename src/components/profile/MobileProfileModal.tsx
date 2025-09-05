import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileProfileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: MobileProfileModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-background">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-muted/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 hover:bg-muted/50"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto -webkit-overflow-scrolling-touch",
          "animate-fade-in",
          className
        )}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Safe area at bottom */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-background" />
    </div>
  );
};