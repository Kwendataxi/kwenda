import React from 'react';
import { MapPin, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LastMessagePreviewProps {
  content: string;
  messageType: 'text' | 'location' | 'image' | 'file' | 'quick_action';
  isRead?: boolean;
  isOwnMessage?: boolean;
  className?: string;
}

export const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({
  content,
  messageType,
  isRead = false,
  isOwnMessage = false,
  className
}) => {
  const getPreviewContent = () => {
    switch (messageType) {
      case 'location':
        return (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            Position partagée
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3 flex-shrink-0" />
            Photo
          </span>
        );
      case 'file':
        return (
          <span className="flex items-center gap-1">
            📎 Fichier
          </span>
        );
      default:
        return content.length > 35 ? content.substring(0, 35) + '...' : content;
    }
  };

  const ReadIndicator = isOwnMessage ? (
    isRead ? (
      <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
    ) : (
      <Check className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    )
  ) : null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-sm text-muted-foreground truncate",
      className
    )}>
      {ReadIndicator}
      <span className="truncate">{getPreviewContent()}</span>
    </div>
  );
};
